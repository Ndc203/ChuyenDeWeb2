<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCategoryController;

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

// ✅ Auth routes
Route::controller(AuthController::class)->group(function () {
    Route::post('/register', 'register');
    Route::post('/login', 'login');
});

// ✅ Post routes
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
