// =========================
// TIME SINCE MESSAGE
// =========================

const messageDate = new Date(
    2026,
    4,
    24,
    17,
    20
);

function getTimePassed() {

    const now = new Date();

    const diff =
        now - messageDate;

    const totalMinutes =
        Math.floor(diff / 1000 / 60);

    const days =
        Math.floor(totalMinutes / 1440);

    const hours =
        Math.floor(
            (totalMinutes % 1440) / 60
        );

    const minutes =
        totalMinutes % 60;

    return `
        ${days} days,
        ${hours} hours,
        ${minutes} minutes
    `;
}

/* =========================
   DOM ELEMENTS
========================= */

const canvas =
    document.getElementById("game-canvas");

const ctx =
    canvas.getContext("2d");

const bucket =
    document.getElementById("bucket");

const starsCount =
    document.getElementById("stars-count");

const messageModal =
    document.getElementById("message-modal");

const messageText =
    document.getElementById("message-text");

const closeButton =
    document.getElementById("close-message");

const constellationModal =
    document.getElementById("constellation-modal");

const constellationCanvas =
    document.getElementById("constellation-canvas");

const constellationCtx =
    constellationCanvas.getContext("2d");

const replayButton =
    document.getElementById("replay-button");

/* =========================
   GAME STATE
========================= */

let bucketX =
    window.innerWidth / 2;

let currentStar = null;

let collected = [];

let canSpawn = true;

let gameFinished = false;

/* =========================
   CANVAS
========================= */

function resizeCanvas() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;
}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);

/* =========================
   BUCKET
========================= */

function updateBucket() {

    bucket.style.left =
        bucketX + "px";
}

/* DESKTOP */

document.addEventListener(
    "mousemove",
    e => {

        bucketX =
            e.clientX;

        updateBucket();
    }
);

/* MOBILE */

document.addEventListener(
    "touchmove",
    e => {

        e.preventDefault();

        bucketX =
            e.touches[0].clientX;

        updateBucket();

    },
    { passive: false }
);

/* =========================
   FALLING STAR
========================= */

class FallingStar {

    constructor(memory) {

        this.memory = memory;

        /* =========================
           RANDOM SPAWN
        ========================= */

        this.x =
            Math.random() *
            (canvas.width - 200) + 100;

        this.y =
            Math.random() *
            (canvas.height * 0.33);

        /* =========================
           RANDOM TRAJECTORY
        ========================= */

        const goLeft =
            Math.random() < 0.5;

        this.speedX =
            goLeft

            ? -(1 + Math.random() * 2.5)

            : (1 + Math.random() * 2.5);

        this.speedY =
            1.2 + Math.random() * 1.8;

        /* =========================
           VISUALS
        ========================= */

        this.pulse = 0;

        this.opacity = 0;

        this.fadingIn = true;

        this.active = false;

        this.activationDelay = 120;

        this.delayCounter = 0;

        this.size = 10;
    }

    update() {

        this.pulse += 0.05;

        /* =========================
           FADE IN
        ========================= */

        if (this.fadingIn) {

            this.opacity += 0.01;

            if (this.opacity >= 1) {

                this.opacity = 1;

                this.fadingIn = false;
            }

            return;
        }

        /* =========================
           WAIT BEFORE FALL
        ========================= */

        if (!this.active) {

            this.delayCounter++;

            if (
                this.delayCounter >=
                this.activationDelay
            ) {

                this.active = true;
            }

            return;
        }

        /* =========================
           MOVEMENT
        ========================= */

        this.x += this.speedX;

        this.y += this.speedY;

        /* NATURAL DRIFT */

        this.x +=
            Math.sin(this.pulse) * 0.15;

        /* =========================
           EXIT SCREEN
        ========================= */

        const exitedLeft =
            this.x < -100;

        const exitedRight =
            this.x > canvas.width + 100;

        const exitedBottom =
            this.y >
            canvas.height * 0.78;

        if (
            exitedBottom &&
            (exitedLeft || exitedRight)
        ) {

            currentStar = null;

            canSpawn = true;
        }

        /* =========================
           COLLISION
        ========================= */

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

            this.y > rect.top - 30 &&
            this.y < rect.bottom
        );
    }

    catch() {

        collected.push(this.memory);

        starsCount.textContent =
            memories.length -
            collected.length;

        showMessage(this.memory);

        currentStar = null;

        canSpawn = false;
    }

    draw() {

        ctx.save();

        ctx.translate(this.x, this.y);

        const glowPulse =
            Math.sin(this.pulse) *
            0.2 + 0.8;

        /* OUTER GLOW */

        const gradient =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                40
            );

        gradient.addColorStop(
            0,
            `rgba(255,255,255,${
                0.9 *
                glowPulse *
                this.opacity
            })`
        );

        gradient.addColorStop(
            0.4,
            `rgba(255,240,200,${
                0.4 *
                this.opacity
            })`
        );

        gradient.addColorStop(
            1,
            `rgba(255,255,255,0)`
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            40,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* INNER STAR */

        ctx.fillStyle =
            `rgba(255,255,255,${
                this.opacity
            })`;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            this.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* SPARKLE */

        ctx.strokeStyle =
            `rgba(255,255,255,${
                0.5 *
                this.opacity
            })`;

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);

        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);

        ctx.stroke();

        ctx.restore();
    }
}

