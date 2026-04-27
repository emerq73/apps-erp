const { Client } = require('pg');
require('dotenv').config();

async function seedAccounts() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5438,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'hotel_erp',
    });

    try {
        await client.connect();
        console.log('--- Reseteando y Poblando Plan de Cuentas ---');

        // Limpiar datos previos
        await client.query('TRUNCATE TABLE accounts CASCADE');

        const accounts = [
            // Activos (1)
            { code: '1', name: 'ACTIVOS', balance: 0 },
            { code: '11', name: 'DISPONIBLE', balance: 0, parent_code: '1' },
            { code: '110505', name: 'CAJA GENERAL', balance: 1500000.00, parent_code: '11' },
            { code: '111005', name: 'BANCO NACIONAL', balance: 8500000.00, parent_code: '11' },

            // Pasivos (2)
            { code: '2', name: 'PASIVOS', balance: 0 },
            { code: '21', name: 'OBLIGACIONES FINANCIERAS', balance: 0, parent_code: '2' },
            { code: '210505', name: 'PAGARÉS BANCARIOS', balance: 2000000.00, parent_code: '21' },

            // Patrimonio (3)
            { code: '3', name: 'PATRIMONIO', balance: 0 },
            { code: '310505', name: 'CAPITAL EMITIDO', balance: 8000000.00, parent_code: '3' },

            // Ingresos (4)
            { code: '4', name: 'INGRESOS OPERACIONALES', balance: 0 },
            { code: '411005', name: 'SERV. DE ALOJAMIENTO', balance: 0, parent_code: '4' },
            { code: '411010', name: 'SERV. DE RESTAURANTE', balance: 0, parent_code: '4' },
        ];

        for (const acc of accounts) {
            let parentId = null;
            if (acc.parent_code) {
                const res = await client.query('SELECT id FROM accounts WHERE code = $1', [acc.parent_code]);
                parentId = res.rows[0]?.id;
            }

            await client.query(
                'INSERT INTO accounts (code, name, balance, "parentId") VALUES ($1, $2, $3, $4)',
                [acc.code, acc.name, acc.balance, parentId]
            );
            console.log(`Cuenta creada: ${acc.code} - ${acc.name}`);
        }

        console.log('--- Seed completado exitosamente ---');
    } catch (err) {
        console.error('Error durante el seed:', err);
    } finally {
        await client.end();
    }
}

seedAccounts();
