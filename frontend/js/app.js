import { api, getToken, setToken, removeToken, getUser, setUser } from './api.js';

let currentUser = null;
let selectedSeats = [];
let currentScreening = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (token) {
    try {
      currentUser = await api.get('/auth/me');
      setUser(currentUser);
    } catch {
      removeToken();
    }
  }
  updateNavbar();
  showPage('movies');
});

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  const btn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (btn) btn.classList.add('active');

  if (pageId === 'movies') loadMovies();
  if (pageId === 'bookings') loadMyBookings();
}

document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page === 'bookings' && !currentUser) {
      showPage('login');
      return;
    }
    showPage(page);
  });
});

function updateNavbar() {
  const authArea = document.getElementById('auth-area');
  if (currentUser) {
    authArea.innerHTML = `
      <div class="user-bar">
        <div class="user-avatar">${currentUser.username[0].toUpperCase()}</div>
        <span>${currentUser.username}</span>
        <button class="nav-btn" id="btn-bookings-nav" data-page="bookings">Foglalásaim</button>
        <button class="nav-btn" id="btn-logout">Kilépés</button>
      </div>`;
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-bookings-nav').addEventListener('click', () => showPage('bookings'));
  } else {
    authArea.innerHTML = `
      <button class="nav-btn" data-page="login" id="btn-login-nav">Bejelentkezés</button>
      <button class="nav-btn primary" data-page="register" id="btn-register-nav">Regisztráció</button>`;
    document.getElementById('btn-login-nav').addEventListener('click', () => showPage('login'));
    document.getElementById('btn-register-nav').addEventListener('click', () => showPage('register'));
  }
}

function logout() {
  currentUser = null;
  removeToken();
  updateNavbar();
  showPage('movies');
}

async function loadMovies() {
  const container = document.getElementById('movies-grid');
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const movies = await api.get('/movies');
    if (movies.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">🎬</div><p>Nincs elérhető film</p></div>';
      return;
    }
    container.innerHTML = movies.map(m => `
      <div class="movie-card" onclick="showMovieDetail(${m.id})">
        <img src="${m.poster_url || ''}" alt="${m.title}"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%232a2a2a%22 width=%22200%22 height=%22300%22/><text x=%22100%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>🎬</text></svg>'">
        <div class="movie-card-info">
          <h3>${m.title}</h3>
          <div class="genre">${m.genre || 'Film'}</div>
          <div class="duration">${m.duration_min ? m.duration_min + ' perc' : ''}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">Hiba a filmek betöltésekor: ${e.message}</div>`;
  }
}

window.showMovieDetail = async function(movieId) {
  const page = document.getElementById('page-detail');
  const content = document.getElementById('movie-detail-content');
  content.innerHTML = '<div class="spinner"></div>';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  page.classList.add('active');

  try {
    const movie = await api.get(`/movies/${movieId}`);

    const screeningRows = movie.screenings.length === 0
      ? '<p style="color:var(--text-muted)">Nincs közelgő vetítés</p>'
      : movie.screenings.map(s => {
          const dt = new Date(s.screening_time);
          const dateStr = dt.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'short' });
          const timeStr = dt.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
          const full = s.available_seats === 0;
          return `
          <div class="screening-item">
            <div>
              <div class="screening-time">${dateStr} ${timeStr}</div>
              <div class="screening-meta">${s.hall}</div>
            </div>
            <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
              <div class="screening-seats">
                <div class="seats-count" style="color:${s.available_seats < 10 ? 'var(--warning)' : 'var(--success)'}">
                  ${s.available_seats}
                </div>
                <div class="seats-label">szabad hely</div>
              </div>
              <div>
                <div class="price-tag">${s.price.toLocaleString('hu-HU')} Ft</div>
              </div>
              <button class="btn btn-primary" ${full ? 'disabled' : ''}
                onclick="openSeatPicker(${s.id}, '${movie.title}', ${s.total_seats}, ${s.price})">
                ${full ? 'Telt ház' : 'Jegyvásárlás'}
              </button>
            </div>
          </div>`;
        }).join('');

    content.innerHTML = `
      <button class="btn btn-secondary" style="margin-bottom:20px" onclick="showPage('movies')">← Vissza</button>
      <div class="movie-detail-header">
        <img src="${movie.poster_url || ''}" alt="${movie.title}"
          onerror="this.style.display='none'">
        <div class="movie-detail-info">
          <h2>${movie.title}</h2>
          <div class="meta">
            ${movie.genre ? `<span class="badge genre">${movie.genre}</span>` : ''}
            ${movie.duration_min ? `<span class="badge">${movie.duration_min} perc</span>` : ''}
          </div>
          <p>${movie.description || 'Nincs leírás.'}</p>
        </div>
      </div>
      <div class="screenings-section">
        <h3>Vetítések</h3>
        ${screeningRows}
      </div>`;
  } catch (e) {
    content.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
};

window.openSeatPicker = async function(screeningId, movieTitle, totalSeats, price) {
  if (!currentUser) {
    showAlert('login', 'Jegyvásárláshoz be kell jelentkezni!', 'error');
    showPage('login');
    return;
  }

  selectedSeats = [];
  currentScreening = { id: screeningId, price, totalSeats };

  const overlay = document.getElementById('seat-picker-overlay');
  overlay.style.display = 'flex';

  document.getElementById('seat-picker-title').textContent = movieTitle;

  try {
    const screening = await api.get(`/screenings/${screeningId}`);
    const takenSeats = screening.taken_seats || [];
    renderSeats(totalSeats, takenSeats, price);
  } catch (e) {
    closeSeatPicker();
    alert('Hiba a vetítés betöltésekor: ' + e.message);
  }
};

