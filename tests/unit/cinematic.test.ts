import { describe, expect, it } from "vitest";
import {
  clampCinematicProgress,
  getActiveCinematicChapter,
  progressToVideoTime,
  WARDROBE_STORY_DURATION_SECONDS,
} from "@/lib/cinematic";

describe("cinematic wardrobe timeline", () => {
  it("maps normalized scroll progress to the 16.125 second master", () => {
    expect(progressToVideoTime(0)).toBe(0);
    expect(progressToVideoTime(0.5)).toBeCloseTo(
      WARDROBE_STORY_DURATION_SECONDS / 2,
      4,
    );
    expect(progressToVideoTime(1)).toBe(WARDROBE_STORY_DURATION_SECONDS);
  });

  it("clamps invalid or out-of-range progress before seeking", () => {
    expect(clampCinematicProgress(-1)).toBe(0);
    expect(clampCinematicProgress(3)).toBe(1);
    expect(clampCinematicProgress(Number.NaN)).toBe(0);
    expect(progressToVideoTime(4, 10)).toBe(10);
  });

  it.each([
    [0, "opening"],
    [0.179, "opening"],
    [0.18, "wardrobe"],
    [0.38, "intelligence"],
    [0.56, "directions"],
    [0.82, "ready"],
    [1, "ready"],
  ])("activates the expected chapter at progress %s", (progress, id) => {
    expect(getActiveCinematicChapter(progress).id).toBe(id);
  });
});
