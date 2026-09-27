import React from 'react';

interface NavbarProps {
  onNewRelease: () => void;
  totalReleases: number;
  theme: 'dark' | 'light';
  onSetTheme: (theme: 'dark' | 'light') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewRelease,
  totalReleases,
  theme,
  onSetTheme,
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
        {/* Modern Pill-Shaped Dark / Light Theme Segmented Switcher */}
        <div
          id="theme-switcher"
          className="theme-pill-switcher"
          role="radiogroup"
          aria-label="Theme selector"
        >
          <button
            id="theme-light-btn"
            type="button"
            className={`theme-pill-segment ${theme === 'light' ? 'active' : ''}`}
            onClick={() => onSetTheme('light')}
            aria-checked={theme === 'light'}
            role="radio"
            title="Switch to Light Theme"
            aria-label="Switch to Light Theme"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="theme-svg-icon"
            >
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
          </button>
          <button
            id="theme-dark-btn"
            type="button"
            className={`theme-pill-segment ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => onSetTheme('dark')}
            aria-checked={theme === 'dark'}
            role="radio"
            title="Switch to Dark Theme"
            aria-label="Switch to Dark Theme"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="theme-svg-icon"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </div>

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
