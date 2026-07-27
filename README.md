# FitToday

> วันนี้จะไปไหน ให้ AI ช่วยเลือกชุด

FitToday เป็น MVP เว็บภาษาไทยที่แยกสองระบบออกจากกันอย่างชัดเจน:

- AI Stylist สร้างไอเดียแต่งตัว 3 แนวทางจากบริบทของผู้ใช้
- Fashion Advertising Platform ให้ร้านค้าลงโฆษณาไปยัง Shopee และดู impressions, likes, clicks และ CTR

เงินโฆษณาไม่มีผลต่อคำแนะนำจาก AI Stylist และโฆษณาทุกตำแหน่งมีป้ายกำกับ

## Stack

- Next.js 16 App Router, React 19, TypeScript strict และ Tailwind CSS
- Supabase Auth แบบ SSR, PostgreSQL, Row Level Security และ private Storage
- OpenAI Responses API พร้อม Structured Outputs (Zod)
- React Hook Form, Vitest และ Playwright
- npm พร้อม `package-lock.json`
- Vercel สำหรับ Preview และ Production

## เริ่มต้นบนเครื่อง

ต้องใช้ Node.js 20.9 ขึ้นไป

```bash
npm ci
cp .env.example .env.local
npm run dev
```

เปิด `http://localhost:3000` ข้อมูล public จะ fallback เป็น Demo ที่ติดป้ายชัดเจน หากยังไม่ตั้งค่า Supabase ระบบบัญชีและ dashboard จะยังไม่เปิดใช้งาน

## Environment variables

| ตัวแปร | เปิดเผยใน browser | ใช้สำหรับ |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ใช่ | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ใช่ | Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | ใช่ | canonical URL และ Auth callback |
| `SUPABASE_SECRET_KEY` | ไม่ | server-only events, admin และ signed assets |
| `OPENAI_API_KEY` | ไม่ | OpenAI Responses API |
| `OPENAI_MODEL` | ไม่ | ค่าเริ่มต้น `gpt-4o-mini` |
| `ADMIN_EMAILS` | ไม่ | allowlist อีเมล admin คั่นด้วยจุลภาค |

ห้ามใช้ service-role/secret key ในตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` และห้าม commit `.env.local`

Supabase รุ่นใหม่ใช้ publishable/secret keys ตามตัวอย่างนี้ หาก project ยังแสดง legacy keys ให้ใส่ legacy anon key ใน `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` และ legacy service-role keyใน `SUPABASE_SECRET_KEY` ชั่วคราว โดยยังคงข้อจำกัด browser/server เดิม

## ตั้งค่า Supabase

Migration หลักอยู่ที่ `supabase/migrations/20260727000100_initial_schema.sql` และ seed อยู่ที่ `supabase/seed.sql`

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase db seed
```

Migration สร้าง:

- ตาราง `profiles`, `customer_preferences`, `shops`, `shop_members`, `categories`
- ตาราง `ads`, `ad_categories`, `ad_images`, `ad_likes`
- event tables `ad_impressions`, `ad_clicks`, `shop_views`
- `outfit_requests`, `outfit_results`, `account_deletion_requests`
- private audit/rate-limit tables และ server-only RPC
- private buckets `avatars`, `shop-assets`, `ad-assets`
- RLS ทุกตารางใน exposed schema, ownership policies, column grants และ Storage policies

เปิด Email/Password provider ใน Supabase Auth และตั้ง Redirect URLs:

- Local: `http://localhost:3000/auth/callback`
- Preview: `https://*-YOUR-TEAM.vercel.app/auth/callback`
- Production: `https://YOUR-DOMAIN/auth/callback`

ใช้ wildcard เฉพาะ hostname ของ Vercel team ที่ควบคุมได้ อย่าใช้ wildcard กว้างข้ามโดเมน

## บัญชีและบทบาท

### ลูกค้า

สมัครที่ `/register/customer` ระบบสร้าง `profiles.role = customer` ผ่าน database trigger แล้วพาไป `/account`

### ร้านค้า

สมัครที่ `/register/merchant` ระบบสร้าง `profiles.role = merchant` และพาไป `/merchant/onboarding` ร้านใหม่มีสถานะ `pending` และ subscription `inactive` ร้าน pending สร้าง draft ได้ แต่ส่งตรวจไม่ได้

### Admin

วิธีแนะนำสำหรับ deployment คือใส่อีเมลที่เชื่อถือได้ใน `ADMIN_EMAILS` (server-only) หลังจากเจ้าของอีเมลสมัครบัญชีตามปกติแล้ว Admin UI และ mutation ตรวจสิทธิ์ซ้ำที่ server ก่อนใช้ Supabase secret key

