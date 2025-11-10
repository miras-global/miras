import Link from 'next/link';
import { getAllPostsMeta } from '@/lib/blog';

export const dynamic = 'force-static';

export default function BlogIndex() {
  const posts = getAllPostsMeta();

  return (
    <div className="container py-5">
      <h1 className="mb-4">Blog</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="list-unstyled">
          {posts.map((post) => (
            <li key={post.slug} className="mb-3">
              <h5 className="mb-1">
                <Link href={`/blog/${post.slug}`} className="text-decoration-none">
                  {post.title}
                </Link>
              </h5>
              <div className="text-body-secondary small">
                {post.date && new Date(post.date).toLocaleDateString()} {post.description && `• ${post.description}`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
