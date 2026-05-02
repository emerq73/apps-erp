const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5438,
  username: 'postgres',
  password: 'postgres',
  database: 'hotel_erp',
});

ds.initialize()
  .then(async () => {
    const res = await ds.query("SELECT id, reservation_number, status FROM reservations WHERE reservation_number = 'WI-1777348528906'");
    console.log('Reservation:', res);
    await ds.destroy();
  })
  .catch(e => console.error(e.message));
