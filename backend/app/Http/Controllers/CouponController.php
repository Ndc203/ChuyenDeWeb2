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

    /**
     * API: POST /api/coupons/apply
     * Kiểm tra mã giảm giá và trả về số tiền giảm
     */
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'order_total' => 'required|numeric|min:0'
        ]);

        $code = $request->code;
        $total = $request->order_total;
        $today = now();

        // 1. Tìm mã trong database
        $coupon = \App\Models\Coupon::where('code', $code)->first();

        // 2. Các bước kiểm tra (Validate)
        if (!$coupon) {
            return response()->json(['message' => 'Mã giảm giá không tồn tại!'], 404);
        }

        if (!$coupon->is_active) {
            return response()->json(['message' => 'Mã giảm giá này đã bị vô hiệu hóa!'], 400);
        }

        if ($coupon->start_date > $today) {
            return response()->json(['message' => 'Mã giảm giá chưa đến đợt áp dụng!'], 400);
        }

        if ($coupon->end_date < $today) {
            return response()->json(['message' => 'Mã giảm giá đã hết hạn!'], 400);
        }

        if ($coupon->usage_count >= $coupon->max_usage) {
            return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng!'], 400);
        }

        if ($total < $coupon->min_order_value) {
            return response()->json([
                'message' => 'Đơn hàng chưa đạt giá trị tối thiểu: ' . number_format($coupon->min_order_value) . 'đ'
            ], 400);
        }

        // 3. Kiểm tra giá trị đơn hàng tối thiểu
        if ($request->order_total < $coupon->min_order_value) {
            return response()->json([
                'message' => 'Đơn hàng chưa đạt tối thiểu ' . number_format($coupon->min_order_value) . 'đ'
            ], 400);
        }

        // 4. Tính tiền giảm
        $discount = 0;
        if ($coupon->type === 'percentage') {
            $discount = $request->order_total * ($coupon->value / 100);
            if ($coupon->max_value > 0) { // Nếu có giảm tối đa
                $discount = min($discount, $coupon->max_value);
            }
        } else {
            $discount = $coupon->value;
        }

        // Không giảm quá tổng tiền
        $discount = min($discount, $request->order_total);

        return response()->json([
            'message' => 'Áp dụng mã thành công!',
            'discount_amount' => $discount,
            'coupon_code' => $coupon->code,
            'coupon_id' => $coupon->coupon_id
        ]);
    }
}