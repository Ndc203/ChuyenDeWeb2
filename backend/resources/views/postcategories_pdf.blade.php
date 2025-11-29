<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Post Categories PDF</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #333;
            padding: 6px;
            font-size: 12px;
        }
        th {
            background: #eee;
        }
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
        @foreach ($categories as $c)
            <tr>
                <td>{{ $c->post_category_id }}</td>
                <td>{{ $c->name }}</td>
                <td>{{ $c->description }}</td>
                <td>{{ $c->created_at ? $c->created_at->format('d/m/Y H:i') : '' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

</body>
</html>
