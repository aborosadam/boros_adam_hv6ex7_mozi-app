# MoziJegy – Online Mozijegy-foglaló Rendszer

**Tantárgy:** Webprogramozás alapjai (WEBPRO-T-LA01)  
**Projekt:** Projekt 10 – Online jegyfoglaló rendszer mozik számára  
**Github Link:** https://github.com/aborosadam/boros_adam_hv6ex7_mozi-app

---

## Tartalomjegyzék

1. [Az alkalmazás leírása](#1-az-alkalmazás-leírása)
2. [Alkalmazás felépítése](#2-alkalmazás-felépítése)
3. [Telepítési útmutató](#3-telepítési-útmutató)
4. [Konfiguráció](#4-konfiguráció)
5. [API végpontok leírása](#5-api-végpontok-leírása)
6. [Adatbázis felépítése](#6-adatbázis-felépítése)
7. [Tesztek](#7-tesztek)
8. [Opcionális funkciók](#8-opcionális-funkciók)

---

## 1. Az alkalmazás leírása

A MoziJegy egy online mozijegy-foglaló webalkalmazás, amely lehetővé teszi a felhasználók számára, hogy filmeket böngésszenek, vetítési időpontokat tekintsenek meg, és jegyeket foglaljanak. Az alkalmazás adminisztrátori felületet is biztosít a filmek és vetítések kezeléséhez.

**Fő funkciók:**

- Filmek listázása és részletes adatainak megtekintése
- Közelgő vetítések böngészése
- Interaktív ülőhely-választó
- Jegyfoglalás kiválasztott időpontra és székekre
- Saját foglalások megtekintése és lemondása

**Opcionális funkciók:**

- Felhasználói regisztráció és bejelentkezés (JWT)
- Admin felület filmek és vetítések kezeléséhez
- Konténerizáció Dockerrel

---

## 2. Alkalmazás felépítése

```
mozi-app/
├── backend/
│   ├── db/
│   │   ├── database.js       # Adatbázis kapcsolat és inicializálás
│   │   └── schema.sql        # Táblák és mintaadatok
│   ├── middleware/
│   │   └── auth.js           # JWT autentikációs middleware
│   ├── routes/
│   │   ├── auth.js           # Regisztráció és bejelentkezés
│   │   ├── movies.js         # Filmkezelés
│   │   ├── screenings.js     # Vetítések kezelése
│   │   └── bookings.js       # Foglalások kezelése
│   ├── tests/
│   │   └── app.test.js       # Integrációs tesztek
│   ├── server.js             # Express szerver belépési pont
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css         # Reszponzív stíluslap
│   ├── js/
│   │   ├── api.js            # API kommunikáció
│   │   └── app.js            # Frontend logika
│   └── index.html            # SPA belépési pont
├── Dockerfile
├── docker-compose.yml
└── .gitignore
```

**Technológiai stack:**

| Réteg | Technológia |
|---|---|
| Backend | Node.js, Express |
| Adatbázis | SQLite (better-sqlite3) |
| Autentikáció | JWT (jsonwebtoken), bcryptjs |
| Frontend | Vanilla HTML/CSS/JavaScript |
| Konténerizáció | Docker, Docker Compose |
| Tesztelés | Jest, Supertest |

---

## 3. Telepítési útmutató

### Docker segítségével (ajánlott)

Előfeltétel: Docker és Docker Compose telepítve.

```bash
# 1. A projekt kicsomagolása
unzip boros_adam_hv6ex7_mozi-app.zip
cd boros_adam_hv6ex7_mozi-app

# 2. Alkalmazás indítása
docker-compose up --build

# 3. Megnyitás böngészőben
# http://localhost:3000
```

A leállításhoz:

```bash
docker-compose down
```

### Lokálisan (Docker nélkül)

Előfeltétel: Node.js 18+

```bash
# 1. Függőségek telepítése
cd boros_adam_hv6ex7_mozi-app/backend
npm install

# 2. Szerver indítása
npm start

# 3. Megnyitás böngészőben
# http://localhost:3000
```

### Tesztek futtatása

```bash
cd boros_adam_hv6ex7_mozi-app/backend
npm install
npm test
```

---

## 4. Konfiguráció

Az alkalmazás az alábbi környezeti változókat olvassa be. Ezek opcionálisak – alapértelmezett értékkel rendelkeznek.

| Változó | Alapértelmezett érték | Leírás |
|---|---|---|
| `PORT` | `3000` | A szerver portja |
| `DB_PATH` | `backend/db/mozi.db` | SQLite adatbázis fájl elérési útja |
| `JWT_SECRET` | `mozi_secret_key_...` | JWT token titkosítási kulcs |
| `NODE_ENV` | `development` | Futtatási környezet |

Docker Compose esetén a `docker-compose.yml` fájlban módosíthatók az `environment` szekción belül.

**Alapértelmezett admin felhasználó:**

| Mező | Érték |
|---|---|
| Email | admin@mozi.hu |
| Jelszó | admin123 |

Az admin fiók automatikusan létrejön az alkalmazás első indításakor.

---

## 5. API végpontok leírása

Az API alapútvonala: `/api`

### Autentikáció

#### `POST /api/auth/register`
Új felhasználó regisztrálása.

**Kérés törzse:**
```json
{
  "username": "felhasznalo",
  "email": "pelda@email.hu",
  "password": "jelszo123"
}
```

**Sikeres válasz (201):**
```json
{
  "message": "Sikeres regisztráció",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 2, "username": "felhasznalo", "email": "pelda@email.hu", "role": "user" }
}
```

**Hibák:** `400` – hiányzó mező / rövid jelszó / érvénytelen email, `409` – foglalt felhasználónév vagy email

---

#### `POST /api/auth/login`
Bejelentkezés.

**Kérés törzse:**
```json
{
  "email": "pelda@email.hu",
  "password": "jelszo123"
}
```

**Sikeres válasz (200):**
```json
{
  "message": "Sikeres bejelentkezés",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 2, "username": "felhasznalo", "email": "pelda@email.hu", "role": "user" }
}
```

**Hibák:** `400` – hiányzó mező, `401` – nem létező email vagy hibás jelszó

---

#### `GET /api/auth/me`
Bejelentkezett felhasználó adatainak lekérése. Hitelesítés szükséges.

**Fejléc:** `Authorization: Bearer <token>`

**Sikeres válasz (200):**
```json
{
  "id": 2,
  "username": "felhasznalo",
  "email": "pelda@email.hu",
  "role": "user",
  "created_at": "2025-05-01T10:00:00.000Z"
}
```

---

### Filmek

#### `GET /api/movies`
Összes film listázása.

**Sikeres válasz (200):** Filmek tömbje.

---

#### `GET /api/movies/:id`
Egy film adatainak és közelgő vetítéseinek lekérése.

**Sikeres válasz (200):**
```json
{
  "id": 1,
  "title": "Dune: Part Two",
  "description": "...",
  "genre": "Sci-Fi",
  "duration_min": 166,
  "poster_url": "https://...",
  "screenings": [ { "id": 1, "screening_time": "...", "hall": "1-es terem", "available_seats": 80, "price": 1800 } ]
}
```

**Hibák:** `404` – film nem található

---

#### `POST /api/movies`
Új film hozzáadása. Csak admin jogosultsággal.

**Fejléc:** `Authorization: Bearer <admin_token>`

**Kérés törzse:**
```json
{
  "title": "Új film",
  "description": "Leírás",
  "genre": "Akció",
  "duration_min": 120,
  "poster_url": "https://..."
}
```

**Sikeres válasz (201):** Az újonnan létrehozott film objektuma.

---

#### `PUT /api/movies/:id`
Film adatainak módosítása. Csak admin jogosultsággal.

**Fejléc:** `Authorization: Bearer <admin_token>`

---

#### `DELETE /api/movies/:id`
Film törlése. Csak admin jogosultsággal.

**Fejléc:** `Authorization: Bearer <admin_token>`

**Sikeres válasz (200):** `{ "message": "Film sikeresen törölve" }`

---

### Vetítések

#### `GET /api/screenings`
Közelgő vetítések listázása. Szűrhető `movie_id` query paraméterrel.

**Példa:** `GET /api/screenings?movie_id=1`

**Sikeres válasz (200):** Vetítések tömbje a film adataival együtt.

---

#### `GET /api/screenings/:id`
Egy vetítés részletes adatai, beleértve a már foglalt székeket.

**Sikeres válasz (200):**
```json
{
  "id": 1,
  "movie_title": "Dune: Part Two",
  "screening_time": "2025-05-10T10:00:00",
  "hall": "1-es terem",
  "total_seats": 80,
  "available_seats": 72,
  "price": 1800,
  "taken_seats": [1, 5, 12]
}
```

---

#### `POST /api/screenings`
Új vetítés létrehozása. Csak admin jogosultsággal.

**Fejléc:** `Authorization: Bearer <admin_token>`

**Kérés törzse:**
```json
{
  "movie_id": 1,
  "screening_time": "2025-05-15T18:00:00",
  "hall": "2-es terem",
  "total_seats": 60,
  "price": 1800
}
```

---

#### `DELETE /api/screenings/:id`
Vetítés törlése. Csak admin jogosultsággal.

---

### Foglalások

#### `GET /api/bookings`
Bejelentkezett felhasználó foglalásainak listázása. Hitelesítés szükséges.

**Fejléc:** `Authorization: Bearer <token>`

**Sikeres válasz (200):** Foglalások tömbje a film és vetítés adataival.

---

#### `POST /api/bookings`
Új jegyfoglalás létrehozása. Hitelesítés szükséges.

**Fejléc:** `Authorization: Bearer <token>`

**Kérés törzse:**
```json
{
  "screening_id": 1,
  "seat_numbers": [14, 15, 16]
}
```

**Sikeres válasz (201):**
```json
{
  "message": "Foglalás sikeresen létrehozva",
  "booking": {
    "id": 5,
    "seat_count": 3,
    "seat_numbers": "14,15,16",
    "total_price": 5400,
    "status": "confirmed"
  }
}
```

**Hibák:** `400` – hiányzó adat / lejárt vetítés / érvénytelen szék, `401` – nincs bejelentkezve, `409` – foglalt szék / nincs elég hely

---

#### `DELETE /api/bookings/:id`
Foglalás lemondása. Hitelesítés szükséges (saját foglalás, vagy admin).

**Fejléc:** `Authorization: Bearer <token>`

**Sikeres válasz (200):** `{ "message": "Foglalás sikeresen lemondva" }`

**Hibák:** `400` – már lemondott foglalás / lejárt vetítés, `403` – nem saját foglalás

---

#### `GET /api/bookings/all`
Összes foglalás listázása. Csak admin jogosultsággal.

---

### Health Check

#### `GET /api/health`
Az alkalmazás állapotának ellenőrzése.

**Sikeres válasz (200):** `{ "status": "ok", "timestamp": "2025-05-09T..." }`

---

## 6. Adatbázis felépítése

Az alkalmazás SQLite adatbázist használ. Az adatbázis automatikusan létrejön az első indításkor a `schema.sql` alapján.

### Táblák

**users** – Felhasználók

| Oszlop | Típus | Leírás |
|---|---|---|
| id | INTEGER PK | Egyedi azonosító |
| username | TEXT UNIQUE | Felhasználónév |
| email | TEXT UNIQUE | Email cím |
| password_hash | TEXT | Bcrypt hash |
| role | TEXT | `user` vagy `admin` |
| created_at | DATETIME | Regisztráció ideje |

**movies** – Filmek

| Oszlop | Típus | Leírás |
|---|---|---|
| id | INTEGER PK | Egyedi azonosító |
| title | TEXT | Film címe |
| description | TEXT | Leírás |
| genre | TEXT | Műfaj |
| duration_min | INTEGER | Hossz percben |
| poster_url | TEXT | Plakát URL |

**screenings** – Vetítések

| Oszlop | Típus | Leírás |
|---|---|---|
| id | INTEGER PK | Egyedi azonosító |
| movie_id | INTEGER FK | Film azonosítója |
| screening_time | DATETIME | Vetítés időpontja |
| hall | TEXT | Terem neve |
| total_seats | INTEGER | Összes szék |
| available_seats | INTEGER | Szabad helyek száma |
| price | INTEGER | Jegy ára (Ft) |

**bookings** – Foglalások

| Oszlop | Típus | Leírás |
|---|---|---|
| id | INTEGER PK | Egyedi azonosító |
| user_id | INTEGER FK | Felhasználó azonosítója |
| screening_id | INTEGER FK | Vetítés azonosítója |
| seat_count | INTEGER | Foglalt jegyek száma |
| seat_numbers | TEXT | Székek vesszővel elválasztva |
| total_price | INTEGER | Végösszeg (Ft) |
| status | TEXT | `confirmed` vagy `cancelled` |
| created_at | DATETIME | Foglalás ideje |

---

## 7. Tesztek

A tesztek Jest és Supertest keretrendszerrel készültek. A tesztek egy elkülönített, ideiglenes adatbázison futnak, amely a futás után törlődik.

**Tesztek futtatása:**

```bash
cd backend
npm test
```

**Tesztelt területek:**

| Tesztcsoport | Tesztesetek |
|---|---|
| `POST /api/auth/register` | Sikeres regisztráció, hiányzó mezők, duplikált email, rövid jelszó |
| `POST /api/auth/login` | Sikeres bejelentkezés, hibás jelszó, nem létező email |
| `GET /api/auth/me` | Token nélkül 401, érvényes tokennel visszaadja az adatokat |
| `GET /api/movies` | Filmek listája visszaadva |
| `GET /api/movies/:id` | Létező film adatai és vetítései, nem létező 404 |
| `GET /api/screenings` | Vetítések listája, movie_id szűrő, foglalt székek |
| `POST /api/bookings` | Token nélkül 401, sikeres foglalás, duplikált szék 409, hiányzó adat 400 |
| `GET /api/bookings` | Saját foglalások visszaadva |
| `GET /api/health` | Health check ok státusz |

---

## 8. Opcionális funkciók

### Konténerizáció – Docker (15 pont)

Az alkalmazás Dockerrel konténerizálva van. A `Dockerfile` és a `docker-compose.yml` a projekt gyökerében található.

Az alkalmazás indítása:

```bash
docker-compose up --build
```

Az adatbázis fájl egy named volume-ban (`mozi-data`) tárolódik, így az adatok megmaradnak a konténer újraindítása után is.

### Autentikáció – JWT (15 pont)

A felhasználói autentikáció JWT (JSON Web Token) alapú. A token 24 óráig érvényes.

A regisztrációhoz és bejelentkezéshez nincs szükség tokenre. A foglaláshoz, a saját foglalások megtekintéséhez és az admin funkciókhoz érvényes Bearer token szükséges az `Authorization` fejlécben.

A jelszavak bcrypt algoritmussal, 10 körössel vannak hashelve. Az admin felhasználó automatikusan létrejön az alkalmazás első indításakor.
