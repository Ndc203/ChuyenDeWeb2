<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PostsExport;

class PostExportController extends Controller
{
    public function export(Request $request)
    {
        $format = $request->query('format', 'excel'); // excel | pdf
        $posts = Post::with('category')->get();

        if ($format === 'pdf') {
            $pdf = PDF::loadView('posts_pdf', compact('posts'))
                      ->setPaper('a4', 'portrait');
            return $pdf->download('posts.pdf');
        }

        if ($format === 'excel') {
            return Excel::download(new PostsExport, 'posts.xlsx');
        }

        return response()->json(['error' => 'Invalid format'], 400);
    }
}
