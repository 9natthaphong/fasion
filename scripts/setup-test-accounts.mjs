import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Load local environment variables from .env.local
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Safe alphanumeric + hyphen/underscore characters (no shell comment delimiters like # or $)
function generateCleanSecurePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let password = "Ft!";
  const randomBytes = crypto.randomBytes(32);
  for (let i = 0; i < 30; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

async function getOrCreateTestUser(email, displayName, role) {
  const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw listErr;

  let user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  let password = generateCleanSecurePassword();

  if (!user) {
    console.log(`Creating Auth user for ${email}...`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw error;
    user = data.user;
  } else {
    console.log(`Auth user ${email} already exists (${user.id}). Updating password & metadata...`);
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        role: role,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (profileErr) throw profileErr;

  return { id: user.id, email, password, role, displayName };
}

async function main() {
  const customer = await getOrCreateTestUser("fittoday.customer@example.com", "FitToday Test Customer", "customer");
  const merchant = await getOrCreateTestUser("fittoday.merchant@example.com", "FitToday Test Merchant", "merchant");
  const admin = await getOrCreateTestUser("fittoday.admin@example.com", "FitToday Test Admin", "admin");

  const envTestLocalContent = `E2E_CUSTOMER_EMAIL="${customer.email}"
E2E_CUSTOMER_PASSWORD="${customer.password}"
E2E_CUSTOMER_USER_ID="${customer.id}"

E2E_MERCHANT_EMAIL="${merchant.email}"
E2E_MERCHANT_PASSWORD="${merchant.password}"
E2E_MERCHANT_USER_ID="${merchant.id}"

E2E_ADMIN_EMAIL="${admin.email}"
E2E_ADMIN_PASSWORD="${admin.password}"
E2E_ADMIN_USER_ID="${admin.id}"

ADMIN_EMAILS="${admin.email}"
`;

  const outputPath = path.join(process.cwd(), ".env.test.local");
  fs.writeFileSync(outputPath, envTestLocalContent, "utf8");
  console.log(`SUCCESS: Created .env.test.local at ${outputPath}`);
}

main().catch((err) => {
  console.error("Error setting up test accounts:", err);
  process.exit(1);
});
