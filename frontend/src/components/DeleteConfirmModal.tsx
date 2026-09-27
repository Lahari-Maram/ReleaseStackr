import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  releaseName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  releaseName,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Software Release</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>"{releaseName}"</strong>?
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>Deleting...</span>
              </>
            ) : (
              'Yes, Delete Release'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
