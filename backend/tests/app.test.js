const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.DB_PATH = path.join(__dirname, 'test.db');

const app = require('../server');
const { closeDb } = require('../db/database');

let authToken = '';
let testScreeningId = null;

afterAll(() => {
  closeDb();
  const dbPath = process.env.DB_PATH;
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe('POST /api/auth/register', () => {
  test('Sikeres regisztráció', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'tesztuser',
      email: 'teszt@mozi.hu',
      password: 'jelszo123'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('tesztuser');
    authToken = res.body.token;
  });

  test('Hiányzó mezők esetén 400-as hiba', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'valaki' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Duplikált email esetén 409-es hiba', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'masikuser',
      email: 'teszt@mozi.hu',
      password: 'jelszo123'
    });
    expect(res.status).toBe(409);
  });

  test('Rövid jelszó esetén 400-as hiba', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ujuser',
      email: 'uj@mozi.hu',
      password: '123'
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('Sikeres bejelentkezés helyes adatokkal', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'teszt@mozi.hu',
      password: 'jelszo123'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  test('Hibás jelszó esetén 401-es hiba', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'teszt@mozi.hu',
      password: 'rossz_jelszo'
    });
    expect(res.status).toBe(401);
  });

  test('Nem létező email esetén 401-es hiba', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nemletezik@mozi.hu',
      password: 'jelszo123'
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('Token nélkül 401-es hiba', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('Érvényes tokennel visszaadja a felhasználó adatait', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('tesztuser');
  });
});

describe('GET /api/movies', () => {
  test('Visszaadja a filmek listáját', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/movies/:id', () => {
  test('Létező film visszaadja az adatokat és vetítéseket', async () => {
    const res = await request(app).get('/api/movies/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('screenings');
    expect(Array.isArray(res.body.screenings)).toBe(true);
  });

  test('Nem létező film esetén 404-es hiba', async () => {
    const res = await request(app).get('/api/movies/99999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/screenings', () => {
  test('Visszaadja a közelgő vetítések listáját', async () => {
    const res = await request(app).get('/api/screenings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) testScreeningId = res.body[0].id;
  });

  test('movie_id szűrő működik', async () => {
    const res = await request(app).get('/api/screenings?movie_id=1');
    expect(res.status).toBe(200);
    res.body.forEach(s => expect(s.movie_id).toBe(1));
  });

  test('Vetítés részletei tartalmazzák a foglalt székeket', async () => {
    if (!testScreeningId) return;
    const res = await request(app).get(`/api/screenings/${testScreeningId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('taken_seats');
  });
});

describe('POST /api/bookings', () => {
  test('Token nélkül 401-es hiba', async () => {
    const res = await request(app).post('/api/bookings').send({
      screening_id: 1,
      seat_numbers: [1, 2]
    });
    expect(res.status).toBe(401);
  });

  test('Sikeres foglalás bejelentkezett felhasználóval', async () => {
    if (!testScreeningId) return;
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ screening_id: testScreeningId, seat_numbers: [42, 43] });
    expect(res.status).toBe(201);
    expect(res.body.booking).toHaveProperty('id');
    expect(res.body.booking.seat_count).toBe(2);
  });

  test('Már foglalt szék esetén 409-es hiba', async () => {
    if (!testScreeningId) return;
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ screening_id: testScreeningId, seat_numbers: [42] });
    expect(res.status).toBe(409);
  });

  test('Hiányzó adatok esetén 400-as hiba', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ screening_id: 1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/bookings', () => {
  test('Visszaadja a bejelentkezett felhasználó foglalásait', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/health', () => {
  test('Health check visszaad ok státuszt', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
