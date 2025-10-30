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
  <h3>Danh sách thương hiệu</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Tên thương hiệu</th>
        <th>Slug</th>
        <th>Trạng thái</th>
        <th>Mô tả</th>
        <th>Ngày tạo</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($rows as $r)
        <tr>
          <td>{{ $r['ID'] }}</td>
          <td>{{ $r['Name'] }}</td>
          <td>{{ $r['Slug'] }}</td>
          <td>{{ $r['Status'] }}</td>
          <td>{{ $r['Description'] }}</td>
          <td>{{ $r['Created At'] }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
