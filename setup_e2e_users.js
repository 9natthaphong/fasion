import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SECRET_KEY ?? ''
);

async function setup() {
  // Create admin
  const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'e2e_admin@example.com',
    password: 'password123',
    email_confirm: true,
  });
  if (adminErr && !adminErr.message.includes('already registered')) console.error(adminErr);

  const { data: customerData, error: customerErr } = await supabase.auth.admin.createUser({
    email: 'e2e_customer@example.com',
    password: 'password123',
    email_confirm: true,
  });
  if (customerErr && !customerErr.message.includes('already registered')) console.error(customerErr);

  if (adminData?.user) {
    await supabase.from('profiles').upsert({ id: adminData.user.id, role: 'admin', display_name: 'E2E Admin' });
  } else {
    const { data: adminUsers } = await supabase.auth.admin.listUsers();
    const adminUser = adminUsers?.users.find(u => u.email === 'e2e_admin@example.com');
    if (adminUser) await supabase.from('profiles').upsert({ id: adminUser.id, role: 'admin', display_name: 'E2E Admin' });
  }

  if (customerData?.user) {
    await supabase.from('profiles').upsert({ id: customerData.user.id, role: 'customer', display_name: 'E2E Customer' });
  } else {
    const { data: customerUsers } = await supabase.auth.admin.listUsers();
    const customerUser = customerUsers?.users.find(u => u.email === 'e2e_customer@example.com');
    if (customerUser) await supabase.from('profiles').upsert({ id: customerUser.id, role: 'customer', display_name: 'E2E Customer' });
  }

  console.log('Users setup complete.');
}
setup();
