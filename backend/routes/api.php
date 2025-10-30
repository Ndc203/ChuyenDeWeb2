<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PostExportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Tất cả route trong file này đều có tiền tố "/api"
| Ví dụ: http://127.0.0.1:8000/api/test
*/

// ✅ Route kiểm tra kết nối
Route::get('/test', function () {
    return response()->json(['message' => '✅ API đang hoạt động!']);
});

// ✅ Auth routes (public)
Route::controller(AuthController::class)->group(function () {
    Route::post('/register', 'register');
    Route::post('/login', 'login');
});

// ✅ Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::apiResource('users', UserController::class)->only(['index']);
});


// ✅ Post routes

Route::get('/posts/export', [PostExportController::class, 'export']);
Route::apiResource('posts', PostController::class);

// ✅ Post Category routes
Route::apiResource('postcategories', PostCategoryController::class);

// ✅ Category routes
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

// �o. Brand routes
Route::controller(BrandController::class)->group(function () {
    Route::get('/brands', 'index');
    Route::get('/brands/trashed', 'trashed');
    Route::get('/brands/export', 'export');
    Route::post('/brands', 'store');
    Route::put('/brands/{id}', 'update');
    Route::patch('/brands/{id}/toggle', 'toggleStatus');
    Route::patch('/brands/{id}/restore', 'restore');
    Route::delete('/brands/{id}', 'destroy');
    Route::get('/brands/slugify', 'slugify');
});
