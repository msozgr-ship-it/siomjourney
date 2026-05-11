const seriesModal = document.getElementById('series-modal');
const playerModal = document.getElementById('player-modal');
const videoPlayer = document.getElementById('video-player');
const ytPlayer = document.getElementById('yt-player');
const subText = document.getElementById('sub-text');
const customControls = document.getElementById('custom-controls');
const playPauseBtn = document.getElementById('play-pause-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const timeDisplay = document.getElementById('time-display');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const playerContainerWrapper = document.getElementById('player-container');

function generateCardHTML(item, type) {
  let onClickAction;
  if (type === 'series') onClickAction = `openDetailsModal('${item.id}', 'series')`;
  else if (item.isCollection) onClickAction = `openDetailsModal('${item.id}', 'collection')`;
  else onClickAction = `openPlayerMovie('${item.id}')`;
  
  const shapeClass = type === 'series' ? 'card-wide' : 'card-tall';
  const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=500&output=webp`;
  
  return `
  <div class="card-wrapper ${shapeClass}">
    <div class="card" onclick="${onClickAction}">
      <img class="poster-art" src="${encodeURI(proxyUrl)}" alt="${item.title}" loading="lazy">
      <div class="card-glass-play"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="card-content">
        <div class="card-meta">${item.year} • ${item.meta}</div>
        <div class="card-title">${item.title}</div>
      </div>
    </div>
  </div>`;
}

function renderContent() {
  const all = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  const gridHTML = all.map(item => generateCardHTML(item, item.type)).join('');
  document.getElementById('movie-grid').innerHTML = gridHTML;
}
renderContent();

let cfItems = [];
let cfActiveIndex = 0;
let cfInterval = null;
let isDragging = false;
let startX = 0;
let dragDist = 0;

function initCoverFlow() {
  const allItems = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  allItems.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  
  // Sadece Popülerler (İlk 5) Vitrinde Dönecek
  cfItems = allItems.slice(0, 5);
  while(cfItems.length < 5 && cfItems.length > 0) cfItems = cfItems.concat(cfItems);
  
  const container = document.getElementById('coverflow-container');
  container.innerHTML = cfItems.map((item, i) => {
    const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=600&output=webp`;
    return `
    <div class="cf-item" id="cf-item-${i}" onclick="clickCoverflow(${i})">
      <img class="poster-art" src="${encodeURI(proxyUrl)}" alt="${item.title}">
      <div class="play-overlay">
        <div class="play-glass-btn">
          <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    </div>`;
  }).join('');
  
  updateCoverFlow();
  startCoverflowAuto();

  // Drag / Swipe Events
  container.addEventListener('mousedown', dragStart);
  container.addEventListener('touchstart', dragStart, {passive: true});
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, {passive: false});
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);
}

function dragStart(e) {
  isDragging = true;
  startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  dragDist = 0;
  clearInterval(cfInterval);
}

function dragMove(e) {
  if (!isDragging) return;
  const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  dragDist = x - startX;
  const container = document.getElementById('coverflow-container');
  container.style.transform = `translateX(${dragDist * 0.2}px)`;
  if (Math.abs(dragDist) > 10) e.preventDefault();
}

function dragEnd() {
  if (!isDragging) return;
  isDragging = false;
  document.getElementById('coverflow-container').style.transform = `translateX(0)`;
  const threshold = 60;
  if (dragDist > threshold) {
    cfActiveIndex = (cfActiveIndex - 1 + cfItems.length) % cfItems.length;
    if (dragDist > 160) cfActiveIndex = (cfActiveIndex - 1 + cfItems.length) % cfItems.length; // Momentum
  } else if (dragDist < -threshold) {
    cfActiveIndex = (cfActiveIndex + 1) % cfItems.length;
    if (dragDist < -160) cfActiveIndex = (cfActiveIndex + 1) % cfItems.length; // Momentum
  }
  updateCoverFlow();
  startCoverflowAuto();
}

function updateCoverFlow() {
  if(cfItems.length === 0) return;
  const len = cfItems.length;
  for(let i = 0; i < len; i++) {
    const el = document.getElementById(`cf-item-${i}`);
    el.className = 'cf-item';
    
    let offset = i - cfActiveIndex;
    if (offset < -Math.floor(len/2)) offset += len;
    if (offset > Math.floor(len/2)) offset -= len;
    
    if (offset === 0) el.classList.add('active');
    else if (offset === -1) el.classList.add('prev-1');
    else if (offset === 1) el.classList.add('next-1');
    else if (offset === -2) el.classList.add('prev-2');
    else if (offset === 2) el.classList.add('next-2');
    else el.classList.add('hidden');
  }
  
  const activeItem = cfItems[cfActiveIndex];
  document.getElementById('cf-bg-blur').style.backgroundImage = `url('${activeItem.poster}')`;
  document.getElementById('cf-title').innerText = activeItem.title;
  document.getElementById('cf-meta').innerText = `${activeItem.year} • ${activeItem.meta}`;
}

function clickCoverflow(index) {
  if (Math.abs(dragDist) > 15) return; 
  if (index === cfActiveIndex) {
    const item = cfItems[index];
    const playType = item.isCollection ? 'collection' : item.type;
    if(playType === 'series' || playType === 'collection') openDetailsModal(item.id, playType); 
    else openPlayerMovie(item.id); 
  } else {
    cfActiveIndex = index;
    updateCoverFlow();
    startCoverflowAuto();
  }
}

