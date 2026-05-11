function generateCardHTML(item, type) {
  let onClickAction;
  if (type === 'series') onClickAction = `openDetailsModal('${item.id}', 'series')`;
  else if (item.isCollection) onClickAction = `openDetailsModal('${item.id}', 'collection')`;
  else onClickAction = `openPlayerMovie('${item.id}')`;
  
  const shapeClass = type === 'series' ? 'card-wide' : 'card-tall';
  
  return `
  <div class="card-wrapper ${shapeClass}">
    <div class="card" onclick="${onClickAction}">
      <div class="poster-art" style="background-image: url('${item.poster}')"></div>
      <div class="card-glass-play"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="card-content">
        <div class="card-meta">${item.year} • ${item.meta}</div>
        <div class="card-title">${item.title}</div>
      </div>
    </div>
  </div>`;
}

function renderContent() {
  const seriesHTML = DB.series.map(s => generateCardHTML(s, 'series')).join('');
  const moviesHTML = DB.movies.map(m => generateCardHTML(m, 'movie')).join('');
  document.getElementById('series-row').innerHTML = seriesHTML;
  document.getElementById('movies-row').innerHTML = moviesHTML;
}
renderContent();

let cfItems = [];
let cfActiveIndex = 0;
let cfInterval = null;

function initCoverFlow() {
  const allItems = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  allItems.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  
  cfItems = [...allItems];
  while(cfItems.length < 5 && cfItems.length > 0) cfItems = cfItems.concat(allItems);
  
  const container = document.getElementById('coverflow-container');
  container.innerHTML = cfItems.map((item, i) => `
    <div class="cf-item" id="cf-item-${i}" style="background-image: url('${item.poster}')" onclick="clickCoverflow(${i})">
      <div class="play-overlay">
        <svg viewBox="0 0 24 24" fill="white" width="60" height="60"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
  `).join('');
  
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
  document.getElementById('cf-title').innerText = activeItem.title;
  document.getElementById('cf-meta').innerText = `${activeItem.year} • ${activeItem.meta}`;
}

function clickCoverflow(index) {
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
  
  document.getElementById('sm-episodes').innerHTML = listArr.map(ep => `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}', '${type}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-thumb"><video src="${ep.file}#t=2" preload="metadata"></video></div>
      <div class="ep-details">
        <div class="ep-title">${ep.title}</div>
        <div class="ep-desc">${ep.desc}</div>
      </div>
    </div>
  `).join('');
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
  if(ep && ep.file) initPlayer(ep); 
  else alert('Bu video henüz eklenmedi!');
}

function initPlayer(c) {
  heroVideo.pause(); heroYt.src = ''; playerModal.classList.add('active');
  if (c.isYoutube) { 
    videoPlayer.style.display = 'none'; ytPlayer.style.display = 'block'; ytPlayer.src = c.file; 
    customControls.style.display = 'none'; 
    
    // Google Drive Crop Hack (Only apply if it's a Drive link)
    if(c.file.includes('drive.google.com')) {
      ytPlayer.style.top = '-60px';
      ytPlayer.style.height = 'calc(100% + 60px)';
    } else {
      ytPlayer.style.top = '0';
      ytPlayer.style.height = '100%';
    }
  } else { 
    ytPlayer.style.display = 'none'; videoPlayer.style.display = 'block'; videoPlayer.src = c.file; 
    customControls.style.display = 'flex'; videoPlayer.play(); 
  }
}
function closePlayer() {
  playerModal.classList.remove('active'); ytPlayer.src = ''; videoPlayer.pause(); videoPlayer.src = '';
  if(currentHeroId) updateHero(currentHeroId, DB.series.find(x=>x.id===currentHeroId)?'series':'movie');
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
