const { Client } = require('pg');
async function run() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'postgres',
        port: 5438,
        database: 'hotel_erp'
    });
    await client.connect();
    try {
        const comp = await client.query('SELECT id FROM companies LIMIT 1');
        if (comp.rows.length === 0) {
            console.log('No company found');
            return;
        }
        const companyId = comp.rows[0].id;
        const res = await client.query(
            'INSERT INTO accounting_periods (year, month, status, "companyId") VALUES (2026, 4, \'OPEN\', $1) ON CONFLICT DO NOTHING RETURNING *',
            [companyId]
        );
        console.log('Result:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
run();
