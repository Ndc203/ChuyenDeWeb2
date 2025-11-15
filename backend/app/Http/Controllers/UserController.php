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
            // Bảng 'users'
            'username' => 'required|string|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'customer'])],
            'status' => ['required', Rule::in(['active', 'banned'])],
            
            // Bảng 'userprofile'
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            // ... thêm các trường profile khác nếu cần
            
        ]);

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
                'full_name' => $validated['full_name'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
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
        // cập nhật chưa làm
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
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

        return response()->json([
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
            'adminUsers' => $adminUsers,
            'customerUsers' => $customerUsers,
        ]);
    }

    public function monthlyUserStatistics()
    {
        $monthlyStats = User::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as newUsers')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json($monthlyStats);
    }
}
