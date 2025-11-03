<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * Lấy danh sách sản phẩm
     */
    public function index(Request $request)
    {
        $query = Product::with(['category:category_id,name', 'brand:brand_id,name'])
            ->withCount('reviews')
            ->orderBy('product_id', 'desc');

        // Lọc theo category
        if ($request->has('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        // Tìm kiếm
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->get();

        $rows = $products->map(function (Product $product) {
            // Tính rating trung bình
            $avgRating = $product->reviews()->avg('rating') ?? 0;
            $totalReviews = $product->reviews_count ?? 0;

            // Xác định badges
            $badges = [];
            if ($product->is_flash_sale) {
                $badges[] = 'SALE';
            }
            if ($product->is_new) {
                $badges[] = 'MỚI';
            }
            if ($product->tags && str_contains($product->tags, 'hot')) {
                $badges[] = 'HOT';
            }

            // Xác định trạng thái tồn kho
            $stockStatus = 'Còn hàng';
            if ($product->stock == 0) {
                $stockStatus = 'Hết hàng';
            } elseif ($product->stock < 10) {
                $stockStatus = 'Sắp hết';
            }

            return [
                'id' => $product->product_id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'brand' => optional($product->brand)->name,
                'brand_id' => $product->brand_id,
                'price' => (float) $product->price,
                'discount' => $product->discount ?? 0,
                'final_price' => $product->discount > 0 
                    ? (float) ($product->price - ($product->price * $product->discount / 100))
                    : (float) $product->price,
                'category' => optional($product->category)->name,
                'category_id' => $product->category_id,
                'stock' => $product->stock,
                'stock_status' => $stockStatus,
                'status' => $product->status ?? 'active',
                'rating' => round($avgRating, 1),
                'reviews' => $totalReviews,
                'badges' => $badges,
                'image' => $product->image,
                'created_at' => optional($product->created_at)?->format('Y-m-d H:i'),
                'updated_at' => optional($product->updated_at)?->format('Y-m-d H:i'),
            ];
        });

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Tạo sản phẩm mới
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'discount' => ['nullable', 'integer', 'min:0', 'max:100'],
            'stock' => ['required', 'integer', 'min:0'],
            'category_id' => ['nullable', 'integer', 'exists:categories,category_id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,brand_id'],
            'is_flash_sale' => ['nullable', 'boolean'],
            'is_new' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        // Set default values
        $data['status'] = $data['status'] ?? 'active';
        $data['discount'] = $data['discount'] ?? 0;
        $data['is_flash_sale'] = $data['is_flash_sale'] ?? false;
        $data['is_new'] = $data['is_new'] ?? false;

        $product = Product::create($data);

        return response()->json([
            'message' => 'Sản phẩm đã được tạo thành công.',
            'data' => $product->fresh(['category', 'brand']),
        ], 201, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Hiển thị chi tiết sản phẩm
     */
    public function show($id)
    {
        $product = Product::with(['category', 'brand', 'reviews'])
            ->findOrFail($id);

        $avgRating = $product->reviews()->avg('rating') ?? 0;
        $totalReviews = $product->reviews()->count();

        return response()->json([
            'id' => $product->product_id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'brand' => optional($product->brand)->name,
            'brand_id' => $product->brand_id,
            'price' => (float) $product->price,
            'discount' => $product->discount ?? 0,
            'final_price' => $product->discount > 0 
                ? (float) ($product->price - ($product->price * $product->discount / 100))
                : (float) $product->price,
            'category' => optional($product->category)->name,
            'category_id' => $product->category_id,
            'stock' => $product->stock,
            'status' => $product->status ?? 'active',
            'rating' => round($avgRating, 1),
            'reviews' => $totalReviews,
            'is_flash_sale' => $product->is_flash_sale,
            'is_new' => $product->is_new,
            'tags' => $product->tags,
            'image' => $product->image,
            'created_at' => optional($product->created_at)?->format('Y-m-d H:i'),
            'updated_at' => optional($product->updated_at)?->format('Y-m-d H:i'),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Cập nhật sản phẩm
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'discount' => ['nullable', 'integer', 'min:0', 'max:100'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'category_id' => ['nullable', 'integer', 'exists:categories,category_id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,brand_id'],
            'is_flash_sale' => ['nullable', 'boolean'],
            'is_new' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $product->update($data);

        return response()->json([
            'message' => 'Sản phẩm đã được cập nhật thành công.',
            'data' => $product->fresh(['category', 'brand']),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Xóa sản phẩm (soft delete)
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'message' => 'Sản phẩm đã được xóa thành công.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Lấy danh sách sản phẩm đã xóa
     */
    public function trashed()
    {
        $products = Product::onlyTrashed()
            ->with(['category:category_id,name', 'brand:brand_id,name'])
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function (Product $product) {
                return [
                    'id' => $product->product_id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'brand' => optional($product->brand)->name,
                    'price' => (float) $product->price,
                    'category' => optional($product->category)->name,
                    'stock' => $product->stock,
                    'status' => $product->status ?? 'active',
                    'deleted_at' => optional($product->deleted_at)?->format('Y-m-d H:i'),
                ];
            });

        return response()->json($products->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Khôi phục sản phẩm đã xóa
     */
    public function restore($id)
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->restore();

        return response()->json([
            'message' => 'Sản phẩm đã được khôi phục thành công.',
            'data' => $product->fresh(['category', 'brand']),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Chuyển đổi trạng thái sản phẩm
     */
    public function toggleStatus($id)
    {
        $product = Product::findOrFail($id);
        $product->status = $product->status === 'active' ? 'inactive' : 'active';
        $product->save();

        return response()->json([
            'ok' => true,
            'id' => $product->product_id,
            'status' => $product->status,
            'message' => 'Trạng thái đã được cập nhật.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Tạo slug từ tên
     */
    public function slugify(Request $request)
    {
        $name = $request->query('text', '');
        $ignore = $request->query('ignore');

        $slug = Product::generateUniqueSlug(
            $name,
            $ignore !== null ? (int) $ignore : null
        );

        return response()->json(['slug' => $slug], 200, [], JSON_UNESCAPED_UNICODE);
    }
}

