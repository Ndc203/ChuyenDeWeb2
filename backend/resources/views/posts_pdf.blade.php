<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Danh sách bài viết</title>
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
    h2 { text-align: center; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #444; padding: 6px; text-align: left; }
    th { background-color: #eee; }
  </style>
</head>
<body>
  <h2>📋 Danh sách bài viết</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Tiêu đề</th>
        <th>Danh mục</th>
        <th>Trạng thái</th>
        <th>Ngày tạo</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($posts as $post)
        <tr>
          <td>{{ $post->id }}</td>
          <td>{{ $post->title }}</td>
          <td>{{ $post->category->name ?? '—' }}</td>
          <td>{{ $post->status }}</td>
          <td>{{ $post->created_at->format('d/m/Y') }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
