let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentRotation = 0;
let autoRotateSpeed = 0.003; // İnanılmaz yavaşlatıldı (0.05'ten 0.003'e düştü - 1 fragman bitene kadar ancak 1 kart döner)
let isDragging = false;
let startX = 0;
let startRotation = 0;
let pauseAutoRotate = false;
let pauseTimeout = null;

function initApp() {
  try {
    if (typeof DB === 'undefined') return;
    allContent = [...DB.movies, ...DB.series];
    
    // DÖNME DOLAPTA ARTIK SADECE TEKLİ FİMLERİN AFİŞLERİ OLACAK (Seriler ve koleksiyonlar elendi!)
    orbitalContent = allContent.filter(item => !(item.isCollection || item.episodes)); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupSearch();
    setupDragEvents();
    animate();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closePlayer(); closeDetails(); }
    });

    window.addEventListener('resize', updateOrbitalTransforms);
  } catch (err) {
    console.error("Sistem hatası:", err);
  }
}

function animate() {
  if (!isDragging && !pauseAutoRotate) {
    currentRotation -= autoRotateSpeed;
    updateOrbitalTransforms();
  }
  requestAnimationFrame(animate);
}

function setupDragEvents() {
  const dragArea = document.getElementById('hero-drag-area');
  if (!dragArea) return;

  const onStart = (e) => {
    isDragging = true;
    dragArea.classList.add('dragging'); // Sürükleme esnasında CSS geçişlerini kapatarak 0ms gecikme sağlarız!
    startX = e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
    startRotation = currentRotation;
    clearTimeout(pauseTimeout);
    pauseAutoRotate = true; // Sürüklerken durdur
  };

  const onMove = (e) => {
    if (!isDragging) return;
    
    // Mobilde yatay yörünge sürüklemesi yaparken tüm ekranın sağa sola kaymasını önlüyoruz!
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const x = e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
    const diff = (x - startX) * 0.1;
    currentRotation = startRotation + diff;
    updateOrbitalTransforms();
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    dragArea.classList.remove('dragging'); // Sürükleme bittiğinde yumuşak animasyonları geri açarız!
    // Bıraktıktan 3 saniye sonra dönmeye devam etsin (kullanıcı etkileşimi bittiyse)
    startPauseTimer(3000);
  };

  dragArea.addEventListener('mousedown', onStart);
  dragArea.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  dragArea.addEventListener('touchstart', onStart, { passive: true });
  dragArea.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd, { passive: true });
}

function updateOrbitalTransforms() {
  const items = document.querySelectorAll('.cf-item');
  if (!items.length) return;
  const count = items.length;
  const angleStep = 360 / count;
  const isMobile = window.innerWidth < 768;

  // 1. ADIM: Merkez odak noktasını belirle (Tek aktif kart garantisi)
  let closestIndex = -1;
  let minAbsAngle = 999999;
  
  const calculatedAngles = Array.from(items).map((item, i) => {
    let relAngle = (i * angleStep) + currentRotation;
    relAngle = ((relAngle + 180) % 360 + 360) % 360 - 180;
    const absAngle = Math.abs(relAngle);
    if (absAngle < minAbsAngle) {
      minAbsAngle = absAngle;
      closestIndex = i;
    }
    return { item, relAngle, absAngle };
  });

  // MOBİL VE MASAÜSTÜ İÇİN ORTAK DİKEY DÖNME DOLAP MOTORU
  const isMobile = window.innerWidth < 768;
  const radiusY_vertical = isMobile ? 380 : 650; // Mobilde 380px, masaüstünde 650px
  const radiusZ = isMobile ? 280 : 500;
  const leftOffset = isMobile ? -180 : -680; // Sola yaslama
  const curveX = isMobile ? 25 : 60;

  calculatedAngles.forEach((data, i) => {
    const { item, relAngle } = data;
    const rad = (relAngle * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const sinVal = Math.sin(rad);
    
    const x = leftOffset + (Math.abs(sinVal) * curveX); 
    const y = sinVal * radiusY_vertical; 
    const z = cosVal * radiusZ; 
    
    const normCos = (cosVal + 1) / 2;
    const isCenter = (i === closestIndex);
    
    let scale;
    if (isCenter) {
      scale = 1.15;
    } else {
      scale = 0.35 + 0.35 * Math.pow(normCos, 2);
    }
    
    const rotY = 12; 
    const rotX = -sinVal * 15; 
    
    item.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) scale(${scale.toFixed(3)}) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
    
    if (isCenter) {
      item.style.opacity = "1";
      item.style.visibility = "visible";
      item.style.filter = "brightness(1.15) contrast(1.1) saturate(1.12)";
      item.classList.add('active');
      item.style.zIndex = "25000";
      item.style.pointerEvents = "auto";
    } else {
      if (cosVal < 0.65) {
        item.style.opacity = "0";
        item.style.visibility = "hidden";
        item.style.pointerEvents = "none";
      } else {
        item.style.visibility = "visible";
        const cardOpacity = Math.max(0.15, (normCos - 0.6) * 2.5);
        item.style.opacity = cardOpacity.toFixed(2);
        item.style.filter = `brightness(${(0.45 + 0.50 * normCos).toFixed(2)}) saturate(0.8)`;
      }
      item.classList.remove('active');
      
      const zIndexBase = Math.round(19000 + cosVal * 1000);
      item.style.zIndex = zIndexBase;
      item.style.pointerEvents = cosVal >= 0.85 ? "auto" : "none";
    }
  });

  // Arka plan videosunu güncelle
  if (closestIndex !== -1 && orbitalContent[closestIndex]) {
    updateBackgroundVideo(orbitalContent[closestIndex]);
  }
}


