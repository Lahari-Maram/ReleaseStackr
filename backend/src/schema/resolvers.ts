import { GraphQLError } from 'graphql';
import { prisma } from '../db/prisma';
import { FIXED_CHECKLIST_STEPS, FIXED_STEP_IDS } from '../constants/steps';
import { computeReleaseStatus } from '../utils/status';
import { releaseCache } from '../utils/cache';

interface CreateReleaseInput {
  name: string;
  date: string;
  additionalInfo?: string | null;
}

export const resolvers = {
  Query: {
    releases: async () => {
      const cached = releaseCache.getList();
      if (cached) {
        return cached;
      }
      const records = await prisma.release.findMany({
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });
      const mapped = records.map((r) => ({
        ...r,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        completedSteps: Array.isArray(r.completedSteps)
          ? (r.completedSteps as string[])
          : [],
        status: computeReleaseStatus(r.completedSteps),
      }));
      releaseCache.setList(mapped);
      return mapped;
    },

    release: async (_: unknown, { id }: { id: string }) => {
      const cached = releaseCache.getItem(id);
      if (cached) {
        return cached;
      }
      const record = await prisma.release.findUnique({
        where: { id },
      });
      if (!record) {
        return null;
      }
      const mapped = {
        ...record,
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        completedSteps: Array.isArray(record.completedSteps)
          ? (record.completedSteps as string[])
          : [],
        status: computeReleaseStatus(record.completedSteps),
      };
      releaseCache.setItem(mapped);
      return mapped;
    },

    checklistSteps: () => {
      return FIXED_CHECKLIST_STEPS;
    },
  },

  Mutation: {
    createRelease: async (
      _: unknown,
      { input }: { input: CreateReleaseInput }
    ) => {
      const trimmedName = input.name?.trim();
      if (!trimmedName) {
        throw new GraphQLError('Release name is required and cannot be blank.', {
          extensions: { code: 'BAD_USER_INPUT', argumentName: 'name' },
        });
      }

      if (!input.date) {
        throw new GraphQLError('Release date is required.', {
          extensions: { code: 'BAD_USER_INPUT', argumentName: 'date' },
        });
      }

      const parsedDate = new Date(input.date);
      if (isNaN(parsedDate.getTime())) {
        throw new GraphQLError('Invalid date format provided for release date.', {
          extensions: { code: 'BAD_USER_INPUT', argumentName: 'date' },
        });
      }

      const record = await prisma.release.create({
        data: {
          name: trimmedName,
          date: parsedDate,
          additionalInfo: input.additionalInfo?.trim() || null,
          completedSteps: [],
        },
      });

      releaseCache.invalidate();

      return {
        ...record,
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        completedSteps: [],
        status: computeReleaseStatus([]),
      };
    },

    updateReleaseAdditionalInfo: async (
      _: unknown,
      { id, additionalInfo }: { id: string; additionalInfo?: string | null }
    ) => {
      const existing = await prisma.release.findUnique({ where: { id } });
      if (!existing) {
        throw new GraphQLError(`Release with ID '${id}' not found.`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const sanitizedInfo =
        additionalInfo !== undefined && additionalInfo !== null
          ? additionalInfo.trim()
          : null;

      const record = await prisma.release.update({
        where: { id },
        data: {
          additionalInfo: sanitizedInfo,
        },
      });

      releaseCache.invalidate(id);

      return {
        ...record,
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        completedSteps: Array.isArray(record.completedSteps)
          ? (record.completedSteps as string[])
          : [],
        status: computeReleaseStatus(record.completedSteps),
      };
    },

    toggleReleaseStep: async (
      _: unknown,
      {
        id,
        stepId,
        completed,
      }: { id: string; stepId: string; completed: boolean }
    ) => {
      if (!FIXED_STEP_IDS.includes(stepId)) {
        throw new GraphQLError(
          `Invalid stepId '${stepId}'. Must be one of: ${FIXED_STEP_IDS.join(', ')}`,
          { extensions: { code: 'BAD_USER_INPUT', argumentName: 'stepId' } }
        );
      }

      const existing = await prisma.release.findUnique({ where: { id } });
      if (!existing) {
        throw new GraphQLError(`Release with ID '${id}' not found.`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const currentSteps = Array.isArray(existing.completedSteps)
        ? (existing.completedSteps as string[])
        : [];

      let updatedSteps: string[];
      if (completed) {
        updatedSteps = currentSteps.includes(stepId)
          ? currentSteps
          : [...currentSteps, stepId];
      } else {
        updatedSteps = currentSteps.filter((s) => s !== stepId);
      }

      const record = await prisma.release.update({
        where: { id },
        data: {
          completedSteps: updatedSteps,
        },
      });

      releaseCache.invalidate(id);

      return {
        ...record,
        date: record.date.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        completedSteps: updatedSteps,
        status: computeReleaseStatus(updatedSteps),
      };
    },

    deleteRelease: async (_: unknown, { id }: { id: string }) => {
      const existing = await prisma.release.findUnique({ where: { id } });
      if (!existing) {
        throw new GraphQLError(`Release with ID '${id}' not found.`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await prisma.release.delete({ where: { id } });
      releaseCache.invalidate(id);
      return true;
    },
  },
};
