import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_RELEASES, GET_CHECKLIST_STEPS } from './graphql/queries';
import { DELETE_RELEASE } from './graphql/mutations';
import { Release, ChecklistStep } from './types';
import { Navbar } from './components/Navbar';
import { ReleaseList } from './components/ReleaseList';
import { ReleaseDetail } from './components/ReleaseDetail';
import { CreateReleaseModal } from './components/CreateReleaseModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const App: React.FC = () => {
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);

  // Dark / Light Theme state with localStorage persistence (Default: 'dark')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('release_checklist_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('release_checklist_theme', theme);
  }, [theme]);

  const {
    data: releasesData,
    loading: releasesLoading,
    error: releasesError,
    refetch: refetchReleases,
  } = useQuery(GET_RELEASES);

  const {
    data: stepsData,
    loading: stepsLoading,
    error: stepsError,
  } = useQuery(GET_CHECKLIST_STEPS);

  const [deleteReleaseMutation, { loading: isDeleting }] = useMutation(
    DELETE_RELEASE,
    {
      refetchQueries: [{ query: GET_RELEASES }],
    }
  );

  const releases: Release[] = releasesData?.releases || [];
  const checklistSteps: ChecklistStep[] = stepsData?.checklistSteps || [];

  const selectedRelease = releases.find((r) => r.id === selectedReleaseId);

  const handleDeleteConfirm = async () => {
    if (!releaseToDelete) return;
    try {
      await deleteReleaseMutation({
        variables: { id: releaseToDelete.id },
      });
      if (selectedReleaseId === releaseToDelete.id) {
        setSelectedReleaseId(null);
      }
      setReleaseToDelete(null);
    } catch (err) {
      console.error('Failed to delete release:', err);
    }
  };

  const handleCreateSuccess = (newReleaseId: string) => {
    setIsCreateModalOpen(false);
    setSelectedReleaseId(newReleaseId);
  };

  const isLoading = (releasesLoading || stepsLoading) && !releasesData;

  return (
    <div className="app-container">
      <Navbar
        onNewRelease={() => setIsCreateModalOpen(true)}
        totalReleases={releases.length}
        theme={theme}
        onSetTheme={setTheme}
      />

      {/* Global Error Banner */}
      {(releasesError || stepsError) && (
        <div className="alert-box alert-danger">
          <span>
            ⚠️ GraphQL Error:{' '}
            {releasesError?.message || stepsError?.message || 'Failed to communicate with API.'}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => refetchReleases()}
            style={{ marginLeft: 'auto' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state for initial fetch */}
      {isLoading && (
        <div className="loading-skeleton">
          <div className="spinner" />
          <p style={{ marginTop: 14, fontSize: 14 }}>Loading software releases from GraphQL API...</p>
        </div>
      )}

      {/* Main View Switching */}
      {!isLoading && selectedRelease ? (
        <ReleaseDetail
          release={selectedRelease}
          allSteps={checklistSteps}
          onBack={() => setSelectedReleaseId(null)}
          onRequestDelete={(r) => setReleaseToDelete(r)}
        />
      ) : !isLoading ? (
        <ReleaseList
          releases={releases}
          totalFixedSteps={checklistSteps.length || 8}
          onSelectRelease={(id) => setSelectedReleaseId(id)}
          onRequestDelete={(r) => setReleaseToDelete(r)}
          onNewRelease={() => setIsCreateModalOpen(true)}
        />
      ) : null}

      {/* Modals */}
      <CreateReleaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteConfirmModal
        isOpen={!!releaseToDelete}
        releaseName={releaseToDelete?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setReleaseToDelete(null)}
        isDeleting={isDeleting}
      />
      {/* Subtle Creator Credit Footer */}
      <footer className="app-footer">
        <p className="app-footer-text">
          Designed &amp; built by <span className="app-footer-author">Lahari Maram</span>
        </p>
      </footer>
    </div>
  );
};
