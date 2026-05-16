let currentOrbitalIndex = 0;
const orbitalMovies = [...DB.movies, ...DB.series];

function initApp() {
  renderOrbital();
  updateStage();
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
  // Handle circular wrap
  let virtualDiff = diff;
  if (diff > orbitalMovies.length / 2) virtualDiff -= orbitalMovies.length;
  if (diff < -orbitalMovies.length / 2) virtualDiff += orbitalMovies.length;

  if (virtualDiff === 0) return 'active';
  if (virtualDiff === -1) return 'prev-1';
  if (virtualDiff === 1) return 'next-1';
  if (virtualDiff === -2) return 'prev-2';
  if (virtualDiff === 2) return 'next-2';
  return 'hidden';
}

function setOrbital(index) {
  if (currentOrbitalIndex === index) {
    // If clicking the active one, play it
    playCurrent();
    return;
  }
  currentOrbitalIndex = index;
  renderOrbital();
  updateStage();
}

function nextOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex + 1) % orbitalMovies.length;
  renderOrbital();
  updateStage();
}

function prevOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex - 1 + orbitalMovies.length) % orbitalMovies.length;
  renderOrbital();
  updateStage();
}

// STAGE LOGIC
function updateStage() {
  const movie = orbitalMovies[currentOrbitalIndex];
  if (!movie) return;

  const titleEl = document.getElementById('st-title');
  const yearEl = document.getElementById('st-year');
  const ratingEl = document.getElementById('st-rating');
  const matchEl = document.getElementById('st-match');
  const descEl = document.getElementById('st-desc');
  const epContainer = document.getElementById('st-episodes');
  const dynamicBg = document.getElementById('dynamic-bg');

  // Fade out effect
  titleEl.parentElement.style.opacity = '0';
  epContainer.style.opacity = '0';

  setTimeout(() => {
    titleEl.textContent = movie.title;
    yearEl.textContent = movie.year;
    ratingEl.textContent = `★ ${movie.rating}`;
    matchEl.textContent = `${movie.match} Match`;
    descEl.textContent = movie.desc;

    // Dynamic Ambiance
    const color = movie.id.startsWith('s') ? 'rgba(255, 15, 35, 0.2)' : 'rgba(74, 0, 255, 0.2)';
    dynamicBg.style.setProperty('--accent-ambient', color);

    // Render Episodes if Series
    if (movie.episodes) {
      epContainer.innerHTML = movie.episodes.map(ep => `
        <div class="ep-panel" onclick="playEpisode('${movie.id}', '${ep.id}')">
          <h3>Bölüm ${ep.epNum}: ${ep.title}</h3>
          <p>${ep.desc}</p>
        </div>
      `).join('');
    } else if (movie.isCollection) {
      epContainer.innerHTML = movie.collection.map(f => `
        <div class="ep-panel" onclick="playCollectionFilm('${movie.id}', '${f.id}')">
          <h3>${f.title}</h3>
          <p>${f.desc}</p>
        </div>
      `).join('');
    } else {
      epContainer.innerHTML = `
        <div class="ep-panel" style="cursor: default; opacity: 0.5;">
          <h3>Bağımsız Film</h3>
          <p>Bu içerik tek parçadan oluşmaktadır.</p>
        </div>
      `;
    }

    // Fade in
    titleEl.parentElement.style.opacity = '1';
    epContainer.style.opacity = '1';
  }, 300);
}

function playCurrent() {
  const movie = orbitalMovies[currentOrbitalIndex];
  openPlayerLogic(movie);
}

function playEpisode(seriesId, epId) {
  const series = DB.series.find(s => s.id === seriesId);
  const ep = series.episodes.find(e => e.id === epId);
  openPlayerLogic(ep);
}

function playCollectionFilm(collId, filmId) {
  const coll = DB.movies.find(m => m.id === collId);
  const film = coll.collection.find(f => f.id === filmId);
  openPlayerLogic(film);
}

function openPlayerLogic(content) {
  const modal = document.getElementById('player-modal');
  const videoEl = document.getElementById('video-player');
  const iframeEl = document.getElementById('yt-player');
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  
  videoEl.style.display = 'none';
  iframeEl.style.display = 'none';
  videoEl.src = '';
  iframeEl.src = '';

  const fileUrl = content.file;
  const isEmbed = content.isYoutube || (fileUrl && fileUrl.includes('http'));

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

function openSearch() {
  const modal = document.getElementById('search-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  document.getElementById('search-input').focus();
}

function closeSearch() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 600);
}

function setupEventListeners() {
  document.getElementById('search-input').oninput = (e) => {
    const val = e.target.value.toLowerCase();
    const results = orbitalMovies.filter(m => 
      m.title.toLowerCase().includes(val) || 
      m.searchTags.toLowerCase().includes(val)
    );
    const container = document.getElementById('search-results');
    container.innerHTML = results.map(m => `
      <div class="search-item" onclick="selectFromSearch('${m.id}')">
        <img src="${m.poster}" alt="${m.title}">
        <span>${m.title}</span>
      </div>
    `).join('');
  };
}

function selectFromSearch(id) {
  const index = orbitalMovies.findIndex(m => m.id === id);
  if (index !== -1) {
    setOrbital(index);
    closeSearch();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
