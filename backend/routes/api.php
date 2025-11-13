<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PostExportController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\ProductHistoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Tất cả route trong file này đều có tiền tố "/api"
| Ví dụ: http://127.0.0.1:8000/api/test
*/

// Route kiểm tra kết nối
Route::get('/test', function () {
    return response()->json(['message' => 'API đang hoạt động!']);
});

// Auth routes (public)
Route::controller(AuthController::class)->group(function () {
    Route::post('/register', 'register');
    Route::post('/login', 'login');
    Route::post('/forgot-password', 'forgotPassword');
    Route::post('/reset-password', 'resetPassword');
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn(Request $request) => $request->user());

    // Profile routes
    Route::put('/me/update', [ProfileController::class, 'updateProfile']);
    Route::post('/me/change-password', [ProfileController::class, 'changePassword']);

    Route::apiResource('users', UserController::class)->only(['index', 'show', 'update', 'destroy', 'store']);
});

// User statistics route (public)
Route::get('/user-statistics', [UserController::class, 'userStatistics']);
Route::get('/monthly-user-statistics', [UserController::class, 'monthlyUserStatistics']);


// Comment routes
Route::get('/comments/export', [CommentController::class, 'export']);
Route::apiResource('comments', CommentController::class);

// ✅ Post routes
Route::get('/posts/{id}/versions', [PostController::class, 'versions']);
Route::get('/posts/{id}/versions/{versionId}', [PostController::class, 'showVersion']);
Route::post('/posts/{id}/restore/{versionId}', [PostController::class, 'restoreVersion']);
Route::get('/post-statistics', [PostController::class, 'statistics']);
Route::get('/posts/export', [PostExportController::class, 'export']);
Route::apiResource('posts', PostController::class);

// Post Category routes
Route::get('/postcategories/export', [PostCategoryController::class, 'export']);
Route::apiResource('postcategories', PostCategoryController::class);

// Category routes
Route::controller(CategoryController::class)->group(function () {
    Route::get('/categories', 'index');
    Route::post('/categories', 'store');
    Route::post('/categories/import/preview', 'importPreview');
    Route::post('/categories/import', 'import');
    Route::put('/categories/{id}', 'update');
    Route::patch('/categories/{id}/toggle', 'toggleStatus');
    Route::get('/categories/trashed', 'trashed');
    Route::delete('/categories/{id}', 'destroy');
    Route::patch('/categories/{id}/restore', 'restore');
    Route::get('/categories/export', 'export');
    Route::get('/categories/slugify', 'slugify');
});

// Brand routes
Route::controller(BrandController::class)->group(function () {
    Route::get('/brands', 'index');
    Route::get('/brands/trashed', 'trashed');
    Route::get('/brands/export', 'export');
    Route::post('/brands/import/preview', 'importPreview');
    Route::post('/brands/import', 'import');
    Route::post('/brands', 'store');
    Route::put('/brands/{id}', 'update');
    Route::patch('/brands/{id}/toggle', 'toggleStatus');
    Route::patch('/brands/{id}/restore', 'restore');
    Route::delete('/brands/{id}', 'destroy');
    Route::get('/brands/slugify', 'slugify');
});

// Quick count routes
Route::get('/brands/count', fn() => ['count' => DB::table('brands')->count()]);
Route::get('/categories/count', fn() => ['count' => DB::table('categories')->count()]);
Route::get('/posts/count', fn() => ['count' => DB::table('posts')->count()]);
Route::get('/comments/count', fn() => ['count' => DB::table('comments')->count()]);
Route::get('/users/count', fn() => ['count' => DB::table('users')->count()]);
Route::get('/orders/count', fn() => ['count' => DB::table('orders')->count()]);

// Product routes
Route::controller(ProductController::class)->group(function () {
    Route::get('/products', 'index');
    Route::get('/products/trashed', 'trashed');
    Route::get('/products/slugify', 'slugify');
    Route::post('/products', 'store');
    Route::get('/products/{id}', 'show');
    Route::put('/products/{id}', 'update');
    Route::patch('/products/{id}/toggle', 'toggleStatus');
    Route::patch('/products/{id}/restore', 'restore');
    Route::delete('/products/{id}', 'destroy');
});

