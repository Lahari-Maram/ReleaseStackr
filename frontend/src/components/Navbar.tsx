import React from 'react';

interface NavbarProps {
  onNewRelease: () => void;
  totalReleases: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewRelease,
  totalReleases,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon" aria-label="ReleaseStackr Logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-logo-svg"
          >
            <path d="M3.5 12.5L8.5 17.5L20.5 5.5" />
            <path d="M14 17.5L20.5 11" opacity="0.6" />
          </svg>
        </div>
        <div>
          <div className="brand-title-wrap">
            <h1 className="brand-title">ReleaseStackr</h1>
            <span className="brand-badge">
              {totalReleases} {totalReleases === 1 ? 'Release' : 'Releases'}
            </span>
          </div>
          <p className="brand-subtitle">Release Checklist & Tracking</p>
        </div>
      </div>
      <div className="header-actions">
        {/* iPhone-style Single Theme Toggle Switch */}
        <button
          id="theme-switch"
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          className={`ios-theme-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="ios-switch-track">
            <span className="ios-switch-icon ios-icon-sun" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </span>
            <span className="ios-switch-icon ios-icon-moon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
            <span className="ios-switch-thumb">
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="thumb-icon-moon">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="thumb-icon-sun">
                  <circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#f59e0b" />
                  <line x1="12" y1="1" x2="12" y2="3" stroke="#f59e0b" />
                  <line x1="12" y1="21" x2="12" y2="23" stroke="#f59e0b" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#f59e0b" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#f59e0b" />
                  <line x1="1" y1="12" x2="3" y2="12" stroke="#f59e0b" />
                  <line x1="21" y1="12" x2="23" y2="12" stroke="#f59e0b" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#f59e0b" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#f59e0b" />
                </svg>
              )}
            </span>
          </span>
        </button>

        <button
          id="btn-new-release"
          className="btn btn-primary"
          onClick={onNewRelease}
        >
          <span>+ New Release</span>
        </button>
      </div>
    </header>
  );
};
