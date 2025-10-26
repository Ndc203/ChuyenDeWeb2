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
