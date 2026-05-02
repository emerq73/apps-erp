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
    
    const rooms = await client.query('SELECT count(*), "companyId" FROM rooms GROUP BY "companyId"');
    console.log('Rooms per company:', rooms.rows);

    const cleaning = await client.query('SELECT count(*), "companyId" FROM cleaning_requests GROUP BY "companyId"');
    console.log('Cleaning per company:', cleaning.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkData();
