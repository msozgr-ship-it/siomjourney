// SiomJourney Premium App Logic
let seriesModal, playerModal, videoPlayer, ytPlayer, customControls, playPauseBtn, iconPlay, iconPause, progressBar, progressContainer, timeDisplay, fullscreenBtn, playerContainerWrapper, searchModal, searchInput, searchResults;

function initDOMElements() {
  seriesModal = document.getElementById('series-modal');
  playerModal = document.getElementById('player-modal');
  videoPlayer = document.getElementById('video-player');
  ytPlayer = document.getElementById('yt-player');
  customControls = document.getElementById('custom-controls');
  playPauseBtn = document.getElementById('play-pause-btn');
  iconPlay = document.getElementById('icon-play');
  iconPause = document.getElementById('icon-pause');
  progressBar = document.getElementById('progress-bar');
  progressContainer = document.getElementById('progress-container');
  timeDisplay = document.getElementById('time-display');
  fullscreenBtn = document.getElementById('fullscreen-btn');
  playerContainerWrapper = document.getElementById('player-container');
  searchModal = document.getElementById('search-modal');
  searchInput = document.getElementById('search-input');
  searchResults = document.getElementById('search-results');
}

function generateCardHTML(item, type) {
  const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=400&output=webp`;
  const playType = item.isCollection ? 'collection' : type;
  
  return `
    <div class="card-wrapper" data-id="${item.id}" data-type="${playType}" style="cursor:pointer;">
      <div class="card" style="pointer-events: none;">
        <img class="poster-art" src="${proxyUrl}" alt="${item.title}" loading="lazy">
        <div class="card-glass-play"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
        <div class="card-content">
          <div class="card-meta">${item.year}</div>
          <div class="card-title">${item.title}</div>
        </div>
      </div>
    </div>
  `;
}

function renderContent() {
  const all = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  const gridHTML = all.map(item => generateCardHTML(item, item.type)).join('');
  const movieGrid = document.getElementById('movie-grid');
  if(movieGrid) movieGrid.innerHTML = gridHTML;
}

// Global Click Listener with improved detection
document.addEventListener('click', (e) => {
  const wrapper = e.target.closest('.card-wrapper');
  if (wrapper) {
    const id = wrapper.getAttribute('data-id');
    const type = wrapper.getAttribute('data-type');
    if (type === 'series' || type === 'collection') openDetailsModal(id, type);
    else openPlayerMovie(id);
    return;
  }

  const cfItem = e.target.closest('.cf-item');
  if (cfItem) {
    const index = parseInt(cfItem.id.split('-').pop());
    clickCoverflow(index);
  }
});

let cfItems = [];
let cfActiveIndex = 0;
let cfInterval = null;
let isDragging = false;
let startX = 0;
let dragDist = 0;

function initCoverFlow() {
  const allItems = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  allItems.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  cfItems = allItems.slice(0, 5);
  while(cfItems.length < 5 && cfItems.length > 0) cfItems = cfItems.concat(cfItems);
  const container = document.getElementById('coverflow-container');
  if(!container) return;
  container.innerHTML = cfItems.map((item, i) => {
    const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=600&output=webp`;
    return `
    <div class="cf-item" id="cf-item-${i}" style="cursor:pointer;">
      <img class="poster-art" src="${encodeURI(proxyUrl)}" alt="${item.title}" style="pointer-events:none;">
      <div class="play-overlay" style="pointer-events:none;">
        <div class="play-glass-btn"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
      </div>
    </div>`;
  }).join('');
  updateCoverFlow();
  startCoverflowAuto();
  container.addEventListener('mousedown', dragStart);
  container.addEventListener('touchstart', dragStart, {passive: true});
}

function dragStart(e) { isDragging = true; startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX; dragDist = 0; clearInterval(cfInterval); }
function updateCoverFlow() {
  if(cfItems.length === 0) return;
  for(let i = 0; i < cfItems.length; i++) {
    const el = document.getElementById(`cf-item-${i}`);
    if(!el) continue;
    el.className = 'cf-item';
    let offset = i - cfActiveIndex;
    if (offset < -Math.floor(cfItems.length/2)) offset += cfItems.length;
    if (offset > Math.floor(cfItems.length/2)) offset -= cfItems.length;
    if (offset === 0) el.classList.add('active');
    else if (offset === -1) el.classList.add('prev-1');
    else if (offset === 1) el.classList.add('next-1');
    else if (offset === -2) el.classList.add('prev-2');
    else if (offset === 2) el.classList.add('next-2');
    else el.classList.add('hidden');
  }
  const activeItem = cfItems[cfActiveIndex];
  const bgBlur = document.getElementById('cf-bg-blur');
  if(bgBlur) bgBlur.style.backgroundImage = `url('${activeItem.poster}')`;
  const cfTitle = document.getElementById('cf-title');
  if(cfTitle) cfTitle.innerText = activeItem.title;
  const cfMeta = document.getElementById('cf-meta');
  if(cfMeta) cfMeta.innerText = `${activeItem.year} • ${activeItem.meta}`;
}

