import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'README.md',
  'docs/ASSET_LICENSES.md',
  'docs/CINEMATIC_VIDEO_PIPELINE.md',
  'docs/CODEX_HANDOFF.md',
  'src/app/ai-stylist/page.tsx',
  'src/app/api/ai-stylist/route.ts',
  'src/app/api/wardrobe/analyze/route.ts',
  'src/app/categories/[slug]/page.tsx',
  'src/app/discover/page.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx',
  'src/components/admin-nav.tsx',
  'src/components/auth-page.tsx',
  'src/components/cinematic/wardrobe-story.tsx',
  'src/components/dashboard-nav.tsx',
  'src/components/shop-form.tsx',
  'src/components/site-footer.tsx',
  'src/components/site-header.tsx',
  'src/components/wardrobe/add-item-form.tsx',
  'src/lib/demo-data.ts',
  'tests/e2e/authenticated.spec.ts',
  'tests/e2e/public.spec.ts',
  'tests/unit/site-header.test.tsx'
];

for (const file of filesToUpdate) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace FitToday with YourStylist
    content = content.replace(/FitToday/g, 'YourStylist');
    
    // Replace specific Thai copy
    content = content.replace(/จัดตู้เสื้อผ้าด้วย AI สไตล์คุณ/g, 'สไตลิสต์ส่วนตัวที่ยิ่งใช้ ยิ่งรู้จักคุณ');
    content = content.replace(/อัปโหลดรูปภาพเสื้อผ้าของคุณ แล้วให้ AI ช่วยแมตช์ชุด/g, 'ช่วยเลือกชุดจากเสื้อผ้าที่คุณมี พร้อมจดจำกิจวัตรและสไตล์ในแต่ละวัน');
    content = content.replace(/ช่วยแมตช์ชุดในทุกวัน/g, 'พร้อมจดจำกิจวัตรและสไตล์ในแต่ละวัน');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
