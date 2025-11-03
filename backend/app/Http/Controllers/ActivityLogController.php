<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index()
    {
        return response()->json(['message' => 'Activity log data will be here.']);
    }
}
