let currentOrbitalIndex = 0;
const orbitalMovies = DB.movies.slice(0, 5);

function initApp() {
  renderOrbital();
  renderContent();
  setupEventListeners();
}

function renderOrbital() {
  const container = document.getElementById('orbital-container');
  const indicator = document.getElementById('orbital-indicator');
  if (!container) return;
  
  container.innerHTML = orbitalMovies.map((movie, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" onclick="setOrbital(${index})">
      <img src="${movie.poster}" alt="${movie.title}">
    </div>
  `).join('');

  if (indicator) {
    const progress = ((currentOrbitalIndex + 1) / orbitalMovies.length) * 100;
    indicator.style.setProperty('--progress', `${progress}%`);
  }
}

function getOrbitalClass(index) {
  const diff = index - currentOrbitalIndex;
  const len = orbitalMovies.length;
  if (diff === 0) return 'active';
  if (diff === -1 || (currentOrbitalIndex === 0 && index === len - 1)) return 'prev-1';
  if (diff === 1 || (currentOrbitalIndex === len - 1 && index === 0)) return 'next-1';
  if (diff === -2 || (currentOrbitalIndex === 1 && index === len - 1)) return 'prev-2';
  if (diff === 2 || (currentOrbitalIndex === len - 2 && index === 0)) return 'next-2';
  return 'hidden';
}

function setOrbital(index) {
  currentOrbitalIndex = index;
  renderOrbital();
}

function nextOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex + 1) % orbitalMovies.length;
  renderOrbital();
}

function prevOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex - 1 + orbitalMovies.length) % orbitalMovies.length;
  renderOrbital();
}

function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  const categories = [
    { label: 'TRENDING NOW', title: 'S-Trend Filmler', filter: () => true },
    { label: 'NEW RELEASES', title: 'Yeni Çıkanlar', filter: (m) => m.year === '2025' || m.year === '2026' },
    { label: 'TOP RATED', title: 'En Çok Beğenilenler', filter: (m) => parseInt(m.match) > 95 }
  ];

  content.innerHTML = categories.map(cat => `
    <section class="section-matrix">
      <div class="section-label">${cat.label}</div>
      <h2 class="matrix-title">${cat.title}</h2>
      <div class="movie-grid">
        ${DB.movies.filter(cat.filter).map(m => renderCard(m)).join('')}
      </div>
    </section>
  `).join('');
}

function renderCard(movie) {
  return `
    <div class="card-wrapper" onclick="openPlayer('${movie.id}')">
      <div class="card">
        <div class="card-rating">⭐ ${movie.match.replace('%','')}</div>
        <img src="${movie.poster}" alt="${movie.title}">
      </div>
      <div class="card-info">
          <h3>${movie.title}</h3>
          <div class="card-meta">⭐ ${movie.match} • ${movie.year} • 2h 15m</div>
          <p class="card-highlights">${movie.desc}</p>
          <div class="card-progress"></div>
      </div>
    </div>
  `;
}

function openPlayer(id) {
  const movie = [...DB.movies, ...DB.series].find(m => m.id === id);
  if (!movie) return;

  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  
  if (movie.file) {
    iframe.src = movie.file.includes('?') ? `${movie.file}&autoplay=1` : `${movie.file}?autoplay=1`;
  }
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    iframe.src = '';
  }, 600);
}

function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayer();
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

document.addEventListener('DOMContentLoaded', initApp);
