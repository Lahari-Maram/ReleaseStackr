export interface CachedRelease {
  id: string;
  name: string;
  date: string;
  status: 'PLANNED' | 'ONGOING' | 'DONE';
  additionalInfo: string | null;
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * In-memory read cache for releases to eliminate redundant database I/O on hot read paths.
 * Automatically invalidated on any mutating operation (create, update, toggle, delete).
 */
class ReleaseCache {
  private listCache: CachedRelease[] | null = null;
  private itemCache = new Map<string, CachedRelease>();

  getList(): CachedRelease[] | null {
    return this.listCache;
  }

  setList(releases: CachedRelease[]): void {
    this.listCache = releases;
    for (const r of releases) {
      this.itemCache.set(r.id, r);
    }
  }

  getItem(id: string): CachedRelease | null {
    return this.itemCache.get(id) || null;
  }

  setItem(release: CachedRelease): void {
    this.itemCache.set(release.id, release);
  }

  invalidate(id?: string): void {
    this.listCache = null;
    if (id) {
      this.itemCache.delete(id);
    } else {
      this.itemCache.clear();
    }
  }

  clear(): void {
    this.listCache = null;
    this.itemCache.clear();
  }
}

export const releaseCache = new ReleaseCache();
