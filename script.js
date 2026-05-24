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
const constellationCanvas = document.getElementById('constellation-canvas');
const constellationCtx = constellationCanvas.getContext('2d');

const replayBtn = document.getElementById('replay-button');

/* DEVICE */
const isMobile = /Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);

/* RESPONSIVE */
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
}
setupResponsiveSizes();

/* CANVAS */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupResponsiveSizes();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* TIME */
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

memories.forEach(m => {
    m.message = m.message.replace(/\[TIME_PASSED\]/g, getTimePassed());
});

/* STATE */
let collectedStars = [];
let totalStars = memories.length;
let currentFallingStar = null;
let gameComplete = false;
let starActive = false;

/* MOVEMENT */
let bucketX = window.innerWidth / 2;
let bucketY = window.innerHeight * 0.82;

function updateBucket() {
    bucket.style.left = `${bucketX}px`;
    bucket.style.top = `${bucketY}px`;
}

function resetBucket() {
    bucketX = window.innerWidth / 2;
    bucketY = window.innerHeight * 0.82;
    updateBucket();
}
resetBucket();

/* CONTROLS */
document.addEventListener('mousemove', (e) => {
    if (isMobile) return;
    if (!messageModal.classList.contains('hidden')) return;

    bucketX = e.clientX;
    bucketY = e.clientY;
    updateBucket();
});

document.addEventListener('touchmove', (e) => {
    if (!isMobile) return;
    if (!messageModal.classList.contains('hidden')) return;

    const t = e.touches[0];
    bucketX = t.clientX;
    bucketY = t.clientY;
    updateBucket();
}, { passive: true });

/* STAR CLASS */
class FallingStar {
    constructor(memoryData) {
        this.memoryData = memoryData;
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * (canvas.height * 0.33);

        const targetX = Math.random() < 0.5 ? -200 : canvas.width + 200;
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
            this.opacity += 0.02;
            if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeIn = false;
            }
            return;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.checkCollision()) this.catchStar();

        if (
            this.x < -300 ||
            this.x > canvas.width + 300 ||
            this.y > canvas.height * 0.8
        ) {
            this.reset();
        }
    }

    checkCollision() {
        const r = bucket.getBoundingClientRect();
        return (
            this.x > r.left &&
            this.x < r.right &&
            this.y > r.top &&
            this.y < r.bottom
        );
    }

    catchStar() {
        starActive = false;
        collectedStars.push(this.memoryData);

        starsLeftSpan.textContent = totalStars - collectedStars.length;

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

        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        glow.addColorStop(0, 'rgba(255,255,220,0.9)');
        glow.addColorStop(1, 'rgba(255,255,220,0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();

        this.drawStar(ctx, this.size * pulse);

        ctx.restore();
    }

    drawStar(ctx, r) {
        ctx.fillStyle = 'rgba(255,255,240,0.95)';
        ctx.beginPath();

        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const radius = i % 2 === 0 ? r : r * 0.45;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
    }
}

/* MESSAGE */
function showMessage(memoryData) {
    messageText.innerHTML = `
        <h3 style="color:#ffd700;margin-bottom:12px;">
            ${memoryData.title}
        </h3>
        ${memoryData.message.replace(/\n/g, '<br>')}
    `;

    messageModal.classList.remove('hidden');
}

closeMessageBtn.addEventListener('click', () => {
    messageModal.classList.add('hidden');

    resetBucket();

    if (collectedStars.length >= totalStars) {
        gameComplete = true;
        showConstellation();
    } else {
        currentFallingStar = new FallingStar(memories[collectedStars.length]);
        starActive = true;
    }
});

/* =========================
   CONSTELLATION "1" DRAW ANIMATION
========================= */

let clickableStars = [];
const starPopup = document.createElement('div');

starPopup.style.position = 'fixed';
starPopup.style.background = 'rgba(0,0,0,0.75)';
starPopup.style.color = '#fff';
starPopup.style.padding = '6px 10px';
starPopup.style.borderRadius = '8px';
starPopup.style.fontSize = '12px';
starPopup.style.pointerEvents = 'none';
starPopup.style.display = 'none';
starPopup.style.zIndex = 9999;