/* =========================
   MESSAGE MODAL
========================= */

function showMessage(memory) {

    const formattedMessage =
        memory.message
            .replace(
                "[TIME_PASSED]",
                getTimePassed()
            )
            .replace(/\n/g, "<br>");

    messageText.innerHTML = `

        <h3 style="
            color: gold;
            margin-bottom: 12px;
        ">

            ${memory.title}

        </h3>

        ${formattedMessage}
    `;

    messageText.scrollTop = 0;

    closeButton.disabled = true;

    messageModal.classList.remove(
        "hidden"
    );
}

/* =========================
   REQUIRE FULL SCROLL
========================= */

messageText.addEventListener(
    "scroll",
    () => {

        const reachedBottom =

            messageText.scrollTop +
            messageText.clientHeight >=

            messageText.scrollHeight - 10;

        if (reachedBottom) {

            closeButton.disabled = false;
        }
    }
);

/* =========================
   CLOSE MESSAGE
========================= */

closeButton.addEventListener(
    "click",
    () => {

        messageModal.classList.add(
            "hidden"
        );

        if (
            collected.length >=
            memories.length
        ) {

            gameFinished = true;

            setTimeout(
                showConstellation,
                1000
            );

        } else {

            setTimeout(() => {

                canSpawn = true;

            }, 4000);
        }
    }
);

/* =========================
   CONSTELLATION
========================= */

function showConstellation() {

    constellationModal.classList.remove(
        "hidden"
    );

    constellationCanvas.width = 400;

    constellationCanvas.height = 400;

    const points = [

        { x: 200, y: 340 },

        { x: 90, y: 220 },

        { x: 120, y: 110 },

        { x: 200, y: 70 },

        { x: 280, y: 110 },

        { x: 310, y: 220 }
    ];

    constellationCtx.clearRect(
        0,
        0,
        400,
        400
    );

    /* HEART LINES */

    constellationCtx.strokeStyle =
        "rgba(255,255,255,0.25)";

    constellationCtx.lineWidth = 2;

    constellationCtx.beginPath();

    constellationCtx.moveTo(
        points[0].x,
        points[0].y
    );

    for (
        let i = 1;
        i < points.length;
        i++
    ) {

        constellationCtx.lineTo(
            points[i].x,
            points[i].y
        );
    }

    constellationCtx.closePath();

    constellationCtx.stroke();

    /* HEART STARS */

    points.forEach(point => {

        const glow =
            constellationCtx.createRadialGradient(
                point.x,
                point.y,
                0,
                point.x,
                point.y,
                25
            );

        glow.addColorStop(
            0,
            "rgba(255,255,255,1)"
        );

        glow.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        constellationCtx.fillStyle =
            glow;

        constellationCtx.beginPath();

        constellationCtx.arc(
            point.x,
            point.y,
            25,
            0,
            Math.PI * 2
        );

        constellationCtx.fill();

        constellationCtx.fillStyle =
            "white";

        constellationCtx.beginPath();

        constellationCtx.arc(
            point.x,
            point.y,
            6,
            0,
            Math.PI * 2
        );

        constellationCtx.fill();
    });
}

/* =========================
   REPLAY
========================= */

replayButton.addEventListener(
    "click",
    () => {

        collected = [];

        currentStar = null;

        canSpawn = true;

        gameFinished = false;

        starsCount.textContent =
            memories.length;

        constellationModal.classList.add(
            "hidden"
        );
    }
);

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

    /* SPAWN STAR */

    if (
        !gameFinished &&
        !currentStar &&
        canSpawn
    ) {

        currentStar =
            new FallingStar(
                memories[
                    collected.length
                ]
            );
    }

    /* DRAW STAR */

    if (currentStar) {

        currentStar.update();

        currentStar.draw();
    }

    requestAnimationFrame(
        gameLoop
    );
}

gameLoop();