// BREATHTAKING AMBIENT VIDEO BACKDROP GENERATOR
let bgVideoTimeout = null;
let currentBgVideoId = null;

function updateBackgroundVideo(item) {
  if (!item) return;
  if (currentBgVideoId === item.id) return;
  currentBgVideoId = item.id;

  const bgContainer = document.getElementById('hero-video-bg');
  if (!bgContainer) return;

  // Mevcut arka planı yumuşakça soldur
  bgContainer.classList.remove('active');

  clearTimeout(bgVideoTimeout);
  bgVideoTimeout = setTimeout(() => {
    let videoHtml = '';
    // YALNIZCA FRAGMANI OLAN FİLMLER ARKA PLANDA OYNATILSIN
    const sourceUrl = item.trailer;
    
    if (!sourceUrl) {
      bgContainer.innerHTML = ''; // Fragman yoksa arka planı temizle
      return;
    }

    // Play tuşu, logo animasyonları ve reklam overlay'lerini tamamen atlamak için
    // fragmanlar 15. saniyeden başlar (Play butonu %100 atlanır)!
    const midPoint = 15; 

    if (sourceUrl) {
      if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
        let ytId = '';
        if (sourceUrl.includes('embed/')) ytId = sourceUrl.split('embed/')[1]?.split('?')[0];
        else ytId = sourceUrl.split('v=')[1]?.split('&')[0] || sourceUrl.split('youtu.be/')[1]?.split('?')[0];
        
        let startParam = midPoint > 0 ? `&start=${midPoint}` : '';
        // youtube-nocookie.com + maksimum reklam/overlay engelleme parametreleri
        videoHtml = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&vq=hd1080&cc_load_policy=0&hl=tr${startParam}" allow="autoplay; encrypted-media" style="width: 100%; height: 100vh; border: none; pointer-events: none;"></iframe>`;
      } else if (sourceUrl.includes('archive.org')) {
        // ARCHIVE.ORG İÇİN KESİN ÇÖZÜM: iframe yerine doğrudan .mp4 dosyasına çeviriyoruz!
        // Böylece tarayıcılar play butonu çıkarmaz, %100 otomatik (autoplay) sessiz oynatır.
        let identifier = '';
        if (sourceUrl.includes('archive.org/embed/')) identifier = sourceUrl.split('archive.org/embed/')[1]?.split('?')[0];
        else identifier = sourceUrl.split('archive.org/details/')[1]?.split('?')[0];
        
        let directMp4 = `https://archive.org/download/${identifier}/${identifier}.mp4`;
        let fragParam = midPoint > 0 ? `#t=${midPoint}` : '';
        videoHtml = `<video src="${directMp4}${fragParam}" autoplay muted loop playsinline style="width:100vw; height:56.25vw; min-height:100vh; min-width:177.77vh; object-fit:cover; pointer-events: none;"></video>`;
      } else if (sourceUrl.endsWith('.mp4') || sourceUrl.includes('.mp4?')) {
        let fragParam = midPoint > 0 ? `#t=${midPoint}` : '';
        videoHtml = `<video src="${sourceUrl}${fragParam}" autoplay muted loop playsinline style="width:100vw; height:56.25vw; min-height:100vh; min-width:177.77vh; object-fit:cover; pointer-events: none;"></video>`;
      } else if (sourceUrl.includes('dailymotion.com') || sourceUrl.includes('dai.ly')) {
        let dmId = '';
        if (sourceUrl.includes('video/')) dmId = sourceUrl.split('video/')[1]?.split('?')[0]?.split('&')[0];
        else if (sourceUrl.includes('dai.ly/')) dmId = sourceUrl.split('dai.ly/')[1]?.split('?')[0];
        
        if (dmId) {
          let startParam = midPoint > 0 ? `&start=${midPoint}` : '';
          // Dailymotion reklam + logo + başlangıç ekranı tamamen engellendi
          videoHtml = `<iframe src="https://www.dailymotion.com/embed/video/${dmId}?autoplay=1&mute=1&muted=1&controls=0&ui-logo=0&ui-start-screen-info=0&ui-highlight=000000&quality=1080&queue-enable=false&sharing-enable=false&watchlater-enable=false${startParam}" allow="autoplay" style="width: 100%; height: 100vh; border: none; pointer-events: none;"></iframe>`;
        }
      }
    }

    if (videoHtml) {
      bgContainer.innerHTML = videoHtml;
      // Yeni arka planı yumuşakça aydınlat (gecikme ile play butonu tamamen gizlenir)
      setTimeout(() => {
        bgContainer.classList.add('active');
      }, 150);
    } else {
      bgContainer.innerHTML = '';
    }
  }, 1200); // 1.2 saniye gecikme (drag/sürükleme esnasında kasmayı %100 önler!)
}

