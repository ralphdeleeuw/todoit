import type { NightLog, NightStatus } from "@prisma/client";
import { NIGHT_MILESTONES } from "@/lib/arcade";

export type NightLogEntry = Pick<NightLog, "date" | "status" | "points">;

/** Normalizes any date-ish value to a "YYYY-MM-DD" key for lexicographic compare. */
function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * Returns only the logs on/after the tracker start date. Nights logged before a
 * "fresh start" stay visible on the calendar but no longer count toward points,
 * badges or streaks. When no start date is set, all logs count.
 */
export function logsFromStart(
  logs: NightLogEntry[],
  startDate: Date | string | null | undefined,
): NightLogEntry[] {
  if (!startDate) return logs;
  const startKey = dayKey(startDate);
  return logs.filter((l) => dayKey(l.date) >= startKey);
}

/** A "dry night" for streak/total purposes: physically stayed dry (with or without meds). */
function isDry(status: NightStatus): boolean {
  return status === "DRY" || status === "DRY_MEDS";
}

/** Counts only for streaks: dry WITHOUT medication. A meds night breaks the streak. */
function isDryUnaided(status: NightStatus): boolean {
  return status === "DRY";
}

/**
 * Computes the current consecutive dry-night streak.
 * Counts only DRY (without medication). DRY_MEDS, WET, WET_MEDS or a gap
 * (missing night) break the streak. Logs must be sorted in ascending date order.
 */
export function computeDryStreak(logs: NightLogEntry[]): number {
  if (logs.length === 0) return 0;

  // Walk backwards from the most recent logged night
  const sorted = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let streak = 0;
  let prevDate: Date | null = null;

  for (const log of sorted) {
    const d = new Date(log.date);
    d.setHours(0, 0, 0, 0);

    if (prevDate !== null) {
      const expectedPrev = new Date(prevDate);
      expectedPrev.setDate(expectedPrev.getDate() - 1);
      // Gap in the log — streak broken
      if (d.getTime() !== expectedPrev.getTime()) break;
    }

    if (!isDryUnaided(log.status)) break;

    streak++;
    prevDate = d;
  }

  return streak;
}

export function computeLongestDryStreak(logs: NightLogEntry[]): number {
  if (logs.length === 0) return 0;

  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let longest = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const log of sorted) {
    const d = new Date(log.date);
    d.setHours(0, 0, 0, 0);

    if (prevDate !== null) {
      const expected = new Date(prevDate);
      expected.setDate(expected.getDate() + 1);
      if (d.getTime() !== expected.getTime()) {
        current = 0; // gap — reset
      }
    }

    if (isDryUnaided(log.status)) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }

    prevDate = d;
  }

  return longest;
}

/** Total nights that were dry (DRY or DRY_MEDS). */
export function computeTotalDryNights(logs: NightLogEntry[]): number {
  return logs.filter((l) => isDry(l.status)).length;
}

/** Sum of all points awarded (only DRY entries have points > 0). */
export function computeTotalNightPoints(logs: NightLogEntry[]): number {
  return logs.reduce((sum, l) => sum + l.points, 0);
}

/** Returns the ids of milestones that have been reached. */
export function computeMilestonesReached(
  totalDryNights: number,
  longestDryStreak: number,
): string[] {
  return NIGHT_MILESTONES.filter((m) => {
    if (m.type === "total") return totalDryNights >= m.threshold;
    return longestDryStreak >= m.threshold;
  }).map((m) => m.id);
}

export type NightStats = {
  currentStreak: number;
  longestStreak: number;
  totalDryNights: number;
  totalPoints: number;
  milestonesReached: string[];
};

export function computeNightStats(
  logs: NightLogEntry[],
  startDate?: Date | string | null,
): NightStats {
  const counted = logsFromStart(logs, startDate);
  const currentStreak = computeDryStreak(counted);
  const longestStreak = computeLongestDryStreak(counted);
  const totalDryNights = computeTotalDryNights(counted);
  const totalPoints = computeTotalNightPoints(counted);
  const milestonesReached = computeMilestonesReached(totalDryNights, longestStreak);
  return { currentStreak, longestStreak, totalDryNights, totalPoints, milestonesReached };
}
