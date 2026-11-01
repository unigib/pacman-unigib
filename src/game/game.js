const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;
const TUNNEL_ROW = 8;
let lives = 3;
let ghostCount = 4;
let ghostImageLocations = [
    { x: 0, y: 0 },
    { x: 176, y: 0 },
    { x: 0, y: 121 },
    { x: 176, y: 121 },
];

let fps = 30;
let pacman;
let oneBlockSize = 20;
let score = 0;
let ghosts = [];
let wallSpaceWidth = oneBlockSize / 1.6;
let wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
let wallInnerColor = "black";
let gameStarted = false
let audioContext = null;
let lastMovementSoundTime = 0;
let movementSoundToggle = false;
const frightenedDuration = 30 * 1000;
let frightenedUntil = 0;

let isFrightened = () => Date.now() < frightenedUntil;

let activatePowerMode = () => {
    frightenedUntil = Date.now() + frightenedDuration;
    playTone(660, 0.12, "square", 0.035, 990);
    playTone(990, 0.18, "square", 0.035, 1320, 0.12);
};

let startAudio = () => {
    let AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
        console.warn("Web Audio is not supported; sound effects are unavailable.");
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextConstructor();
    }
    if (audioContext.state === "suspended") {
        audioContext.resume().catch(error => {
            console.error("Could not start game audio.", error);
        });
    }
};

let playTone = (frequency, duration, waveform, volume, endFrequency, delay = 0) => {
    if (!audioContext || audioContext.state !== "running") {
        return;
    }

    let startTime = audioContext.currentTime + delay;
    let oscillator = audioContext.createOscillator();
    let gain = audioContext.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
        endFrequency,
        startTime + duration
    );
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
};

let playMovementSound = () => {
    if (!audioContext || audioContext.state !== "running") {
        return;
    }

    let currentTime = audioContext.currentTime;
    if (currentTime - lastMovementSoundTime < 0.16) {
        return;
    }

    lastMovementSoundTime = currentTime;
    movementSoundToggle = !movementSoundToggle;
    let frequency = movementSoundToggle ? 300 : 220;
    playTone(frequency, 0.045, "square", 0.012, frequency * 0.75);
};

let playPelletSound = () => {
    playTone(520, 0.07, "square", 0.025, 760);
};

let playCollisionSound = () => {
    playTone(520, 0.12, "sawtooth", 0.035, 350);
    playTone(350, 0.12, "sawtooth", 0.035, 220, 0.12);
    playTone(220, 0.18, "sawtooth", 0.035, 110, 0.24);
};

let pmap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1],
    [1, 1, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

let map = pmap;
let originalMap = pmap.map(row => [...row]);


let wrapAtTunnel = entity => {
    if (entity.getMapY() !== TUNNEL_ROW) {
        return;
    }

    if (entity.x < 0) {
        entity.x = map[0].length * oneBlockSize - entity.width;
    } else if (entity.x + entity.width > map[0].length * oneBlockSize) {
        entity.x = 0;
    }
};

let randomTargetsForGhosts = [
    { x: 1 * oneBlockSize, y: 1 * oneBlockSize },
    { x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
        x: (map[0].length - 2) * oneBlockSize,
        y: (map.length - 2) * oneBlockSize,
    },
];

let createNewPacman = () => {
    pacman = new Pacman(
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize / 5
    );
};

let gameLoop = () => {
    update();
    draw();
};

let gameInterval = setInterval(gameLoop, 1000 / fps);

let restartPacmanAndGhosts = () => {
    createNewPacman();
    createGhosts();
};

let onGhostCollision = () => {
    lives--;
    frightenedUntil = 0;
    playCollisionSound();
    restartPacmanAndGhosts();
    if (lives === 0) {
        canvas.style.opacity = "0";
        document.getElementById("gameOver").style.opacity = "1";
        document.getElementById("startButton").style.opacity = "1";
        setTimeout(() => {
            document.getElementById("gameOver").style.display = "block";
            document.getElementById("startButton").style.display = "block";
            canvas.style.display = "none";
        }, 500);
    }
};

let update = () => {
    if (gameStarted) {
        let previousX = pacman.x;
        let previousY = pacman.y;
        pacman.moveProcess();
        if (pacman.x !== previousX || pacman.y !== previousY) {
            playMovementSound();
        }
        pacman.eat();
        updateGhosts();
        let collidingGhosts = ghosts.filter(ghost =>
            ghost.getMapX() === pacman.getMapX() &&
            ghost.getMapY() === pacman.getMapY() &&
            (!ghost.eatenAt || Date.now() - ghost.eatenAt >= 1000)
        );
        if (isFrightened()) {
            collidingGhosts.forEach(eatGhost);
        } else if (collidingGhosts.length > 0) {
            onGhostCollision();
        }
    }
};

let drawFoods = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] === 2) {
                createRect(
                    j * oneBlockSize + oneBlockSize / 3,
                    i * oneBlockSize + oneBlockSize / 3,
                    oneBlockSize / 3,
                    oneBlockSize / 3,
                    "#FEB897"
                );
            } else if (map[i][j] === 4) {
                canvasContext.beginPath();
                canvasContext.arc(
                    j * oneBlockSize + oneBlockSize / 2,
                    i * oneBlockSize + oneBlockSize / 2,
                    oneBlockSize / 3,
                    0,
                    Math.PI * 2
                );
                canvasContext.fillStyle = "#FFF4A3";
                canvasContext.shadowColor = "#FFE066";
                canvasContext.shadowBlur = 8;
                canvasContext.fill();
                canvasContext.shadowBlur = 0;
            }
        }
    }
};

