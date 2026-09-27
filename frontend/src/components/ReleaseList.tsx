import React, { useState, useMemo } from 'react';
import { Release, ReleaseStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, isOverdue } from '../utils/date';

interface ReleaseListProps {
  releases: Release[];
  totalFixedSteps: number;
  onSelectRelease: (id: string) => void;
  onRequestDelete: (release: Release) => void;
  onNewRelease: () => void;
}

type FilterOption = 'ALL' | ReleaseStatus;

export const ReleaseList: React.FC<ReleaseListProps> = ({
  releases,
  totalFixedSteps,
  onSelectRelease,
  onRequestDelete,
  onNewRelease,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const plannedCount = releases.filter((r) => r.status === 'PLANNED').length;
  const ongoingCount = releases.filter((r) => r.status === 'ONGOING').length;
  const doneCount = releases.filter((r) => r.status === 'DONE').length;
  const overdueCount = releases.filter((r) => isOverdue(r.date, r.status)).length;

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const matchesSearch = release.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'ALL' || release.status === statusFilter;
      const matchesOverdue = !overdueOnly || isOverdue(release.date, release.status);
      return matchesSearch && matchesStatus && matchesOverdue;
    });
  }, [releases, searchQuery, statusFilter, overdueOnly]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setOverdueOnly(false);
  };

  // If no releases exist at all in database
  if (releases.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No Software Releases Found</h3>
          <p className="empty-state-text">
            Get started by creating your first software release checklist.
          </p>
          <button id="btn-create-first" className="btn btn-primary" onClick={onNewRelease}>
            + Create First Release
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Summary Stats (including Overdue Card) */}
      <div className="stats-grid">
        <div
          id="card-total"
          className={`stat-card clickable ${statusFilter === 'ALL' && !overdueOnly ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter('ALL');
            setOverdueOnly(false);
          }}
          title="Show all releases"
        >
          <span className="stat-label">Total Releases</span>
          <span className="stat-value">{releases.length}</span>
        </div>
        <div
          id="card-planned"
          className={`stat-card clickable ${statusFilter === 'PLANNED' && !overdueOnly ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter(statusFilter === 'PLANNED' && !overdueOnly ? 'ALL' : 'PLANNED');
          }}
          title="Filter planned releases"
        >
          <span className="stat-label">Planned</span>
          <span className="stat-value" style={{ color: 'var(--status-planned-text)' }}>
            {plannedCount}
          </span>
        </div>
        <div
          id="card-ongoing"
          className={`stat-card clickable ${statusFilter === 'ONGOING' && !overdueOnly ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter(statusFilter === 'ONGOING' && !overdueOnly ? 'ALL' : 'ONGOING');
          }}
          title="Filter ongoing releases"
        >
          <span className="stat-label">Ongoing</span>
          <span className="stat-value" style={{ color: 'var(--status-ongoing-text)' }}>
            {ongoingCount}
          </span>
        </div>
        <div
          id="card-done"
          className={`stat-card clickable ${statusFilter === 'DONE' && !overdueOnly ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter(statusFilter === 'DONE' && !overdueOnly ? 'ALL' : 'DONE');
            setOverdueOnly(false);
          }}
          title="Filter completed releases"
        >
          <span className="stat-label">Done</span>
          <span className="stat-value" style={{ color: 'var(--status-done-text)' }}>
            {doneCount}
          </span>
        </div>
        <div
          id="card-overdue"
          className={`stat-card clickable overdue-card ${overdueOnly ? 'active' : ''}`}
          onClick={() => setOverdueOnly(!overdueOnly)}
          title="Filter overdue releases"
        >
          <span className="stat-label" style={{ color: overdueCount > 0 ? '#f87171' : 'var(--text-secondary)' }}>
            ⚠️ Overdue
          </span>
          <span className="stat-value" style={{ color: overdueCount > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
            {overdueCount}
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        {/* Controls Toolbar: Search, Filter Tabs, Overdue Toggle & Actions */}
        <div className="table-toolbar">
          <div className="search-box-wrapper">
            <span className="search-icon">🔎</span>
            <input
              id="search-releases-input"
              type="text"
              className="search-input"
              placeholder="Search releases by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-pills">
            <button
              id="filter-all"
              className={`filter-pill ${statusFilter === 'ALL' && !overdueOnly ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('ALL');
                setOverdueOnly(false);
              }}
            >
              All ({releases.length})
            </button>
            <button
              id="filter-planned"
              className={`filter-pill ${statusFilter === 'PLANNED' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'PLANNED' ? 'ALL' : 'PLANNED')}
            >
              Planned ({plannedCount})
            </button>
            <button
              id="filter-ongoing"
              className={`filter-pill ${statusFilter === 'ONGOING' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'ONGOING' ? 'ALL' : 'ONGOING')}
            >
              Ongoing ({ongoingCount})
            </button>
            <button
              id="filter-done"
              className={`filter-pill ${statusFilter === 'DONE' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(statusFilter === 'DONE' ? 'ALL' : 'DONE');
                setOverdueOnly(false);
              }}
            >
              Done ({doneCount})
            </button>
            <button
              id="filter-overdue"
              className={`filter-pill overdue-pill ${overdueOnly ? 'active' : ''}`}
              onClick={() => setOverdueOnly(!overdueOnly)}
            >
              ⚠️ Overdue ({overdueCount})
            </button>
          </div>

          <button id="btn-new-release-table" className="btn btn-primary btn-sm" onClick={onNewRelease}>
            + New Release
          </button>
        </div>

        {/* If filtered list is empty */}
        {filteredReleases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 className="empty-state-title">No Matching Releases Found</h3>
            <p className="empty-state-text">
              {overdueOnly && statusFilter !== 'ALL'
                ? `No overdue releases found with status "${statusFilter}".`
                : overdueOnly
                ? `No overdue releases found.`
                : searchQuery
                ? `No releases matching "${searchQuery}".`
                : `No releases currently in status "${statusFilter}".`}
            </p>
            <button
              id="btn-clear-filters"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
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
              {filteredReleases.map((release) => {
                const completedCount = release.completedSteps?.length || 0;
                const percent = Math.round(
                  (completedCount / (totalFixedSteps || 1)) * 100
                );
                const overdue = isOverdue(release.date, release.status);

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
                          <span
                            className="release-info-preview"
                            title={release.additionalInfo}
                          >
                            {release.additionalInfo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span className="date-text">{formatDateTime(release.date)}</span>
                        {overdue && (
                          <span className="overdue-badge">
                            ⚠️ Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={release.status} />
                    </td>
                    <td className="hide-on-mobile">
                      <div className="progress-container">
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${
                              release.status === 'DONE' ? 'done' : ''
                            }`}
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
        )}
      </div>
    </div>
  );
};
