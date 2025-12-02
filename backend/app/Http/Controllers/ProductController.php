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

        // Nếu decode thành công, lấy theo ID
        if ($realId) {
            return Product::findOrFail($realId);
        }

        // Nếu $id là số nguyên (string số) thì tìm theo khoá chính
        if (is_numeric($id) && ctype_digit((string) $id)) {
            return Product::findOrFail((int) $id);
        }

        // Nếu không phải numeric, thử tìm theo slug
        $bySlug = Product::where('slug', $id)->first();
        if ($bySlug) {
            return $bySlug;
        }

        // Không tìm thấy: trả 404 với message rõ ràng
        abort(response()->json(['message' => 'Không tìm thấy trang'], 404));
    }

    /**
     * Normalize full-width digits and unicode spaces to ASCII and trim strings
     */
    private function normalizeRequestInput(Request $request)
    {
        $data = $request->all();

        // Fields expected to be numeric that may contain full-width digits
        $numericFields = ['price', 'discount', 'stock', 'category_id', 'brand_id'];
        foreach ($numericFields as $f) {
            if (isset($data[$f]) && is_string($data[$f])) {
                // Convert full-width digits to ASCII
                $data[$f] = $this->toAsciiDigits($data[$f]);
                // Remove surrounding unicode spaces
                $data[$f] = $this->normalizeWhitespace($data[$f]);
            }
        }

        // Fields expected to be textual — normalize whitespace and trim
        $textFields = ['name', 'description', 'tags', 'status'];
        foreach ($textFields as $f) {
            if (isset($data[$f]) && is_string($data[$f])) {
                $data[$f] = $this->normalizeWhitespace($data[$f]);
                $data[$f] = trim($data[$f]);
            }
        }

        $request->merge($data);
    }

    private function toAsciiDigits(string $s): string
    {
        $full = ['０','１','２','３','４','５','６','７','８','９'];
        $ascii = ['0','1','2','3','4','5','6','7','8','9'];
        return str_replace($full, $ascii, $s);
    }

    private function normalizeWhitespace(string $s): string
    {
        // Replace full-width space U+3000 with normal space and collapse multiple spaces
        $s = str_replace("\xE3\x80\x80", ' ', $s); // utf-8 of U+3000
        // Also normalize other unicode whitespace characters to ASCII space
        $s = preg_replace('/[\x{00A0}\x{2000}-\x{200B}\x{202F}\x{205F}\x{3000}]+/u', ' ', $s);
        // Collapse multiple spaces
        $s = preg_replace('/\s+/u', ' ', $s);
        return $s;
    }

    private function containsHtml(string $s): bool
    {
        return $s !== strip_tags($s);
    }

    /**
     * Lấy danh sách sản phẩm
     */
    public function index(Request $request)
    {
        // Validate page param if provided
        if ($request->has('page')) {
            $page = $request->page;
            if (!ctype_digit((string) $page) || (int) $page <= 0) {
                return response()->json(['message' => 'Tham số page không hợp lệ.'], 400);
            }
        }
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
                'image' => ($product->image && file_exists(public_path('images/products/' . $product->image))) ? url('images/products/' . $product->image) : null,
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
        // Normalize inputs: full-width digits, unicode spaces, trim
        $this->normalizeRequestInput($request);

        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
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
        ], [
            'name.required' => 'Tên sản phẩm là bắt buộc.',
            'name.string' => 'Tên sản phẩm phải là chuỗi ký tự.',
            'name.max' => 'Tên sản phẩm không được vượt quá 255 ký tự.',
            'price.required' => 'Giá sản phẩm là bắt buộc.',
            'price.numeric' => 'Giá sản phẩm phải là một số.',
            'price.min' => 'Giá sản phẩm phải lớn hơn hoặc bằng 0.',
            'discount.integer' => 'Chiết khấu phải là số nguyên.',
            'discount.min' => 'Chiết khấu phải lớn hơn hoặc bằng 0.',
            'discount.max' => 'Chiết khấu không được lớn hơn 100.',
            'stock.required' => 'Số lượng tồn kho là bắt buộc.',
            'stock.integer' => 'Số lượng tồn kho phải là số nguyên.',
            'stock.min' => 'Số lượng tồn kho phải lớn hơn hoặc bằng 0.',
            'category_id.integer' => 'ID danh mục phải là số nguyên.',
            'category_id.exists' => 'Danh mục được chọn không hợp lệ.',
            'brand_id.integer' => 'ID thương hiệu phải là số nguyên.',
            'brand_id.exists' => 'Thương hiệu được chọn không hợp lệ.',
            'is_flash_sale.boolean' => 'Giá trị "Flash Sale" không hợp lệ.',
            'is_new.boolean' => 'Giá trị "Sản phẩm mới" không hợp lệ.',
            'image.image' => 'Tệp tải lên phải là hình ảnh.',
            'image.mimes' => 'Hình ảnh phải có định dạng: jpeg, jpg, png, gif, webp.',
            'image.max' => 'Kích thước hình ảnh không được vượt quá 2MB.',
            'status.in' => 'Trạng thái không hợp lệ.',
        ]);
        $data = $validatedData;

        // Additional checks: reject HTML in text fields
        if (isset($data['name']) && $this->containsHtml($data['name'])) {
            return response()->json(['message' => 'Tên sản phẩm không được chứa thẻ HTML.'], 422);
        }
        if (isset($data['description']) && $this->containsHtml($data['description'])) {
            return response()->json(['message' => 'Mô tả không được chứa thẻ HTML.'], 422);
        }

        // Reject whitespace-only inputs (after normalization)
        if (isset($data['name']) && trim($data['name']) === '') {
            return response()->json(['message' => 'Tên sản phẩm là bắt buộc.'], 422);
        }

        // Heuristic duplicate-check to avoid double-submit creating multiple records
        $recentDuplicate = Product::where('name', $data['name'])
            ->where('brand_id', $data['brand_id'] ?? null)
            ->where('category_id', $data['category_id'] ?? null)
            ->where('created_at', '>=', now()->subSeconds(5))
            ->exists();
        if ($recentDuplicate) {
            return response()->json(['message' => 'Bản ghi có vẻ đã được lưu. Vui lòng kiểm tra danh sách để tránh tạo trùng.'], 409);
        }

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
        // Giải mã hashed_id nếu được truyền vào
        $realId = Product::decodeHashedId($id);
        $productId = $realId ?? $id;

        // 1. Tìm sản phẩm theo ID (đã giải mã) hoặc Slug
        $product = Product::with(['category', 'brand'])
            ->where('product_id', $productId)
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
            'image' => ($product->image && file_exists(public_path('images/products/' . $product->image))) ? url('images/products/' . $product->image) : null,
            
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

        // Normalize inputs first
        $this->normalizeRequestInput($request);

        $validatedData = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
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
        ], [
            'name.required' => 'Tên sản phẩm là bắt buộc.',
            'name.string' => 'Tên sản phẩm phải là chuỗi ký tự.',
            'name.max' => 'Tên sản phẩm không được vượt quá 255 ký tự.',
            'price.required' => 'Giá sản phẩm là bắt buộc.',
            'price.numeric' => 'Giá sản phẩm phải là một số.',
            'price.min' => 'Giá sản phẩm phải lớn hơn hoặc bằng 0.',
            'discount.integer' => 'Chiết khấu phải là số nguyên.',
            'discount.min' => 'Chiết khấu phải lớn hơn hoặc bằng 0.',
            'discount.max' => 'Chiết khấu không được lớn hơn 100.',
            'stock.required' => 'Số lượng tồn kho là bắt buộc.',
            'stock.integer' => 'Số lượng tồn kho phải là số nguyên.',
            'stock.min' => 'Số lượng tồn kho phải lớn hơn hoặc bằng 0.',
            'category_id.integer' => 'ID danh mục phải là số nguyên.',
            'category_id.exists' => 'Danh mục được chọn không hợp lệ.',
            'brand_id.integer' => 'ID thương hiệu phải là số nguyên.',
            'brand_id.exists' => 'Thương hiệu được chọn không hợp lệ.',
            'is_flash_sale.boolean' => 'Giá trị "Flash Sale" không hợp lệ.',
            'is_new.boolean' => 'Giá trị "Sản phẩm mới" không hợp lệ.',
            'image.image' => 'Tệp tải lên phải là hình ảnh.',
            'image.mimes' => 'Hình ảnh phải có định dạng: jpeg, jpg, png, gif, webp.',
            'image.max' => 'Kích thước hình ảnh không được vượt quá 2MB.',
            'status.in' => 'Trạng thái không hợp lệ.',
        ]);
        $data = $validatedData;

        // Cast numeric-like strings to proper types
        foreach (['price','discount','stock','category_id','brand_id'] as $n) {
            if (isset($data[$n]) && $data[$n] === '') {
                unset($data[$n]);
            }
        }

        // Optimistic lock: if client provides updated_at, ensure it matches current value
        if ($request->has('updated_at')) {
            $clientTs = (string) $request->input('updated_at');
            $serverTs = $product->updated_at ? $product->updated_at->format('Y-m-d H:i') : null;
            if ($serverTs && $clientTs !== $serverTs) {
                return response()->json([
                    'message' => 'Dữ liệu đã được thay đổi. Vui lòng tải lại trang trước khi cập nhật.'
                ], 409);
            }
        }

        // Validate HTML and whitespace-only
        if (isset($data['name']) && $this->containsHtml($data['name'])) {
            return response()->json(['message' => 'Tên sản phẩm không được chứa thẻ HTML.'], 422);
        }
        if (isset($data['description']) && $this->containsHtml($data['description'])) {
            return response()->json(['message' => 'Mô tả không được chứa thẻ HTML.'], 422);
        }
        if (isset($data['name']) && trim($data['name']) === '') {
            return response()->json(['message' => 'Tên sản phẩm là bắt buộc.'], 422);
        }

        // Handle file upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image && file_exists(public_path('images/products/' . $product->image))) {
                unlink(public_path('images/products/' . $product->image));
            }
            
            $image = $request->file('image');
            // Double-check uploaded file is an image via getimagesize
            $size = @getimagesize($image->getPathname());
            if ($size === false) {
                return response()->json(['message' => 'Tệp tải lên không phải là hình ảnh hợp lệ.'], 422);
            }
            $mime = $image->getClientMimeType();
            if (!str_starts_with($mime, 'image/')) {
                return response()->json(['message' => 'Tệp tải lên không phải là hình ảnh.'], 422);
            }

            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/products'), $filename);
            $data['image'] = $filename;
        }

        // Reject HTML in tags
        if (isset($data['tags']) && is_string($data['tags']) && $this->containsHtml($data['tags'])) {
            return response()->json(['message' => 'Tags không được chứa thẻ HTML.'], 422);
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
        // Ensure dangerous GET deletes are not allowed
        $request = request();
        if ($request->isMethod('get')) {
            return response()->json(['message' => 'Method Not Allowed'], 405);
        }

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
