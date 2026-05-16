let currentOrbitalIndex = 0;
const allContent = [...DB.movies, ...DB.series];
const orbitalContent = DB.movies.slice(0, 6);
let filteredContent = [...allContent];

function initApp() {
  renderOrbital();
  renderContent();
  setupEventListeners();
}

// 3D ORBITAL LOGIC
function renderOrbital() {
  const container = document.getElementById('orbital-container');
  const indicator = document.getElementById('orbital-indicator');
  if (!container) return;
  
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" onclick="setOrbital(${index})">
      <img src="${item.poster}" alt="${item.title}">
    </div>
  `).join('');

  if (indicator) {
    const progress = ((currentOrbitalIndex + 1) / orbitalContent.length) * 100;
    indicator.style.setProperty('--progress', `${progress}%`);
  }
}

function getOrbitalClass(index) {
  const diff = index - currentOrbitalIndex;
  const len = orbitalContent.length;
  if (diff === 0) return 'active';
  
  let normalDiff = diff;
  if (diff < -len / 2) normalDiff += len;
  if (diff > len / 2) normalDiff -= len;

  if (normalDiff === -1) return 'prev-1';
  if (normalDiff === 1) return 'next-1';
  if (normalDiff === -2) return 'prev-2';
  if (normalDiff === 2) return 'next-2';
  
  return 'hidden';
}

function setOrbital(index) {
  currentOrbitalIndex = index;
  renderOrbital();
}

function nextOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex + 1) % orbitalContent.length;
  renderOrbital();
}

function prevOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex - 1 + orbitalContent.length) % orbitalContent.length;
  renderOrbital();
}

// CONTENT MATRIX RENDER (SINGLE 10-COLUMN GRID)
function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  content.innerHTML = `
    <section class="section-matrix">
      <div class="movie-grid">
        ${filteredContent.map(item => renderCard(item)).join('')}
      </div>
    </section>
  `;
}

function renderCard(item) {
  const isCollection = item.isCollection || item.episodes;
  const badge = isCollection ? `<div class="card-badge">SERİ</div>` : '';
  
  return `
    <div class="card-wrapper" onclick="openDetails('${item.id}')">
      <div class="card">
        ${badge}
        <div class="card-rating">⭐ ${item.rating || '9.0'}</div>
        <img src="${item.poster}" alt="${item.title}">
      </div>
      <div class="card-info">
          <h3>${item.title}</h3>
          <div class="card-meta">${item.year}</div>
      </div>
    </div>
  `;
}

// SEARCH & HOME LOGIC
function handleSearch(query) {
  const q = query.toLowerCase().trim();
  if (q === '') {
    filteredContent = [...allContent];
  } else {
    filteredContent = allContent.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.searchTags.toLowerCase().includes(q)
    );
  }
  renderContent();
}

function resetFilter() {
  filteredContent = [...allContent];
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) searchInput.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DETAILS MODAL LOGIC
function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('details-modal');
  const poster = document.getElementById('details-poster');
  const title = document.getElementById('details-title');
  const year = document.getElementById('details-year');
  const rating = document.getElementById('details-rating');
  const type = document.getElementById('details-type');
  const desc = document.getElementById('details-desc');
  const grid = document.getElementById('details-grid');
  const listTitle = document.getElementById('list-title');

  poster.src = item.poster;
  title.textContent = item.title;
  year.textContent = item.year;
  rating.textContent = `⭐ ${item.rating || '9.0'}`;
  type.textContent = item.episodes ? 'Dizi' : (item.isCollection ? 'Koleksiyon' : 'Film');
  desc.textContent = item.desc;

  let subItems = [];
  if (item.episodes) {
    subItems = item.episodes;
    listTitle.textContent = 'Bölümler';
  } else if (item.isCollection) {
    subItems = item.collection;
    listTitle.textContent = 'Serideki Filmler';
  }

  if (subItems.length > 0) {
    grid.innerHTML = subItems.map(sub => `
      <div class="ep-card" onclick="event.stopPropagation(); openPlayer('${sub.file}')">
        <div class="ep-header">
            <h3>${sub.epNum ? sub.epNum + '. ' : ''}${sub.title}</h3>
            <button class="play-btn-mini">HEMEN İZLE</button>
        </div>
        <p>${sub.desc || ''}</p>
      </div>
    `).join('');
    document.querySelector('.details-list-section').style.display = 'block';
  } else {
    grid.innerHTML = '';
    document.querySelector('.details-list-section').style.display = 'none';
    desc.innerHTML += `<br><br><button class="ctrl-btn" style="width:auto; padding:0 30px; border-radius:10px; font-size:16px;" onclick="openPlayer('${item.file}')">Hemen İzle</button>`;
  }

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 500);
}

// PLAYER LOGIC
function openPlayer(file) {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (!file) return;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  iframe.src = file.includes('?') ? `${file}&autoplay=1` : `${file}?autoplay=1`;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    iframe.src = '';
  }, 600);
}

function setupEventListeners() {
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePlayer();
        closeDetails();
    }
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

document.addEventListener('DOMContentLoaded', initApp);