document.body.appendChild(starPopup);

/* "1" SHAPE */
function getOneShape(size, titles) {
    const cx = size * 0.5;

    const points = [
        { x: cx, y: size * 0.12 },
        { x: cx, y: size * 0.25 },
        { x: cx, y: size * 0.38 },
        { x: cx, y: size * 0.52 },
        { x: cx, y: size * 0.68 },
        { x: cx, y: size * 0.86 }
    ];

    return points.map((p, i) => ({
        x: p.x,
        y: p.y,
        title: titles[i]
    }));
}

/* ANIMATION STATE */
let drawProgress = 0;
let animFrame = null;

function animateOnePath(points) {

    let i = 0;
    const total = points.length;

    const drawStep = () => {

        constellationCtx.clearRect(0, 0, constellationCanvas.width, constellationCanvas.height);

        clickableStars = [];

        /* glowing trail */
        constellationCtx.strokeStyle = 'rgba(255,255,255,0.25)';
        constellationCtx.lineWidth = 3;
        constellationCtx.beginPath();

        constellationCtx.moveTo(points[0].x, points[0].y);

        const steps = Math.floor(total * drawProgress);

        for (let j = 1; j <= steps; j++) {
            constellationCtx.lineTo(points[j].x, points[j].y);
        }

        constellationCtx.stroke();

        /* draw stars gradually */
        for (let k = 0; k <= steps; k++) {

            const p = points[k];

            const glow = constellationCtx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, 26
            );

            glow.addColorStop(0, 'rgba(255,255,210,0.95)');
            glow.addColorStop(1, 'rgba(255,255,210,0)');

            constellationCtx.fillStyle = glow;
            constellationCtx.beginPath();
            constellationCtx.arc(p.x, p.y, 18, 0, Math.PI * 2);
            constellationCtx.fill();

            constellationCtx.fillStyle = '#fff7cc';
            constellationCtx.beginPath();
            constellationCtx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            constellationCtx.fill();

            clickableStars.push({
                x: p.x,
                y: p.y,
                r: 25,
                title: p.title
            });
        }

        drawProgress += 0.02;

        if (drawProgress <= 1) {
            animFrame = requestAnimationFrame(drawStep);
        }
    };

    drawStep();
}

/* MAIN CONSTELLATION */
function drawConstellation() {

    const size = Math.min(window.innerWidth * 0.8, 420);

    constellationCanvas.width = size;
    constellationCanvas.height = size;

    constellationCtx.clearRect(0, 0, size, size);

    drawProgress = 0;
    clickableStars = [];

    const points = getOneShape(size, [
        "One Year Together ❤️",
        "First Spark",
        "First Smile",
        "Late Nights",
        "Growing Strong",
        "Forever Us"
    ]);

    animateOnePath(points);
}

/* CLICK POPUP */
constellationCanvas.addEventListener('click', (e) => {

    const rect = constellationCanvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    clickableStars.forEach(s => {

        const d = Math.hypot(x - s.x, y - s.y);

        if (d < s.r) {
            starPopup.textContent = s.title;
            starPopup.style.left = e.clientX + 'px';
            starPopup.style.top = e.clientY + 'px';
            starPopup.style.display = 'block';

            clearTimeout(window.__t);
            window.__t = setTimeout(() => {
                starPopup.style.display = 'none';
            }, 1500);
        }
    });
});

/* REPLAY FIX */
replayBtn.addEventListener('click', () => {

    constellationModal.classList.add('hidden');

    collectedStars = [];
    gameComplete = false;
    starsLeftSpan.textContent = totalStars;

    resetBucket();

    currentFallingStar = new FallingStar(memories[0]);
    starActive = true;
});

/* MUSIC */
document.addEventListener('click', () => {
    if (!bgMusic) return;
    bgMusic.volume = 0.45;
    bgMusic.play().catch(() => {});
}, { once: true });

/* START */
currentFallingStar = new FallingStar(memories[0]);
starActive = true;

/* LOOP */
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentFallingStar && starActive && !gameComplete) {
        currentFallingStar.update();
        currentFallingStar.draw(ctx);
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();