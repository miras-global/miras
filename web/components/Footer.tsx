import Link from "next/link";

const linkCls = "footer-link";

export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <footer>
      <div className="container">
        <div className="d-flex flex-column align-items-center gap-3">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3">
            <Link href="https://miras.global" className={linkCls}>miras.global</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="https://app.aragon.org/dao/ethereum-mainnet/mrs.dao.eth" target="_blank" className={linkCls}>DAO</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="/blog" className={linkCls}>Blog</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="/whitepapers/1.3/miras.pdf" className={linkCls}>Whitepaper</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="/whitepapers/your-crypto-shouldnt-die-with-you.pdf" className={linkCls}>Guide</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="/miras_investor_presentation.pdf" className={linkCls}>Investors</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="/tos" className={linkCls}>TOS</Link>
            <span className="footer-dot" aria-hidden>•</span>
            <Link href="https://github.com/miras-global/miras" className={linkCls}>Source</Link>
          </div>
          <div className="footer-meta">
            © {year} miras.global · Patent Pending 63/914,518
          </div>
        </div>
      </div>

      <style>{`
        .footer-link{
          color: var(--ink);
          opacity:.78;
          font-size:.88rem;
          letter-spacing:.005em;
          transition: opacity .15s ease, color .15s ease;
        }
        .footer-link:hover{ opacity:1; color:#fff; text-decoration:none }
        .footer-dot{ color: var(--dim); font-size:.7rem }
        .footer-meta{ font-size:.78rem; color: var(--dim); letter-spacing:.04em }
      `}</style>
    </footer>
  );
}
