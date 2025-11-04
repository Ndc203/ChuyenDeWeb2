<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use App\Models\Coupon;
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

    /**
     * Lấy số liệu thống kê cho dashboard mã giảm giá.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function statistics(Request $request): JsonResponse
    {
        $now = Carbon::now();

        // 1. Tổng số mã giảm giá
        $total = Coupon::count();

        // 2. Đang hoạt động
        // Phải thỏa mãn TẤT CẢ các điều kiện:
        // - Đang được bật (is_active)
        // - Đang trong thời gian hiệu lực
        // - Vẫn còn lượt sử dụng
        $active = Coupon::where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->whereColumn('usage_count', '<', 'max_usage')
            ->count();

        // 3. Đã hết hạn (do THỜI GIAN)
        // Những mã đã qua ngày end_date
        $expired = Coupon::where('end_date', '<', $now)
            // Chúng ta cũng có thể kiểm tra is_active = true
            // nếu bạn muốn tách bạch với "Vô hiệu hóa"
            // ->where('is_active', true) 
            ->count();

        // 4. Đã hết lượt (do SỐ LƯỢNG)
        // Phải thỏa mãn 2 điều kiện:
        // - Đã hết lượt dùng
        // - VÀ *chưa* hết hạn (để không bị đếm trùng)
        $usedUp = Coupon::where('is_active', true)
            ->where('end_date', '>=', $now) // <-- Quan trọng: Vẫn còn hạn
            ->whereColumn('usage_count', '>=', 'max_usage')
            ->count();

        // Trả về dữ liệu JSON
        return response()->json([
            'total'   => $total,
            'active'  => $active,
            'expired' => $expired,
            'usedUp'  => $usedUp,
        ]);
    }

    /**
     * Bật hoặc tắt trạng thái 'is_active' của mã giảm giá.
     *
     * @param  \App\Models\Coupon  $coupon
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus(Coupon $coupon): JsonResponse
    {
        try {
            // Lật ngược giá trị (true -> false, false -> true)
            $coupon->is_active = !$coupon->is_active;
            $coupon->save();

            return response()->json($coupon);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Không thể cập nhật trạng thái.'], 500);
        }
    }
}
