<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Danh sách danh mục bài viết</title>
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #333; padding: 6px; text-align: left; }
    th { background: #eee; }
  </style>
</head>
<body>
  <h2>Danh sách danh mục bài viết</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Tên danh mục</th>
        <th>Mô tả</th>
        <th>Ngày tạo</th>
      </tr>
    </thead>
    <tbody>
      @foreach($categories as $cat)
        <tr>
          <td>{{ $cat->post_category_id }}</td>
          <td>{{ $cat->name }}</td>
          <td>{{ $cat->description }}</td>
          <td>{{ $cat->created_at->format('d/m/Y') }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
