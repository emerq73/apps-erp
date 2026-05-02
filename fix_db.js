const { Client } = require('pg');

async function fixDb() {
  const client = new Client({
    host: 'localhost',
    port: 5438,
    user: 'postgres',
    password: 'postgres',
    database: 'hotel_erp',
  });

  try {
    await client.connect();
    console.log('Conectado a la DB');
    
    const columns = [
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "checklist" JSONB',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "minibarConsumptions" JSONB',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "completedDate" DATE',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "completedTime" TIME',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "assignedToId" VARCHAR',
      'ALTER TABLE cleaning_requests ADD COLUMN IF NOT EXISTS "supervisorId" VARCHAR'
    ];

    for (const sql of columns) {
      await client.query(sql);
    }
    
    console.log('Estructura de DB sincronizada manualmente.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixDb();
