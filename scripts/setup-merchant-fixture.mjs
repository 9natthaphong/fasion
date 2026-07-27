import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Load local environment variables from .env.local and .env.test.local
for (const filename of [".env.local", ".env.test.local"]) {
  const filePath = path.join(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const merchantUserId = process.env.E2E_MERCHANT_USER_ID;

if (!supabaseUrl || !supabaseSecretKey || !merchantUserId) {
  console.error("Missing environment configuration or E2E_MERCHANT_USER_ID");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const shopSlug = "fittoday-test-merchant-shop";

  // Check if shop already exists
  const { data: existingShop } = await supabaseAdmin
    .from("shops")
    .select("id, status, subscription_status")
    .eq("slug", shopSlug)
    .maybeSingle();

  let shopId = existingShop?.id;

  if (!existingShop) {
    console.log("Creating merchant shop fixture: FitToday Test Merchant Shop...");
    const { data: newShop, error: shopErr } = await supabaseAdmin
      .from("shops")
      .insert({
        owner_id: merchantUserId,
        name: "FitToday Test Merchant Shop",
        slug: shopSlug,
        description: "ร้านค้าทดสอบ E2E สำหรับการอนุมัติโฆษณาและตรวจสอบสิทธิ์แอดมิน",
        logo_path: null,
        cover_path: null,
        shopee_url: "https://shopee.co.th/fittoday-test-shop",
        status: "pending",
        subscription_status: "inactive",
      })
      .select()
      .single();

    if (shopErr) throw shopErr;
    shopId = newShop.id;

    // Add merchant as shop member
    await supabaseAdmin.from("shop_members").upsert({
      shop_id: shopId,
      user_id: merchantUserId,
      role: "owner",
    });
  } else {
    console.log(`Merchant shop fixture already exists: ${shopId}`);
  }

  console.log(`SUCCESS: Merchant test shop ready (id: ${shopId})`);
}

main().catch((err) => {
  console.error("Error setting up merchant fixture:", err);
  process.exit(1);
});
