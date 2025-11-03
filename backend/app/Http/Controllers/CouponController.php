<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class CouponController extends Controller
{
    public function index(Request $request)
    {
        $query = Coupon::query();

        // Lọc theo từ khóa (mã hoặc mô tả)
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Lọc theo loại
        if ($request->has('type') && in_array($request->type, ['percentage', 'fixed_amount'])) {
            $query->where('type', $request->type);
        }

        // Lọc theo trạng thái
        if ($request->has('status') && $request->status !== 'all') {
            $status = $request->status;
            $now = Carbon::now();

            if ($status === 'Hoạt động') $query->where('is_active', true)->where('start_date', '<=', $now)->where('end_date', '>=', $now)->whereRaw('usage_count < max_usage');
            if ($status === 'Hết hạn') $query->where('end_date', '<', $now);
            if ($status === 'Đã hết lượt') $query->whereRaw('usage_count >= max_usage');
            if ($status === 'Sắp diễn ra') $query->where('start_date', '>', $now);
            if ($status === 'Vô hiệu hóa') $query->where('is_active', false);
        }

        return $query->orderBy('created_at', 'desc')->paginate(10); // Phân trang 10 mục mỗi trang
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons|max:100',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['percentage', 'fixed_amount'])],
            'value' => 'required|numeric|min:0',
            'max_value' => 'nullable|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_usage' => 'required|integer|min:1',
            // usage_count sẽ mặc định là 0, không cần validate khi tạo
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean', // Mặc định là true, nhưng vẫn có thể gửi lên
        ]);

        $coupon = Coupon::create(array_merge($validated, ['usage_count' => 0])); // Đảm bảo usage_count được set

        return response()->json($coupon, 201);
    }

    public function show(Coupon $coupon)
    {
        return $coupon;
    }

    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:100', Rule::unique('coupons')->ignore($coupon->coupon_id, 'coupon_id')],
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['percentage', 'fixed_amount'])],
            'value' => 'required|numeric|min:0',
            'max_value' => 'nullable|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_usage' => 'required|integer|min:1',
            'usage_count' => 'sometimes|integer|min:0', // Có thể cập nhật số lượt đã dùng
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'sometimes|boolean',
        ]);

        $coupon->update($validated);

        return response()->json($coupon);
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();
        return response()->json(['message' => 'Xoá mã giảm giá thành công!']);
    }
}
