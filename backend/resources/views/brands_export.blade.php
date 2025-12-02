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
  <h3>Danh sach thuong hieu</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Ten thuong hieu</th>
        <th>Slug</th>
        <th>Trang thai</th>
        <th>Mo ta</th>
        <th>Ngay tao</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($rows as $row)
        <tr>
          <td>{{ $row['ID'] }}</td>
          <td>{{ $row['Ten thuong hieu'] }}</td>
          <td>{{ $row['Slug'] }}</td>
          <td>{{ $row['Trang thai'] }}</td>
          <td>{{ $row['Mo ta'] }}</td>
          <td>{{ $row['Ngay tao'] }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