let drawRemainingLives = () => {
    canvasContext.font = "15px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("Lives: ", 270, oneBlockSize * (map.length + 1) + 15);

    for (let i = 0; i < lives; i++) {
        canvasContext.drawImage(
            pacmanFrames,
            2 * oneBlockSize,
            0,
            oneBlockSize,
            oneBlockSize,
            360 + i * oneBlockSize,
            oneBlockSize * map.length + 20,
            oneBlockSize,
            oneBlockSize
        );
    }
};

let drawScore = () => {
    canvasContext.font = "15px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText(
        "Score: " + score,
        20,
        oneBlockSize * (map.length + 1) + 15
    );
};

let drawPowerTimer = () => {
    if (!isFrightened()) {
        return;
    }

    let secondsRemaining = Math.ceil((frightenedUntil - Date.now()) / 1000);
    canvasContext.font = "9px Emulogic";
    canvasContext.fillStyle = "#FFF4A3";
    canvasContext.fillText(`POWER ${secondsRemaining}s`, 175, oneBlockSize * (map.length + 1) + 15);
};

let draw = () => {
    if (gameStarted) {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        createRect(0, 0, canvas.width, canvas.height, "black");
        drawWalls();
        drawFoods();
        drawGhosts();
        pacman.draw();
        drawScore();
        drawRemainingLives();
        drawPowerTimer();
    }
};

let drawWalls = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] === 1) {
                createRect(
                    j * oneBlockSize,
                    i * oneBlockSize,
                    oneBlockSize,
                    oneBlockSize,
                    "#342DCA"
                );
                if (j > 0 && map[i][j - 1] === 1) {
                    createRect(
                        j * oneBlockSize,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (j < map[0].length - 1 && map[i][j + 1] === 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (i < map.length - 1 && map[i + 1][j] === 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }

                if (i > 0 && map[i - 1][j] === 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }
            }
        }
    }
};

let createGhosts = () => {
    ghosts = [];
    for (let i = 0; i < ghostCount * 2; i++) {
        let newGhost = new Ghost(
            9 * oneBlockSize + (i % 2 === 0 ? 0 : 1) * oneBlockSize,
            10 * oneBlockSize + (i % 2 === 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            pacman.speed / 2,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }
};

let eatGhost = ghost => {
    score += 100;
    playTone(880, 0.12, "square", 0.035, 1320);
    let ghostIndex = ghosts.indexOf(ghost);
    ghost.x = (9 + ghostIndex % 2) * oneBlockSize;
    ghost.y = (10 + Math.floor(ghostIndex / 2) % 2) * oneBlockSize;
    ghost.eatenAt = Date.now();
};

let startGame = () => {
    startAudio();
    gameStarted = true;
    createNewPacman();
    createGhosts();
    gameInterval = setInterval(gameLoop, 1000 / fps);
};

let restartGame = () => {
    clearInterval(gameInterval);
    score = 0;
    lives = 3;
    gameStarted = false;
    frightenedUntil = 0;
    map = originalMap.map(row => [...row]);
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
};

document.getElementById("startButton").addEventListener("click", () => {
    restartGame()
    startGame();
    document.getElementById("startButton").style.opacity = "0";
    canvas.style.opacity = "0";

    setTimeout(() => {
        document.getElementById("gameOver").style.display = "none";
        document.getElementById("startButton").style.display = "none";
        canvas.style.display = "block";

        setTimeout(() => {
            document.getElementById("startButton").style.opacity = "1";
            document.getElementById("gameOver").style.opacity = "1";
            canvas.style.opacity = "1";
        }, 50);
    }, 500);
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("touchstart", handleTouchStart);
window.addEventListener("touchmove", handleTouchMove);

function handleKeyDown(event) {
    let k = event.keyCode;
    setPacmanDirection(k);
}

function handleTouchStart(event) {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
}

function handleTouchMove(event) {
    if (!startX || !startY) {
        return;
    }
    const touch = event.touches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            setPacmanDirection(39);
        } else {
            setPacmanDirection(37);
        }
    } else {
        if (deltaY > 0) {
            setPacmanDirection(40);
        } else {
            setPacmanDirection(38);
        }
    }
    startX = null;
    startY = null;
}

function setPacmanDirection(keyCode) {
    setTimeout(() => {
        if (keyCode === 37 || keyCode === 65) {
            pacman.nextDirection = DIRECTION_LEFT;
        } else if (keyCode === 38 || keyCode === 87) {
            pacman.nextDirection = DIRECTION_UP;
        } else if (keyCode === 39 || keyCode === 68) {
            pacman.nextDirection = DIRECTION_RIGHT;
        } else if (keyCode === 40 || keyCode === 83) {
            pacman.nextDirection = DIRECTION_BOTTOM;
        }
    }, 1);
}

window.addEventListener("touchmove", handleTouchMove);
