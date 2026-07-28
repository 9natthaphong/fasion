# Asset License Inventory — FitToday

All media assets included in this repository have been audited for proper licensing, provenance, and commercial compliance.

---

## 1. Generated AI Demo Assets (`public/images/fittoday/`)

These images were generated using Google Native Image Generation tools specifically for FitToday's contemporary Bangkok fashion editorial identity. All prompts excluded real brand logos, trademarks, fake celebrity likenesses, and watermarks.

| Filename | Generation Date | Purpose | Provenance & License |
|---|---|---|---|
| `home-hero-bangkok-editorial-v1.webp` | 2026-07-27 | Homepage Signature Editorial Hero | Original Generated Asset (AI ImageGen) |
| `direction-safe-editorial-v1.webp` | 2026-07-27 | Safe Look Direction Card | Original Generated Asset (AI ImageGen) |
| `direction-elevated-editorial-v1.webp` | 2026-07-27 | Elevated Look Direction Card | Original Generated Asset (AI ImageGen) |
| `direction-comfortable-editorial-v1.webp` | 2026-07-27 | Comfortable Look Direction Card | Original Generated Asset (AI ImageGen) |
| `wardrobe-capture-guide.jpg` | 2026-07-28 | Wardrobe Flat-lay Photo Guidance Banner | Original Generated Asset (AI ImageGen) |
| `ad-pleated-pants.jpg` | 2026-07-28 | Relaxed Pleated Pants Ad Cover | Original Generated Asset (AI ImageGen) |
| `ad-summer-dress.jpg` | 2026-07-28 | Summer Linen Dress Ad Cover | Original Generated Asset (AI ImageGen) |
| `ad-city-shoes.jpg` | 2026-07-28 | Minimalist Leather Sneakers Ad Cover | Original Generated Asset (AI ImageGen) |
| `ad-structure-tote.jpg` | 2026-07-28 | Structured Canvas Tote Bag Ad Cover | Original Generated Asset (AI ImageGen) |
| `ad-soft-tailored-set-v1.webp` | 2026-07-28 | Soft Tailored Set fictional demo ad cover | Original Generated Asset (Built-in ImageGen; model identifier not exposed); manual inspection passed |
| `ad-workday-capsule-v1.webp` | 2026-07-28 | Workday Capsule fictional demo ad cover | Original Generated Asset (Built-in ImageGen; model identifier not exposed); manual inspection passed |
| `ad-travel-light-set-v1.webp` | 2026-07-28 | Travel Light Set fictional demo ad cover | Original Generated Asset (Built-in ImageGen; model identifier not exposed); manual inspection passed |

---

## 2. Royalty-Free Unsplash Stock Assets (`public/demo-assets/`)

These photography assets are licensed under the **Unsplash License** (free for commercial and non-commercial use, permission granted).

| Filename | Creator | Source / License | Usage Location |
|---|---|---|---|
| `hero-lookbook.jpg` | Igor Rand | Unsplash License | Discover Page Secondary Hero |
| `hero-lookbook-2.jpg` | Dom Hill | Unsplash License | Discover Page Gallery |
| `shop-quiet-cover.jpg` | Alyssa Strohmann | Unsplash License | Quiet Form Shop Cover |
| `shop-edit-cover.jpg` | Northern Aesthetic | Unsplash License | Studio Edit Shop Cover |
| `shop-morrow-cover.jpg` | Alexander Andrews | Unsplash License | Morrow Studio Shop Cover |
| `shop-sunday-cover.jpg` | Priscilla Du Preez | Unsplash License | Sunday Assembly Shop Cover |
| `ad-linen-shirt.jpg` | Forecast Fashion | Unsplash License | Linen Shirt Demo Ad Cover |
| `ad-tailored-set.jpg` | Studio Lookbook | Unsplash License | Tailored Set Demo Ad Cover |
| `ad-city-walk.jpg` | City Walk Photo | Unsplash License | City Walk Demo Ad Cover |
| `ad-weekend-pairing.jpg` | Weekend Style | Unsplash License | Weekend Pairing Demo Ad Cover |

---

## 3. Compliance Summary

- No hotlinked external image URLs used in runtime. All images are hosted locally under `/public`.
- No third-party trademarks, watermarks, or proprietary campaign photos included.
- Next.js Image component (`next/image`) is configured for local WebP and JPG formats.

---

## 4. User-Provided Cinematic Footage (`public/videos-assets/`)

| Filename | Date Added | Purpose | Provenance | Manual Inspection |
|---|---|---|---|---|
| `1.mp4` | 2026-07-28 | Wardrobe selection and outfit preparation, first half | User-provided project footage; preserved unchanged | Passed — subject, wardrobe action, negative space, start/end frames, and metadata reviewed |
| `2.mp4` | 2026-07-28 | Outfit moving through the day, second half | User-provided project footage; preserved unchanged | Passed — subject, office/gym/sunset scenes, negative space, start/end frames, and metadata reviewed |
| `fittoday-wardrobe-story.mp4` | 2026-07-28 | Homepage scroll-controlled wardrobe film | Derived locally from `1.mp4` + `2.mp4` with FFmpeg; no generated frames | Passed — full timeline, matched join, black-frame check, forward/reverse seek, and framing reviewed |
| `fittoday-wardrobe-story-poster.webp` | 2026-07-28 | Immediate poster and reduced-motion fallback | Extracted from the approved cinematic master with FFmpeg | Passed — subject placement, crop, brightness, and text-safe region reviewed |

The exact encoding commands and output measurements are recorded in
[`CINEMATIC_VIDEO_PIPELINE.md`](./CINEMATIC_VIDEO_PIPELINE.md).
