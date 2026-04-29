import Link from 'next/link';
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
    <>
      <section className="hero-gradient">
        <div className="container">
          <Link href="/blog" className="kicker" style={{ textDecoration: 'none' }}>
            <i className="bi bi-arrow-left"></i> Back to blog
          </Link>
          <h1 className="display-5 mt-3 mb-2">{post.title}</h1>
          {post.date && (
            <p className="lead mb-0">
              {new Date(post.date).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' })}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-8">
              <article className="prose-miras" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </div>
          </div>
        </div>

        <style>{`
          .prose-miras{ color: var(--ink); font-size: 1.05rem; line-height: 1.75 }
          .prose-miras h2{ margin-top: 2.5rem; margin-bottom: 1rem; color: var(--ink-strong); font-size: 1.6rem; letter-spacing:-.01em }
          .prose-miras h3{ margin-top: 2rem; margin-bottom: .75rem; color: var(--ink-strong); font-size: 1.25rem }
          .prose-miras p{ margin-bottom: 1.1rem }
          .prose-miras a{ color: var(--brand); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(106,163,255,.4) }
          .prose-miras a:hover{ text-decoration-color: var(--brand) }
          .prose-miras ul, .prose-miras ol{ margin-bottom: 1.1rem; padding-left: 1.25rem }
          .prose-miras li{ margin-bottom: .35rem }
          .prose-miras blockquote{
            border-left: 3px solid var(--brand);
            margin: 1.5rem 0; padding: .75rem 1.15rem;
            background: var(--surface);
            border-radius: 0 var(--radius) var(--radius) 0;
            color: var(--ink);
          }
          .prose-miras code{
            background: var(--surface-2);
            color: #ffd9a8;
            padding: .15rem .4rem;
            border-radius: .35rem;
            font-size: .9em;
          }
          .prose-miras pre{
            background: var(--bg-2);
            border: 1px solid var(--border);
            color: var(--ink);
            padding: 1.1rem 1.25rem;
            border-radius: var(--radius);
            overflow-x: auto;
            margin: 1.5rem 0;
          }
          .prose-miras pre code{ background: transparent; color: inherit; padding: 0 }
          .prose-miras hr{ margin: 2rem 0; border-color: var(--border) }
          .prose-miras img{ max-width: 100%; border-radius: var(--radius); margin: 1.5rem 0 }
        `}</style>
      </section>
    </>
  );
}
