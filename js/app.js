// Versiyon 2.4 - Seri & Görsellik Düzeltmesi
let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentOrbitalIndex = 0;

function initApp() {
  try {
    if (typeof DB === 'undefined') return;
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 10); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupSearch();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closePlayer(); closeDetails(); }
      if (e.key === 'ArrowRight') nextOrbital();
      if (e.key === 'ArrowLeft') prevOrbital();
    });
  } catch (err) {
    console.error("Başlatma Hatası:", err);
  }
}

// 3D ORBITAL
function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container) return;
  
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" onclick="handleItemClick('${item.id}', ${index}, true)">
      <img src="${item.poster}" alt="">
    </div>
  `).join('');

  const indicator = document.getElementById('orbital-indicator');
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

// MATRİS RENDER
function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  content.innerHTML = `
    <div class="movie-grid">
      ${filteredContent.map(item => `
        <div class="card-wrapper" onclick="handleItemClick('${item.id}', -1, false)">
          <div class="card">
            ${(item.isCollection || item.episodes) ? '<div class="card-badge">SERİ</div>' : ''}
            <img src="${item.poster}" alt="">
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function handleItemClick(id, index, isOrbital) {
  if (isOrbital && index !== currentOrbitalIndex) {
    setOrbital(index);
    return;
  }
  const item = allContent.find(i => i.id === id);
  if (!item) return;
  if (item.episodes || item.isCollection) openDetails(id);
  else openPlayer(item.file);
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    filteredContent = allContent.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.searchTags && item.searchTags.toLowerCase().includes(q))
    );
    renderContent();
  });
}

// SERİ PANELİ (Görsel Poster Izgarası)
function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('details-modal');
  const grid = document.getElementById('details-grid');
  
  document.getElementById('details-poster').style.display = 'none'; // Yan afişi gizle, ızgaraya odaklan
  document.getElementById('details-title').textContent = item.title;

  let subItems = item.episodes || item.collection || [];
  
  // Seriyi de görsel bir ızgara yapıyoruz (Sadece Afişler)
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
  grid.style.gap = "20px";
  
  grid.innerHTML = subItems.map(sub => `
    <div class="card-wrapper" onclick="event.stopPropagation(); openPlayer('${sub.file}')">
      <div class="card">
        <img src="${sub.poster || item.poster}" alt="">
      </div>
      <div style="font-size:12px; margin-top:5px; text-align:center; font-weight:700;">${sub.title}</div>
    </div>
  `).join('');

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 500);
  }
}

function openPlayer(file) {
  if (!file) return;
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  
  modal.style.display = 'flex';
  modal.style.zIndex = "50000"; // En üstte olduğundan emin ol
  modal.classList.add('active');
  iframe.src = file.includes('?') ? `${file}&autoplay=1` : `${file}?autoplay=1`;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 500);
  }
}

function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', initApp);
