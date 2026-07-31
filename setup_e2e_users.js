import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? "",
);

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "E2E_CUSTOMER_EMAIL",
  "E2E_CUSTOMER_PASSWORD",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const accounts = [
  { role: "admin", email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
  { role: "customer", email: process.env.E2E_CUSTOMER_EMAIL, password: process.env.E2E_CUSTOMER_PASSWORD },
];

async function setup() {
  for (const account of accounts) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error && !error.message.includes("already registered")) throw error;

    let user = data.user;
    if (!user) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      user = users.users.find(
        (candidate) => candidate.email?.toLowerCase() === account.email?.toLowerCase(),
      );
    }
    if (!user) throw new Error(`Unable to resolve E2E ${account.role} account`);

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, role: account.role, display_name: `E2E ${account.role}` });
    if (profileError) throw profileError;
  }

  console.log("Users setup complete.");
}

setup().catch((error) => {
  console.error(
    "E2E user setup failed:",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
});