// Product History routes
Route::controller(ProductHistoryController::class)->group(function () {
    Route::get('/products/{productId}/history', 'index');              // Lịch sử của một sản phẩm
    Route::get('/product-history', 'all');                             // Tất cả lịch sử (admin)
    Route::get('/product-history/statistics', 'statistics');           // Thống kê
    Route::get('/product-history/{id}', 'show');                       // Chi tiết bản ghi lịch sử
    Route::post('/product-history/{id}/restore', 'restoreFromHistory'); // Khôi phục từ lịch sử
    Route::get('/product-history/compare/{id1}/{id2}', 'compare');     // So sánh hai phiên bản
});

// Stock routes
Route::controller(StockController::class)->group(function () {
    Route::get('/stock', 'index');
    Route::get('/stock/history', 'history');
    Route::post('/stock/update', 'updateStock');
});


//==========================================================================
// Coupon routes (giữ đầy đủ từ branch_merge)
Route::controller(CouponController::class)->group(function () {
    Route::get('/coupons', 'index');
    Route::get('/coupons/statistics', [CouponController::class, 'statistics']);
    Route::post('/coupons', 'store');
    Route::put('/coupons/{coupon}', [CouponController::class, 'update']);
    Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy']);
    Route::patch('/coupons/{coupon}/toggle', [CouponController::class, 'toggleStatus']);
});

// Order routes
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/statistics', [OrderController::class, 'statistics']);
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
Route::get('/orders/{order}', [OrderController::class, 'show']);
Route::get('/orders/{order}/print', [OrderController::class, 'print']);

//Report routes
Route::get('/reports/revenue', [ReportController::class, 'revenueReport']);

// Product Review routes
Route::controller(ProductReviewController::class)->group(function () {
    Route::get('/reviews', 'index');
    Route::get('/reviews/statistics', 'statistics');
    Route::get('/reviews/{id}', 'show');
    Route::patch('/reviews/{id}/status', 'updateStatus');
    Route::patch('/reviews/{id}/helpful', 'updateHelpful');
    Route::delete('/reviews/{id}', 'destroy');
});

// API Token Management Routes
Route::prefix('api-tokens')->controller(ApiTokenController::class)->group(function () {
    Route::get('/', 'index');                          // Lấy danh sách tokens
    Route::post('/', 'store');                         // Tạo token mới
    Route::get('/permissions', 'permissions');         // Lấy danh sách permissions
    Route::get('/{id}', 'show');                       // Xem chi tiết token
    Route::put('/{id}', 'update');                     // Cập nhật token
    Route::delete('/{id}', 'destroy');                 // Xóa token
    Route::patch('/{id}/deactivate', 'deactivate');    // Vô hiệu hóa token
    Route::patch('/{id}/activate', 'activate');        // Kích hoạt token
    Route::get('/{id}/statistics', 'statistics');      // Thống kê sử dụng
});

/*
|--------------------------------------------------------------------------
| Protected API Routes với API Token
|--------------------------------------------------------------------------
| Các routes này yêu cầu API Token để truy cập
| Sử dụng middleware: api.token:permission
| 
| Cách sử dụng:
| - Header: Authorization: Bearer YOUR_API_TOKEN
| - Rate limit theo cấu hình của token
*/

// Example: Product API với token authentication
Route::prefix('v1')->middleware('api.token')->group(function () {
    // Read products (yêu cầu quyền products.read hoặc products.*)
    Route::get('/products', [ProductController::class, 'index'])
        ->middleware('api.token:products.read');
    
    Route::get('/products/{id}', [ProductController::class, 'show'])
        ->middleware('api.token:products.read');
    
    // Create products (yêu cầu quyền products.create hoặc products.*)
    Route::post('/products', [ProductController::class, 'store'])
        ->middleware('api.token:products.create');
    
    // Update products (yêu cầu quyền products.update hoặc products.*)
    Route::put('/products/{id}', [ProductController::class, 'update'])
        ->middleware('api.token:products.update');
    
    // Delete products (yêu cầu quyền products.delete hoặc products.*)
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])
        ->middleware('api.token:products.delete');
    
    // Reviews API với token
    Route::get('/reviews', [ProductReviewController::class, 'index'])
        ->middleware('api.token:reviews.read');
    
    Route::patch('/reviews/{id}/status', [ProductReviewController::class, 'updateStatus'])
        ->middleware('api.token:reviews.update');
    
    Route::delete('/reviews/{id}', [ProductReviewController::class, 'destroy'])
        ->middleware('api.token:reviews.delete');
});
