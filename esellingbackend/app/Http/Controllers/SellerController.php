<?php

namespace App\Http\Controllers;

use App\Models\Seller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SellerController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $seller = Seller::where('user_id', $user->id)
            ->withCount(['products', 'orders'])
            ->first();
        if (!$seller) {
            return response()->json([
                'success' => false,
                'message' => 'Seller profile not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Seller fetched.',
            'data' => $seller,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Check for existing seller application
        $existingSeller = Seller::where('user_id', $user->id)->first();
        
        if ($existingSeller && $existingSeller->verification_status !== 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'You already have a seller profile with status: ' . $existingSeller->verification_status . '.',
            ], 422);
        }

        // Build validation rules
        $slugRule = ['required', 'string', 'max:140'];
        if ($existingSeller && $existingSeller->verification_status === 'rejected') {
            // If updating a rejected seller, allow same slug or new unique slug
            $slugRule[] = 'unique:seller,slug,' . $existingSeller->id;
        } else {
            // If creating new, must be unique
            $slugRule[] = 'unique:seller,slug';
        }
        
        $validator = Validator::make($request->all(), [
            'shop_name' => ['required', 'string', 'max:120'],
            'slug' => $slugRule,
            'description' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'banner' => ['nullable', 'image', 'max:8192'],
            'id_image' => ['required', 'image', 'max:5120'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:32'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle uploads
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store("sellers/{$user->id}", 'public');
            $data['logo_url'] = "/storage/{$path}";
        }
        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store("sellers/{$user->id}", 'public');
            $data['banner_url'] = "/storage/{$path}";
        }
        if ($request->hasFile('id_image')) {
            $path = $request->file('id_image')->store("sellers/{$user->id}/id", 'public');
            $data['id_image_path'] = "/storage/{$path}";
        }

        // If existing seller with rejected status, update it; otherwise create new
        if ($existingSeller && $existingSeller->verification_status === 'rejected') {
            // Update the existing seller application
            $data['verification_status'] = 'unverified';
            $data['is_active'] = true;
            $existingSeller->update($data);
            $seller = $existingSeller->fresh();
        } else {
            // Create new seller application
            $seller = Seller::create(array_merge($data, [
                'user_id' => $user->id,
                'verification_status' => 'unverified',
                'is_active' => true,
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Seller application submitted.',
            'data' => $seller,
        ], 201);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $seller = Seller::where('user_id', $user->id)->first();
        if (!$seller) {
            return response()->json([
                'success' => false,
                'message' => 'Seller profile not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'shop_name' => ['sometimes', 'required', 'string', 'max:120'],
            'slug' => ['sometimes', 'required', 'string', 'max:140', 'unique:seller,slug,' . $seller->id],
            'description' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'banner' => ['nullable', 'image', 'max:8192'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:32'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle uploads
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($seller->logo_url) {
                $oldPath = str_replace('/storage/', '', $seller->logo_url);
                Storage::disk('public')->delete($oldPath);
            }
            
            $path = $request->file('logo')->store("sellers/{$user->id}", 'public');
            $data['logo_url'] = "/storage/{$path}";
        }
        
        if ($request->hasFile('banner')) {
            // Delete old banner if exists
            if ($seller->banner_url) {
                $oldPath = str_replace('/storage/', '', $seller->banner_url);
                Storage::disk('public')->delete($oldPath);
            }
            
            $path = $request->file('banner')->store("sellers/{$user->id}", 'public');
            $data['banner_url'] = "/storage/{$path}";
        }

        $seller->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Seller profile updated successfully.',
            'data' => $seller,
        ]);
    }

    public function show($id)
    {
        $seller = Seller::withCount(['products', 'orders'])->find($id);
        if (!$seller) {
            return response()->json([
                'success' => false,
                'message' => 'Seller not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Seller fetched.',
            'data' => $seller,
        ]);
    }
}


