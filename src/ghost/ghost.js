class Ghost {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        imageX,
        imageY,
        imageWidth,
        imageHeight,
        range
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = DIRECTION_RIGHT;
        this.imageX = imageX;
        this.imageY = imageY;
        this.imageHeight = imageHeight;
        this.imageWidth = imageWidth;
        this.range = range;
        this.randomTargetIndex = parseInt(Math.random() * 4);
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
        setInterval(() => {
            this.changeRandomDirection();
        }, 10000);
    }

    isInRange() {
        let xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        let yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        if (
            Math.sqrt(xDistance * xDistance + yDistance * yDistance) <=
            this.range
        ) {
            return true;
        }
        return false;
    }

    changeRandomDirection() {
        let addition = 1;
        this.randomTargetIndex += addition;
        this.randomTargetIndex = this.randomTargetIndex % 4;
    }

    moveProcess() {
        if (isFrightened()) {
            this.target = randomTargetsForGhosts.reduce((farthest, target) => {
                let targetDistance =
                    Math.abs(pacman.getMapX() - target.x / oneBlockSize) +
                    Math.abs(pacman.getMapY() - target.y / oneBlockSize);
                let farthestDistance =
                    Math.abs(pacman.getMapX() - farthest.x / oneBlockSize) +
                    Math.abs(pacman.getMapY() - farthest.y / oneBlockSize);
                return targetDistance > farthestDistance ? target : farthest;
            });
        } else if (this.isInRange()) {
            this.target = pacman;
        } else {
            this.target = randomTargetsForGhosts[this.randomTargetIndex];
        }
        this.changeDirectionIfPossible();
        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            return;
        }
        wrapAtTunnel(this);
    }

    moveBackwards() {
        switch (this.direction) {
            case 4:
                this.x -= this.speed;
                break;
            case 3:
                this.y += this.speed;
                break;
            case 2:
                this.x += this.speed;
                break;
            case 1:
                this.y -= this.speed;
                break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case 4:
                this.x += this.speed;
                break;
            case 3:
                this.y -= this.speed;
                break;
            case 2:
                this.x -= this.speed;
                break;
            case 1:
                this.y += this.speed;
                break;
        }
    }

    checkCollisions() {
        let isCollided = false;
        if (
            map[parseInt(this.y / oneBlockSize)][
            parseInt(this.x / oneBlockSize)
            ] === 1 ||
            map[parseInt(this.y / oneBlockSize + 0.9999)][
            parseInt(this.x / oneBlockSize)
            ] === 1 ||
            map[parseInt(this.y / oneBlockSize)][
            parseInt(this.x / oneBlockSize + 0.9999)
            ] === 1 ||
            map[parseInt(this.y / oneBlockSize + 0.9999)][
            parseInt(this.x / oneBlockSize + 0.9999)
            ] === 1
        ) {
            isCollided = true;
        }
        return isCollided;
    }

    changeDirectionIfPossible() {
        let tempDirection = this.direction;
        this.direction = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize),
            parseInt(this.target.y / oneBlockSize)
        );
        if (typeof this.direction === "undefined") {
            this.direction = tempDirection;
            return;
        }
        if (
            this.getMapY() != this.getMapYRightSide() &&
            (this.direction === DIRECTION_LEFT ||
                this.direction === DIRECTION_RIGHT)
        ) {
            this.direction = DIRECTION_UP;
        }
        if (
            this.getMapX() != this.getMapXRightSide() &&
            this.direction === DIRECTION_UP
        ) {
            this.direction = DIRECTION_LEFT;
        }
        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
    }

    calculateNewDirection(map, destX, destY) {
        let mp = [];
        for (let i = 0; i < map.length; i++) {
            mp[i] = map[i].slice();
        }

        let queue = [
            {
                x: this.getMapX(),
                y: this.getMapY(),
                rightX: this.getMapXRightSide(),
                rightY: this.getMapYRightSide(),
                moves: [],
            },
        ];
        while (queue.length > 0) {
            let poped = queue.shift();
            if (poped.x === destX && poped.y === destY) {
                return poped.moves[0];
            } else {
                mp[poped.y][poped.x] = 1;
                let neighborList = this.addNeighbors(poped, mp);
                for (let i = 0; i < neighborList.length; i++) {
                    queue.push(neighborList[i]);
                }
            }
        }

        return 1;
    }

    addNeighbors(poped, mp) {
        let queue = [];
        let numOfRows = mp.length;
        let numOfColumns = mp[0].length;

        let leftX = poped.x - 1;
        if (poped.x === 0 && poped.y === TUNNEL_ROW) {
            leftX = numOfColumns - 1;
        }
        if (leftX >= 0 && leftX < numOfColumns && mp[poped.y][leftX] != 1) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_LEFT);
            queue.push({ x: leftX, y: poped.y, moves: tempMoves });
        }
        let rightX = poped.x + 1;
        if (poped.x === numOfColumns - 1 && poped.y === TUNNEL_ROW) {
            rightX = 0;
        }
        if (rightX >= 0 && rightX < numOfColumns && mp[poped.y][rightX] != 1) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_RIGHT);
            queue.push({ x: rightX, y: poped.y, moves: tempMoves });
        }
        if (
            poped.y - 1 >= 0 &&
            poped.y - 1 < numOfRows &&
            mp[poped.y - 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_UP);
            queue.push({ x: poped.x, y: poped.y - 1, moves: tempMoves });
        }
        if (
            poped.y + 1 >= 0 &&
            poped.y + 1 < numOfRows &&
            mp[poped.y + 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_BOTTOM);
            queue.push({ x: poped.x, y: poped.y + 1, moves: tempMoves });
        }
        return queue;
    }

    getMapX() {
        let mapX = parseInt(this.x / oneBlockSize);
        return mapX;
    }

    getMapY() {
        let mapY = parseInt(this.y / oneBlockSize);
        return mapY;
    }

    getMapXRightSide() {
        let mapX = parseInt((this.x * 0.99 + oneBlockSize) / oneBlockSize);
        return mapX;
    }

    getMapYRightSide() {
        let mapY = parseInt((this.y * 0.99 + oneBlockSize) / oneBlockSize);
        return mapY;
    }

    changeAnimation() {
        this.currentFrame =
            this.currentFrame === this.frameCount ? 1 : this.currentFrame + 1;
    }

    draw() {
        canvasContext.save();
        if (isFrightened()) {
            let shouldFlash = frightenedUntil - Date.now() < 3000;
            canvasContext.fillStyle =
                shouldFlash && Math.floor(Date.now() / 200) % 2 === 0
                    ? "#f5f5f5"
                    : "#1877ff";
            canvasContext.beginPath();
            canvasContext.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2,
                Math.PI,
                0
            );
            canvasContext.lineTo(this.x + this.width, this.y + this.height);
            canvasContext.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.82);
            canvasContext.lineTo(this.x + this.width * 0.5, this.y + this.height);
            canvasContext.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.82);
            canvasContext.lineTo(this.x, this.y + this.height);
            canvasContext.closePath();
            canvasContext.fill();
            canvasContext.fillStyle = shouldFlash ? "#1877ff" : "#ffffff";
            canvasContext.beginPath();
            canvasContext.arc(this.x + this.width * 0.35, this.y + this.height * 0.45, 2, 0, Math.PI * 2);
            canvasContext.arc(this.x + this.width * 0.65, this.y + this.height * 0.45, 2, 0, Math.PI * 2);
            canvasContext.fill();
        } else {
            canvasContext.drawImage(
                ghostFrames,
                this.imageX,
                this.imageY,
                this.imageWidth,
                this.imageHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
        canvasContext.restore();
        canvasContext.beginPath();
    }
}

let updateGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].moveProcess();
    }
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};
