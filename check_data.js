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
    
    const cleaningReqs = await client.query('SELECT count(*) FROM cleaning_requests');
    const maintenanceReqs = await client.query('SELECT count(*) FROM maintenance_requests');
    const cleaningStaff = await client.query('SELECT count(*) FROM housekeeping_staff');
    const maintenanceStaff = await client.query('SELECT count(*) FROM maintenance_staff');
    const companies = await client.query('SELECT id, name FROM companies');

    console.log('Cleaning Reqs:', cleaningReqs.rows[0].count);
    console.log('Maintenance Reqs:', maintenanceReqs.rows[0].count);
    console.log('Cleaning Staff:', cleaningStaff.rows[0].count);
    console.log('Maintenance Staff:', maintenanceStaff.rows[0].count);
    console.log('Companies:', companies.rows);

    if (cleaningStaff.rows[0].count > 0) {
        const staff = await client.query('SELECT id, name, "companyId" FROM housekeeping_staff LIMIT 5');
        console.log('Sample Cleaning Staff:', staff.rows);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkData();
