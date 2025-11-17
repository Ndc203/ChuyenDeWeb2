<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // For the admin activity page we want to show all users' activity logs.
        // Return all logs (paginated) for any authenticated user (admin panel is protected by auth).
        $logs = ActivityLog::with('user')->orderBy('created_at', 'desc')->paginate(50);

        return response()->json($logs);
    }
}
