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

  const indicator = document.querySelector('.ctrl-indicator');
  if (indicator) {
    const progress = ((currentOrbitalIndex + 1) / orbitalMovies.length) * 100;
    indicator.style.setProperty('--progress', `${progress}%`);
  }
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

function nextOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex + 1) % orbitalMovies.length;
  renderOrbital();
}

function prevOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex - 1 + orbitalMovies.length) % orbitalMovies.length;
  renderOrbital();
}

function renderContent() {
  const content = document.getElementById('kutuphane');
  if (!content) return;

  const sections = [
    { label: 'TRENDING NOW', movies: DB.movies },
    { label: 'NEW RELEASES', movies: DB.series },
    { label: 'TOP RATED', movies: DB.movies.filter(m => parseFloat(m.rating) >= 8.8) },
    { label: 'SCI-FI EXPLORATION', movies: DB.movies.filter(m => m.searchTags.includes('uzay') || m.searchTags.includes('elio')) }
  ];

  content.innerHTML = sections.map(sec => `
    <section class="section-matrix">
      <div class="section-label">${sec.label}</div>
      <div class="movie-grid">
        ${sec.movies.map(m => renderCard(m)).join('')}
      </div>
    </section>
  `).join('');
}

function renderCard(movie) {
  const clickAction = movie.episodes ? `openSeries('${movie.id}')` : `openPlayer('${movie.id}')`;
  return `
    <div class="card-wrapper" onclick="${clickAction}">
      <div class="card">
        <img src="${movie.poster}" alt="${movie.title}">
        <div class="card-rating">
          <span>★</span> ${movie.rating || '8.5'}
        </div>
      </div>
      <div class="card-info">
        <h3>${movie.title}</h3>
        <p class="card-meta">${movie.year} • ${movie.meta}</p>
        <div class="card-highlights">
          <strong>HIGHLIGHTS</strong><br>
          ${movie.highlights || 'İçeriğe dair en heyecan verici anlar ve detaylar burada.'}
        </div>
      </div>
    </div>
  `;
}

// PLAYER LOGIC
function openPlayer(id) {
  const movie = [...DB.movies, ...DB.series].find(m => m.id === id);
  if (!movie) return;
  openPlayerLogic(movie);
}

function openPlayerLogic(movie) {
  const modal = document.getElementById('player-modal');
  const videoEl = document.getElementById('video-player');
  const iframeEl = document.getElementById('yt-player');
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  
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
  
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    if (videoEl) { videoEl.pause(); videoEl.src = ''; }
    if (iframeEl) { iframeEl.src = ''; }
  }, 600);
}

// SERIES LOGIC
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
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 600);
}

function openPlayerFromSeries(seriesId, epId) {
  const series = DB.series.find(s => s.id === seriesId);
  const ep = series.episodes.find(e => e.id === epId);
  if (!ep) return;
  openPlayerLogic({ file: ep.file, isYoutube: ep.isYoutube });
}

// SEARCH LOGIC
function openSearch() {
  const modal = document.getElementById('search-modal');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
    document.getElementById('search-input').focus();
  }, 10);
}

function closeSearch() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 600);
}

function setupEventListeners() {
  const closeBtns = document.querySelectorAll('.close-btn');
  closeBtns.forEach(btn => {
    btn.onclick = () => {
      closePlayer();
      closeSeriesModal();
      closeSearch();
    };
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      const val = e.target.value.toLowerCase();
      const results = [...DB.movies, ...DB.series].filter(m => 
        m.title.toLowerCase().includes(val) || 
        m.searchTags.toLowerCase().includes(val)
      );
      renderSearchResults(results);
    };
  }
}

function renderSearchResults(results) {
  const container = document.getElementById('search-results');
  if (results.length === 0) {
    container.innerHTML = '<p style="padding: 20px; opacity: 0.5;">Sonuç bulunamadı...</p>';
    return;
  }
  container.innerHTML = results.map(m => renderCard(m)).join('');
}

document.addEventListener('DOMContentLoaded', initApp);
