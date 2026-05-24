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



/* =========================================
   DEVICE DETECTION
========================================= */

const isMobile =
    /Android|iPhone|iPad|iPod|Tablet/i.test(
        navigator.userAgent
    );



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

        bucketWidth = w * 0.12;

        starSize = w * 0.022;
    }

    bucket.style.width = `${bucketWidth}px`;

    bucket.style.height = 'auto';
}

setupResponsiveSizes();



/* =========================================
   TIME COUNTER
========================================= */

const messageDate = new Date(
    2025,
    4,
    24,
    17,
    20
);

function getTimePassed() {

    const now = new Date();

    const diff = now - messageDate;

    const minutes = Math.floor(
        diff / (1000 * 60)
    );

    const days = Math.floor(
        minutes / (60 * 24)
    );

    const hours = Math.floor(
        (minutes % (60 * 24)) / 60
    );

    const mins = minutes % 60;

    return `${days} days, ${hours} hours, ${mins} minutes`;
}

memories.forEach(memory => {

    memory.message = memory.message.replace(
        /\[TIME_PASSED\]/g,
        getTimePassed()
    );

});



/* =========================================
   CANVAS
========================================= */

function resizeCanvas() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;

    setupResponsiveSizes();
}

resizeCanvas();

window.addEventListener(
    'resize',
    resizeCanvas
);



/* =========================================
   GAME STATE
========================================= */

let collectedStars = [];

let totalStars = memories.length;

let currentFallingStar = null;

let isStarFalling = false;

let canSpawnStar = true;

let gameComplete = false;



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
   DESKTOP / LAPTOP
   MOON FOLLOWS CURSOR
========================================= */

document.addEventListener('mousemove', (e) => {

    if (isMobile) return;

    if (gameComplete) return;

    bucketX = e.clientX;

    bucketY = e.clientY;

    updateBucketPosition();
});



/* =========================================
   MOBILE / TABLET
   DRAG MOON
========================================= */

let dragging = false;



bucket.addEventListener('touchstart', () => {

    dragging = true;
});



document.addEventListener('touchmove', (e) => {

    if (!isMobile) return;

    if (!dragging) return;

    if (gameComplete) return;

    const touch = e.touches[0];

    bucketX = touch.clientX;

    bucketY = touch.clientY;

    updateBucketPosition();

}, { passive: true });



document.addEventListener('touchend', () => {

    dragging = false;
});



/* =========================================
   STAR CLASS
========================================= */

class FallingStar {

    constructor(memoryData) {

        this.memoryData = memoryData;

        this.reset();
    }

    reset() {

        /* SPAWN IN TOP 1/3 */

        this.x =
            Math.random() * canvas.width;

        this.y =
            Math.random() *
            (canvas.height * 0.33);



        /* RANDOM EXIT DIRECTION */

        const exitLeft =
            Math.random() < 0.5;



        const targetX = exitLeft
            ? -300
            : canvas.width + 300;



        /* EXIT AROUND 3/4 SCREEN */

        const targetY =
            canvas.height * 0.75;



        const dx = targetX - this.x;

        const dy = targetY - this.y;

        const dist =
            Math.sqrt(dx * dx + dy * dy);



        /* RANDOM SPEED */

        const speed =
            2 + Math.random() * 3;



        this.vx = (dx / dist) * speed;

        this.vy = (dy / dist) * speed;



        this.size = starSize;

        this.opacity = 0;

        this.fadeIn = true;

        this.caught = false;

        this.pulse =
            Math.random() * Math.PI * 2;
    }

    update() {

        this.pulse += 0.05;



        /* FADE IN */

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



        /* MISSED STAR */

        if (

            this.x < -350 ||

            this.x > canvas.width + 350 ||

            this.y > canvas.height * 0.76

        ) {

            this.reset();
        }



        /* COLLISION */

        if (this.checkCollision()) {

            this.catch();
        }
    }

    checkCollision() {

        const rect =
            bucket.getBoundingClientRect();

        return (

            this.x > rect.left &&
            this.x < rect.right &&
            this.y > rect.top &&
            this.y < rect.bottom

        );
    }

    catch() {

        this.caught = true;

        isStarFalling = false;



        collectedStars.push(
            this.memoryData
        );



        starsLeftSpan.textContent =
            totalStars - collectedStars.length;



        if (collectedStars.length === 1) {

            hintText.classList.add(
                'hidden'
            );
        }



        showMessage(this.memoryData);
    }

    draw(ctx) {

        const pulse =
            Math.sin(this.pulse) * 0.3 + 0.7;

        const glowPulse =
            Math.sin(this.pulse * 1.5) *
                0.2 +
            0.8;



        ctx.save();

        ctx.globalAlpha = this.opacity;

        ctx.translate(this.x, this.y);



        /* OUTER GLOW */

        const glow =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                this.size * 2
            );



        glow.addColorStop(
            0,
            `rgba(255,255,220,${
                0.8 * glowPulse
            })`
        );

        glow.addColorStop(
            0.4,
            `rgba(255,220,150,${
                0.4 * glowPulse
            })`
        );

