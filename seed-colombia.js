const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5438,
    user: 'postgres',
    password: 'postgres',
    database: 'hotel_erp',
});

async function seedColombianDefaults() {
    try {
        await client.connect();
        console.log('Connected to DB for seeding Colombian defaults...');

        // 1. Seed Terceros (Ejemplos comunes)
        const thirdParties = [
            { id: '343ba87a-8f4b-4a5d-9b1a-2e3f4a5b6c7d', identification: '800123456', dv: '1', name: 'DIAN - Impuestos Nacionales', type: 'PJ', city: 'Bogotá' },
            { id: '443ba87a-8f4b-4a5d-9b1a-2e3f4a5b6c7e', identification: '890101010', dv: '2', name: 'Alcaldía Municipal - ICA', type: 'PJ', city: 'Bogotá' },
            { id: '543ba87a-8f4b-4a5d-9b1a-2e3f4a5b6c7f', identification: '901234567', dv: '0', name: 'Proveedor Hotelero S.A.S', type: 'PJ', city: 'Medellín' },
            { id: '643ba87a-8f4b-4a5d-9b1a-2e3f4a5b6c80', identification: '1010202020', dv: null, name: 'Juan Pérez (Cliente)', type: 'PN', city: 'Cartagena' }
        ];

        for (const tp of thirdParties) {
            await client.query(
                `INSERT INTO third_parties (id, identification, dv, name, type, city, "isActive", "createdAt", "updatedAt") 
                 VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) 
                 ON CONFLICT (identification) DO NOTHING`,
                [tp.id, tp.identification, tp.dv, tp.name, tp.type, tp.city]
            );
        }
        console.log('Seeded Third Parties.');

        // 2. Seed Centros de Costo (Estructura Hotelera)
        const costCenters = [
            { id: 'cc1', code: '100', name: 'ADMINISTRACION' },
            { id: 'cc2', code: '200', name: 'RECEPCION' },
            { id: 'cc3', code: '300', name: 'RESTAURANTE' },
            { id: 'cc4', code: '400', name: 'ALOJAMIENTO' },
            { id: 'cc5', code: '500', name: 'MANTENIMIENTO' }
        ];

        for (const cc of costCenters) {
            await client.query(
                `INSERT INTO cost_centers (id, code, name, "isActive", "createdAt", "updatedAt") 
                 VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW()) 
                 ON CONFLICT (code) DO NOTHING`,
                [cc.code, cc.name]
            );
        }
        console.log('Seeded Cost Centers.');

    } catch (err) {
        console.error('Error seeding defaults:', err);
    } finally {
        await client.end();
    }
}

seedColombianDefaults();
