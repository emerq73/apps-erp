const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    const config = {
        user: 'postgres',
        host: 'localhost',
        password: 'postgres', // Ajusta esto según tu configuración en .env
        port: 5438,
        database: 'hotel_erp',
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Conectado a la base de datos para seeding...');

        const email = 'admin@empresa.com';
        const password = 'admin123';
        const fullName = 'Administrador Sistema';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el rol si no existe (opcional, basado en tu esquema actual)
        // En el User entity pusimos 'role' como string por defecto, así que insertamos directo

        const query = `
      INSERT INTO users (email, password, "fullName", role, "isActive")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING;
    `;

        await client.query(query, [email, hashedPassword, fullName, 'admin', true]);

        console.log('\n--- USUARIO CREADO ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('----------------------\n');

    } catch (err) {
        console.error('Error durante el seeding:', err.message);
    } finally {
        await client.end();
    }
}

seedAdmin();