อีกวิธีคือกำหนด `profiles.role = 'admin'` ด้วย SQL ที่รันผ่าน Supabase Dashboard/ผู้ถือสิทธิ์ฐานข้อมูลเท่านั้น:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

ไม่มี frontend/API ปกติที่เปลี่ยน role เป็น admin ได้ และ `requested_role` จากการสมัครยอมรับเพียง customer/merchant

Admin อนุมัติร้านและเปิด subscription ที่ `/admin/shops/[id]` จากนั้นอนุมัติโฆษณาที่ `/admin/ads/[id]` ทุก action บันทึก private audit log

## AI Stylist

Endpoint `/api/ai-stylist`:

- เรียก OpenAI เฉพาะ server
- ใช้ Responses API, `store: false`, `responses.parse` และ Zod Structured Outputs
- จำกัดเวลา 20 วินาที, retry จำกัด, database-backed rate limit
- ตรวจ input/output และไม่ส่ง stack trace ให้ผู้ใช้
- ไม่บันทึกส่วนสูง/น้ำหนักเมื่อไม่ได้เลือก “บันทึกข้อมูลนี้ไว้ใช้ครั้งหน้า”
- ไม่สร้างสินค้า/ลิงก์/โฆษณา และไม่ใช้ภาษาวิจารณ์รูปร่าง

ถ้าไม่มี `OPENAI_API_KEY` หน้า development แสดง “configuration missing” และปิดปุ่มอย่างชัดเจน ไม่มี silent mock ใน production

## Tracking

- Impression ใช้ `IntersectionObserver`: visible อย่างน้อย 50% ต่อเนื่อง 1 วินาที
- Server deduplicate ตาม user/first-party anonymous session ภายใน 30 นาที
- Like ต้องเป็น customer และมี unique constraint `(ad_id, user_id)`
- `/go/ad/[id]` โหลด URL จากฐานข้อมูล ตรวจสถานะและ allowlist `shopee.co.th`, บันทึก click แล้วจึง redirect
- Client ไม่ส่งยอดรวมหรือ destination URL มาเป็น source of truth
- CTR = clicks / impressions × 100 และเป็น 0% เมื่อไม่มี impression

## คำสั่งตรวจคุณภาพ

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright ต้องติดตั้ง Chromium ก่อน:

```bash
npx playwright install chromium
```

ชุด E2E public รันได้โดยไม่มี secret ส่วน flow ที่ต้องล็อกอิน/AI จริงต้องตั้ง Supabase/OpenAI test environment ก่อน ห้ามใช้บัญชี Production กับการทดสอบที่ลบข้อมูล

## Deploy บน Vercel

1. Import private GitHub repository
2. Framework preset: Next.js, root directory: repository root
3. ตั้ง Supabase variables สำหรับ Development, Preview และ Production
4. ตั้ง `NEXT_PUBLIC_SITE_URL` เป็น URL ของแต่ละ environment
5. ตั้ง `ADMIN_EMAILS` และ server secret เฉพาะ Preview/Production ที่ต้องใช้
6. เพิ่ม `OPENAI_API_KEY` ผ่าน Vercel Environment Variables เมื่อพร้อม แล้ว redeploy
7. ตรวจ Preview ก่อน merge เข้า default branch ซึ่งเป็น Production source

> **หมายเหตุ:** ในรอบการทำงานปัจจุบัน ได้ทำการตรวจสอบความถูกต้องของโค้ด สคีมา RLS และ build สำเร็จเรียบร้อยแล้ว โดยยังไม่ได้ทำการ Deploy บน Vercel ขั้นตอนถัดไปคือให้ Codex รีวิว PR (`agent/complete-fittoday-predeploy`) และปรับปรุงการออกแบบอินเทอร์เฟซ (design refinement) ก่อนดำเนินการ Deploy ต่อไป

## ขอบเขต MVP

- Subscription เป็น mock ที่ admin เปิด/ปิด ไม่มี payment gateway
- ไม่มีตะกร้า การชำระเงิน สต็อก จัดส่ง หรือคืนสินค้า
- ไม่มี virtual try-on
- AI ไม่เลือกสินค้าจากร้านค้า
- Analytics ป้องกันซ้ำและ bot ระดับพื้นฐาน ไม่ใช่ระบบ anti-fraud เต็มรูปแบบ
- ไม่มี automated image moderation เต็มรูปแบบ
- สมาชิกหลายคนต่อร้านมี schema เตรียมไว้ แต่ UI เปิดเฉพาะ owner

