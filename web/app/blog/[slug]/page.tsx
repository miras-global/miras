import { notFound } from 'next/navigation';
import { getPost, getPostSlugs } from '@/lib/blog';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post || post.draft) return notFound();

  return (
    <div className="container py-5">
      <h1 className="mb-3">{post.title}</h1>
      {post.date && (
        <div className="text-body-secondary mb-4">{new Date(post.date).toLocaleDateString()}</div>
      )}
      <article dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </div>
  );
}
