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

  const walletBtnStyle = {
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.32)',
    borderRadius: '10px',
    color: 'rgba(255, 255, 255, 0.92)',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '6px 12px',
    fontWeight: '600' as const,
    transition: 'all 0.2s ease',
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark navbar-glass sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
            <i className="bi bi-piggy-bank fs-3" />
            <span className="fw-bold">miras.global</span>
            <sup>β</sup>
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
            <ul className="navbar-nav ms-auto mb-2 mb-md-0 align-items-lg-center">
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
                <ul className="dropdown-menu dropdown-menu-dark">
                  <li>
                    <Link href="/register" className={`dropdown-item${isActive('/register') ? ' active' : ''}`}>Register</Link>
                  </li>
                  <li>
                    <Link href="/track" className={`dropdown-item${isActive('/track') ? ' active' : ''}`}>Validate</Link>
                  </li>
                </ul>
              </li>
              <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
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
                        {!connected ? (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            style={walletBtnStyle}
                          >
                            Connect Wallet
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={openChainModal} type="button" style={walletBtnStyle}>
                              {chain.name}
                            </button>
                            <button onClick={openAccountModal} type="button" style={walletBtnStyle}>
                              {account.displayName}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
