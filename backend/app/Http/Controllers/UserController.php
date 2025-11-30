<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\ValidText;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource with optional filters and pagination.
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255', new ValidText()],
            'role' => ['nullable', Rule::in(['admin', 'customer', 'editor'])],
            'status' => ['nullable', Rule::in(['active', 'banned'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::with('profile')->orderBy('created_at', 'desc');

        if (array_key_exists('search', $filters)) {
            $search = $this->normalizeSearch($filters['search']);
            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder->where('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', function ($profile) use ($search) {
                            $profile->where('full_name', 'like', "%{$search}%");
                        });
                });
            }
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $shouldPaginate = array_key_exists('page', $filters) || array_key_exists('per_page', $filters);
        if ($shouldPaginate) {
            $perPage = $filters['per_page'] ?? 15;
            return response()->json(
                $query->paginate($perPage)->withQueryString()
            );
        }

        return response()->json($query->get());
    }

    /**
     * Persist a new user with profile data.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9._-]+$/', 'unique:users,username', new ValidText()],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'customer', 'editor'])],
            'status' => ['required', Rule::in(['active', 'banned'])],
            'full_name' => ['nullable', 'string', 'max:255', new ValidText()],
            'phone' => ['nullable', 'string', 'regex:/^[0-9]{9,15}$/'],
            'address' => ['nullable', 'string', 'max:500', new ValidText()],
        ]);

        $payload = $this->cleanTextPayload($validated, ['username', 'email', 'full_name', 'address']);
        if (array_key_exists('phone', $validated)) {
            $payload['phone'] = $validated['phone'] !== null ? trim($validated['phone']) : null;
        }

        try {
            DB::beginTransaction();

            $user = User::create([
                'username' => $payload['username'],
                'email' => $payload['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'],
            ]);

            $user->profile()->create([
                'full_name' => $payload['full_name'] ?? null,
                'phone' => $payload['phone'] ?? null,
                'address' => $payload['address'] ?? null,
            ]);

            DB::commit();

            return response()->json($user->load('profile'), 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Khong the tao nguoi dung moi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $user = $this->findUserById($id, true);
        } catch (ModelNotFoundException $e) {
            return $this->userNotFound();
        }

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $user = $this->findUserById($id);
        } catch (ModelNotFoundException $e) {
            return $this->userNotFound();
        }

        $validated = $request->validate([
            'role' => ['nullable', Rule::in(['admin', 'customer', 'editor'])],
            'status' => ['nullable', Rule::in(['active', 'banned'])],
            'lock_version' => ['nullable', 'date'],
        ]);

        if ($request->filled('lock_version') && $user->updated_at !== null) {
            $clientVersion = Carbon::parse($request->input('lock_version'));
            if (!$user->updated_at->equalTo($clientVersion)) {
                return response()->json([
                    'message' => 'Thong tin nguoi dung da thay doi. Vui long tai lai trang truoc khi cap nhat.',
                    'code' => 'VERSION_CONFLICT',
                ], 409);
            }
        }

        $data = [];
        if (array_key_exists('role', $validated)) {
            $data['role'] = $validated['role'];
        }
        if (array_key_exists('status', $validated)) {
            $data['status'] = $validated['status'];
        }

        if (!empty($data)) {
            $user->update($data);
        }

        return response()->json($user->fresh('profile'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $user = $this->findUserById($id);
        } catch (ModelNotFoundException $e) {
            return $this->userNotFound();
        }

        if ($user->orders()->exists()) {
            return response()->json([
                'message' => 'Nguoi dung van con don hang, khong the xoa.',
                'code' => 'USER_HAS_ORDERS',
            ], 409);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    public function userStatistics()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'banned')->count();
        $adminUsers = User::where('role', 'admin')->count();
        $customerUsers = User::where('role', 'customer')->count();
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
        $monthlyStats = User::selectRaw("strftime('%Y', created_at) as year, strftime('%m', created_at) as month, COUNT(*) as newUsers")
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json($monthlyStats);
    }

    protected function findUserById(string $id, bool $withProfile = false): User
    {
        if (!ctype_digit($id) || (int) $id <= 0) {
            throw new ModelNotFoundException();
        }

        $query = User::query();
        if ($withProfile) {
            $query->with('profile');
        }

        return $query->findOrFail((int) $id);
    }

    protected function userNotFound(): JsonResponse
    {
        return response()->json([
            'message' => 'Khong the tim thay nguoi dung hoac da bi xoa.',
        ], 404);
    }

    protected function cleanTextPayload(array $input, array $keys): array
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $input)) {
                $input[$key] = $this->cleanString($input[$key]);
            }
        }

        return $input;
    }

    protected function cleanString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = preg_replace('/\x{3000}/u', ' ', $value);
        $value = trim($value);

        return $value === '' ? null : $value;
    }

    protected function normalizeSearch(?string $value): string
    {
        $clean = $this->cleanString($value);
        if ($clean === null) {
            return '';
        }

        return str_replace(['%', '_'], '', $clean);
    }
}
