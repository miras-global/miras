import Link from 'next/link';
import { getAllPostsMeta } from '@/lib/blog';

export const dynamic = 'force-static';

export default function BlogIndex() {
  const posts = getAllPostsMeta();

  return (
    <>
      <section className="hero-gradient">
        <div className="container">
          <span className="kicker"><i className="bi bi-journals"></i> Blog</span>
          <h1 className="display-5 mt-3 mb-2">From the <span className="text-gradient">Miras</span> team</h1>
          <p className="lead mb-0">Notes on crypto inheritance, cryptography, and protocol design.</p>
        </div>
      </section>

      <section>
        <div className="container">
          {posts.length === 0 ? (
            <div className="card"><div className="card-body"><p className="text-muted mb-0">No posts yet.</p></div></div>
          ) : (
            <div className="row g-3">
              {posts.map((post) => (
                <div key={post.slug} className="col-12">
                  <Link href={`/blog/${post.slug}`} className="text-decoration-none">
                    <div className="card card-glow">
                      <div className="card-body">
                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                          <div>
                            <h3 className="card-title mb-1" style={{fontSize:'1.35rem'}}>{post.title}</h3>
                            {post.description && <p className="text-muted mb-0">{post.description}</p>}
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            {post.date && (
                              <span className="text-muted small" style={{minWidth:'fit-content'}}>
                                {new Date(post.date).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}
                              </span>
                            )}
                            <i className="bi bi-arrow-right" style={{color:'var(--brand)', fontSize:'1.25rem'}}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
