<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'seller_id' => ['required', 'exists:seller,id'],
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:180', 'unique:product,slug'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:120'],
            'sku' => ['nullable', 'string', 'max:80'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            // Accept uploaded files instead of base64 strings
            'main_image' => ['nullable', 'image', 'max:5120'], // 5MB
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'],
            'weight' => ['nullable', 'string', 'max:50'],
            'options' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Initialize fields to be saved
        $data['main_image_url'] = $data['main_image_url'] ?? null;
        $data['is_active'] = true; // Explicitly set products as active when created

        // Handle main image upload
        if ($request->hasFile('main_image')) {
            // Store under storage/app/public/products
            $path = $request->file('main_image')->store('products', 'public');
            // Build public URL: /storage/products/...
            $data['main_image_url'] = '/storage/' . $path;
        }

        // Handle additional images upload
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imageFile) {
                $stored = $imageFile->store('products', 'public');
                $imagePaths[] = '/storage/' . $stored;
            }
        }
        if (!empty($imagePaths)) {
            $data['images'] = $imagePaths;
        }

        // Remove non-fillable transient keys
        unset($data['main_image']);

        $product = Product::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created.',
            'data' => $product,
        ], 201);
    }

    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 20);
        
        $products = Product::with('seller')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'message' => 'Products fetched successfully.',
            'data' => $products,
        ]);
    }

    public function bySeller(Request $request, int $sellerId)
    {
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 20);

        $products = Product::with('seller')
            ->where('is_active', true)
            ->where('seller_id', $sellerId)
            ->orderBy('created_at', 'desc')
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'message' => 'Seller products fetched successfully.',
            'data' => $products,
        ]);
    }

    public function show(int $id)
    {
        $product = Product::with('seller')->find($id);
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product fetched successfully.',
            'data' => $product,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $product = Product::find($id);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:180', 'unique:product,slug,' . $id],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:120'],
            'sku' => ['nullable', 'string', 'max:80'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'main_image' => ['nullable', 'image', 'max:5120'], // 5MB
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'],
            'weight' => ['nullable', 'string', 'max:50'],
            'options' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle main image upload
        if ($request->hasFile('main_image')) {
            // Store under storage/app/public/products
            $path = $request->file('main_image')->store('products', 'public');
            // Build public URL: /storage/products/...
            $data['main_image_url'] = '/storage/' . $path;
        }

        // Handle additional images upload
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imageFile) {
                $stored = $imageFile->store('products', 'public');
                $imagePaths[] = '/storage/' . $stored;
            }
        }
        if (!empty($imagePaths)) {
            $data['images'] = $imagePaths;
        }

        // Remove non-fillable transient keys
        unset($data['main_image']);

        $product->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => $product->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        // Set product as inactive instead of deleting
        $product->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Product removed from store successfully.',
        ]);
    }

    public function restore($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        // Reactivate the product
        $product->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Product restored successfully.',
            'data' => $product->fresh(),
        ]);
    }
}