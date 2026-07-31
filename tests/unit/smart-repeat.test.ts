import { describe, it, expect } from "vitest";
import { buildRepeatAvoidancePromptContext } from "@/lib/smart-repeat";

describe("Smart Repeat Avoidance", () => {
  it("should return empty string if no recent items", () => {
    const context = buildRepeatAvoidancePromptContext([]);
    expect(context).toBe("");
  });

  it("should return empty string if preference is none", () => {
    const context = buildRepeatAvoidancePromptContext(["item-1"], "none");
    expect(context).toBe("");
  });

  it("should deduplicate items and include preference context", () => {
    const context = buildRepeatAvoidancePromptContext(["item-1", "item-2", "item-1"], "balanced");
    expect(context).toContain("item-1, item-2");
    expect(context).toContain("Please prefer variety");
  });
  
  it("should include favorites preference", () => {
    const context = buildRepeatAvoidancePromptContext(["item-1"], "favorites_okay");
    expect(context).toContain("okay to repeat favorite staples");
  });
});