function clickCoverflow(index) {
  if (index === cfActiveIndex) {
    const item = cfItems[index];
    const playType = item.isCollection ? 'collection' : item.type;
    if(playType === 'series' || playType === 'collection') openDetailsModal(item.id, playType); 
    else openPlayerMovie(item.id); 
  } else {
    cfActiveIndex = index; updateCoverFlow();
  }
}

function startCoverflowAuto() { if(cfInterval) clearInterval(cfInterval); cfInterval = setInterval(() => { cfActiveIndex = (cfActiveIndex + 1) % cfItems.length; updateCoverFlow(); }, 5000); }
function formatTime(seconds) { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; }

function openDetailsModal(id, type) {
  let s;
  if (type === 'series') s = DB.series.find(x => x.id === id);
  else if (type === 'collection') s = DB.movies.find(x => x.id === id);
  if(!s) return;
  const listArr = type === 'series' ? s.episodes : s.collection;
  document.getElementById('sm-poster').src = s.poster; 
  document.getElementById('sm-title').innerText = s.title; 
  document.getElementById('sm-desc').innerText = s.desc;
  document.getElementById('sm-episodes').innerHTML = listArr.map(ep => {
    return `<div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}', '${type}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-details"><div class="ep-title">${ep.title}</div><div class="ep-desc">${ep.desc}</div></div>
    </div>`; }).join('');
  seriesModal.classList.add('active');
}

function openPlayerMovie(id) { const m = DB.movies.find(x => x.id === id); if(m) initPlayer(m); }
function openPlayerEpisode(parentId, childId, type) { 
  let s, ep;
  if(type === 'series') { s = DB.series.find(x => x.id === parentId); if(s) ep = s.episodes.find(x => x.id === childId); } 
  else if (type === 'collection') { s = DB.movies.find(x => x.id === parentId); if(s) ep = s.collection.find(x => x.id === childId); }
  if(ep) initPlayer(ep); 
}

function initPlayer(c) {
  if(!playerModal) return;
  playerModal.classList.add('active');
  const soonOverlay = document.getElementById('coming-soon-overlay');
  if(!c.file) {
    if(videoPlayer) videoPlayer.style.display = 'none';
    if(ytPlayer) ytPlayer.style.display = 'none';
    if(customControls) customControls.style.display = 'none';
    if(soonOverlay) soonOverlay.style.display = 'flex';
    return;
  }
  if(soonOverlay) soonOverlay.style.display = 'none';
  if (c.isYoutube) { 
    if(videoPlayer) videoPlayer.style.display = 'none'; 
    if(ytPlayer) { ytPlayer.style.display = 'block'; ytPlayer.src = c.file; }
    if(customControls) customControls.style.display = 'none'; 
  } else { 
    if(ytPlayer) ytPlayer.style.display = 'none'; 
    if(videoPlayer) { videoPlayer.style.display = 'block'; videoPlayer.src = c.file; videoPlayer.play().catch(e => {}); }
    if(customControls) customControls.style.display = 'flex'; 
  }
}
function closePlayer() { if(playerModal) playerModal.classList.remove('active'); if(ytPlayer) ytPlayer.src = ''; if(videoPlayer) { videoPlayer.pause(); videoPlayer.src = ''; } }
function openSearch() { if(searchModal) { searchModal.classList.add('active'); searchInput.value = ''; searchResults.innerHTML = ''; setTimeout(() => searchInput.focus(), 100); } }
function closeSearch() { if(searchModal) searchModal.classList.remove('active'); }

async function updateVisitorCount() {
  try {
    const response = await fetch('https://api.countapi.xyz/hit/siomjourney.io/visits');
    const data = await response.json();
    if(data && data.value) document.getElementById('visit-count').innerText = data.value.toLocaleString();
  } catch (err) { document.getElementById('visit-count').innerText = "1"; }
}

document.addEventListener('DOMContentLoaded', () => {
  initDOMElements(); renderContent(); initCoverFlow(); updateVisitorCount();
  if(searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length < 2) return;
      const results = [];
      DB.series.forEach(s => { if(s.title.toLowerCase().includes(query)) results.push({item: s, type: 'series'}); });
      DB.movies.forEach(m => { if(m.title.toLowerCase().includes(query)) results.push({item: m, type: 'movie'}); });
      searchResults.innerHTML = results.map(r => generateCardHTML(r.item, r.type)).join('');
    });
  }
  if(seriesModal) seriesModal.addEventListener('click', (e) => { if (e.target === seriesModal) closeSeriesModal(); });
  if(playerModal) playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closePlayer(); });
  if(searchModal) searchModal.addEventListener('click', (e) => { if (e.target === searchModal) closeSearch(); });
  if(videoPlayer) {
    videoPlayer.addEventListener('timeupdate', () => {
      const percent = (videoPlayer.currentTime / (videoPlayer.duration || 1)) * 100;
      if(progressBar) progressBar.style.width = percent + '%';
      if(timeDisplay) timeDisplay.innerText = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration || 0)}`;
    });
  }
  if(progressContainer) progressContainer.addEventListener('click', (e) => { const rect = progressContainer.getBoundingClientRect(); const pos = (e.clientX - rect.left) / rect.width; videoPlayer.currentTime = pos * videoPlayer.duration; });
});
