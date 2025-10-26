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
  <h3>Danh sach danh muc</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Ten danh muc</th>
        <th>Slug</th>
        <th>Danh muc cha</th>
        <th>Trang thai</th>
        <th>Ngay tao</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($rows as $r)
        <tr>
          <td>{{ $r['ID'] }}</td>
          <td>{{ $r['Name'] }}</td>
          <td>{{ $r['Slug'] }}</td>
          <td>{{ $r['Parent'] }}</td>
          <td>{{ $r['Status'] }}</td>
          <td>{{ $r['Created At'] }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
