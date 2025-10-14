@extends('layouts.admin')

@section('content')
<div class="container mt-4">
    <h4 class="mb-4">📄 Danh sách bài viết</h4>

    <table class="table table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th></th>
                <th>Bài viết</th>
                <th>Tác giả</th>
                <th>Chuyên mục</th>
                <th>Lượt xem</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
            </tr>
        </thead>
        <tbody>
        @foreach($posts as $post)
            <tr>
                <td><input type="checkbox"></td>
                <td style="width: 300px;">
                    <div class="d-flex align-items-center">
                        <img src="{{ asset('img/' . $post->image) }}" alt="" class="post-thumb">


                        <div>
                            <h6 class="mb-1">{{ Str::limit($post->title, 40) }}
                                @if($post->is_trending)
                                    <span class="badge bg-danger ms-1">🔥 Trending</span>
                                @endif
                            </h6>
                            <small class="text-muted">{{ Str::limit($post->excerpt, 60) }}</small><br>
                            <small><i class="bi bi-eye"></i> {{ number_format($post->views) }} &nbsp; 
                                <i class="bi bi-chat-left-text"></i> {{ $post->comments_count }} bình luận
                            </small>
                        </div>
                    </div>
                </td>
                <td>{{ $post->author->name ?? 'Ẩn danh' }}</td>
                <td><span class="badge bg-secondary">{{ $post->category->name ?? 'Chưa phân loại' }}</span></td>
                <td>{{ number_format($post->views) }}</td>
                <td>{{ $post->created_at->format('H:i d/m/Y') }}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-outline-warning"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="mt-3">
        {{ $posts->links() }}
    </div>
</div>
@endsection
