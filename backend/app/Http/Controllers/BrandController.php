<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index()
    {
        $rows = Brand::query()
            ->orderBy('brand_id')
            ->get()
            ->map(fn (Brand $brand) => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ]);

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $brand = Brand::create($data)->refresh();

        return response()->json([
            'message' => 'Brand created successfully.',
            'data' => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ],
        ], 201, [], JSON_UNESCAPED_UNICODE);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $brand->update($data);
        $brand->refresh();

        return response()->json([
            'message' => 'Brand updated successfully.',
            'data' => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json([
            'ok' => true,
            'id' => $brand->brand_id,
            'message' => 'Brand deleted successfully.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function slugify(Request $request)
    {
        $text = $request->query('text', '');
        $ignore = $request->query('ignore');
        $ignoreId = $ignore !== null ? (int) $ignore : null;

        $baseSlug = Str::slug($text) ?: 'brand';
        $slug = Brand::generateUniqueSlug($text, $ignoreId);

        $exists = Brand::query()
            ->when($ignoreId, fn ($query) => $query->where('brand_id', '!=', $ignoreId))
            ->where('slug', $baseSlug)
            ->exists();

        return response()->json([
            'slug' => $slug,
            'base' => $baseSlug,
            'available' => !$exists,
            'modified' => $slug !== $baseSlug,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
