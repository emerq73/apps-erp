const { Client } = require('pg');

async function checkData() {
  const client = new Client({
    host: 'localhost',
    port: 5438,
    user: 'postgres',
    password: 'postgres',
    database: 'hotel_erp',
  });

  try {
    await client.connect();
    
    const cleaningReqs = await client.query('SELECT * FROM cleaning_requests LIMIT 1');
    console.log('Cleaning Request Sample:', JSON.stringify(cleaningReqs.rows[0], null, 2));

    const staff = await client.query('SELECT * FROM housekeeping_staff LIMIT 1');
    console.log('Staff Sample:', JSON.stringify(staff.rows[0], null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkData();