function handleOrbitalClick(index, id) {
  if (isDragging) return;

  const count = orbitalContent.length;
  const angleStep = 360 / count;
  const targetRotation = -(index * angleStep);
  
  const currentNorm = ((currentRotation % 360) + 360) % 360;
  const targetNorm = ((targetRotation % 360) + 360) % 360;
  const diff = Math.abs(currentNorm - targetNorm);

  // EĞER KART ZATEN MERKEZDEYSE (Filmi Aç)
  if (diff < 5 || diff > 355) {
    const item = allContent.find(i => i.id === id);
    if (!item) return;
    if (item.episodes || item.isCollection) openDetails(id);
    else openPlayer(item.file, item.title, item.poster);
  } 
  // EĞER KART MERKEZDE DEĞİLSE (Merkeze Getir ve 5sn durdur)
  else {
    currentRotation = targetRotation;
    updateOrbitalTransforms();
    startPauseTimer(5000);
  }
}

function startPauseTimer(ms) {
  clearTimeout(pauseTimeout);
  pauseAutoRotate = true;
  pauseTimeout = setTimeout(() => {
    pauseAutoRotate = false;
  }, ms);
}

function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container) return;
  container.innerHTML = orbitalContent.map((item, index) => {
    const isColl = item.isCollection || item.episodes;
    // Dosya linki olmayan, boş olan veya ID/coming/soon içerenler henüz yüklenmemiş (Yakında) kabul edilir
    const isUpcoming = !item.file || item.file.includes('ID') || item.file.includes('coming') || item.file.includes('COMING');
    
    return `
      <div class="cf-item ${isColl ? 'collection-stack' : ''}" id="orb-${index}" onclick="handleOrbitalClick(${index}, '${item.id}')">
        ${isColl ? '<div class="collection-badge">SERİ</div>' : ''}
        ${isUpcoming && !isColl ? '<div class="collection-badge coming-soon-badge" style="background: rgba(255, 15, 35, 0.85); border-color: rgba(255, 15, 35, 0.3);">YAKINDA</div>' : ''}
        <div class="neon-rim"></div>
        <img src="${item.poster}" alt="" onerror="this.src='https://via.placeholder.com/200x300?text=Afiş+Yok'">
      </div>
    `;
  }).join('');
}

