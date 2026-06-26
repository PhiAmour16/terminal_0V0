// 1. 初始化 Supabase (URL 和 Anon Key 可以在 Supabase 後台的 Project Settings -> API 找到)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
const SUPABASE_URL = 'https://ikrhmxramfjtlvgcavfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcmhteHJhbWZqdGx2Z2NhdmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0ODAwMTUsImV4cCI6MjA5ODA1NjAxNX0.tCPR3iOPChiUFfdg4fYHj5HVkKuZtfPUhbOQaN7mAYQ';
const supabase= createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. Loading 進度條機制與打字效果觸發
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const percentText = document.getElementById('load-percent');
    let percent = 0;
    
    const loadingInterval = setInterval(() => {
        percent += Math.floor(Math.random() * 15) + 3;
        if (percent >= 100) {
            percent = 100;
            clearInterval(loadingInterval);
            loadingBar.style.width = '100%';
            percentText.innerText = '100%';
            percentText.setAttribute('data-text', '100%');
            
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.visibility = 'hidden';
                startTypingEffect(); // 啟動首頁打字
            }, 500);
        } else {
            loadingBar.style.width = percent + '%';
            let displayPercent = percent < 10 ? '0' + percent + '%' : percent + '%';
            percentText.innerText = displayPercent;
            percentText.setAttribute('data-text', displayPercent);
        }
    }, 100);

    // 初始化首頁粒子系統
    initParticles();
});

// 終端機大標題打字邏輯
const titleText = "TERMINAL_0V0"; 
const subtitleText = "歡迎登入記憶終端。系統已上線。";

function startTypingEffect() {
    const titleEl = document.getElementById('type-title');
    const subtitleEl = document.getElementById('type-subtitle');
    const hintEl = document.getElementById('home-hint');
    const cursorEl = document.getElementById('cursor');
    let i = 0; let j = 0;

    function typeTitle() {
        if (i < titleText.length) {
            titleEl.innerHTML += titleText.charAt(i);
            i++;
            setTimeout(typeTitle, 120);
        } else {
            cursorEl.style.height = '1.2rem'; 
            subtitleEl.appendChild(cursorEl); 
            setTimeout(typeSubtitle, 400); 
        }
    }

    function typeSubtitle() {
        if (j < subtitleText.length) {
            subtitleEl.innerHTML += subtitleText.charAt(j);
            j++;
            setTimeout(typeSubtitle, 60); 
        } else {
            hintEl.style.opacity = "1";
        }
    }
    typeTitle(); 
}

// ==========================================
// 2. SPA CRT 頻道切換控制中心
// ==========================================
function switchPage(targetId) {
    const currentActive = document.querySelector('.page.active');
    if (currentActive && currentActive.id === targetId) return;

    const flashOverlay = document.getElementById('transition-flash');
    flashOverlay.classList.remove('flash-active');
    void flashOverlay.offsetWidth; // 觸發重繪
    flashOverlay.classList.add('flash-active');

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    setTimeout(() => {
        document.getElementById(targetId).classList.add('active');
        const targetBtn = document.querySelector(`button[onclick="switchPage('${targetId}')"]`);
        if(targetBtn) targetBtn.classList.add('active');
        
        // 效能優化：如果不是去首頁，就隱藏 Canvas 節省效能
        const canvas = document.getElementById('particle-canvas');
        if(targetId === 'home') {
            canvas.style.display = 'block';
        } else {
            canvas.style.display = 'none';
            document.getElementById(targetId).scrollTop = 0; // 捲軸歸零
        }
    }, 150); 
}

// ==========================================
// 3. 波蘭歐什廷 (Olsztyn) 當地時鐘
// ==========================================
function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Europe/Warsaw', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-GB', options);
}
setInterval(updateClock, 1000); updateClock();

// ==========================================
// 4. ARTICLES：文字檔案讀取 (Fetch)
// ==========================================
function loadArticle(filePath) {
    const contentBox = document.getElementById('article-content');
    const statusBox = document.getElementById('reader-status');
    contentBox.style.opacity = '0.3'; statusBox.style.display = 'block';

    fetch(filePath)
        .then(res => { if(!res.ok) throw new Error('NOT_FOUND'); return res.text(); })
        .then(text => {
            setTimeout(() => {
                contentBox.innerHTML = text;
                contentBox.style.opacity = '1'; statusBox.style.display = 'none';

                // 🔮 核心修正 3：讓手機版的下拉選單數值同步指向當前載入的檔案路徑
                const mobileSelect = document.getElementById('mobile-article-selector');
                if(mobileSelect) mobileSelect.value = filePath;
            }, 500);
        })
        .catch(err => {
            setTimeout(() => {
                contentBox.innerHTML = `<span style="color:#ff003c;">[ERROR] 檔案損毀或不存在。</span>`;
                contentBox.style.opacity = '1'; statusBox.style.display = 'none';
            }, 500);
        });
}

// ==========================================
// 5. ALBUMS：不規則拼貼影像載入
// ==========================================
async function loadAlbums() {
    const gallery = document.getElementById('album-gallery');
    gallery.innerHTML = '<div style="color: #a4d4c8; animation: blinker 1s infinite;">&gt; DOWNLOADING_IMAGE_DATA...</div>';
    
    try {
        // 這裡會使用到最上方宣告的 supabase 物件
        const { data, error } = await supabase
            .from('albums')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        let html = '';
        data.forEach(item => {
            let imgSize = item.size ? item.size : 'normal';
            html += `
                <div class="album-item size-${imgSize}" onclick="openModal('${item.url}', '${item.title} // ${item.date}')">
                    <img src="${item.url}" loading="lazy" alt="${item.title}">
                    <div class="img-meta">REC: ${item.date} | ${item.title}</div>
                </div>`;
        });
        
        setTimeout(() => { gallery.innerHTML = html; }, 800);

    } catch (err) {
        console.error(err);
        gallery.innerHTML = `<div style="color: #ff003c;">&gt; ERROR: 影像資料庫連線失敗。</div>`;
    }
}

// 圖片全域放大檢視器控制
function openModal(imgSrc, metaText) {
    const modalImg = document.getElementById('modal-img');
    modalImg.src = ''; // 斬斷舊圖片以重啟聚焦動畫
    modalImg.src = imgSrc;
    document.getElementById('modal-meta').innerText = '> OBSERVING: ' + metaText;
    document.getElementById('image-modal').style.display = 'flex';
}
function closeModal() {
    document.getElementById('image-modal').style.display = 'none';
}

// ==========================================
// 6. HOME：Canvas 互動神經網路粒子系統
// ==========================================
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let mouse = { x: null, y: null, radius: 150 };

    canvas.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
    canvas.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; init(); });

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x; this.y = y;
            this.directionX = directionX; this.directionY = directionY;
            this.size = size; this.color = color;
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color; ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

            let dx = mouse.x - this.x; let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < mouse.radius + this.size){
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
                if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
                if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
            }
            this.x += this.directionX; this.y += this.directionY; this.draw();
        }
    }

    function init() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 12000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 1) - 0.5;
            let directionY = (Math.random() * 1) - 0.5;
            particlesArray.push(new Particle(x, y, directionX, directionY, size, '#4a7569'));
        }
    }

    function connect() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                               ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                if (distance < (canvas.width / 10) * (canvas.height / 10)) {
                    let opacityValue = 1 - (distance / 15000);
                    ctx.strokeStyle = 'rgba(74, 117, 105,' + opacityValue + ')';
                    ctx.lineWidth = 1; ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke();
                }
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate); ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particlesArray.length; i++) particlesArray[i].update();
        connect();
    }
    init(); animate();
}