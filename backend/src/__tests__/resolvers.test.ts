import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolvers } from '../schema/resolvers';
import { FIXED_CHECKLIST_STEPS } from '../constants/steps';
import { prisma } from '../db/prisma';

// Mock prisma for isolated resolver unit tests
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

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query: checklistSteps', () => {
    it('should return all fixed checklist steps', () => {
      const steps = resolvers.Query.checklistSteps();
      expect(steps).toEqual(FIXED_CHECKLIST_STEPS);
      expect(steps.length).toBe(8);
      expect(steps[0].id).toBe('code-freeze');
    });
  });

  describe('Query: releases', () => {
    it('should return list of releases with computed status', async () => {
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
        {
          id: 'rel-2',
          name: 'Release 2.0',
          date: new Date('2026-10-15T00:00:00.000Z'),
          additionalInfo: null,
          completedSteps: ['code-freeze'],
          createdAt: new Date('2026-09-02T00:00:00.000Z'),
          updatedAt: new Date('2026-09-02T00:00:00.000Z'),
        },
      ];

      (prisma.release.findMany as any).mockResolvedValue(mockDbReleases);

      const result = await resolvers.Query.releases();
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('PLANNED');
      expect(result[1].status).toBe('ONGOING');
      expect(result[0].date).toBe('2026-10-01T00:00:00.000Z');
    });
  });

  describe('Query: release(id)', () => {
    it('should return release by id with computed status', async () => {
      const mockRelease = {
        id: 'rel-123',
        name: 'Release 1.2.3',
        date: new Date('2026-11-01T12:00:00.000Z'),
        additionalInfo: 'Special notes',
        completedSteps: FIXED_CHECKLIST_STEPS.map((s) => s.id),
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T00:00:00.000Z'),
      };

      (prisma.release.findUnique as any).mockResolvedValue(mockRelease);

      const result = await resolvers.Query.release({}, { id: 'rel-123' });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('rel-123');
      expect(result?.status).toBe('DONE');
      expect(result?.completedSteps.length).toBe(8);
    });

    it('should return null if release is not found', async () => {
      (prisma.release.findUnique as any).mockResolvedValue(null);

      const result = await resolvers.Query.release({}, { id: 'non-existent' });
      expect(result).toBeNull();
    });
  });

  describe('Mutation: createRelease', () => {
    it('should create release with valid inputs', async () => {
      const mockCreated = {
        id: 'new-rel-1',
        name: 'Release Alpha',
        date: new Date('2026-12-01T10:00:00.000Z'),
        additionalInfo: 'Alpha release notes',
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.release.create as any).mockResolvedValue(mockCreated);

      const result = await resolvers.Mutation.createRelease(
        {},
        {
          input: {
            name: 'Release Alpha',
            date: '2026-12-01T10:00:00.000Z',
            additionalInfo: 'Alpha release notes',
          },
        }
      );

      expect(result.name).toBe('Release Alpha');
      expect(result.status).toBe('PLANNED');
      expect(result.completedSteps).toEqual([]);
      expect(prisma.release.create).toHaveBeenCalledOnce();
    });

    it('should reject empty or whitespace-only name', async () => {
      await expect(
        resolvers.Mutation.createRelease(
          {},
          {
            input: {
              name: '   ',
              date: '2026-12-01T10:00:00.000Z',
            },
          }
        )
      ).rejects.toThrow('Release name is required');
    });

    it('should reject missing date', async () => {
      await expect(
        resolvers.Mutation.createRelease(
          {},
          {
            input: {
              name: 'Release Beta',
              date: '',
            },
          }
        )
      ).rejects.toThrow('Release date is required');
    });

    it('should reject invalid date string', async () => {
      await expect(
        resolvers.Mutation.createRelease(
          {},
          {
            input: {
              name: 'Release Beta',
              date: 'not-a-real-date',
            },
          }
        )
      ).rejects.toThrow('Invalid date format');
    });
  });

  describe('Mutation: toggleReleaseStep', () => {
    it('should reject invalid stepId', async () => {
      await expect(
        resolvers.Mutation.toggleReleaseStep(
          {},
          {
            id: 'rel-1',
            stepId: 'invalid-non-existent-step',
            completed: true,
          }
        )
      ).rejects.toThrow("Invalid stepId 'invalid-non-existent-step'");
    });

    it('should add step when completed is true', async () => {
      const existing = {
        id: 'rel-1',
        name: 'Release 1',
        date: new Date('2026-10-01T00:00:00.000Z'),
        additionalInfo: null,
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.release.findUnique as any).mockResolvedValue(existing);
      (prisma.release.update as any).mockImplementation(({ data }) => ({
        ...existing,
        completedSteps: data.completedSteps,
      }));

      const result = await resolvers.Mutation.toggleReleaseStep(
        {},
        {
          id: 'rel-1',
          stepId: 'code-freeze',
          completed: true,
        }
      );

      expect(result.completedSteps).toContain('code-freeze');
      expect(result.status).toBe('ONGOING');
    });

    it('should remove step when completed is false', async () => {
      const existing = {
        id: 'rel-1',
        name: 'Release 1',
        date: new Date('2026-10-01T00:00:00.000Z'),
        additionalInfo: null,
        completedSteps: ['code-freeze'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.release.findUnique as any).mockResolvedValue(existing);
      (prisma.release.update as any).mockImplementation(({ data }) => ({
        ...existing,
        completedSteps: data.completedSteps,
      }));

      const result = await resolvers.Mutation.toggleReleaseStep(
        {},
        {
          id: 'rel-1',
          stepId: 'code-freeze',
          completed: false,
        }
      );

      expect(result.completedSteps).toEqual([]);
      expect(result.status).toBe('PLANNED');
    });
  });

  describe('Mutation: updateReleaseAdditionalInfo', () => {
    it('should update additional info string', async () => {
      const existing = {
        id: 'rel-1',
        name: 'Release 1',
        date: new Date('2026-10-01T00:00:00.000Z'),
        additionalInfo: 'Old info',
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.release.findUnique as any).mockResolvedValue(existing);
      (prisma.release.update as any).mockImplementation(({ data }) => ({
        ...existing,
        additionalInfo: data.additionalInfo,
      }));

      const result = await resolvers.Mutation.updateReleaseAdditionalInfo(
        {},
        {
          id: 'rel-1',
          additionalInfo: 'Updated new info text',
        }
      );

      expect(result.additionalInfo).toBe('Updated new info text');
    });
  });

  describe('Mutation: deleteRelease', () => {
    it('should delete existing release', async () => {
      const existing = {
        id: 'rel-1',
        name: 'Release 1',
        date: new Date(),
        additionalInfo: null,
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.release.findUnique as any).mockResolvedValue(existing);
      (prisma.release.delete as any).mockResolvedValue(existing);

      const result = await resolvers.Mutation.deleteRelease({}, { id: 'rel-1' });
      expect(result).toBe(true);
      expect(prisma.release.delete).toHaveBeenCalledWith({ where: { id: 'rel-1' } });
    });

    it('should throw NOT_FOUND if deleting non-existent release', async () => {
      (prisma.release.findUnique as any).mockResolvedValue(null);

      await expect(
        resolvers.Mutation.deleteRelease({}, { id: 'missing-id' })
      ).rejects.toThrow("Release with ID 'missing-id' not found");
    });
  });
});