function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  // Seri ve tekli filmleri filtrele (Sadece dönme dolapta görünmesi gereken tekli filmler elendi!)
  const collections = filteredContent.filter(item => item.isCollection || item.episodes);
  const singles = filteredContent.filter(item => !(item.isCollection || item.episodes || item.showOnlyInOrbital));

  // Kart HTML oluşturucu yardımcı fonksiyon
  const makeCardHtml = (item) => {
    const isColl = item.isCollection || item.episodes;
    // Dosya linki olmayan, boş olan veya ID/coming/soon içerenler henüz yüklenmemiş (Yakında) kabul edilir
    const isUpcoming = !item.file || item.file.includes('ID') || item.file.includes('coming') || item.file.includes('COMING');
    
    return `
      <div class="card-wrapper ${isColl ? 'collection-stack' : ''}" onclick="handleItemClick('${item.id}')">
        <div class="card">
          ${isColl ? '<div class="collection-badge">SERİ</div>' : ''}
          ${isUpcoming && !isColl ? '<div class="collection-badge coming-soon-badge" style="background: rgba(255, 15, 35, 0.85); border-color: rgba(255, 15, 35, 0.3);">YAKINDA</div>' : ''}
          <img src="${item.poster}" alt="" onerror="this.src='https://via.placeholder.com/200x300?text=Afiş+Yok'">
        </div>
      </div>
    `;
  };

  content.innerHTML = `
    <div class="split-matrix-container">
      <!-- SOL BLOK: SERİ FİLMLER & KOLEKSİYONLAR -->
      <div class="matrix-column">
        <h3 class="matrix-column-title">SERİ FİLMLER & KOLEKSİYONLAR</h3>
        <div class="split-grid">
          ${collections.length > 0 ? collections.map(makeCardHtml).join('') : '<div class="no-results-text">Seri film bulunamadı.</div>'}
        </div>
      </div>

      <!-- SAĞ BLOK: TEKLİ FİLMLER -->
      <div class="matrix-column">
        <h3 class="matrix-column-title">TEKLİ FİLMLER</h3>
        <div class="split-grid">
          ${singles.length > 0 ? singles.map(makeCardHtml).join('') : '<div class="no-results-text">Tekli film bulunamadı.</div>'}
        </div>
      </div>
    </div>
  `;
}

// DEEP ITEM LOCATOR (Tüm seri bölümlerini ve koleksiyon alt filmlerini de bulur!)
function findItemDeep(id) {
  // 1. Üst seviyede ara
  let found = allContent.find(i => i.id === id);
  if (found) return found;

  // 2. Koleksiyonların içinde ara
  for (const item of allContent) {
    if (item.collection) {
      const nested = item.collection.find(f => f.id === id);
      if (nested) return nested;
    }
    // 3. Serilerin bölümlerinin içinde ara
    if (item.episodes) {
      const nested = item.episodes.find(e => e.id === id);
      if (nested) return nested;
    }
  }
  return null;
}

function handleItemClick(id) {
  const item = findItemDeep(id);
  if (!item) return;

  if (item.episodes || item.isCollection) {
    openDetails(id);
  } else {
    openPlayer(item.file, item.title, item.poster, item.trailer);
  }
}

