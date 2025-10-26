<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCategoryController;

Route::apiResource('posts', PostController::class);
Route::apiResource('postcategories', PostCategoryController ::class);

Route::get('/test', fn () => response()->json(['message' => 'API is running.']));

Route::controller(CategoryController::class)->group(function () {
    Route::get('/categories', 'index');
    Route::post('/categories', 'store');
    Route::put('/categories/{id}', 'update');
    Route::patch('/categories/{id}/toggle', 'toggleStatus');
    Route::get('/categories/export', 'export');
    Route::get('/categories/slugify', 'slugify');
});
