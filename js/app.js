let currentOrbitalIndex = 0;
const orbitalMovies = DB.movies.slice(0, 5);

function initApp() {
  renderOrbital();
  renderContent();
  setupEventListeners();
}

function renderOrbital() {
  const container = document.getElementById('orbital-container');
  const titleEl = document.getElementById('cf-title');
  const metaEl = document.getElementById('cf-meta');
  
  if (!container) return;
  
  container.innerHTML = orbitalMovies.map((movie, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" onclick="setOrbital(${index})" data-id="${movie.id}">
      <img src="${movie.poster}" alt="${movie.title}">
    </div>
  `).join('');

  const activeMovie = orbitalMovies[currentOrbitalIndex];
  if (activeMovie && titleEl && metaEl) {
    titleEl.textContent = activeMovie.title;
    metaEl.textContent = `${activeMovie.year} • MATCH ${activeMovie.match} • S-ORBITAL EDITION`;
  }
}

function getOrbitalClass(index) {
  const diff = index - currentOrbitalIndex;
  const len = orbitalMovies.length;
  
  if (diff === 0) return 'active';
  if (diff === -1 || (currentOrbitalIndex === 0 && index === len - 1)) return 'prev-1';
  if (diff === 1 || (currentOrbitalIndex === len - 1 && index === 0)) return 'next-1';
  if (diff === -2 || (currentOrbitalIndex === 1 && index === len - 1) || (currentOrbitalIndex === 0 && index === len - 2)) return 'prev-2';
  if (diff === 2 || (currentOrbitalIndex === len - 2 && index === 0) || (currentOrbitalIndex === len - 1 && index === 1)) return 'next-2';
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

  content.innerHTML = `
    <!-- TRENDING -->
    <section class="section-matrix">
      <div class="section-label">TRENDING</div>
      <h2 class="matrix-title">S-Trend Filmler</h2>
      <div class="movie-grid">
        ${DB.movies.map(m => renderCard(m)).join('')}
      </div>
    </section>

    <!-- ANIMATION -->
    <section class="section-matrix">
      <div class="section-label">ANIMATION</div>
      <h2 class="matrix-title">Animasyon Dünyası</h2>
      <div class="movie-grid">
        ${DB.movies.filter(m => m.searchTags.includes('animasyon')).map(m => renderCard(m)).join('')}
      </div>
    </section>
  `;
}

function renderCard(movie) {
  return `
    <div class="card-wrapper" onclick="openPlayer('${movie.id}')">
      <div class="card">
        <img src="${movie.poster}" alt="${movie.title}">
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
  } else if (movie.isCollection) {
    const firstVideo = movie.collection[0].file;
    iframe.src = firstVideo.includes('?') ? `${firstVideo}&autoplay=1` : `${firstVideo}?autoplay=1`;
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