function setupSearch() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const resultsPanel = document.getElementById('search-results-panel');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    
    // Temizleme butonu kontrolü
    if (q.length > 0) {
      if (clearBtn) clearBtn.classList.add('active');
      if (resultsPanel) {
        resultsPanel.style.display = 'flex';
        setTimeout(() => resultsPanel.classList.add('active'), 10);
      }
    } else {
      if (clearBtn) clearBtn.classList.remove('active');
      if (resultsPanel) {
        resultsPanel.classList.remove('active');
        setTimeout(() => resultsPanel.style.display = 'none', 300);
      }
    }

    // Ana kütüphane grid filtreleme
    filteredContent = allContent.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.searchTags && item.searchTags.toLowerCase().includes(q))
    );
    renderContent();

    // Spotlight hızlı öneriler panelini render etme (Koleksiyon alt filmleri dahil!)
    if (q.length > 0 && resultsPanel) {
      const searchableItems = [];
      allContent.forEach(item => {
        searchableItems.push(item);
        if (item.collection) {
          item.collection.forEach(sub => {
            searchableItems.push({
              ...sub,
              searchTags: (sub.searchTags || '') + ' ' + (item.searchTags || '')
            });
          });
        }
        if (item.episodes) {
          item.episodes.forEach(sub => {
            searchableItems.push({
              ...sub,
              searchTags: (sub.searchTags || '') + ' ' + (item.searchTags || '')
            });
          });
        }
      });

      const matches = searchableItems.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) || 
        (item.searchTags && item.searchTags.toLowerCase().includes(q))
      ).slice(0, 5); // En iyi 5 eşleşmeyi al

      if (matches.length > 0) {
        resultsPanel.innerHTML = matches.map(item => {
          const isColl = item.isCollection || item.episodes;
          const isUpcoming = !item.file || item.file.includes('ID') || item.file.includes('coming') || item.file.includes('COMING');
          const ratingText = isUpcoming ? 'Yakında' : (item.rating ? `⭐ <span>${item.rating}</span>` : '⭐ 8.0');
          const typeText = isColl ? 'Seri' : 'Film';
          return `
            <div class="search-result-item" onclick="handleSuggestionClick('${item.id}')">
              <img src="${item.poster}" alt="">
              <div class="search-result-info">
                <div class="search-result-title">${item.title}</div>
                <div class="search-result-meta">${item.year || '2024'} • ${typeText} • ${ratingText}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        resultsPanel.innerHTML = `<div class="search-no-results">Aradığınız kriterlere uygun sonuç bulunamadı.</div>`;
      }
    }
  });

  // Dışarı tıklandığında paneli gizleme
  document.addEventListener('click', (e) => {
    if (resultsPanel && !e.target.closest('#search-container')) {
      resultsPanel.classList.remove('active');
      setTimeout(() => resultsPanel.style.display = 'none', 300);
    }
  });

  // Odaklanıldığında sorgu varsa paneli tekrar açma
  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0 && resultsPanel) {
      resultsPanel.style.display = 'flex';
      setTimeout(() => resultsPanel.classList.add('active'), 10);
    }
  });
}

function handleSuggestionClick(id) {
  const resultsPanel = document.getElementById('search-results-panel');
  if (resultsPanel) {
    resultsPanel.classList.remove('active');
    setTimeout(() => resultsPanel.style.display = 'none', 300);
  }
  
  const item = findItemDeep(id);
  if (!item) return;

  // Arama sonucundan gelen tıklamalarda HER ZAMAN doğrudan oynatıcıyı aç!
  if (item.episodes && item.episodes.length > 0) {
    // Seri ise: İlk bölümü doğrudan oynat!
    const firstEp = item.episodes[0];
    openPlayer(firstEp.file, firstEp.title, firstEp.poster || item.poster, firstEp.trailer || item.trailer);
  } else if (item.collection && item.collection.length > 0) {
    // Koleksiyon ise: İlk filmi doğrudan oynat!
    const firstMovie = item.collection[0];
    openPlayer(firstMovie.file, firstMovie.title, firstMovie.poster || item.poster, firstMovie.trailer || item.trailer);
  } else {
    // Tekil film veya alt film ise: Doğrudan oynat!
    openPlayer(item.file, item.title, item.poster, item.trailer);
  }
}

function clearSearchInput(event) {
  if (event) event.stopPropagation();
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const resultsPanel = document.getElementById('search-results-panel');
  
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.remove('active');
  if (resultsPanel) {
    resultsPanel.classList.remove('active');
    setTimeout(() => resultsPanel.style.display = 'none', 300);
  }
  
  resetFilter();
  if (input) input.focus();
}

function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;
  const modal = document.getElementById('details-modal');
  const grid = document.getElementById('details-grid');
  document.getElementById('details-title').textContent = item.title;
  let subItems = item.episodes || item.collection || [];
  grid.innerHTML = subItems.map(sub => {
    // Dosya linki olmayan, boş olan veya ID/coming/soon içerenler henüz yüklenmemiş (Yakında) kabul edilir
    const isUpcoming = !sub.file || sub.file.includes('ID') || sub.file.includes('coming') || sub.file.includes('COMING');
    const trailerForSub = sub.trailer || item.trailer || '';
    
    return `
      <div class="series-item" onclick="event.stopPropagation(); openPlayer('${sub.file}', '${sub.title}', '${sub.poster || item.poster}', '${trailerForSub}')">
        <div class="card">
          ${isUpcoming ? '<div class="collection-badge coming-soon-badge" style="background: rgba(255, 15, 35, 0.85); border-color: rgba(255, 15, 35, 0.3);">YAKINDA</div>' : ''}
          <img src="${sub.poster || item.poster}" alt="">
        </div>
        <h3>${sub.title}</h3>
      </div>
    `;
  }).join('');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (modal) { modal.classList.remove('active'); setTimeout(() => modal.style.display = 'none', 500); }
}

function openPlayer(file, title, poster, trailer) {
  if (!file || file.includes('ID')) {
    openComingSoon(title, poster);
    return;
  }

  // Filmi kendi sitemizdeki özel premium player.html sayfasında açıyoruz!
  // Fragman URL'si varsa da ekliyoruz ki player.html içinde geçiş butonu çıksın.
  
  // Öğeyi bulup fileSub olup olmadığını kontrol et
  let item = allContent.find(i => i.title === title);
  if (!item) {
    for (const parent of allContent) {
      if (parent.collection) {
        const nested = parent.collection.find(f => f.title === title);
        if (nested) { item = nested; break; }
      }
      if (parent.episodes) {
        const nested = parent.episodes.find(f => f.title === title);
        if (nested) { item = nested; break; }
      }
    }
  }
  const fileSub = item ? (item.fileSub || '') : '';
  
  let playerUrl = `player.html?file=${encodeURIComponent(file)}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster || '')}`;
  if (trailer) {
    playerUrl += `&trailer=${encodeURIComponent(trailer)}`;
  }
  if (fileSub) {
    playerUrl += `&filesub=${encodeURIComponent(fileSub)}`;
  }
  window.open(playerUrl, '_blank');
}

function openComingSoon(title, poster) {
  const modal = document.getElementById('coming-soon-modal');
  const csTitle = document.getElementById('cs-title');
  const csBackdrop = document.getElementById('cs-backdrop');
  const csPosterImg = document.getElementById('cs-poster-img');
  
  const csYear = document.getElementById('cs-year');
  const csMeta = document.getElementById('cs-meta');
  const csRating = document.getElementById('cs-rating');
  const csDesc = document.getElementById('cs-desc');
  const csPercentVal = document.getElementById('cs-percent-val');
  const csProgressFill = document.getElementById('cs-progress-fill');
  const csTrailerBtn = document.getElementById('cs-trailer-btn');
  
  csTitle.textContent = title || "Sinematik İçerik";
  
  if (poster) {
    csBackdrop.style.backgroundImage = `url(${poster})`;
    csPosterImg.src = poster;
    csPosterImg.style.display = 'block';
  } else {
    csBackdrop.style.backgroundImage = '';
    csPosterImg.style.display = 'none';
  }

  // Database'den filmi derin arama ile bulup bilgileri çekiyoruz
  const item = findItemDeepByTitle(title);
  if (item) {
    if (csYear) csYear.textContent = item.year || '2026';
    if (csMeta) csMeta.textContent = item.meta || '4K Ultra HD';
    if (csRating) csRating.textContent = item.rating ? `⭐ ${item.rating}` : '⭐ 8.5';
    if (csDesc && item.desc) csDesc.textContent = item.desc;
    else if (csDesc) csDesc.textContent = "Bu premium sinematik başyapıt, ultra yüksek çözünürlük, özel ses tasarımı ve pürüzsüz akış optimizasyonları ile SiomJourney kütüphanesine eklenmek üzere özenle hazırlanıyor.";
    
    // İsme göre dinamik ama sabit bir ilerleme yüzdesi oluşturuyoruz (örneğin %60-90 arası)
    let percent = 60 + Math.floor((item.title.charCodeAt(0) % 4) * 10);
    if (csPercentVal) csPercentVal.textContent = `${percent}%`;
    if (csProgressFill) csProgressFill.style.width = `${percent}%`;
    
    // İlerleme yüzdesine göre adımları aktifleştir
    const steps = document.querySelectorAll('.cs-pipeline-steps .cs-step');
    steps.forEach((step, idx) => {
      if (percent >= (idx + 1) * 22) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    // Fragman butonu aksiyonu
    if (item.trailer) {
      if (csTrailerBtn) {
        csTrailerBtn.classList.remove('disabled');
        csTrailerBtn.onclick = (e) => {
          e.stopPropagation();
          closeComingSoon();
          openPlayerTrailerOnly(item.trailer, `${item.title} - Fragman`, item.poster);
        };
      }
    } else {
      if (csTrailerBtn) {
        csTrailerBtn.classList.add('disabled');
        csTrailerBtn.onclick = null;
      }
    }
  } else {
    // Fallback varsayılan değerler
    if (csYear) csYear.textContent = '2026';
    if (csMeta) csMeta.textContent = '4K UHD';
    if (csRating) csRating.textContent = '⭐ 8.5';
    if (csDesc) csDesc.textContent = "Bu premium sinematik başyapıt, ultra yüksek çözünürlük, özel ses tasarımı ve pürüzsüz akış optimizasyonları ile SiomJourney kütüphanesine eklenmek üzere özenle hazırlanıyor.";
    if (csPercentVal) csPercentVal.textContent = '75%';
    if (csProgressFill) csProgressFill.style.width = '75%';
    if (csTrailerBtn) {
      csTrailerBtn.classList.add('disabled');
      csTrailerBtn.onclick = null;
    }
  }
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function findItemDeepByTitle(title) {
  if (!title) return null;
  const cleanTitle = title.toLowerCase().trim();
  
  // 1. Üst seviyede ara
  let found = allContent.find(i => i.title && i.title.toLowerCase().trim() === cleanTitle);
  if (found) return found;

  // 2. Koleksiyonların içinde ara
  for (const item of allContent) {
    if (item.collection) {
      const nested = item.collection.find(f => f.title && f.title.toLowerCase().trim() === cleanTitle);
      if (nested) return nested;
    }
    // 3. Serilerin bölümlerinin içinde ara
    if (item.episodes) {
      const nested = item.episodes.find(e => e.title && e.title.toLowerCase().trim() === cleanTitle);
      if (nested) return nested;
    }
  }
  return null;
}

// Sadece fragmanı açan özel oynatıcı fonksiyonu
function openPlayerTrailerOnly(trailerUrl, title, poster) {
  const modal = document.getElementById('player-modal');
  const playerTitle = document.getElementById('player-title');
  const playerBackdrop = document.getElementById('player-backdrop');
  const container = document.querySelector('.player-container');
  const togglesContainer = document.getElementById('player-source-toggles');
  
  if (playerTitle) playerTitle.textContent = title;
  if (playerBackdrop) playerBackdrop.style.backgroundImage = poster ? `url(${poster})` : '';
  if (togglesContainer) togglesContainer.style.display = 'none'; // Sadece fragman oynattığımız için butonları gizle
  
  container.innerHTML = `
    <div class="player-logo-blocker" id="logo-blocker" style="display:none;"></div>
  `;

  let finalUrl = trailerUrl;
  if (trailerUrl.includes("youtu.be")) {
    let id = trailerUrl.split("youtu.be/")[1].split("?")[0];
    let start = trailerUrl.includes("start=") ? "&start=" + trailerUrl.split("start=")[1] : "";
    finalUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&controls=1&showinfo=0&modestbranding=1&rel=0&playsinline=1${start}`;
  } else if (trailerUrl.includes("youtube.com")) {
    let id = trailerUrl.split("v=")[1]?.split("&")[0];
    finalUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&controls=1&showinfo=0&modestbranding=1&rel=0&playsinline=1`;
  }
  
  container.innerHTML += `
    <iframe id="player-frame" src="${finalUrl}" allow="autoplay; fullscreen" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" style="width:100%; height:100%; border:none; display:block;"></iframe>
  `;
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeComingSoon() {
  const modal = document.getElementById('coming-soon-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 600);
  }
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  
  // Tam ekrandan çıkış yap (aktifse)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  
  if (modal) { 
    modal.classList.remove('active'); 
    setTimeout(() => { 
      modal.style.display = 'none'; 
      const container = document.querySelector('.player-container');
      if (container) container.innerHTML = ''; // Videoyu durdur ve hafızayı temizle!
    }, 500); 
  }
}

function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
}

document.addEventListener('DOMContentLoaded', initApp);