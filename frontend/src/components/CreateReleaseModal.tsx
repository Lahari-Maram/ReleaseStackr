import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_RELEASE } from '../graphql/mutations';
import { GET_RELEASES } from '../graphql/queries';

interface CreateReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReleaseId: string) => void;
}

export const CreateReleaseModal: React.FC<CreateReleaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Default date: Tomorrow at 09:00 AM local
  const getDefaultDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const [name, setName] = useState('');
  const [date, setDate] = useState(getDefaultDateString());
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createRelease, { loading }] = useMutation(CREATE_RELEASE, {
    refetchQueries: [{ query: GET_RELEASES }],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Release name is mandatory.');
      return;
    }

    if (!date) {
      setErrorMessage('Release target date is mandatory.');
      return;
    }

    try {
      const isoDate = new Date(date).toISOString();
      const response = await createRelease({
        variables: {
          input: {
            name: trimmedName,
            date: isoDate,
            additionalInfo: additionalInfo.trim() || null,
          },
        },
      });

      if (response.data?.createRelease?.id) {
        setName('');
        setDate(getDefaultDateString());
        setAdditionalInfo('');
        onSuccess(response.data.createRelease.id);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create release. Please check input.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Software Release</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="alert-box alert-danger">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="release-name">
              Release Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="release-name"
              type="text"
              className="form-input"
              placeholder="e.g. v2.5.0 — Core Platform Upgrade"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="release-date">
              Target Release Date & Time <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="release-date"
              type="datetime-local"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="release-info">
              Additional Information (Optional)
            </label>
            <textarea
              id="release-info"
              className="form-input"
              rows={3}
              placeholder="Any release notes, deployment risks, rollback plans, or stakeholders..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="btn-submit-create"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Release'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
