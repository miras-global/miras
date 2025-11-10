"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };
  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark navbar-glass sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
          <span className="fw-bold d-flex align-items-center gap-2">

          <i className="bi bi-piggy-bank fs-1 me-2" />
            <span className="fw-bold">miras.global</span>
            <sup>β</sup>
          </span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto mb-2 mb-md-0">
              <li className="nav-item">
                <Link href="/learn-more" className={`nav-link${isActive('/learn-more') ? ' active' : ''}`}>Learn More</Link>
              </li>
              <li className="nav-item">
                <Link href="/pricing" className={`nav-link${isActive('/pricing') ? ' active' : ''}`}>Pricing</Link>
              </li>
              <li className="nav-item">
                <Link href="/get-started" className={`nav-link${(isActive('/get-started') || isActive('/launch')) ? ' active' : ''}`}>Get Started</Link>
              </li>
              <li className="nav-item">
                <Link href="/claim" className={`nav-link${isActive('/claim') ? ' active' : ''}`}>Claim</Link>
              </li>
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle${(isActive('/register') || isActive('/track')) ? ' active' : ''}`}
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Attester
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link href="/register" className={`dropdown-item${isActive('/register') ? ' active' : ''}`}>Register</Link>
                  </li>
                  <li>
                    <Link href="/track" className={`dropdown-item${isActive('/track') ? ' active' : ''}`}>Validate</Link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div style={{ position: 'absolute', top: '-2px', right: '20px', zIndex: 1050 }}>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              color: 'rgba(255, 255, 255, 0.85)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              padding: '6px 14px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                            }}
                          >
                            Connect
                          </button>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={openChainModal}
                            type="button"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.85)',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            }}
                          >
                            {chain.name}
                          </button>
                          <button
                            onClick={openAccountModal}
                            type="button"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.85)',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            }}
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </nav>
    </header>
  );
}
