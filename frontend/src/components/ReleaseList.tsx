import React from 'react';
import { Release } from '../types';
import { StatusBadge } from './StatusBadge';

interface ReleaseListProps {
  releases: Release[];
  totalFixedSteps: number;
  onSelectRelease: (id: string) => void;
  onRequestDelete: (release: Release) => void;
  onNewRelease: () => void;
}

export const ReleaseList: React.FC<ReleaseListProps> = ({
  releases,
  totalFixedSteps,
  onSelectRelease,
  onRequestDelete,
  onNewRelease,
}) => {
  const plannedCount = releases.filter((r) => r.status === 'PLANNED').length;
  const ongoingCount = releases.filter((r) => r.status === 'ONGOING').length;
  const doneCount = releases.filter((r) => r.status === 'DONE').length;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (releases.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No Software Releases Found</h3>
          <p className="empty-state-text">
            Get started by creating your first software release checklist.
          </p>
          <button className="btn btn-primary" onClick={onNewRelease}>
            + Create First Release
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Releases</span>
          <span className="stat-value">{releases.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Planned</span>
          <span className="stat-value" style={{ color: 'var(--status-planned-text)' }}>
            {plannedCount}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ongoing</span>
          <span className="stat-value" style={{ color: 'var(--status-ongoing-text)' }}>
            {ongoingCount}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Done</span>
          <span className="stat-value" style={{ color: 'var(--status-done-text)' }}>
            {doneCount}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Software Releases ({releases.length})</h2>
          <button className="btn btn-primary btn-sm" onClick={onNewRelease}>
            + New Release
          </button>
        </div>

        <table className="releases-table">
          <thead>
            <tr>
              <th>Release Name</th>
              <th>Target Date</th>
              <th>Status</th>
              <th className="hide-on-mobile">Checklist Progress</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => {
              const completedCount = release.completedSteps?.length || 0;
              const percent = Math.round((completedCount / (totalFixedSteps || 1)) * 100);

              return (
                <tr key={release.id}>
                  <td>
                    <div className="release-name-cell">
                      <span
                        className="release-name-link"
                        onClick={() => onSelectRelease(release.id)}
                      >
                        {release.name}
                      </span>
                      {release.additionalInfo && (
                        <span className="release-info-preview" title={release.additionalInfo}>
                          {release.additionalInfo}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="date-text">{formatDate(release.date)}</span>
                  </td>
                  <td>
                    <StatusBadge status={release.status} />
                  </td>
                  <td className="hide-on-mobile">
                    <div className="progress-container">
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${release.status === 'DONE' ? 'done' : ''}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {completedCount}/{totalFixedSteps}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectRelease(release.id)}
                        id={`btn-view-${release.id}`}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--accent-danger)' }}
                        onClick={() => onRequestDelete(release)}
                        id={`btn-delete-${release.id}`}
                        title="Delete Release"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
