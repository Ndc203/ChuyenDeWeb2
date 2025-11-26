<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductHistory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * Tìm sản phẩm bằng ID hoặc Hashed ID
     */
    private function findProduct($id)
    {
        // Thử decode hashed ID trước
        $realId = Product::decodeHashedId($id);
        
        // Nếu decode thành công, dùng real ID, nếu không dùng ID gốc
        $productId = $realId ?? $id;
        
        return Product::findOrFail($productId);
    }

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
                'hashed_id' => $product->hashed_id,
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
                'image' => $product->image ? url('images/products/' . $product->image) : null,
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
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        // Handle file upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/products'), $filename);
            $data['image'] = $filename;
        }

        // Set default values
        $data['status'] = $data['status'] ?? 'active';
        $data['discount'] = $data['discount'] ?? 0;
        $data['is_flash_sale'] = $data['is_flash_sale'] ?? false;
        $data['is_new'] = $data['is_new'] ?? false;

        $product = Product::create($data);

        // Ghi lại lịch sử tạo sản phẩm
        ProductHistory::logChange($product, 'created', [], $data);

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
        // 1. Tìm sản phẩm theo ID hoặc Slug
        // Sử dụng 'with' để lấy luôn thông tin Brand và Category (Eager Loading)
        $product = Product::with(['category', 'brand'])
            ->where('product_id', $id)
            ->orWhere('slug', $id)
            ->first();

        // 2. Nếu không tìm thấy -> Trả về lỗi 404
        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại'], 404);
        }

        // 3. Tính toán Rating & Reviews
        // (Truy vấn trực tiếp từ quan hệ reviews)
        $avgRating = $product->reviews()->avg('rating') ?? 0;
        $totalReviews = $product->reviews()->count();

        // 4. Tính giá cuối cùng (Final Price)
        $finalPrice = $product->price;
        if ($product->discount > 0) {
            $finalPrice = $product->price - ($product->price * ($product->discount / 100));
        }

        // 5. Trả về JSON
        return response()->json([
            'product_id' => $product->product_id, // Sửa lại key cho khớp với frontend nếu cần
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            
            // Xử lý an toàn nếu brand/category bị null
            'brand' => $product->brand ? $product->brand->name : 'Không có thương hiệu',
            'brand_id' => $product->brand_id,
            'category' => $product->category ? $product->category->name : 'Không có danh mục',
            'category_id' => $product->category_id,

            'price' => (float) $product->price,
            'discount' => $product->discount ?? 0,
            'final_price' => (float) $finalPrice,
            
            'stock' => $product->stock,
            'status' => $product->status ?? 'active',
            
            // Thông tin đánh giá
            'rating' => round($avgRating, 1),
            'reviews' => $totalReviews,
            
            'is_flash_sale' => (bool) $product->is_flash_sale,
            'is_new' => (bool) $product->is_new,
            'tags' => $product->tags,
            'image' => $product->image,
            
            'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i') : null,
            'updated_at' => $product->updated_at ? $product->updated_at->format('Y-m-d H:i') : null,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Cập nhật sản phẩm
     */
    public function update(Request $request, $id)
    {
        $product = $this->findProduct($id);

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
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        // Handle file upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image && file_exists(public_path('images/products/' . $product->image))) {
                unlink(public_path('images/products/' . $product->image));
            }
            
            $image = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/products'), $filename);
            $data['image'] = $filename;
        }

        // Lưu giá trị cũ trước khi cập nhật
        $oldValues = $product->only(array_keys($data));

        $product->update($data);

        // Ghi lại lịch sử cập nhật
        ProductHistory::logChange($product, 'updated', $oldValues, $data);

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
        $product = $this->findProduct($id);
        
        // Lưu thông tin sản phẩm trước khi xóa
        $productData = $product->only([
            'name', 'price', 'stock', 'category_id', 'brand_id', 'status'
        ]);
        
        $product->delete();

        // Ghi lại lịch sử xóa
        ProductHistory::logChange($product, 'deleted', $productData, []);

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
                    'hashed_id' => $product->hashed_id,
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
        $realId = Product::decodeHashedId($id);
        $productId = $realId ?? $id;
        
        $product = Product::onlyTrashed()->findOrFail($productId);
        
        // Lưu thông tin sản phẩm
        $productData = $product->only([
            'name', 'price', 'stock', 'category_id', 'brand_id', 'status'
        ]);
        
        $product->restore();

        // Ghi lại lịch sử khôi phục
        ProductHistory::logChange($product, 'restored', [], $productData);

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
        $product = $this->findProduct($id);
        $oldStatus = $product->status;
        $product->status = $product->status === 'active' ? 'inactive' : 'active';
        $product->save();

        // Ghi lại lịch sử thay đổi trạng thái
        ProductHistory::logChange(
            $product, 
            'updated', 
            ['status' => $oldStatus], 
            ['status' => $product->status]
        );

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
