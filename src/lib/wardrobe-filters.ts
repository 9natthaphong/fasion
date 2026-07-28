import type {
  WardrobeAvailabilityStatus,
  WardrobeItemType,
} from "@/lib/types";

const wardrobeItemTypes = [
  "top",
  "bottom",
  "skirt",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
] as const satisfies readonly WardrobeItemType[];

const wardrobeStatuses = [
  "available",
  "laundry",
  "archived",
] as const satisfies readonly WardrobeAvailabilityStatus[];

export function parseWardrobeFilters(input: {
  type?: string;
  status?: string;
  favorite?: string;
}): {
  type: WardrobeItemType | "all";
  status: WardrobeAvailabilityStatus | "all";
  favoriteOnly: boolean;
  invalid: boolean;
} {
  const type =
    input.type === undefined || input.type === "all"
      ? "all"
      : wardrobeItemTypes.includes(input.type as WardrobeItemType)
        ? (input.type as WardrobeItemType)
        : "all";
  const status =
    input.status === undefined || input.status === "all"
      ? "all"
      : wardrobeStatuses.includes(input.status as WardrobeAvailabilityStatus)
        ? (input.status as WardrobeAvailabilityStatus)
        : "all";

  return {
    type,
    status,
    favoriteOnly: input.favorite === "true",
    invalid:
      (input.type !== undefined &&
        input.type !== "all" &&
        !wardrobeItemTypes.includes(input.type as WardrobeItemType)) ||
      (input.status !== undefined &&
        input.status !== "all" &&
        !wardrobeStatuses.includes(input.status as WardrobeAvailabilityStatus)),
  };
}
