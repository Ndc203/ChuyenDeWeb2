<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Quản trị bài viết')</title>

    {{-- Bootstrap CSS --}}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    {{-- Bootstrap Icons --}}
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

    {{-- Custom CSS --}}
    <style>
        body {
            background-color: #f8f9fa;
        }
        header.navbar {
            background-color: #343a40;
        }
        header.navbar a.nav-link {
            color: #fff;
        }
        header.navbar a.nav-link.active {
            font-weight: bold;
            text-decoration: underline;
        }
        .dropdown-menu-end {
            right: 0;
            left: auto;
        }
        .post-thumb {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 12px;
}
    </style>
</head>
<body>
    {{-- Thanh điều hướng --}}
    <header class="navbar navbar-expand-lg navbar-dark px-3">
        <a class="navbar-brand fw-bold" href="{{ url('/admin/posts') }}">
            🛒 Ecommerce
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse justify-content-between" id="adminNav">
            {{-- Menu trái --}}
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link {{ request()->is('admin/posts*') ? 'active' : '' }}" href="{{ route('admin.posts.index') }}">
                        <i class="bi bi-file-text"></i> Bài viết
                    </a>
                </li>
                <!-- <li class="nav-item">
                    <a class="nav-link" href="#">
                        <i class="bi bi-people"></i> Người dùng
                    </a>
                </li> -->
            </ul>

            {{-- Icon người dùng bên phải --}}
            <ul class="navbar-nav ms-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle fs-5 me-1"></i>
                        <span>{{ Auth::user()->name ?? 'Admin' }}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="#"><i class="bi bi-person-lines-fill me-2"></i>Hồ sơ cá nhân</a></li>
                        <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i>Cài đặt</a></li>
                        <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i>Logout</a></li>
                        <li><hr class="dropdown-divider"></li>

                    </ul>
                </li>
            </ul>
        </div>
    </header>

    {{-- Nội dung trang --}}
    <main class="py-4">
        @yield('content')
    </main>

    {{-- Footer --}}
    <footer class="text-center py-3 border-top bg-white">
        <small class="text-muted">© {{ date('Y') }} Ecommerce Admin Panel</small>
    </footer>

    {{-- Bootstrap JS --}}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
