/**
 * Run schema.sql and seed.sql against Supabase using the service_role key.
 * Usage: node scripts/run-sql.mjs <service_role_key>
 *
 * The service_role key bypasses RLS and has DDL permissions through the
 * Supabase PostgREST /rpc endpoint won't work for DDL, so we use the
 * pg-meta SQL execution endpoint instead.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'waaasuvpjkcdlwahwdhb';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const serviceRoleKey = process.argv[2];
if (!serviceRoleKey) {
  console.error('Usage: node scripts/run-sql.mjs <service_role_key>');
  process.exit(1);
}

async function runSQL(sql, label) {
  console.log(`\n⏳ Running ${label}...`);
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!resp.ok) {
    // Try the pg-meta endpoint instead
    console.log(`  PostgREST failed (${resp.status}), trying query endpoint...`);
    const resp2 = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!resp2.ok) {
      const txt = await resp2.text();
      console.error(`  ❌ ${label} failed: ${resp2.status} ${txt.slice(0, 300)}`);
      return false;
    }
    const data = await resp2.json();
    console.log(`  ✅ ${label} completed.`, JSON.stringify(data).slice(0, 200));
    return true;
  }

  const data = await resp.json();
  console.log(`  ✅ ${label} completed.`, JSON.stringify(data).slice(0, 200));
  return true;
}

async function main() {
  const schemaPath = resolve(__dirname, '..', 'supabase', 'schema.sql');
  const seedPath = resolve(__dirname, '..', 'supabase', 'seed.sql');

  const schemaSql = readFileSync(schemaPath, 'utf-8');
  const seedSql = readFileSync(seedPath, 'utf-8');

  console.log(`📦 Schema SQL: ${schemaSql.length} chars`);
  console.log(`📦 Seed SQL: ${seedSql.length} chars`);

  const ok1 = await runSQL(schemaSql, 'schema.sql');
  if (!ok1) {
    console.error('\n❌ Schema failed. Cannot continue to seed.');
    process.exit(1);
  }

  const ok2 = await runSQL(seedSql, 'seed.sql');
  if (!ok2) {
    console.error('\n❌ Seed failed.');
    process.exit(1);
  }

  // Verify
  console.log('\n🔍 Verifying...');
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id&limit=1`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
  });
  const data = await resp.json();
  console.log(`  Employees table: ${resp.status} - ${JSON.stringify(data).slice(0, 100)}`);
  console.log('\n🎉 Done!');
}

main().catch(console.error);
