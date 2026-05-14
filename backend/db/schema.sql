CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  duration_min INTEGER,
  poster_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS screenings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  screening_time DATETIME NOT NULL,
  hall TEXT NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 50,
  available_seats INTEGER NOT NULL DEFAULT 50,
  price INTEGER NOT NULL DEFAULT 1500,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  screening_id INTEGER NOT NULL,
  seat_count INTEGER NOT NULL DEFAULT 1,
  seat_numbers TEXT,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (screening_id) REFERENCES screenings(id)
);

INSERT OR IGNORE INTO movies (id, title, description, genre, duration_min, poster_url) VALUES
(1, 'Dune: Part Two', 'Paul Atreides egyesíti a Fremenekkel és bosszút áll a Harkonnenek ellen.', 'Sci-Fi', 166, 'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_Part_Two_poster.jpeg'),
(2, 'Oppenheimer', 'Az atommodabomba atyjának lenyűgöző életrajzi drámája.', 'Dráma', 180, 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg'),
(3, 'Godzilla x Kong', 'Két titán szövetsége egy mélyebb fenyegetéssel szemben.', 'Akció', 115, 'https://upload.wikimedia.org/wikipedia/en/9/9f/Godzilla_x_Kong_The_New_Empire_poster.jpg'),
(4, 'Wonka', 'A fiatal Willy Wonka kalandjai a csokoládé birodalom kezdeteinél.', 'Kaland', 116, 'https://upload.wikimedia.org/wikipedia/en/c/c3/Wonka_%28film%29_poster.jpg'),
(5, 'Furiosa', 'Mad Max előzménye: Furiosa eredettörténete az apokaliptikus sivatagban.', 'Akció', 148, 'https://upload.wikimedia.org/wikipedia/en/4/41/Furiosa_A_Mad_Max_Saga_poster.jpg');

INSERT OR IGNORE INTO screenings (id, movie_id, screening_time, hall, total_seats, available_seats, price) VALUES
(1,  1, datetime('now', '+1 day', 'start of day', '+10 hours'), '1-es terem', 80, 80, 1800),
(2,  1, datetime('now', '+1 day', 'start of day', '+14 hours'), '1-es terem', 80, 65, 1800),
(3,  1, datetime('now', '+2 day', 'start of day', '+18 hours'), '2-es terem', 60, 60, 1800),
(4,  2, datetime('now', '+1 day', 'start of day', '+11 hours'), '2-es terem', 60, 45, 2000),
(5,  2, datetime('now', '+3 day', 'start of day', '+16 hours'), '1-es terem', 80, 80, 2000),
(6,  3, datetime('now', '+1 day', 'start of day', '+13 hours'), '3-as terem', 100, 88, 1600),
(7,  3, datetime('now', '+2 day', 'start of day', '+17 hours'), '3-as terem', 100, 100, 1600),
(8,  4, datetime('now', '+2 day', 'start of day', '+10 hours'), '2-es terem', 60, 30, 1500),
(9,  4, datetime('now', '+4 day', 'start of day', '+15 hours'), '1-es terem', 80, 80, 1500),
(10, 5, datetime('now', '+3 day', 'start of day', '+19 hours'), '3-as terem', 100, 75, 1700),
(11, 5, datetime('now', '+5 day', 'start of day', '+13 hours'), '2-es terem', 60, 60, 1700);
