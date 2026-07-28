export const WARDROBE_STORY_DURATION_SECONDS = 16.125;

export const WARDROBE_STORY_CHAPTERS = [
  {
    id: "opening",
    start: 0,
    end: 0.18,
    placement: "left",
  },
  {
    id: "wardrobe",
    start: 0.18,
    end: 0.38,
    placement: "left",
  },
  {
    id: "intelligence",
    start: 0.38,
    end: 0.56,
    placement: "right",
  },
  {
    id: "directions",
    start: 0.56,
    end: 0.82,
    placement: "left",
  },
  {
    id: "ready",
    start: 0.82,
    end: 1,
    placement: "left",
  },
] as const;

export function clampCinematicProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

export function progressToVideoTime(
  progress: number,
  duration = WARDROBE_STORY_DURATION_SECONDS,
) {
  const safeDuration = Number.isFinite(duration) && duration > 0
    ? duration
    : WARDROBE_STORY_DURATION_SECONDS;
  return clampCinematicProgress(progress) * safeDuration;
}

export function getActiveCinematicChapter(progress: number) {
  const normalized = clampCinematicProgress(progress);
  return (
    WARDROBE_STORY_CHAPTERS.find(
      (chapter, index) =>
        normalized >= chapter.start &&
        (normalized < chapter.end || index === WARDROBE_STORY_CHAPTERS.length - 1),
    ) ?? WARDROBE_STORY_CHAPTERS[0]
  );
}
