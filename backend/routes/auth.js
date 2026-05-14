const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Felhasználónév, email és jelszó megadása kötelező' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Érvénytelen email formátum' });
  }

  const db = getDb();
  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUsername) {
    return res.status(409).json({ error: 'Ez a felhasználónév már foglalt' });
  }
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    return res.status(409).json({ error: 'Ez az email cím már regisztrálva van' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, password_hash);

  const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user);
  res.status(201).json({ message: 'Sikeres regisztráció', token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email és jelszó megadása kötelező' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Nem található fiók ezzel az email címmel' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Hibás jelszó' });
  }

  const token = generateToken(user);
  res.json({
    message: 'Sikeres bejelentkezés',
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Felhasználó nem található' });
  res.json(user);
});

module.exports = router;
