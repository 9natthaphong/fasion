# FitToday — Codex handoff

อัปเดตจากการตรวจ source, runtime, Git, browser และ live Supabase เมื่อ 27 กรกฎาคม 2026

## สถานะที่ยืนยันแล้ว

- Repository: `https://github.com/9natthaphong/fasion`
- Branch: `agent/complete-fittoday-predeploy`
- PR: `https://github.com/9natthaphong/fasion/pull/1`
- PR #1 เป็น `OPEN`, ไม่ใช่ draft, ยังไม่ merge และยังไม่ deploy Vercel
- Stack: Next.js 16 App Router, React 19, TypeScript, Supabase SSR, OpenAI Responses API, Vitest และ Playwright
- Supabase target ที่ runtime ใช้ตรงกับ project reference `pbapddmoprntydpsfirr`
- `.env.local` ถูก ignore และไม่มีการ commit ค่า environment
- `ADMIN_EMAILS` ตั้งใจไม่กำหนด จึงปิด Admin access แบบ fail-closed

สถานะโดยรวม: source, build, public routes, Customer E2E และ Merchant E2E ใช้งานได้ แต่ยัง **ไม่พร้อม Production** เพราะ additive security migration ด้านล่างยังไม่ได้ apply live และ Admin browser E2E ยังถูกบล็อกตาม configuration ที่ตั้งใจไว้

## สิ่งที่ handoff เดิมระบุผิดหรือเก่า

- PR #1 ไม่ใช่ Draft แล้ว
- Storage buckets ไม่ได้เป็น public 2/5 MB
- Admin ต้องผ่านทั้ง `profiles.role = "admin"` และอีเมลใน `ADMIN_EMAILS`; ไม่ใช่อย่างใดอย่างหนึ่ง
- Admin detail routes มีอยู่จริง
- Customer และ Merchant authenticated E2E ถูกทดสอบแล้ว ไม่ได้ deferred ทั้งหมด
- OpenAI live request ถูกทดสอบจริงและคืน 3 directions ตาม schema
- `npm audit` เดิมมี 12 high แต่หลังแก้ production dependency เหลือ 9 high เฉพาะ dev tooling; production audit เป็น 0
- ลิงก์ `file:///C:/...` เดิมใช้งานข้ามเครื่องไม่ได้ จึงเปลี่ยนเป็น relative links
- Migration ที่เพิ่มในรอบนี้ยังไม่ได้ apply live จึงห้ามอ้างว่า repository migrations ตรงกับ live ทั้งหมด

## Runtime และ routes

Build ยืนยัน routes ต่อไปนี้:

- Public: `/`, `/ai-stylist`, `/discover`, `/categories/[slug]`, `/shops/[slug]`, `/ads/[slug]`, `/login/customer`, `/login/merchant`, `/register/customer`, `/register/merchant`, `/privacy`, `/terms`
- Customer: `/account`, `/account/profile`, `/account/outfits`, `/account/likes`, `/account/settings`
- Merchant: `/merchant`, `/merchant/onboarding`, `/merchant/shop`, `/merchant/ads`, `/merchant/ads/new`, `/merchant/ads/[id]/edit`, `/merchant/analytics`, `/merchant/settings`
- Admin: `/admin`, `/admin/shops`, `/admin/shops/[id]`, `/admin/ads`, `/admin/ads/[id]`, `/admin/users`, `/admin/analytics`
- Server flows: `/api/auth/*`, `/api/account/*`, `/api/merchant/*`, `/api/admin/*`, `/api/events/*`, `/api/ai-stylist`, `/api/assets`, `/go/ad/[id]`

Admin pages และ mutations ตรวจสิทธิ์ซ้ำบน server. การสมัครรับได้เฉพาะ `customer` หรือ `merchant`; ไม่มี frontend/API สำหรับเลื่อนเป็น admin

## Security model ที่ตรวจและแก้แล้ว