        glow.addColorStop(
            1,
            'rgba(255,220,150,0)'
        );



        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            this.size * 2,
            0,
            Math.PI * 2
        );

        ctx.fill();



        /* STAR SHAPE */

        this.drawStarShape(
            ctx,
            0,
            0,
            this.size * pulse,
            this.size * 0.45,
            5
        );



        /* INNER CORE */

        const innerGlow =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                this.size * 0.5
            );



        innerGlow.addColorStop(
            0,
            'rgba(255,255,255,1)'
        );

        innerGlow.addColorStop(
            1,
            'rgba(255,255,255,0)'
        );



        ctx.fillStyle = innerGlow;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            this.size * 0.5,
            0,
            Math.PI * 2
        );

        ctx.fill();



        ctx.restore();
    }

    drawStarShape(
        ctx,
        cx,
        cy,
        outerR,
        innerR,
        points
    ) {

        ctx.fillStyle =
            'rgba(255,255,240,0.95)';

        ctx.beginPath();

        for (
            let i = 0;
            i < points * 2;
            i++
        ) {

            const radius =
                i % 2 === 0
                    ? outerR
                    : innerR;

            const angle =
                (i * Math.PI) / points -
                Math.PI / 2;

            const x =
                cx +
                Math.cos(angle) * radius;

            const y =
                cy +
                Math.sin(angle) * radius;

            if (i === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();

        ctx.fill();

        ctx.strokeStyle =
            'rgba(255,255,255,0.6)';

        ctx.lineWidth = 1;

        ctx.stroke();
    }
}



/* =========================================
   MESSAGE MODAL
========================================= */

function showMessage(memoryData) {

    messageText.innerHTML = `
        <h3 style="color:#ffd700;margin-bottom:12px;">
            ${memoryData.title}
        </h3>

        ${memoryData.message.replace(
            /\n/g,
            '<br>'
        )}
    `;

    messageText.scrollTop = 0;

    messageModal.classList.remove(
        'hidden'
    );
}

function hideMessage() {

    messageModal.classList.add(
        'hidden'
    );



    resetMoonPosition();



    if (
        collectedStars.length >= totalStars
    ) {

        gameComplete = true;

        setTimeout(
            showConstellation,
            1000
        );

    } else {

        currentFallingStar = null;

        isStarFalling = false;

        canSpawnStar = true;
    }
}

closeMessageBtn.addEventListener(
    'click',
    hideMessage
);



/* =========================================
   CONSTELLATION
========================================= */

function showConstellation() {

    constellationModal.classList.remove(
        'hidden'
    );

    drawConstellation();
}

function drawConstellation() {

    const size = Math.min(
        window.innerWidth * 0.8,
        420
    );

    constellationCanvas.width = size;

    constellationCanvas.height = size;



    constellationCtx.clearRect(
        0,
        0,
        size,
        size
    );



    const points = [

        { x: 0.5, y: 0.82 },

        { x: 0.2, y: 0.52 },

        { x: 0.28, y: 0.22 },

        { x: 0.5, y: 0.12 },

        { x: 0.72, y: 0.22 },

        { x: 0.8, y: 0.52 }

    ];



    constellationCtx.strokeStyle =
        'rgba(255,255,255,0.25)';

    constellationCtx.lineWidth = 2;

    constellationCtx.beginPath();



    constellationCtx.moveTo(
        points[0].x * size,
        points[0].y * size
    );



    for (let i = 1; i < points.length; i++) {

        constellationCtx.lineTo(
            points[i].x * size,
            points[i].y * size
        );
    }



    constellationCtx.closePath();

    constellationCtx.stroke();



    points.forEach(point => {

        const x = point.x * size;

        const y = point.y * size;



        const glow =
            constellationCtx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                25
            );



        glow.addColorStop(
            0,
            'rgba(255,255,255,1)'
        );

        glow.addColorStop(
            1,
            'rgba(255,255,255,0)'
        );



        constellationCtx.fillStyle = glow;

        constellationCtx.beginPath();

        constellationCtx.arc(
            x,
            y,
            25,
            0,
            Math.PI * 2
        );

        constellationCtx.fill();
    });
}



/* =========================================
   REPLAY
========================================= */

replayBtn.addEventListener('click', () => {

    constellationModal.classList.add(
        'hidden'
    );

    collectedStars = [];

    currentFallingStar = null;

    isStarFalling = false;

    canSpawnStar = true;

    gameComplete = false;

    starsLeftSpan.textContent =
        totalStars;

    resetMoonPosition();
});



/* =========================================
   MUSIC
========================================= */

function startMusic() {

    if (!bgMusic) return;

    bgMusic.volume = 0.45;

    bgMusic.play().catch(() => {});

    document.removeEventListener(
        'click',
        startMusic
    );

    document.removeEventListener(
        'touchstart',
        startMusic
    );
}

document.addEventListener(
    'click',
    startMusic
);

document.addEventListener(
    'touchstart',
    startMusic
);



/* =========================================
   GAME LOOP
========================================= */

function gameLoop() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );



    if (

        !isStarFalling &&
        canSpawnStar &&
        collectedStars.length < totalStars

    ) {

        currentFallingStar =
            new FallingStar(
                memories[collectedStars.length]
            );



        isStarFalling = true;

        canSpawnStar = false;
    }



    if (
        currentFallingStar &&
        isStarFalling
    ) {

        currentFallingStar.update();

        currentFallingStar.draw(ctx);
    }



    requestAnimationFrame(gameLoop);
}

gameLoop();