import React from 'react';
import { ReleaseStatus } from '../types';

interface StatusBadgeProps {
  status: ReleaseStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();
  
  return (
    <span className={`status-badge ${normalized}`}>
      <span className="status-dot" />
      {normalized}
    </span>
  );
};
