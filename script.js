const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const bgMusic = document.getElementById('bg-music');

const bucket = document.getElementById('bucket');

const starsLeftSpan = document.getElementById('stars-count');

const hintText = document.getElementById('hint-text');

const messageModal = document.getElementById('message-modal');

const messageText = document.getElementById('message-text');

const closeMessageBtn = document.getElementById('close-message');

const constellationModal = document.getElementById('constellation-modal');

const constellationCanvas =
    document.getElementById('constellation-canvas');

const constellationCtx =
    constellationCanvas.getContext('2d');

const replayBtn =
    document.getElementById('replay-button');


/* =========================================
   DEVICE
========================================= */

const isMobile =
    /Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);


/* =========================================
   RESPONSIVE SIZES
========================================= */

let bucketWidth;
let starSize;

function setupResponsiveSizes() {

    const w = window.innerWidth;

    if (isMobile) {
        bucketWidth = w * 0.22;
        starSize = w * 0.045;
    } else {
        bucketWidth = w * 0.11;
        starSize = w * 0.02;
    }

    bucket.style.width = `${bucketWidth}px`;
    bucket.style.height = 'auto';
}

setupResponsiveSizes();


/* =========================================
   CANVAS
========================================= */

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupResponsiveSizes();
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);


/* =========================================
   TIME COUNTER
========================================= */

const messageDate = new Date(2026, 4, 24, 17, 20);

function getTimePassed() {

    const now = new Date();

    const diff = now - messageDate;

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;

    return `${days} days, ${hours} hours, ${mins} minutes`;
}


/* =========================================
   MEMORIES
========================================= */

memories.forEach(memory => {
    memory.message = memory.message.replace(
        /\[TIME_PASSED\]/g,
        getTimePassed()
    );
});


/* =========================================
   GAME STATE
========================================= */

let collectedStars = [];
let totalStars = memories.length;
let currentFallingStar = null;
let gameComplete = false;
let starActive = false;


/* =========================================
   MOON POSITION
========================================= */

let bucketX = window.innerWidth / 2;
let bucketY = window.innerHeight * 0.82;

function resetMoonPosition() {
    bucketX = window.innerWidth / 2;
    bucketY = window.innerHeight * 0.82;
    updateBucketPosition();
}

function updateBucketPosition() {
    bucket.style.left = `${bucketX}px`;
    bucket.style.top = `${bucketY}px`;
}

resetMoonPosition();


/* =========================================
   CONTROLS
========================================= */

document.addEventListener('mousemove', (e) => {
    if (isMobile) return;
    if (!messageModal.classList.contains('hidden')) return;

    bucketX = e.clientX;
    bucketY = e.clientY;
    updateBucketPosition();
});

document.addEventListener('touchmove', (e) => {
    if (!isMobile) return;
    if (!messageModal.classList.contains('hidden')) return;

    const touch = e.touches[0];
    bucketX = touch.clientX;
    bucketY = touch.clientY;
    updateBucketPosition();
}, { passive: true });


/* =========================================
   STAR CLASS
========================================= */

class FallingStar {

    constructor(memoryData) {
        this.memoryData = memoryData;
        this.reset();
    }

