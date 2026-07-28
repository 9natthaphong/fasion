import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Load .env.local and .env.test.local
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
const customerPass = process.env.E2E_CUSTOMER_PASSWORD;

const merchantEmail = process.env.E2E_MERCHANT_EMAIL;
const merchantPass = process.env.E2E_MERCHANT_PASSWORD;

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPass = process.env.E2E_ADMIN_PASSWORD;

async function testLogin(email, password, role) {
  const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`FAILED: Login for ${role} (${email}):`, error.message);
    return false;
  }
  console.log(`SUCCESS: Login for ${role} (${email}) - User ID: ${data.user.id}`);
  return true;
}

async function main() {
  await testLogin(customerEmail, customerPass, "customer");
  await testLogin(merchantEmail, merchantPass, "merchant");
  await testLogin(adminEmail, adminPass, "admin");
}

main();