- [`src/lib/auth.ts`](../src/lib/auth.ts): Admin ต้องมีทั้ง database role และ server-only allowlist; unset `ADMIN_EMAILS` ปิดสิทธิ์ทั้งหมด
- [`src/lib/supabase/admin.ts`](../src/lib/supabase/admin.ts): service client ประกาศ `server-only`
- [`src/lib/request-security.ts`](../src/lib/request-security.ts): same-origin validation รองรับ configured origin และ trusted proxy host โดยไม่เปิด origin กว้าง; first-party session ID ต้องเป็น UUID
- [`src/app/api/merchant/ads/route.ts`](../src/app/api/merchant/ads/route.ts) และ [`src/app/api/merchant/ads/[id]/route.ts`](../src/app/api/merchant/ads/[id]/route.ts): ownership, immutable `shop_id`, asset prefix, cover requirement และ state transition ตรวจที่ server
- [`src/app/api/admin/ads/[id]/route.ts`](../src/app/api/admin/ads/[id]/route.ts): ตรวจ cover และ Shopee URL ซ้ำก่อน approve
- [`src/app/go/ad/[id]/route.ts`](../src/app/go/ad/[id]/route.ts): ใช้ destination จาก database, HTTPS Shopee allowlist และบันทึก click ก่อน `303`
- [`next.config.ts`](../next.config.ts): Production CSP ไม่มี `unsafe-eval`; Development อนุญาตเฉพาะที่ Next/Turbopack ต้องใช้; Supabase origin จำกัดจาก configured project
- `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY` และ `ADMIN_EMAILS` ใช้เฉพาะ server code; ไม่พบ client import

Additive migration ที่ยังต้อง apply:

- [`supabase/migrations/20260727145323_harden_merchant_ad_assets.sql`](../supabase/migrations/20260727145323_harden_merchant_ad_assets.sql)
- เพิ่ม asset ownership trigger, merchant ad state-transition guard, draft-only merchant insert, relation policies ที่จำกัดตาม editable state และป้องกันลบ Storage object ที่ถูกใช้โดย ad pending/active

ห้ามแก้ migration เก่าหรือ weaken RLS. ต้อง apply ไฟล์ใหม่นี้กับ project `pbapddmoprntydpsfirr` แล้วรัน Security Advisor และ Performance Advisor ซ้ำก่อน Production

## Live Supabase ที่ตรวจได้

ตรวจด้วย server client แบบ read-only ก่อน mutation ทดสอบ และลบ temporary users/rows/files หลังจบแล้ว:

| Table | Final count |
| --- | ---: |
| `profiles` | 0 |
| `customer_preferences` | 0 |
| `shops` | 4 |
| `shop_members` | 0 |
| `categories` | 15 |
| `ads` | 16 |
| `ad_categories` | 16 |
| `ad_images` | 0 |
| `ad_likes` | 0 |
| `ad_impressions` | 480 |
| `ad_clicks` | 128 |
| `shop_views` | 96 |
| `outfit_requests` | 0 |
| `outfit_results` | 0 |
| `account_deletion_requests` | 0 |

Final cleanup ยืนยัน `auth.users = 0` และ `ad-assets` ไม่มี temporary object ค้าง

Storage buckets จริง:

| Bucket | Public | Limit | MIME |
| --- | --- | ---: | --- |
| `avatars` | false | 3 MiB | JPEG, PNG, WebP |
| `shop-assets` | false | 6 MiB | JPEG, PNG, WebP |
| `ad-assets` | false | 6 MiB | JPEG, PNG, WebP |

ข้อจำกัด: Supabase connector account มองเห็นเฉพาะ project อื่น และ CLI ตอบ `LegacyPlatformAuthRequiredError` จึงยังยืนยัน live migration ledger, policy/function/trigger/index/FK definitions และ Advisors จาก management plane ไม่ได้ อย่าใช้ runtime counts แทนหลักฐานเหล่านี้

## Functional verification

