<?php

namespace App\Exports;

use App\Models\Comment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CommentsExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Comment::with(['user', 'post'])
            ->get()
            ->map(function ($c) {
                return [
                    'ID' => $c->comment_id,
                    'Người dùng' => $c->user->username ?? 'Ẩn danh',
                    'Bài viết' => $c->post->title ?? 'Không xác định',
                    'Nội dung' => $c->content,
                    'Ngày tạo' => $c->created_at ? $c->created_at->format('d/m/Y H:i') : '',
                ];
            });
    }

    public function headings(): array
    {
        return ['ID', 'Người dùng', 'Bài viết', 'Nội dung', 'Ngày tạo'];
    }
}
