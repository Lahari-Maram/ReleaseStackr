import { describe, it, expect, beforeEach, vi } from 'vitest';
import { releaseCache, CachedRelease } from '../utils/cache';
import { resolvers } from '../schema/resolvers';
import { prisma } from '../db/prisma';

vi.mock('../db/prisma', () => ({
  prisma: {
    release: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('ReleaseCache & Resolver Invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    releaseCache.clear();
  });

  it('should store and return cached release list', () => {
    const mockList: CachedRelease[] = [
      {
        id: 'rel-1',
        name: 'Release 1',
        date: '2026-10-01T00:00:00.000Z',
        status: 'PLANNED',
        additionalInfo: null,
        completedSteps: [],
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ];

    expect(releaseCache.getList()).toBeNull();
    releaseCache.setList(mockList);
    expect(releaseCache.getList()).toEqual(mockList);
    expect(releaseCache.getItem('rel-1')).toEqual(mockList[0]);
  });

  it('should invalidate cache when invalidate is called', () => {
    const mockList: CachedRelease[] = [
      {
        id: 'rel-1',
        name: 'Release 1',
        date: '2026-10-01T00:00:00.000Z',
        status: 'PLANNED',
        additionalInfo: null,
        completedSteps: [],
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ];

    releaseCache.setList(mockList);
    expect(releaseCache.getList()).not.toBeNull();
    releaseCache.invalidate();
    expect(releaseCache.getList()).toBeNull();
  });

  it('should serve second releases query from cache without hitting Prisma findMany twice', async () => {
    const mockDbReleases = [
      {
        id: 'rel-1',
        name: 'Release 1.0',
        date: new Date('2026-10-01T00:00:00.000Z'),
        additionalInfo: 'Info text',
        completedSteps: [],
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
    ];

    (prisma.release.findMany as any).mockResolvedValue(mockDbReleases);

    // First call: populates cache from DB
    const firstCall = await resolvers.Query.releases();
    expect(firstCall.length).toBe(1);
    expect(prisma.release.findMany).toHaveBeenCalledTimes(1);

    // Second call: served from in-memory cache
    const secondCall = await resolvers.Query.releases();
    expect(secondCall.length).toBe(1);
    expect(prisma.release.findMany).toHaveBeenCalledTimes(1); // Still 1!
  });

  it('should invalidate cache when toggleReleaseStep mutation runs', async () => {
    const existing = {
      id: 'rel-1',
      name: 'Release 1',
      date: new Date('2026-10-01T00:00:00.000Z'),
      additionalInfo: null,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.release.findMany as any).mockResolvedValue([existing]);
    (prisma.release.findUnique as any).mockResolvedValue(existing);
    (prisma.release.update as any).mockImplementation(({ data }) => ({
      ...existing,
      completedSteps: data.completedSteps,
    }));

    // Populate cache
    await resolvers.Query.releases();
    expect(prisma.release.findMany).toHaveBeenCalledTimes(1);

    // Run mutation
    await resolvers.Mutation.toggleReleaseStep(
      {},
      { id: 'rel-1', stepId: 'code-freeze', completed: true }
    );

    // Query again - cache was invalidated, so findMany must be called again
    await resolvers.Query.releases();
    expect(prisma.release.findMany).toHaveBeenCalledTimes(2);
  });
});
