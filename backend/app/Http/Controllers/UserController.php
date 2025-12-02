<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProfile; // <-- THÊM Model UserProfile
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // <-- THÊM DB để dùng Transaction
use Illuminate\Support\Facades\Hash; // <-- THÊM Hash để mã hóa mật khẩu
use Illuminate\Validation\Rule; // <-- THÊM Rule để validate

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Dùng 'with('profile')' để tải kèm dữ liệu từ bảng userprofile
        $users = User::with('profile')
                     ->orderBy('created_at', 'desc')
                     ->get();
        return response()->json($users);
    }

    /**
     * Lưu user mới vào cả 2 bảng (users và userprofile)
     */
    public function store(Request $request)
    {
        // 1. Validate dữ liệu
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:255',
            'role' => ['nullable', Rule::in(['admin', 'customer', 'editor'])],
            'status' => ['nullable', Rule::in(['active', 'banned'])],
            'full_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ], [
            'username.required' => 'Ten nguoi dung khong duoc de trong.',
            'username.unique' => 'Ten nguoi dung da ton tai.',
            'username.max' => 'Ten nguoi dung khong duoc vuot 255 ky tu.',
            'email.required' => 'Email khong duoc de trong.',
            'email.email' => 'Email khong hop le.',
            'email.unique' => 'Email da ton tai.',
            'email.max' => 'Email khong duoc vuot 255 ky tu.',
            'password.required' => 'Mat khau khong duoc de trong.',
            'password.min' => 'Mat khau phai co it nhat 8 ky tu.',
            'password.max' => 'Mat khau khong duoc vuot 255 ky tu.',
            'role.in' => 'Vai tro khong hop le.',
            'status.in' => 'Trang thai chi chap nhan active hoac banned.',
            'full_name.max' => 'Ho ten khong duoc vuot 255 ky tu.',
            'phone.max' => 'So dien thoai khong duoc vuot 20 ky tu.',
        ]);

        $validated['role'] = $validated['role'] ?? 'customer';
        $validated['status'] = $validated['status'] ?? 'active';

        // 2. Dùng Transaction để đảm bảo an toàn
        // Hoặc tạo user, hoặc không tạo gì cả
        try {
            DB::beginTransaction();

            // 3. Tạo bản ghi trong 'users'
            $user = User::create([
                'username' => $validated['username'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'],
            ]);

            // 4. Dùng quan hệ 'profile()' để tạo bản ghi trong 'userprofile'
            $user->profile()->create([
                'full_name' => $validated['full_name'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                // ... gán các trường profile khác
            ]);
            
            DB::commit(); // Hoàn tất
            
            // Tải lại user với profile để trả về
            $user->load('profile');

            return response()->json($user, 201); // 201 Created

        } catch (\Exception $e) {
            DB::rollBack(); // Hoàn tác nếu có lỗi
            return response()->json(['message' => 'Tạo user thất bại', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // Dùng 'with('profile')' để lấy cả profile
        $user = User::with('profile')->findOrFail($id);
        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => ['nullable', Rule::in(['admin', 'customer', 'editor'])],
            'status' => ['nullable', Rule::in(['active', 'banned'])],
        ]);

        $data = [];
        if (array_key_exists('role', $validated)) $data['role'] = $validated['role'];
        if (array_key_exists('status', $validated)) $data['status'] = $validated['status'];

        if (!empty($data)) {
            $user->update($data);
        }

        $user->load('profile');
        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        // Nếu user còn đơn hàng gắn FK, không cho xóa để tránh lỗi 1451
        $hasOrders = $user->orders()->exists();
        if ($hasOrders) {
            return response()->json([
                'message' => 'Người dùng này vẫn còn đơn hàng, không thể xóa.',
                'code' => 'USER_HAS_ORDERS',
            ], 409);
        }

        $user->delete(); // Do 'onDelete('cascade')', profile cũng sẽ bị xóa
        
        return response()->json(null, 204); // 204 No Content
    }

    public function userStatistics()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'banned')->count();
    $adminUsers = User::where('role', 'admin')->count();
    $customerUsers = User::where('role', 'customer')->count();
    // Count editors if any
    $editorUsers = User::where('role', 'editor')->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
            'adminUsers' => $adminUsers,
            'customerUsers' => $customerUsers,
            'editorUsers' => $editorUsers,
        ]);
    }

    public function monthlyUserStatistics()
    {
        // Build a driver-agnostic query for year/month
        try {
            $driver = DB::getPdo()->getAttribute(\PDO::ATTR_DRIVER_NAME);
        } catch (\Throwable $e) {
            $driver = config('database.default');
        }

        if ($driver === 'sqlite') {
            $select = "strftime('%Y', created_at) as year, strftime('%m', created_at) as month, COUNT(*) as newUsers";
        } elseif ($driver === 'mysql') {
            $select = "YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as newUsers";
        } elseif ($driver === 'pgsql' || $driver === 'postgres') {
            $select = "date_part('year', created_at) as year, date_part('month', created_at) as month, COUNT(*) as newUsers";
        } else {
            // Fallback to MySQL-style which works on many DBs, but may fail on some
            $select = "YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as newUsers";
        }

        $monthlyStats = User::selectRaw($select)
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json($monthlyStats);
    }
}


