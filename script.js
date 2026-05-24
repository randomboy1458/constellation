const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

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



/* =========================
   TIME COUNTER
========================= */

const messageDate = new Date(
    2026,
    4,
    24,
    17,
    20
);



function getTimePassed() {

    const now = new Date();

    const diff = now - messageDate;

    const minutes = Math.floor(diff / (1000 * 60));

    const days = Math.floor(minutes / (60 * 24));

    const hours = Math.floor((minutes % (60 * 24)) / 60);

    const mins = minutes % 60;

    return `${days} days, ${hours} hours, ${mins} minutes`;
}



memories.forEach(memory => {

    memory.message = memory.message.replace(
        /\[TIME_PASSED\]/g,
        getTimePassed()
    );

});



/* =========================
   GAME STATE
========================= */

let collectedStars = [];

let totalStars = memories.length;

let currentFallingStar = null;

let isStarFalling = false;

let canSpawnStar = true;

let gameComplete = false;



/* =========================
   CANVAS
========================= */

function resizeCanvas() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;

}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);



/* =========================
   MOON MOVEMENT
========================= */

let bucketX = window.innerWidth / 2;

let bucketY = window.innerHeight - 140;

let dragging = false;



function updateBucketPosition() {

    bucket.style.left = bucketX + 'px';

    bucket.style.top = bucketY + 'px';

}

updateBucketPosition();



/* DESKTOP */

bucket.addEventListener('mousedown', () => {

    dragging = true;

});



document.addEventListener('mouseup', () => {

    dragging = false;

});



document.addEventListener('mousemove', (e) => {

    if (!dragging) return;

    if (gameComplete) return;



    bucketX = e.clientX;

    bucketY = e.clientY;



    updateBucketPosition();

});



/* MOBILE */

bucket.addEventListener('touchmove', (e) => {

    if (gameComplete) return;

    e.preventDefault();

    bucketX = e.touches[0].clientX;

    bucketY = e.touches[0].clientY;

    updateBucketPosition();

}, { passive: false });



/* =========================
   FALLING STAR
========================= */

class FallingStar {

    constructor(memoryData) {

        this.memoryData = memoryData;

        this.reset();

    }



    reset() {

        /* SPAWN ONLY IN TOP 1/3 */

        this.x = Math.random() * canvas.width;

        this.y = Math.random() * (canvas.height * 0.33);



        /* RANDOM LEFT OR RIGHT EXIT */

        const exitSide = Math.random() < 0.5 ? -1 : 1;



        /* STAR SHOULD EXIT SCREEN
           AROUND 3/4 HEIGHT */

        const targetY = canvas.height * 0.75;



        const targetX = exitSide === -1
            ? -250
            : canvas.width + 250;



        const dx = targetX - this.x;

        const dy = targetY - this.y;



        const length = Math.sqrt(dx * dx + dy * dy);



        /* RANDOM SPEED */

        const speed = 2 + Math.random() * 3;



        this.vx = (dx / length) * speed;

        this.vy = (dy / length) * speed;



        this.size = 24;

        this.opacity = 0;

        this.fadeIn = true;

        this.caught = false;

        this.pulse = Math.random() * Math.PI * 2;

    }



    update() {

        this.pulse += 0.05;



        /* FADE IN EFFECT */

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



        /* IF STAR MISSED */

        if (

            this.x < -300 ||

            this.x > canvas.width + 300 ||

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

        const rect = bucket.getBoundingClientRect();



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



        collectedStars.push(this.memoryData);



        starsLeftSpan.textContent =
            totalStars - collectedStars.length;



        if (collectedStars.length === 1) {

            hintText.classList.add('hidden');

        }



        showMessage(this.memoryData);

    }



    draw(ctx) {

        const pulseScale =
            Math.sin(this.pulse) * 0.15 + 1;



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
                40
            );



        glow.addColorStop(
            0,
            'rgba(255,255,255,0.95)'
        );

        glow.addColorStop(
            0.3,
            'rgba(255,240,180,0.6)'
        );

        glow.addColorStop(
            1,
            'rgba(255,220,120,0)'
        );



        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(0, 0, 40, 0, Math.PI * 2);

        ctx.fill();



        this.drawStar(
            ctx,
            0,
            0,
            this.size * pulseScale,
            this.size * 0.45 * pulseScale,
            5
        );



        ctx.restore();

    }