function startCoverflowAuto() {
  if(cfInterval) clearInterval(cfInterval);
  cfInterval = setInterval(() => {
    cfActiveIndex = (cfActiveIndex + 1) % cfItems.length;
    updateCoverFlow();
  }, 5000);
}

initCoverFlow();

// Global variables moved to top

function formatTime(seconds) {
  const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
}

videoPlayer.addEventListener('timeupdate', () => {
  const percent = (videoPlayer.currentTime / (videoPlayer.duration || 1)) * 100;
  progressBar.style.width = percent + '%';
  timeDisplay.innerText = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration || 0)}`;
});

playPauseBtn.addEventListener('click', () => { if(videoPlayer.paused) videoPlayer.play(); else videoPlayer.pause(); });
videoPlayer.addEventListener('play', () => { iconPlay.style.display = 'none'; iconPause.style.display = 'block'; });
videoPlayer.addEventListener('pause', () => { iconPlay.style.display = 'block'; iconPause.style.display = 'none'; });

progressContainer.addEventListener('click', (e) => {
  const rect = progressContainer.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  videoPlayer.currentTime = pos * videoPlayer.duration;
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    if (playerContainerWrapper.requestFullscreen) playerContainerWrapper.requestFullscreen();
    else if (playerContainerWrapper.webkitRequestFullscreen) playerContainerWrapper.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
});

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
    const thumbUrl = ep.poster ? (ep.poster.startsWith('assets') ? ep.poster : `https://wsrv.nl/?url=${encodeURIComponent(ep.poster)}&w=300&output=webp`) : s.poster;
    return `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}', '${type}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-thumb"><img src="${encodeURI(thumbUrl)}" alt="${ep.title}" loading="lazy"></div>
      <div class="ep-details">
        <div class="ep-title">${ep.title}</div>
        <div class="ep-desc">${ep.desc}</div>
      </div>
    </div>
  `; }).join('');
  seriesModal.classList.add('active');
}

function closeSeriesModal() { seriesModal.classList.remove('active'); }
function openPlayerMovie(id) { const m = DB.movies.find(x => x.id === id); if(m) initPlayer(m); }

function openPlayerEpisode(parentId, childId, type) { 
  let s, ep;
  if(type === 'series') {
     s = DB.series.find(x => x.id === parentId); 
     if(s) ep = s.episodes.find(x => x.id === childId); 
  } else if (type === 'collection') {
     s = DB.movies.find(x => x.id === parentId); 
     if(s) ep = s.collection.find(x => x.id === childId); 
  }
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
    if(ytPlayer) {
      ytPlayer.style.display = 'block'; 
      ytPlayer.src = c.file; 
      if(c.file.includes('drive.google.com')) {
        ytPlayer.style.top = '-60px';
        ytPlayer.style.height = 'calc(100% + 60px)';
      } else {
        ytPlayer.style.top = '0';
        ytPlayer.style.height = '100%';
      }
    }
    if(customControls) customControls.style.display = 'none'; 
  } else { 
    if(ytPlayer) ytPlayer.style.display = 'none'; 
    if(videoPlayer) {
      videoPlayer.style.display = 'block'; 
      videoPlayer.src = c.file; 
      videoPlayer.play().catch(err => console.log("Autoplay blocked or error:", err));
    }
    if(customControls) customControls.style.display = 'flex'; 
  }
}
function closePlayer() {
  playerModal.classList.remove('active'); ytPlayer.src = ''; videoPlayer.pause(); videoPlayer.src = '';
  // if(currentHeroId) updateHero(currentHeroId, DB.series.find(x=>x.id===currentHeroId)?'series':'movie');
}

/* SEARCH LOGIC */
const searchModal = document.getElementById('search-modal');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

function openSearch() {
  searchModal.classList.add('active');
  searchInput.value = ''; searchResults.innerHTML = '';
  setTimeout(() => searchInput.focus(), 100);
}
function closeSearch() { searchModal.classList.remove('active'); }

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (query.length < 2) { searchResults.innerHTML = ''; return; }
  
  const results = [];
  DB.series.forEach(s => { 
    const tags = s.searchTags ? s.searchTags.toLowerCase() : '';
    if(s.title.toLowerCase().includes(query) || tags.includes(query)) results.push({item: s, type: 'series'}); 
  });
  DB.movies.forEach(m => { 
    const tags = m.searchTags ? m.searchTags.toLowerCase() : '';
    if(m.title.toLowerCase().includes(query) || tags.includes(query)) results.push({item: m, type: 'movie'}); 
  });
  
  if (results.length === 0) {
    searchResults.innerHTML = '<div style="width:100%; text-align:center; color:#888; font-size:20px; padding: 40px;">Sonuç bulunamadı...</div>';
  } else {
    searchResults.innerHTML = results.map(r => generateCardHTML(r.item, r.type)).join('');
  }
});

seriesModal.addEventListener('click', (e) => { if (e.target === seriesModal) closeSeriesModal(); });
playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closePlayer(); });
searchModal.addEventListener('click', (e) => { if (e.target === searchModal) closeSearch(); });
window.addEventListener('scroll', () => { const nav = document.getElementById('navbar'); if (window.scrollY > 50) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); });

// VISITOR COUNTER LOGIC
async function updateVisitorCount() {
  try {
    const response = await fetch('https://api.countapi.xyz/hit/siomjourney.io/visits');
    const data = await response.json();
    if(data && data.value) {
      document.getElementById('visit-count').innerText = data.value.toLocaleString();
    }
  } catch (err) {
    console.log("Counter error:", err);
    document.getElementById('visit-count').innerText = "1,248+"; // Fallback static number if API fails
  }
}
updateVisitorCount();
