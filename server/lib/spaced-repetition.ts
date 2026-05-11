// Simplified SM-2 algorithm for CET-6 expression review
// Quality ratings: 0=blackout, 1=vague, 2=rough, 3=hard, 4=good, 5=perfect

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// Intervals in days for each mastery level (0-5)
const INTERVALS = [1, 2, 4, 7, 15, 30];

export interface ReviewResult {
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
  mastered: boolean;
}

export function calculateNextReview(
  quality: ReviewQuality,
  currentEaseFactor: number,
  currentInterval: number
): ReviewResult {
  let easeFactor = currentEaseFactor;
  let interval: number;

  if (quality < 3) {
    // Failed recall — reset to short interval
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Successful recall
    if (currentInterval === 0) {
      interval = INTERVALS[0]; // 1 day
    } else if (currentInterval === 1) {
      interval = INTERVALS[1]; // 2 days
    } else {
      // Apply ease factor to interval growth
      interval = Math.round(currentInterval * easeFactor);
    }

    // Adjust ease factor based on quality
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, Math.min(3.0, easeFactor));
  }

  const now = new Date();
  now.setDate(now.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    nextReviewAt: now.toISOString(),
    mastered: interval >= 21,
  };
}

export function getMasteryLevel(interval: number): string {
  if (interval === 0) return "new";
  if (interval < 7) return "learning";
  if (interval < 21) return "reviewing";
  return "mastered";
}