    reset() {

        this.x = Math.random() * canvas.width;
        this.y = Math.random() * (canvas.height * 0.33);

        const exitLeft = Math.random() < 0.5;
        const targetX = exitLeft ? -250 : canvas.width + 250;
        const targetY = canvas.height * 0.75;

        const dx = targetX - this.x;
        const dy = targetY - this.y;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 2 + Math.random() * 2;

        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.opacity = 0;
        this.fadeIn = true;
        this.size = starSize;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update() {

        this.pulse += 0.05;

        if (this.fadeIn) {
            this.opacity += 0.015;
            if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeIn = false;
            }
            return;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (
            this.x < -300 ||
            this.x > canvas.width + 300 ||
            this.y > canvas.height * 0.76
        ) {
            this.reset();
        }

        if (this.checkCollision()) {
            this.catchStar();
        }
    }

    checkCollision() {
        const rect = bucket.getBoundingClientRect();

        return (
            this.x > rect.left &&
            this.x < rect.right &&
            this.y > rect.top &&
            this.y < rect.bottom
        );
    }

    catchStar() {

        starActive = false;

        collectedStars.push(this.memoryData);

        starsLeftSpan.textContent =
            totalStars - collectedStars.length;

        if (collectedStars.length === 1) {
            hintText.classList.add('hidden');
        }

        showMessage(this.memoryData);
    }

    draw(ctx) {

        const pulse = Math.sin(this.pulse) * 0.3 + 0.7;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);

        const glow = ctx.createRadialGradient(
            0, 0, 0, 0, 0, this.size * 2
        );

        glow.addColorStop(0, 'rgba(255,255,220,0.9)');
        glow.addColorStop(1, 'rgba(255,255,220,0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();

        this.drawStarShape(
            ctx,
            0,
            0,
            this.size * pulse,
            this.size * 0.45,
            5
        );

        ctx.restore();
    }

    drawStarShape(ctx, cx, cy, outerR, innerR, points) {

        ctx.fillStyle = 'rgba(255,255,240,0.95)';
        ctx.beginPath();

        for (let i = 0; i < points * 2; i++) {

            const radius = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / points - Math.PI / 2;

            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
    }
}


/* =========================================
   MESSAGE SYSTEM
========================================= */

function showMessage(memoryData) {

    messageText.innerHTML = `
        <h3 style="color:#ffd700;margin-bottom:12px;">
            ${memoryData.title}
        </h3>
        ${memoryData.message.replace(/\n/g, '<br>')}
    `;

    messageModal.classList.remove('hidden');
}

function closeCurrentMessage() {

    messageModal.classList.add('hidden');

    resetMoonPosition();

    if (collectedStars.length >= totalStars) {
        gameComplete = true;
        showConstellation();
    } else {
        currentFallingStar =
            new FallingStar(memories[collectedStars.length]);
        starActive = true;
    }
}

closeMessageBtn.addEventListener('click', closeCurrentMessage);


/* =========================================
   CONSTELLATION (FIXED HEART + POPUP)
========================================= */

let clickableStars = [];
const starPopup = document.createElement('div');
starPopup.style.position = 'fixed';
starPopup.style.padding = '8px 12px';
starPopup.style.background = 'rgba(0,0,0,0.75)';
starPopup.style.color = '#fff';
starPopup.style.borderRadius = '10px';
starPopup.style.fontSize = '13px';
starPopup.style.pointerEvents = 'none';
starPopup.style.zIndex = 9999;
starPopup.style.display = 'none';
document.body.appendChild(starPopup);

function showConstellation() {
    constellationModal.classList.remove('hidden');
    drawConstellation();
}

/* TRUE HEART SHAPE (6 STARS ONLY) */
function getHeartPoints(size) {
    return [
        { x: 0.5, y: 0.82 },
        { x: 0.25, y: 0.55 },
        { x: 0.20, y: 0.30 },
        { x: 0.35, y: 0.18 },
        { x: 0.65, y: 0.18 },
        { x: 0.80, y: 0.30 }
    ];
}

function drawConstellation() {

    const size = Math.min(window.innerWidth * 0.8, 420);

    constellationCanvas.width = size;
    constellationCanvas.height = size;

    constellationCtx.clearRect(0, 0, size, size);

    clickableStars = [];

    const points = [
        { x: 0.5, y: 0.88, title: "Start of Us ❤️" },
        { x: 0.78, y: 0.62, title: "First Memory" },
        { x: 0.72, y: 0.28, title: "Your Laugh" },
        { x: 0.5, y: 0.18, title: "Our Peak 💫" },
        { x: 0.28, y: 0.28, title: "Late Night Talks" },
        { x: 0.22, y: 0.62, title: "First Smile" }
    ];

    const p = points.map(pt => ({
        x: pt.x * size,
        y: pt.y * size,
        title: pt.title
    }));

    // -----------------------------
    // DRAW SMOOTH HEART PATH (BEZIER)
    // -----------------------------
    constellationCtx.strokeStyle = 'rgba(255,255,255,0.22)';
    constellationCtx.lineWidth = 2;
    constellationCtx.beginPath();

    // start at first point
    constellationCtx.moveTo(p[0].x, p[0].y);

    for (let i = 0; i < p.length; i++) {

        const current = p[i];
        const next = p[(i + 1) % p.length];

        // control point = midpoint (smooth curve effect)
        const cx = (current.x + next.x) / 2;
        const cy = (current.y + next.y) / 2;

        constellationCtx.quadraticCurveTo(
            current.x,
            current.y,
            cx,
            cy
        );
    }

    constellationCtx.closePath();
    constellationCtx.stroke();

    // -----------------------------
    // DRAW STARS + HIT AREAS
    // -----------------------------
    p.forEach(pt => {

        const glow = constellationCtx.createRadialGradient(
            pt.x, pt.y, 0,
            pt.x, pt.y, 24
        );

        glow.addColorStop(0, 'rgba(255,255,210,0.95)');
        glow.addColorStop(1, 'rgba(255,255,210,0)');

        constellationCtx.fillStyle = glow;
        constellationCtx.beginPath();
        constellationCtx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
        constellationCtx.fill();

        constellationCtx.fillStyle = '#fff7cc';
        constellationCtx.beginPath();
        constellationCtx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        constellationCtx.fill();

        clickableStars.push({
            x: pt.x,
            y: pt.y,
            r: 24,
            title: pt.title
        });
    });
}

/* CLICK POPUP */
constellationCanvas.addEventListener('click', (e) => {

    const rect = constellationCanvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    clickableStars.forEach(star => {

        const dx = x - star.x;
        const dy = y - star.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < star.r) {

            starPopup.textContent = star.title;
            starPopup.style.left = `${e.clientX}px`;
            starPopup.style.top = `${e.clientY}px`;
            starPopup.style.display = 'block';

            clearTimeout(window._t);
            window._t = setTimeout(() => {
                starPopup.style.display = 'none';
            }, 2000);
        }
    });
});


/* =========================================
   REPLAY
========================================= */

replayBtn.addEventListener('click', () => {

    constellationModal.classList.add('hidden');

    collectedStars = [];
    gameComplete = false;

    starsLeftSpan.textContent = totalStars;

    resetMoonPosition();

    currentFallingStar = new FallingStar(memories[0]);
    starActive = true;
});


/* =========================================
   MUSIC
========================================= */

document.addEventListener('click', () => {
    if (!bgMusic) return;
    bgMusic.volume = 0.45;
    bgMusic.play().catch(() => {});
}, { once: true });


/* =========================================
   START GAME
========================================= */

currentFallingStar = new FallingStar(memories[0]);
starActive = true;


/* =========================================
   GAME LOOP
========================================= */

function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentFallingStar && starActive && !gameComplete) {
        currentFallingStar.update();
        currentFallingStar.draw(ctx);
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();