<?php

namespace App\Exports;

use App\Models\Post;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PostsExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Post::with('category')
            ->get()
            ->map(function ($post) {
                return [
                    'ID' => $post->post_id,
                    'Tiêu đề' => $post->title,
                    'Danh mục' => $post->category->name ?? 'Không xác định',
                    'Trạng thái' => $post->status,
                    'Ngày tạo' => $post->created_at ? $post->created_at->format('d/m/Y H:i') : '',
                ];
            });
    }

    public function headings(): array
    {
        return ['ID', 'Tiêu đề', 'Danh mục', 'Trạng thái', 'Ngày tạo'];
    }
}
