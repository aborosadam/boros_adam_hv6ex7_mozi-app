const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const movies = db.prepare('SELECT * FROM movies ORDER BY title').all();
  res.json(movies);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Film nem található' });

  const screenings = db.prepare(`
    SELECT * FROM screenings
    WHERE movie_id = ? AND screening_time > datetime('now')
    ORDER BY screening_time
  `).all(req.params.id);

  res.json({ ...movie, screenings });
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, genre, duration_min, poster_url } = req.body;
  if (!title) return res.status(400).json({ error: 'A film címe kötelező' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO movies (title, description, genre, duration_min, poster_url) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description, genre, duration_min, poster_url);

  res.status(201).json(db.prepare('SELECT * FROM movies WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, genre, duration_min, poster_url } = req.body;
  const db = getDb();

  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Film nem található' });

  db.prepare(`
    UPDATE movies SET title = COALESCE(?, title), description = COALESCE(?, description),
    genre = COALESCE(?, genre), duration_min = COALESCE(?, duration_min),
    poster_url = COALESCE(?, poster_url) WHERE id = ?
  `).run(title, description, genre, duration_min, poster_url, req.params.id);

  res.json(db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = getDb();
  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Film nem található' });

  db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  res.json({ message: 'Film sikeresen törölve' });
});

module.exports = router;
