<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    /**
     * Handle user registration
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $fullName = trim($request->input('first_name')." ".$request->input('last_name'));

        $user = User::create([
            'name' => $fullName,
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'contact_number' => $request->input('contact_number'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'user' => [
                'id' => $user->id,
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'user_type' => 'user',
            ],
        ], 201);
    }

    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 422);
        }

        $request->session()->regenerate();

        $user = Auth::user();
        [$firstName, $lastName] = $this->splitName($user->name);

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'user' => [
                'id' => $user->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'profile_picture_url' => $user->profile_picture_url,
                'user_type' => 'user',
            ],
        ]);
    }

    /**
     * Return current authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        [$firstName, $lastName] = $this->splitName($user->name);

        return response()->json([
            'success' => true,
            'message' => 'Authenticated user fetched.',
            'user' => [
                'id' => $user->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'profile_picture_url' => $user->profile_picture_url,
                'user_type' => 'user',
            ],
        ]);
    }

    /**
     * Update current authenticated user's profile (email, contact_number, address)
     */
    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validated = $request->validate([
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'current_password' => ['sometimes', 'required', 'string'],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
            'profile_picture' => ['sometimes', 'file', 'image', 'max:5120'], // 5MB
        ]);

        // Use request->has to reliably detect keys in multipart/form-data
        if ($request->has('email')) {
            $user->email = $request->input('email');
        }
        if ($request->has('contact_number')) {
            $user->contact_number = $request->input('contact_number');
        }

        // Handle password change if requested
        if (array_key_exists('password', $validated)) {
            if (!array_key_exists('current_password', $validated) || !Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect.',
                ], 422);
            }
            $user->password = Hash::make($validated['password']);
        }

        // Handle profile picture upload on the public disk
        if ($request->hasFile('profile_picture')) {
            // Save to storage/app/public/profile_pictures
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            // Generate public URL: /storage/profile_pictures/...
            $publicPath = Storage::url($path);
            $user->profile_picture_url = $publicPath;
        }

        $user->save();

        [$firstName, $lastName] = $this->splitName($user->name);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'profile_picture_url' => $user->profile_picture_url,
                'user_type' => 'user',
            ],
        ]);
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        Auth::guard()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out.',
        ]);
    }

    /**
     * Delete the currently authenticated user's account
     */
    public function destroy(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Optionally: detach/cleanup related records here if needed

        // Log out first to clear session
        Auth::guard()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully.',
        ]);
    }

    private function splitName(?string $name): array
    {
        $name = $name ?? '';
        $parts = preg_split('/\s+/', trim($name));
        $first = $parts[0] ?? '';
        $last = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
        return [$first, $last];
    }
}


