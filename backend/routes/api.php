<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// --- 1. IMPORT CONTROLLERS ---
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostExportController;
use App\Http\Controllers\PostCategoryController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\ProductHistoryController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\Admin\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Route kiểm tra kết nối
Route::get('/test', function () {
    return response()->json(['message' => 'API đang hoạt động!']);
});

// ========================================================================
//  PHẦN 1: PUBLIC ROUTES (Không cần đăng nhập)
// ========================================================================

// --- Authentication (Cổng vào) ---
Route::controller(AuthController::class)->group(function () {
    Route::post('/register', 'register');
    Route::post('/login', 'login'); // Login trả về token + role
    Route::post('/forgot-password', 'forgotPassword');
    Route::post('/reset-password', 'resetPassword');
});

// --- Socialite Routes (Google, Facebook...) ---
Route::controller(SocialiteController::class)->group(function(){
    Route::get('/auth/{provider}/redirect', 'redirectToProvider');
    Route::get('/auth/{provider}/callback', 'handleProviderCallback');
});

// --- Public Data (Xem sản phẩm, danh mục, bài viết...) ---

// Categories & Brands (Xem danh sách)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/slugify', [CategoryController::class, 'slugify']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/slugify', [BrandController::class, 'slugify']);

// Products (Xem sản phẩm)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/slugify', [ProductController::class, 'slugify']);
Route::get('/reviews', [ProductReviewController::class, 'index']);

// Post categories
Route::get('/postcategories/export', [PostCategoryController::class, 'export']);

