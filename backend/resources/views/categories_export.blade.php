<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h3>Danh sách danh mục</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Tên danh mục</th>
        <th>Slug</th>
        <th>Danh mục cha</th>
        <th>Trạng thái</th>
        <th>Ngày tạo</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($rows as $row)
        <tr>
          <td>{{ $row['ID'] }}</td>
          <td>{{ $row['Tên danh mục'] }}</td>
          <td>{{ $row['Slug'] }}</td>
          <td>{{ $row['Danh mục cha'] }}</td>
          <td>{{ $row['Trạng thái'] }}</td>
          <td>{{ $row['Ngày tạo'] }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
