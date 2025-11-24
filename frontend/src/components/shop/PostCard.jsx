import React from "react";
import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <Link to={`/posts/${post.post_id}`}>
      <div className="bg-white rounded-lg shadow p-4 flex flex-col hover:shadow-lg cursor-pointer transition">
        {post.image && (
          <img
            src={`http://127.0.0.1:8000/images/posts/${post.image}`}
            alt={post.title}
            className="h-48 w-full object-cover rounded-md mb-4"
          />
        )}
        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        {post.excerpt && <p className="text-gray-600 mb-2">{post.excerpt}</p>}
        <div className="mt-auto flex justify-between items-center text-sm text-gray-500">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          {post.is_trending && (
            <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
              Nổi bật
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
