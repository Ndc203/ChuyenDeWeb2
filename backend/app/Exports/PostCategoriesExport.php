<?php

namespace App\Exports;

use App\Models\PostCategory;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PostCategoriesExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return PostCategory::select('id', 'name', 'description', 'created_at')->get();
    }

    public function headings(): array
    {
        return ['ID', 'Tên danh mục', 'Mô tả', 'Ngày tạo'];
    }
}