- Public: routes ที่กำหนดทั้งหมดตอบต่ำกว่า 400, ไม่มี console/CSP/image error และไม่มี horizontal overflow ใน Playwright desktop/mobile
- Customer: login, profile, private body-data opt-in, opt-out พร้อม clear values, owned outfit history view/delete, like, duplicate-like prevention, unlike, Shopee click และ account deletion request ผ่านด้วย temporary user
- Merchant: login, onboarding pending/inactive, upload 2 ภาพ, signed preview, draft creation, alt text, reorder, edit, submit pending review หลัง test fixture อนุมัติ shop/subscription และ owned analytics ผ่านด้วย temporary user
- Registration: เรียกจริงแล้ว Supabase ตอบ `email rate limit exceeded`; จึง Blocked ไม่ใช่ Passed
- Admin: anonymous redirect และ server authorization ผ่าน; browser Admin E2E Blocked เพราะ `ADMIN_EMAILS` ตั้งใจ unset
- Tracking: unit test ยืนยัน 50% visibility ต่อเนื่อง 1 วินาทีและส่งครั้งเดียว; live temporary fixture ยืนยัน impression/shop-view ถูกบันทึกและ deduplicate; click บันทึกก่อน redirect
- AI Stylist: live request ผ่านและคืน exactly `safe`, `elevated`, `comfortable`; test นี้เป็น opt-in ผ่าน `RUN_LIVE_AI_E2E=1` เพื่อไม่สร้างค่าใช้จ่ายซ้ำ
- Storage upload: Merchant E2E ยืนยัน upload, preview, reorder และ cleanup

Playwright final suite: 16 passed, 6 skipped. รายการ skip คือ test ที่ตั้งใจ opt-in (registration/live AI) และ authenticated flows ใน mobile project ที่รันจริงแล้วบน Chromium

## Dependencies และ performance

- `postcss` ถูก pin เป็น patched `8.5.23`
- `sharp` ถูก pin เป็น patched `0.35.3`
- React/React DOM อัปเดตเป็น `19.2.8`
- `npm audit --omit=dev`: 0 vulnerabilities
- `npm audit`: 9 high ใน ESLint/minimatch/brace-expansion dev chain; fix ที่ npm เสนอเป็น semver-major หรือ package version ที่ไม่เข้ากับ Next lint config จึงไม่ force
- Next Image ใช้ stable dimensions, `sizes`, hero priority เพียงภาพ LCP และ lazy-load ภาพด้านล่าง
- Server data reads ที่เป็นอิสระใน dashboards ใช้ parallel queries
- `turbopack.root` ถูกกำหนดเพื่อตัด workspace-root warning

## Visual assets

Original AI-generated demo assets อยู่ที่ [`public/images/fittoday/`](../public/images/fittoday/):

- `home-hero-bangkok-editorial-v1.webp`
- `direction-safe-editorial-v1.webp`
- `direction-elevated-editorial-v1.webp`
- `direction-comfortable-editorial-v1.webp`
- [`ASSET_NOTES.md`](../public/images/fittoday/ASSET_NOTES.md)

รูปไม่มี logo, trademark, watermark หรือ text ในภาพ และไม่ถูกนำเสนอเป็น merchant content จริง หน้า Home แยก AI directions ออกจาก sponsored merchant section ชัดเจน

## Verification commands

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

Production E2E:

```bash
npm run build
npm run start -- -p 3001
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test --workers=1
```

Live AI และ registration tests เป็น opt-in:

```bash
RUN_LIVE_AI_E2E=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/e2e/public.spec.ts --project=chromium --grep "live AI"
RUN_REGISTRATION_E2E=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/e2e/authenticated.spec.ts --project=chromium --grep "registration"
```

## Release gate

พร้อมสร้าง Vercel Preview ในเชิง source/build แต่ยังไม่ควรถือ Preview เป็น release candidate จนกว่าจะ:

1. apply additive migration กับ project ที่ยืนยันแล้ว
2. รัน Supabase Security และ Performance Advisors
3. รอ email rate limit แล้วทดสอบ customer/merchant registration อีกครั้ง
4. กำหนด trusted admin account ด้วยทั้ง DB role และ `ADMIN_EMAILS` แล้วทำ Admin E2E
5. ทำ Preview smoke test ด้วย environment ของ Preview

Production ยัง Blocked ตามรายการข้างต้น PR #1 ต้องคงสถานะ unmerged และยังไม่ deploy จนกว่า release gate จะผ่าน