    drawStar(ctx, cx, cy, outerR, innerR, points) {

        ctx.beginPath();



        for (let i = 0; i < points * 2; i++) {

            const r =
                i % 2 === 0
                    ? outerR
                    : innerR;



            const angle =
                (Math.PI * i) / points -
                Math.PI / 2;



            const x = cx + Math.cos(angle) * r;

            const y = cy + Math.sin(angle) * r;



            if (i === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);

            }

        }



        ctx.closePath();



        ctx.fillStyle =
            'rgba(255,255,230,1)';



        ctx.fill();



        ctx.strokeStyle =
            'rgba(255,255,255,0.5)';



        ctx.stroke();

    }

}



/* =========================
   MESSAGE MODAL
========================= */

function showMessage(memoryData) {

    messageText.innerHTML = `
        <h3 style="color:#ffd700;margin-bottom:12px;">
            ${memoryData.title}
        </h3>

        ${memoryData.message.replace(/\n/g, '<br>')}
    `;



    messageText.scrollTop = 0;



    messageModal.classList.remove('hidden');

}



function hideMessage() {

    messageModal.classList.add('hidden');



    if (collectedStars.length >= totalStars) {

        gameComplete = true;

        setTimeout(showConstellation, 1000);

    } else {

        setTimeout(() => {

            canSpawnStar = true;

        }, 3500);

    }

}



closeMessageBtn.addEventListener(
    'click',
    hideMessage
);



/* =========================
   CONSTELLATION
========================= */

function showConstellation() {

    constellationModal.classList.remove('hidden');

    drawConstellation();

}



function drawConstellation() {

    const size = 400;

    constellationCanvas.width = size;

    constellationCanvas.height = size;



    constellationCtx.clearRect(
        0,
        0,
        size,
        size
    );



    const points = [

        { x: 200, y: 320 },

        { x: 90, y: 210 },

        { x: 120, y: 90 },

        { x: 200, y: 60 },

        { x: 280, y: 90 },

        { x: 310, y: 210 }

    ];



    constellationCtx.strokeStyle =
        'rgba(255,255,255,0.25)';



    constellationCtx.lineWidth = 2;



    constellationCtx.beginPath();



    constellationCtx.moveTo(
        points[0].x,
        points[0].y
    );



    for (let i = 1; i < points.length; i++) {

        constellationCtx.lineTo(
            points[i].x,
            points[i].y
        );

    }



    constellationCtx.closePath();

    constellationCtx.stroke();



    points.forEach(point => {

        const glow =
            constellationCtx.createRadialGradient(
                point.x,
                point.y,
                0,
                point.x,
                point.y,
                22
            );



        glow.addColorStop(
            0,
            'rgba(255,255,255,1)'
        );

        glow.addColorStop(
            0.5,
            'rgba(255,220,140,0.5)'
        );

        glow.addColorStop(
            1,
            'rgba(255,220,140,0)'
        );



        constellationCtx.fillStyle = glow;



        constellationCtx.beginPath();

        constellationCtx.arc(
            point.x,
            point.y,
            22,
            0,
            Math.PI * 2
        );

        constellationCtx.fill();

    });

}



/* =========================
   REPLAY
========================= */

replayBtn.addEventListener('click', () => {

    constellationModal.classList.add('hidden');



    collectedStars = [];



    currentFallingStar = null;



    isStarFalling = false;



    canSpawnStar = true;



    gameComplete = false;



    starsLeftSpan.textContent = totalStars;

});



/* =========================
   GAME LOOP
========================= */

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



    if (currentFallingStar && isStarFalling) {

        currentFallingStar.update();

        currentFallingStar.draw(ctx);

    }



    requestAnimationFrame(gameLoop);

}



gameLoop();