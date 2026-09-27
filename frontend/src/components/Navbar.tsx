import React from 'react';

interface NavbarProps {
  onNewRelease: () => void;
  totalReleases: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewRelease, totalReleases }) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">🚀</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="brand-title">Release Checklist Tool</h1>
            <span
              style={{
                fontSize: 12,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '2px 8px',
                borderRadius: 9999,
                fontWeight: 600,
              }}
            >
              {totalReleases} {totalReleases === 1 ? 'Release' : 'Releases'}
            </span>
          </div>
          <p className="brand-subtitle">
            Manage software releases, checklist steps, and track computed statuses
          </p>
        </div>
      </div>
      <div className="header-actions">
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
