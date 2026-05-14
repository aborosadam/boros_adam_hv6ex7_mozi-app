const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/all', authenticateToken, requireAdmin, (req, res) => {
  const db = getDb();
  const bookings = db.prepare(`
    SELECT b.*, u.username, u.email, s.screening_time, s.hall, m.title as movie_title
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN screenings s ON b.screening_id = s.id
    JOIN movies m ON s.movie_id = m.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(bookings);
});

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const bookings = db.prepare(`
    SELECT b.*, s.screening_time, s.hall, s.price,
           m.title as movie_title, m.poster_url
    FROM bookings b
    JOIN screenings s ON b.screening_id = s.id
    JOIN movies m ON s.movie_id = m.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);
  res.json(bookings);
});

router.post('/', authenticateToken, (req, res) => {
  const { screening_id, seat_numbers } = req.body;

  if (!screening_id || !seat_numbers || !Array.isArray(seat_numbers) || seat_numbers.length === 0) {
    return res.status(400).json({ error: 'Vetítés és ülőhely(ek) megadása kötelező' });
  }
  if (seat_numbers.length > 10) {
    return res.status(400).json({ error: 'Egyszerre maximum 10 jegy foglalható' });
  }

  const db = getDb();
  const screening = db.prepare('SELECT * FROM screenings WHERE id = ?').get(screening_id);
  if (!screening) return res.status(404).json({ error: 'Vetítés nem található' });
  if (new Date(screening.screening_time) < new Date()) {
    return res.status(400).json({ error: 'Ez a vetítés már lejárt' });
  }

  const existingBookings = db.prepare(`
    SELECT seat_numbers FROM bookings WHERE screening_id = ? AND status = 'confirmed'
  `).all(screening_id);

  const takenSeats = existingBookings
    .flatMap(b => b.seat_numbers ? b.seat_numbers.split(',').map(Number) : []);

  const conflict = seat_numbers.find(s => takenSeats.includes(Number(s)));
  if (conflict) {
    return res.status(409).json({ error: `A ${conflict}. szék már foglalt` });
  }

  const validSeats = seat_numbers.every(s => s >= 1 && s <= screening.total_seats);
  if (!validSeats) {
    return res.status(400).json({ error: `Érvénytelen széksorszám (1-${screening.total_seats} között kell lennie)` });
  }

  if (screening.available_seats < seat_numbers.length) {
    return res.status(409).json({ error: 'Nincs elegendő szabad hely' });
  }

  const total_price = screening.price * seat_numbers.length;

  const insertBooking = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO bookings (user_id, screening_id, seat_count, seat_numbers, total_price)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, screening_id, seat_numbers.length, seat_numbers.join(','), total_price);

    db.prepare(`
      UPDATE screenings SET available_seats = available_seats - ? WHERE id = ?
    `).run(seat_numbers.length, screening_id);

    return result.lastInsertRowid;
  });

  const bookingId = insertBooking();
  const booking = db.prepare(`
    SELECT b.*, s.screening_time, s.hall, m.title as movie_title
    FROM bookings b
    JOIN screenings s ON b.screening_id = s.id
    JOIN movies m ON s.movie_id = m.id
    WHERE b.id = ?
  `).get(bookingId);

  res.status(201).json({ message: 'Foglalás sikeresen létrehozva', booking });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

  if (!booking) return res.status(404).json({ error: 'Foglalás nem található' });
  if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nincs jogosultság a törléshez' });
  }
  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'A foglalás már le van mondva' });
  }

  const screening = db.prepare('SELECT screening_time FROM screenings WHERE id = ?').get(booking.screening_id);
  if (new Date(screening.screening_time) < new Date()) {
    return res.status(400).json({ error: 'Lejárt vetítés foglalása nem mondható le' });
  }

  db.transaction(() => {
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE screenings SET available_seats = available_seats + ? WHERE id = ?')
      .run(booking.seat_count, booking.screening_id);
  })();

  res.json({ message: 'Foglalás sikeresen lemondva' });
});

module.exports = router;
