// Versiyon 3.3 - Kompakt Satürn Halkası
let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentRotation = 0;

function initApp() {
  try {
    if (typeof DB === 'undefined') return;
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 18); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupSearch();
    updateOrbitalTransforms();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closePlayer(); closeDetails(); }
      if (e.key === 'ArrowRight') nextOrbital();
      if (e.key === 'ArrowLeft') prevOrbital();
    });
  } catch (err) {
    console.error("Sistem hatası:", err);
  }
}

function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container) return;
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item" id="orb-${index}" onclick="handleOrbitalClick(${index}, '${item.id}')">
      <div class="neon-rim"></div>
      <img src="${item.poster}" alt="">
    </div>
  `).join('');
}

function updateOrbitalTransforms() {
  const items = document.querySelectorAll('.cf-item');
  const count = items.length;
  const angleStep = 360 / count;
  
  // KOMPAKT YÖRÜNGE PARAMETRELERİ
  const radiusX = 450; 
  const radiusZ = 200; 

  items.forEach((item, i) => {
    const angle = (i * angleStep) + currentRotation;
    const rad = (angle * Math.PI) / 180;
    const x = Math.sin(rad) * radiusX;
    const z = Math.cos(rad) * radiusZ;
    
    item.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${angle}deg) rotateX(-65deg)`;
    
    const normalizedAngle = ((angle % 360) + 360) % 360;
    if (normalizedAngle < 15 || normalizedAngle > 345) {
      item.classList.add('active');
      item.style.opacity = "1";
      item.style.filter = "brightness(1.2) drop-shadow(0 0 20px rgba(255,15,35,0.5))";
    } else {
      item.classList.remove('active');
      const isBack = normalizedAngle > 70 && normalizedAngle < 290;
      item.style.opacity = isBack ? "0.08" : "0.5";
      item.style.filter = isBack ? "blur(3px)" : "none";
    }
  });
}

function handleOrbitalClick(index, id) {
  const count = orbitalContent.length;
  const angleStep = 360 / count;
  const targetRotation = -(index * angleStep);
  if (Math.abs(currentRotation - targetRotation) < 1) {
    const item = allContent.find(i => i.id === id);
    if (item.episodes || item.isCollection) openDetails(id);
    else openPlayer(item.file);
  } else {
    currentRotation = targetRotation;
    updateOrbitalTransforms();
  }
}

function nextOrbital() { currentRotation -= (360 / orbitalContent.length); updateOrbitalTransforms(); }
function prevOrbital() { currentRotation += (360 / orbitalContent.length); updateOrbitalTransforms(); }

function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;
  content.innerHTML = `<div class="movie-grid">${filteredContent.map(item => `
    <div class="card-wrapper" onclick="handleItemClick('${item.id}')">
      <div class="card">
        ${(item.isCollection || item.episodes) ? '<div class="card-badge">SERİ</div>' : ''}
        <img src="${item.poster}" alt="">
      </div>
    </div>`).join('')}</div>`;
}

function handleItemClick(id) {
  const item = allContent.find(i => i.id === id);
  if (item.episodes || item.isCollection) openDetails(id);
  else openPlayer(item.file);
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    filteredContent = allContent.filter(item => (item.title && item.title.toLowerCase().includes(q)) || (item.searchTags && item.searchTags.toLowerCase().includes(q)));
    renderContent();
  });
}

function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;
  const modal = document.getElementById('details-modal');
  const grid = document.getElementById('details-grid');
  document.getElementById('details-title').textContent = item.title;
  let subItems = item.episodes || item.collection || [];
  grid.innerHTML = subItems.map(sub => `
    <div class="card-wrapper" onclick="event.stopPropagation(); openPlayer('${sub.file}')">
      <div class="card"><img src="${sub.poster || item.poster}" alt=""></div>
      <div style="font-size:10px; margin-top:5px; font-weight:700;">${sub.title}</div>
    </div>
  `).join('');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (modal) { modal.classList.remove('active'); setTimeout(() => modal.style.display = 'none', 500); }
}

function openPlayer(file) {
  if (!file) return;
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  let finalUrl = file;
  if (file.includes('pixeldrain.com/u/')) finalUrl = file.replace('pixeldrain.com/u/', 'pixeldrain.com/u/') + '?embed';
  modal.style.display = 'flex';
  modal.classList.add('active');
  iframe.src = finalUrl;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (modal) { modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 500); }
}

document.addEventListener('DOMContentLoaded', initApp);
