import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DropSend — Share files instantly',
  description: 'Upload any file, get a shareable link. No login. Fast, private, self-hosted.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <header className="header">
            <div className="logo">
              <a href="/" className="logo-link">
                <div className="logo-mark">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                DropSend
              </a>
              <span className="logo-tag">Beta</span>
            </div>
          </header>

          <main className="main">{children}</main>

          <footer className="footer">
            <span className="footer-brand">DropSend · self-hosted</span>
            <div className="footer-links">
              <a href="https://github.com" className="footer-link" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="#" className="footer-link">Docs</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
