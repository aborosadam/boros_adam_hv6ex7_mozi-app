const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { movie_id } = req.query;

  let query = `
    SELECT s.*, m.title as movie_title, m.genre, m.duration_min, m.poster_url
    FROM screenings s
    JOIN movies m ON s.movie_id = m.id
    WHERE s.screening_time > datetime('now')
  `;
  const params = [];

  if (movie_id) {
    query += ' AND s.movie_id = ?';
    params.push(movie_id);
  }
  query += ' ORDER BY s.screening_time';

  res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const screening = db.prepare(`
    SELECT s.*, m.title as movie_title, m.description as movie_description,
           m.genre, m.duration_min, m.poster_url
    FROM screenings s
    JOIN movies m ON s.movie_id = m.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!screening) return res.status(404).json({ error: 'Vetítés nem található' });

  const bookedSeats = db.prepare(`
    SELECT seat_numbers FROM bookings
    WHERE screening_id = ? AND status = 'confirmed'
  `).all(req.params.id);

  const takenSeats = bookedSeats
    .flatMap(b => b.seat_numbers ? b.seat_numbers.split(',') : [])
    .map(Number);

  res.json({ ...screening, taken_seats: takenSeats });
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { movie_id, screening_time, hall, total_seats, price } = req.body;
  if (!movie_id || !screening_time || !hall) {
    return res.status(400).json({ error: 'Film, időpont és terem megadása kötelező' });
  }

  const db = getDb();
  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(movie_id);
  if (!movie) return res.status(404).json({ error: 'Film nem található' });

  const seats = total_seats || 50;
  const result = db.prepare(`
    INSERT INTO screenings (movie_id, screening_time, hall, total_seats, available_seats, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(movie_id, screening_time, hall, seats, seats, price || 1500);

  res.status(201).json(db.prepare('SELECT * FROM screenings WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = getDb();
  const screening = db.prepare('SELECT id FROM screenings WHERE id = ?').get(req.params.id);
  if (!screening) return res.status(404).json({ error: 'Vetítés nem található' });

  db.prepare('DELETE FROM screenings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Vetítés sikeresen törölve' });
});

module.exports = router;
