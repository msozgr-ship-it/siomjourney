let currentOrbitalIndex = 0;
const orbitalMovies = DB.movies.slice(0, 5);

function initApp() {
  renderOrbital();
  renderContent();
  setupEventListeners();
}

function renderOrbital() {
  const container = document.getElementById('coverflow-container');
  if (!container) return;
  
  if (container.children.length === 0) {
    container.innerHTML = orbitalMovies.map((movie, index) => `
      <div class="cf-item" onclick="setOrbital(${index})" data-id="${movie.id}">
        <img src="${movie.poster}" alt="${movie.title}">
      </div>
    `).join('');
  }
  
  const items = container.querySelectorAll('.cf-item');
  items.forEach((item, index) => {
    item.className = `cf-item ${getOrbitalClass(index)}`;
  });
  
  updateOrbitalInfo();
}

function getOrbitalClass(index) {
  const diff = index - currentOrbitalIndex;
  if (diff === 0) return 'active';
  if (diff === -1 || (currentOrbitalIndex === 0 && index === orbitalMovies.length - 1)) return 'prev-1';
  if (diff === 1 || (currentOrbitalIndex === orbitalMovies.length - 1 && index === 0)) return 'next-1';
  if (diff === -2 || (currentOrbitalIndex === 1 && index === orbitalMovies.length - 1)) return 'prev-2';
  if (diff === 2 || (currentOrbitalIndex === orbitalMovies.length - 2 && index === 0)) return 'next-2';
  return 'hidden';
}

function setOrbital(index) {
  currentOrbitalIndex = index;
  renderOrbital();
}

function updateOrbitalInfo() {
  const activeMovie = orbitalMovies[currentOrbitalIndex];
  const titleEl = document.getElementById('cf-title');
  const metaEl = document.getElementById('cf-meta');
  
  if (titleEl && metaEl) {
    titleEl.textContent = activeMovie.title;
    metaEl.textContent = `${activeMovie.year} • ${activeMovie.meta} • MATCH ${activeMovie.match}`;
  }
}

function renderContent() {
  const content = document.getElementById('kutuphane');
  if (!content) return;

  content.innerHTML = `
    <!-- TRENDING MATRIX -->
    <section class="section-matrix">
      <div class="section-label">TRENDING</div>
      <h2 class="matrix-title">S-Trend Filmler</h2>
      <div class="movie-grid">
        ${DB.movies.map(m => renderCard(m)).join('')}
      </div>
    </section>

    <!-- ANIMATION MATRIX -->
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
  const clickAction = movie.episodes ? `openSeries('${movie.id}')` : `openPlayer('${movie.id}')`;
  return `
    <div class="card-wrapper" onclick="${clickAction}">
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
  const videoEl = document.getElementById('video-player');
  const iframeEl = document.getElementById('yt-player');
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  
  // Reset players
  videoEl.style.display = 'none';
  iframeEl.style.display = 'none';
  videoEl.src = '';
  iframeEl.src = '';

  const fileUrl = movie.file || (movie.isCollection ? movie.collection[0].file : null);
  const isEmbed = movie.isYoutube || (fileUrl && fileUrl.includes('http'));

  if (isEmbed) {
    iframeEl.src = fileUrl;
    iframeEl.style.display = 'block';
  } else if (fileUrl) {
    videoEl.src = fileUrl;
    videoEl.style.display = 'block';
    videoEl.play();
  }
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const videoEl = document.getElementById('video-player');
  const iframeEl = document.getElementById('yt-player');
  
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    videoEl.pause();
    videoEl.src = '';
    iframeEl.src = '';
  }, 600);
}

function openSeries(id) {
  const series = DB.series.find(s => s.id === id);
  if (!series) return;

  const modal = document.getElementById('series-modal');
  document.getElementById('sm-poster').src = series.poster;
  document.getElementById('sm-title').textContent = series.title;
  document.getElementById('sm-desc').textContent = series.desc;
  
  const epList = document.getElementById('sm-episodes');
  epList.innerHTML = series.episodes.map(ep => `
    <div class="ep-card" onclick="openPlayerFromSeries('${series.id}', '${ep.id}')">
      <div class="ep-num">${ep.epNum}</div>
      <div class="ep-info">
        <h3>${ep.title}</h3>
        <p>${ep.desc}</p>
      </div>
    </div>
  `).join('');

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeSeriesModal() {
  const modal = document.getElementById('series-modal');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 600);
}

function openPlayerFromSeries(seriesId, epId) {
  const series = DB.series.find(s => s.id === seriesId);
  const ep = series.episodes.find(e => e.id === epId);
  if (!ep) return;

  // Simulate movie object for openPlayer logic
  const mockMovie = {
    file: ep.file,
    isYoutube: ep.isYoutube
  };
  
  openPlayerLogic(mockMovie);
}

// Helper to keep code DRY
function openPlayerLogic(movie) {
  const modal = document.getElementById('player-modal');
  const videoEl = document.getElementById('video-player');
  const iframeEl = document.getElementById('yt-player');
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  
  videoEl.style.display = 'none';
  iframeEl.style.display = 'none';

  if (movie.isYoutube || movie.file.includes('http')) {
    iframeEl.src = movie.file;
    iframeEl.style.display = 'block';
  } else {
    videoEl.src = movie.file;
    videoEl.style.display = 'block';
    videoEl.play();
  }
}

function setupEventListeners() {
  const closeBtn = document.querySelector('.close-btn');
  if (closeBtn) closeBtn.onclick = closePlayer;
}

document.addEventListener('DOMContentLoaded', initApp);
