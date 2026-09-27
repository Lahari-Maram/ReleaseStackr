import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Release, ChecklistStep } from '../types';
import { StatusBadge } from './StatusBadge';
import { TOGGLE_RELEASE_STEP, UPDATE_ADDITIONAL_INFO } from '../graphql/mutations';
import { GET_RELEASES, GET_RELEASE } from '../graphql/queries';
import { formatFullDateTime, isOverdue } from '../utils/date';

interface ReleaseDetailProps {
  release: Release;
  allSteps: ChecklistStep[];
  onBack: () => void;
  onRequestDelete: (release: Release) => void;
}

export const ReleaseDetail: React.FC<ReleaseDetailProps> = ({
  release,
  allSteps,
  onBack,
  onRequestDelete,
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [additionalInfoText, setAdditionalInfoText] = useState(
    release.additionalInfo || ''
  );
  const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);

  const [toggleStep] = useMutation(TOGGLE_RELEASE_STEP, {
    refetchQueries: [
      { query: GET_RELEASES },
      { query: GET_RELEASE, variables: { id: release.id } },
    ],
  });

  const [updateAdditionalInfo, { loading: isSavingInfo }] = useMutation(
    UPDATE_ADDITIONAL_INFO,
    {
      refetchQueries: [
        { query: GET_RELEASES },
        { query: GET_RELEASE, variables: { id: release.id } },
      ],
    }
  );

  const completedSet = new Set(release.completedSteps || []);
  const completedCount = completedSet.size;
  const totalCount = allSteps.length;
  const percent = Math.round((completedCount / (totalCount || 1)) * 100);
  const overdue = isOverdue(release.date, release.status);

  const handleToggleStep = async (stepId: string) => {
    const isCurrentlyCompleted = completedSet.has(stepId);
    setTogglingStepId(stepId);
    try {
      await toggleStep({
        variables: {
          id: release.id,
          stepId,
          completed: !isCurrentlyCompleted,
        },
      });
    } catch (err) {
      console.error('Failed to toggle step:', err);
    } finally {
      setTogglingStepId(null);
    }
  };

  const handleSaveInfo = async () => {
    try {
      await updateAdditionalInfo({
        variables: {
          id: release.id,
          additionalInfo: additionalInfoText.trim() || null,
        },
      });
      setIsEditingInfo(false);
      setInfoSaveSuccess(true);
      setTimeout(() => setInfoSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save additional info:', err);
    }
  };

  const handleCancelEditInfo = () => {
    setAdditionalInfoText(release.additionalInfo || '');
    setIsEditingInfo(false);
  };

  return (
    <div className="detail-view">
      {/* Top navigation */}
      <div className="detail-header-nav">
        <button id="btn-back-to-list" className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back to Releases
        </button>
        <button
          id="btn-delete-detail"
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--accent-danger)' }}
          onClick={() => onRequestDelete(release)}
        >
          🗑️ Delete Release
        </button>
      </div>

      {/* Release Title Block */}
      <div className="detail-title-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <h1 className="detail-release-name" style={{ margin: 0 }}>
            {release.name}
          </h1>
          <StatusBadge status={release.status} />
        </div>

        <div className="detail-meta">
          <div className="meta-item">
            <span>📅</span>
            <span>Target Date: {formatFullDateTime(release.date)}</span>
            {overdue && (
              <span className="overdue-badge">
                ⚠️ Overdue
              </span>
            )}
          </div>
          <div className="meta-item">
            <span>📊</span>
            <span>
              Progress: {completedCount}/{totalCount} steps completed ({percent}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14 }}>
          <div className="progress-track" style={{ height: 8 }}>
            <div
              className={`progress-fill ${release.status === 'DONE' ? 'done' : ''}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="additional-info-section">
        <div className="section-title">
          <span>📝 Additional Information</span>
          {!isEditingInfo && (
            <button
              id="btn-edit-info"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditingInfo(true)}
            >
              Edit
            </button>
          )}
        </div>

        {infoSaveSuccess && (
          <div className="alert-box alert-success" style={{ padding: '8px 12px', marginBottom: 12 }}>
            <span>✓ Additional information updated successfully.</span>
          </div>
        )}

        {isEditingInfo ? (
          <div>
            <textarea
              id="textarea-additional-info"
              className="info-textarea"
              rows={3}
              placeholder="Enter release notes, deployment instructions, rollback strategy..."
              value={additionalInfoText}
              onChange={(e) => setAdditionalInfoText(e.target.value)}
              disabled={isSavingInfo}
            />
            <div className="info-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCancelEditInfo}
                disabled={isSavingInfo}
              >
                Cancel
              </button>
              <button
                id="btn-save-info"
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveInfo}
                disabled={isSavingInfo}
              >
                {isSavingInfo ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </div>
        ) : (
          <div className="info-display">
            {release.additionalInfo ? (
              release.additionalInfo
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No additional information provided. Click "Edit" to add notes.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Checklist Steps Section */}
      <div className="checklist-section">
        <div className="checklist-header">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Release Checklist Steps ({completedCount}/{totalCount})
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Status auto-updates as you check items
          </span>
        </div>

        <div className="checklist-container">
          {allSteps.map((step) => {
            const isChecked = completedSet.has(step.id);
            const isStepToggling = togglingStepId === step.id;

            return (
              <div
                key={step.id}
                id={`step-${step.id}`}
                className={`checklist-item ${isChecked ? 'checked' : ''}`}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => !isStepToggling && handleToggleStep(step.id)}
                onKeyDown={(e) => {
                  if ((e.key === ' ' || e.key === 'Enter') && !isStepToggling) {
                    e.preventDefault();
                    handleToggleStep(step.id);
                  }
                }}
              >
                <div className="custom-checkbox">
                  {isStepToggling ? (
                    <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  ) : isChecked ? (
                    '✓'
                  ) : null}
                </div>
                <div className="step-details">
                  <div className="step-title">
                    {step.order}. {step.name}
                  </div>
                  {step.description && (
                    <div className="step-description">{step.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
