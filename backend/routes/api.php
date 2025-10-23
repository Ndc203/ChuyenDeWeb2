<?php
// routes/api.php
use Illuminate\Support\Facades\Route;
use App\Models\Category;
use App\Http\Controllers\CategoryController;



Route::get('/test', fn () => response()->json(['message' => 'API Laravel đang hoạt động!']));

Route::get('/categories', function () {
    $rows = Category::select(['category_id', 'name', 'parent_id', 'created_at'])
        ->with(['parent:category_id,name'])     // ✅ phải là category_id
        ->orderBy('category_id', 'asc')
        ->get()
        ->map(fn ($c) => [
            'id'         => $c->category_id,     // trả về id cho FE
            'name'       => $c->name,
            'parent'     => optional($c->parent)->name,
            'status'     => 'active',
            'created_at' => optional($c->created_at)?->format('Y-m-d H:i'),
        ]);

    return response()->json($rows->values());    // đảm bảo array tuần tự
});
Route::get('/categories', [CategoryController::class, 'index']);
// Route::put('/categories/{id}/toggle-status', [CategoryController::class, 'toggleStatus']);
// routes/api.php
Route::patch('/categories/{id}/toggle', [CategoryController::class, 'toggleStatus']);

Route::get('/categories/export', [CategoryController::class, 'export']);