function renderSeats(total, taken, price) {
  const grid = document.getElementById('seats-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const seat = document.createElement('div');
    seat.className = 'seat' + (taken.includes(i) ? ' taken' : '');
    seat.textContent = i;
    seat.dataset.seat = i;
    if (!taken.includes(i)) {
      seat.addEventListener('click', () => toggleSeat(i, price));
    }
    grid.appendChild(seat);
  }
  updateSummary(price);
}

function toggleSeat(seatNum, price) {
  const idx = selectedSeats.indexOf(seatNum);
  if (idx > -1) {
    selectedSeats.splice(idx, 1);
  } else {
    if (selectedSeats.length >= 10) { alert('Egyszerre max 10 jegy foglalható!'); return; }
    selectedSeats.push(seatNum);
  }
  document.querySelectorAll(`.seat[data-seat="${seatNum}"]`).forEach(el => {
    el.classList.toggle('selected', selectedSeats.includes(seatNum));
  });
  updateSummary(price);
}

function updateSummary(price) {
  const count = selectedSeats.length;
  const total = count * price;
  document.getElementById('selected-count').textContent = count + ' db';
  document.getElementById('total-price').textContent = total.toLocaleString('hu-HU') + ' Ft';
  document.getElementById('seats-list').textContent = count > 0 ? selectedSeats.sort((a,b)=>a-b).join(', ') : '–';
  document.getElementById('confirm-booking-btn').disabled = count === 0;
}

window.closeSeatPicker = function() {
  document.getElementById('seat-picker-overlay').style.display = 'none';
  selectedSeats = [];
  currentScreening = null;
};

document.getElementById('confirm-booking-btn').addEventListener('click', async () => {
  if (!currentScreening || selectedSeats.length === 0) return;
  const btn = document.getElementById('confirm-booking-btn');
  btn.disabled = true;
  btn.textContent = 'Foglalás...';

  try {
    await api.post('/bookings', {
      screening_id: currentScreening.id,
      seat_numbers: selectedSeats
    });
    closeSeatPicker();
    showPage('bookings');
    showAlert('bookings', `Sikeres foglalás! ${selectedSeats.length} jegy lefoglalva.`, 'success');
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Foglalás megerősítése';
    document.getElementById('seat-picker-error').textContent = e.message;
    document.getElementById('seat-picker-error').style.display = 'block';
  }
});

async function loadMyBookings() {
  if (!currentUser) return;
  const container = document.getElementById('bookings-list');
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const bookings = await api.get('/bookings');
    if (bookings.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">🎟️</div><p>Még nincs foglalásod</p></div>';
      return;
    }
    container.innerHTML = bookings.map(b => {
      const dt = new Date(b.screening_time);
      const dateStr = dt.toLocaleDateString('hu-HU', { year:'numeric', month:'long', day:'numeric', weekday:'short' });
      const timeStr = dt.toLocaleTimeString('hu-HU', { hour:'2-digit', minute:'2-digit' });
      const isPast = dt < new Date();
      const canCancel = b.status === 'confirmed' && !isPast;
      return `
      <div class="booking-card">
        <img src="${b.poster_url || ''}" alt="${b.movie_title}" onerror="this.style.display='none'">
        <div class="booking-info">
          <h4>${b.movie_title}</h4>
          <p>📅 ${dateStr} ${timeStr}</p>
          <p>🪑 ${b.hall} — Székek: ${b.seat_numbers || b.seat_count + ' db'}</p>
          <p>💳 ${b.total_price.toLocaleString('hu-HU')} Ft</p>
        </div>
        <div style="text-align:right">
          <div class="status-badge status-${b.status}">${b.status === 'confirmed' ? 'Aktív' : 'Lemondva'}</div>
          ${canCancel ? `<button class="btn btn-danger" style="margin-top:10px;font-size:0.85rem" onclick="cancelBooking(${b.id})">Lemondás</button>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

window.cancelBooking = async function(bookingId) {
  if (!confirm('Biztosan le szeretnéd mondani ezt a foglalást?')) return;
  try {
    await api.delete(`/bookings/${bookingId}`);
    loadMyBookings();
  } catch (e) {
    alert('Hiba: ' + e.message);
  }
};

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  clearAlert('login');

  try {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    currentUser = data.user;
    setUser(data.user);
    updateNavbar();
    showPage('movies');
  } catch (err) {
    showAlert('login', err.message, 'error');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  clearAlert('register');

  try {
    const data = await api.post('/auth/register', { username, email, password });
    setToken(data.token);
    currentUser = data.user;
    setUser(data.user);
    updateNavbar();
    showPage('movies');
  } catch (err) {
    showAlert('register', err.message, 'error');
  }
});

function showAlert(pageId, message, type) {
  const el = document.getElementById(`alert-${pageId}`);
  if (el) { el.textContent = message; el.className = `alert alert-${type}`; el.style.display = 'block'; }
}
function clearAlert(pageId) {
  const el = document.getElementById(`alert-${pageId}`);
  if (el) el.style.display = 'none';
}

window.showPage = showPage;
