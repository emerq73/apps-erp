const { Client } = require('pg');

async function createDatabase() {
    const config = {
        user: 'postgres',
        host: 'localhost',
        password: 'postgres', // Cambia esto si tu contraseña es diferente
        port: 5438,
        database: 'postgres', // Nos conectamos a la DB por defecto
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Conectado a PostgreSQL en puerto 5438...');

        // El comando CREATE DATABASE no se puede ejecutar dentro de un bloque de transacción
        await client.query('CREATE DATABASE hotel_erp');
        console.log('¡Base de datos "hotel_erp" creada con éxito!');
    } catch (err) {
        if (err.code === '42P04') {
            console.log('La base de datos "hotel_erp" ya existe.');
        } else {
            console.error('Error al crear la base de datos:', err.message);
            console.log('\n--- SUGERENCIA ---');
            console.log('Verifica que la CONTRASEÑA en este script coincida con la de tu usuario "postgres".');
        }
    } finally {
        await client.end();
    }
}

createDatabase();
