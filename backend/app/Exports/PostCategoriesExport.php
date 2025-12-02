<?php

namespace App\Exports;

use App\Models\PostCategory;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PostCategoriesExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return PostCategory::select('post_category_id', 'name', 'description', 'created_at')
            ->get()
            ->map(function ($category) {
                return [
                    'ID' => $category->post_category_id,
                    'Tên danh mục' => $category->name,
                    'Mô tả' => $category->description,
                    'Ngày tạo' => $category->created_at ? $category->created_at->format('d/m/Y H:i') : '',
                ];
            });
    }

    public function headings(): array
    {
        return ['ID', 'Tên danh mục', 'Mô tả', 'Ngày tạo'];
    }
}
