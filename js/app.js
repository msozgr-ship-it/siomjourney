/* =========================================
   UI OLUŞTURMA & YÜKLEME
   ========================================= */

function generateCardHTML(item, type) {
  // onclick is different for series vs movies
  let onClickAction = type === 'series' ? `openSeriesModal('${item.id}')` : `openPlayerMovie('${item.id}')`;
  
  return `
  <div class="card-wrapper" onmouseenter="updateHero('${item.id}', '${type}')">
    <div class="card" onclick="${onClickAction}">
      <div class="poster-art" style="background-image: url('${item.poster}')"></div>
      <div class="card-content">
        <div class="card-meta ${type==='movie'?'movie-badge':''}">${item.year} • ${item.meta}</div>
        <div class="card-title">${item.title}</div>
      </div>
    </div>
  </div>`;
}

function renderContent() {
  const seriesHTML = DB.series.map(s => generateCardHTML(s, 'series')).join('');
  const moviesHTML = DB.movies.map(m => generateCardHTML(m, 'movie')).join('');
  
  document.getElementById('series-grid').innerHTML = seriesHTML;
  document.getElementById('movies-grid').innerHTML = moviesHTML;
}

// Initial Render
renderContent();

/* =========================================
   HERO (VİTRİN) HOVER MANTIĞI
   ========================================= */
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroMatch = document.getElementById('hero-match');
const heroYear = document.getElementById('hero-year');
const heroMeta = document.getElementById('hero-meta');
const heroType = document.getElementById('hero-type');
const heroVideo = document.getElementById('hero-video');
const heroYt = document.getElementById('hero-yt');
const heroPlayBtn = document.getElementById('hero-play-btn');

let currentHeroId = null;
let heroTimeout = null;

function updateHero(id, type) {
  if (currentHeroId === id) return;
  currentHeroId = id;
  
  const item = type === 'series' ? DB.series.find(x => x.id === id) : DB.movies.find(x => x.id === id);
  if(!item) return;

  // Clear pending timeouts
  if(heroTimeout) clearTimeout(heroTimeout);

  // Gecikmeli yükleme (mouse yanlışlıkla geçtiyse hemen değişmesin)
  heroTimeout = setTimeout(() => {
    heroTitle.innerText = item.title;
    heroDesc.innerText = item.desc;
    heroMatch.innerText = item.match + ' Eşleşme';
    heroYear.innerText = item.year;
    heroMeta.innerText = item.meta;
    heroType.innerText = type === 'series' ? 'Orijinal Dizi' : 'Orijinal Film';
    
    // Play Action
    heroPlayBtn.onclick = () => {
      if(type === 'series') openSeriesModal(item.id);
      else openPlayerMovie(item.id);
    };

    // Video/Trailer geçişi
    if(item.isYoutube && item.trailer.includes('youtube')) {
      heroVideo.style.display = 'none';
      heroVideo.pause();
      heroYt.style.display = 'block';
      heroYt.src = item.trailer; // autoplay iframe
    } else {
      heroYt.style.display = 'none';
      heroYt.src = '';
      heroVideo.style.display = 'block';
      heroVideo.src = item.trailer;
      heroVideo.play().catch(e=>console.log("Autoplay engellendi"));
    }
  }, 400); // 400ms hover gecikmesi
}

// Sayfa ilk açıldığında ilk diziyi hero yap
if(DB.series.length > 0) updateHero(DB.series[0].id, 'series');

/* =========================================
   SERIES MODAL (DİZİ BÖLÜMLERİ)
   ========================================= */
const seriesModal = document.getElementById('series-modal');

function openSeriesModal(id) {
  const s = DB.series.find(x => x.id === id);
  if(!s) return;
  
  document.getElementById('sm-poster').src = s.poster;
  document.getElementById('sm-title').innerText = s.title;
  document.getElementById('sm-desc').innerText = s.desc;
  
  const epList = document.getElementById('sm-episodes');
  epList.innerHTML = s.episodes.map(ep => `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-thumb">
        <video src="${ep.file}#t=2" preload="metadata"></video>
        <div class="play-icon" style="opacity:1; transform:translate(-50%,-50%) scale(0.6);"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      </div>
      <div class="ep-details">
        <div class="ep-title">${ep.epNum}. ${ep.title}</div>
        <div class="ep-desc">${ep.desc}</div>
      </div>
    </div>
  `).join('');
  
  seriesModal.classList.add('active');
}

function closeSeriesModal() {
  seriesModal.classList.remove('active');
}

// Modal dışına tıklayınca kapat
seriesModal.addEventListener('click', (e) => {
  if (e.target === seriesModal) closeSeriesModal();
});

/* =========================================
   PLAYER MANTIĞI
   ========================================= */
const playerModal = document.getElementById('player-modal');
const videoPlayer = document.getElementById('video-player');
const ytPlayer = document.getElementById('yt-player');
const subText = document.getElementById('sub-text');
const controlsUI = document.getElementById('player-controls-ui');
const dlBtn = document.getElementById('dl-btn');

let activeSubs = [];
let subTimer = null;
let currentIsYt = false;

function openPlayerMovie(id) {
  const m = DB.movies.find(x => x.id === id);
  if(m) initPlayer(m);
}

function openPlayerEpisode(seriesId, epId) {
  const s = DB.series.find(x => x.id === seriesId);
  const ep = s.episodes.find(x => x.id === epId);
  if(ep) initPlayer(ep);
}

function initPlayer(c) {
  // Arka plandaki Hero videosunu durdur ki sesleri çakışmasın
  heroVideo.pause();
  heroYt.src = '';

  currentIsYt = c.isYoutube;
  activeSubs = c.subs || [];
  
  playerModal.classList.add('active');
  
  if (currentIsYt) {
    videoPlayer.style.display = 'none';
    ytPlayer.style.display = 'block';
    ytPlayer.src = c.file;
    controlsUI.style.display = 'none';
  } else {
    ytPlayer.style.display = 'none';
    videoPlayer.style.display = 'block';
    videoPlayer.src = c.file;
    controlsUI.style.display = 'flex';
    dlBtn.href = c.file;
    dlBtn.download = c.title + '.mp4';
    videoPlayer.play();
    
    if(subTimer) clearInterval(subTimer);
    subTimer = setInterval(() => {
      const t = videoPlayer.currentTime;
      const s = activeSubs.find(x => t >= x.from && t < x.to);
      if(s) { subText.textContent = s.text; subText.style.display = 'block'; }
      else { subText.style.display = 'none'; }
    }, 100);
  }
}

function closePlayer() {
  playerModal.classList.remove('active');
  subText.style.display = 'none';
  if(subTimer) clearInterval(subTimer);
  
  if (currentIsYt) {
    ytPlayer.src = '';
  } else {
    videoPlayer.pause();
    videoPlayer.src = '';
  }
  
  // Modal kapanınca hero'yu tekrar oynat
  if(currentHeroId) updateHero(currentHeroId, DB.series.find(x=>x.id===currentHeroId)?'series':'movie');
}

function togglePlay() {
  if (currentIsYt) return;
  const btn = document.getElementById('play-pause-btn');
  if (videoPlayer.paused) {
    videoPlayer.play();
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Duraklat';
  } else {
    videoPlayer.pause();
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Oynat';
  }
}

playerModal.addEventListener('click', (e) => {
  if (e.target === playerModal) closePlayer();
});

/* =========================================
   SCROLL VE NAVBAR
   ========================================= */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});