// Posts
Route::get('/posts/export', [PostExportController::class, 'export']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::get('/posts/{id}/comments', [CommentController::class, 'getCommentsByPost']);
Route::get('/posts/{id}/versions', [PostController::class, 'versions']);
Route::get('/post-statistics', [PostController::class, 'statistics']);
Route::get('/postcategories', [PostCategoryController::class, 'index']);
Route::get('/postcategories/{id}', [PostCategoryController::class, 'show']);
// Comment routes
Route::get('/comments/export', [CommentController::class, 'export']);      
Route::apiResource('comments', CommentController::class);

// Quick Counts (Thống kê nhanh cho trang chủ)
Route::get('/brands/count', fn() => ['count' => DB::table('brands')->count()]);
Route::get('/categories/count', fn() => ['count' => DB::table('categories')->count()]);
Route::get('/posts/count', fn() => ['count' => DB::table('posts')->count()]);
Route::get('/comments/count', fn() => ['count' => DB::table('comments')->count()]);
Route::get('/users/count', fn() => ['count' => DB::table('users')->count()]);
Route::get('/orders/count', fn() => ['count' => DB::table('orders')->count()]);
Route::post('/coupons/apply', [CouponController::class, 'apply']);

// --- Webhook từ Casso (Thanh toán tự động) ---
Route::post('/payment/casso-webhook', [PaymentWebhookController::class, 'handleCasso']);

// ========================================================================
//  PHẦN 2: PROTECTED ROUTES (Bắt buộc phải có Token)
// ========================================================================
// Khu vực này dành cho: Customer (đã login), Shop Owner, Admin

Route::middleware('auth:sanctum')->group(function () {

    // --- 2.1 User & Auth (Thông tin cá nhân) ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me/update', [ProfileController::class, 'updateProfile']);
    Route::post('/me/change-password', [ProfileController::class, 'changePassword']);
    Route::get('/dashboard', [DashboardController::class, 'statistics']);

    // Route hỗ trợ code cũ (AdminProfilePage)
    Route::get('/user', function (Request $request) {
        return $request->user()->load('profile');
    });

    // --- 2.2 Giỏ hàng (Cart) - CHO KHÁCH HÀNG ---
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);           // Xem giỏ
        Route::post('/add', [CartController::class, 'add']);         // Thêm mới
        Route::put('/items/{item}', [CartController::class, 'update']); // Sửa số lượng
        Route::delete('/items/{item}', [CartController::class, 'remove']); // Xóa item
    });

    // --- 2.3 Quản lý Đơn hàng (Orders) ---
    // Customer xem đơn mình, Admin/Shop xem tất cả (Logic phân quyền trong Controller)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']); // Admin/Shop update
    Route::get('/orders/{id}/print', [OrderController::class, 'print']);
    Route::get('/orders/statistics', [OrderController::class, 'statistics']);
    Route::get('/orders/{order}/status', [OrderController::class, 'checkStatus']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // --- 2.4 Quản lý Phân quyền (Roles) - CHO ADMIN ---
    Route::get('/roles', [RolePermissionController::class, 'getRoles']);
    Route::post('/roles', [RolePermissionController::class, 'store']);
    Route::put('/roles/{role}', [RolePermissionController::class, 'update']);
    Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);

    // --- 2.5 Quản lý Users - CHO ADMIN ---
    Route::apiResource('users', UserController::class);
    Route::get('/user-statistics', [UserController::class, 'userStatistics']);
    Route::get('/monthly-user-statistics', [UserController::class, 'monthlyUserStatistics']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // --- 2.6 Quản lý Content (Sản phẩm, Danh mục...) - CHO SHOP & ADMIN ---

    // Products Management
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::patch('/products/{id}/toggle', [ProductController::class, 'toggleStatus']);
    Route::patch('/products/{id}/restore', [ProductController::class, 'restore']);
    Route::get('/products/trashed', [ProductController::class, 'trashed']);

    // Categories Management
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/reorder', [CategoryController::class, 'reorder']);
    Route::post('/categories/import/preview', [CategoryController::class, 'importPreview']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::patch('/categories/{id}/toggle', [CategoryController::class, 'toggleStatus']);
    Route::get('/categories/trashed', [CategoryController::class, 'trashed']);
    Route::post('/categories/import', [CategoryController::class, 'import']);
    Route::patch('/categories/{id}/restore', [CategoryController::class, 'restore']);
    Route::get('/categories/export', [CategoryController::class, 'export']);

    // Brands Management
    Route::get('/brands/trashed', [BrandController::class, 'trashed']);
    Route::get('/brands/export', [BrandController::class, 'export']);
    Route::post('/brands/import/preview', [BrandController::class, 'importPreview']);
    Route::post('/brands/import', [BrandController::class, 'import']);
    Route::post('/brands', [BrandController::class, 'store']);
    Route::put('/brands/{id}', [BrandController::class, 'update']);
    Route::delete('/brands/{id}', [BrandController::class, 'destroy']);
    Route::patch('/brands/{id}/toggle', [BrandController::class, 'toggleStatus']);
    Route::patch('/brands/{id}/restore', [BrandController::class, 'restore']);

    // Posts Management
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
    Route::post('/posts/{id}/restore/{versionId}', [PostController::class, 'restoreVersion']);
    Route::get('/post-statistics', [PostController::class, 'statistics']);

    // Coupons Management
    Route::get('/coupons', [CouponController::class, 'index']); // Admin view list
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::put('/coupons/{coupon}', [CouponController::class, 'update']);
    Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy']);
    Route::patch('/coupons/{coupon}/toggle', [CouponController::class, 'toggleStatus']);
    Route::get('/coupons/statistics', [CouponController::class, 'statistics']);
    Route::post('/coupons/apply', [CouponController::class, 'apply']);

    // Reports
    Route::get('/reports/revenue', [ReportController::class, 'revenueReport']);

    // Inventory / Stock
    Route::get('/stock', [StockController::class, 'index']);
    Route::post('/stock/update', [StockController::class, 'updateStock']);
    Route::get('/stock/history', [StockController::class, 'history']);

    // Product Reviews Management
    Route::post('/reviews', [ProductReviewController::class, 'store']);
    Route::patch('/reviews/{id}/status', [ProductReviewController::class, 'updateStatus']);
    Route::delete('/reviews/{id}', [ProductReviewController::class, 'destroy']);
    Route::get('/reviews/statistics', [ProductReviewController::class, 'statistics']);

    // Route CRUD chuẩn
    Route::post('/postcategories', [PostCategoryController::class, 'store']);
    Route::put('/postcategories/{id}', [PostCategoryController::class, 'update']);
    Route::delete('/postcategories/{id}', [PostCategoryController::class, 'destroy']);

    // Product History (Admin)
    Route::get('/products/{productId}/history', [ProductHistoryController::class, 'index']);
    Route::get('/product-history', [ProductHistoryController::class, 'all']);
    Route::get('/product-history/statistics', [ProductHistoryController::class, 'statistics']);
    Route::get('/product-history/compare/{id1}/{id2}', [ProductHistoryController::class, 'compare']);
    Route::get('/product-history/{id}', [ProductHistoryController::class, 'show']);
    Route::post('/product-history/{id}/restore', [ProductHistoryController::class, 'restoreFromHistory']);

});


// ========================================================================
//  PHẦN 3: API TOKENS & V1 (Legacy/Advanced)
// ========================================================================

// API Token Management (Admin Only)
Route::prefix('api-tokens')->controller(ApiTokenController::class)->middleware('auth:sanctum')->group(function () {
    Route::get('/', 'index');
    Route::post('/', 'store');
    Route::get('/permissions', 'permissions');
    Route::get('/{id}', 'show');
    Route::put('/{id}', 'update');
    Route::delete('/{id}', 'destroy');
    Route::patch('/{id}/deactivate', 'deactivate');
    Route::patch('/{id}/activate', 'activate');
    Route::get('/{id}/statistics', 'statistics');
});

// External API v1 (Protected by Custom Token Middleware)
Route::prefix('v1')->middleware('api.token')->group(function () {
    Route::get('/products', [ProductController::class, 'index'])->middleware('api.token:products.read');
    Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('api.token:products.read');
    Route::post('/products', [ProductController::class, 'store'])->middleware('api.token:products.create');
    Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('api.token:products.update');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('api.token:products.delete');
});
