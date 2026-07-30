import { randomBytes } from "crypto";

export function createBaseSlug(title: string): string {
  if (!title) {
    return `ad-${randomBytes(4).toString("hex")}`;
  }

  const asciiOnly = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!asciiOnly || asciiOnly.length < 2) {
    return `ad-${randomBytes(4).toString("hex")}`;
  }

  const trimmed = asciiOnly.slice(0, 60).replace(/-+$/, "");
  if (trimmed.length < 2) {
    return `ad-${randomBytes(4).toString("hex")}`;
  }

  return trimmed;
}

export async function generateUniqueAdSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = createBaseSlug(title);

  try {
    if (!(await checkExists(baseSlug))) {
      return baseSlug;
    }
  } catch {
    // If check fails, return baseSlug or safe fallback
    return baseSlug;
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const suffix = randomBytes(3).toString("hex");
    const candidate = `${baseSlug.slice(0, 50)}-${suffix}`;
    try {
      if (!(await checkExists(candidate))) {
        return candidate;
      }
    } catch {
      return candidate;
    }
  }

  return `${baseSlug.slice(0, 45)}-${Date.now().toString(36)}`;
}
