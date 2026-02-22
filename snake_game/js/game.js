const GRID_SIZE = 15; // ✅ changed from 20 to 15

const SPEED_MAP = {
    slow: 200,
    normal: 150,
    fast: 100,
};

const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

class Game {
    constructor(canvas, headImage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.headImage = headImage;
        this.foodImage = null;
        this.darkMode = false;
        this.displaySize = canvas.width;
        this.reset();
    }

    reset() {
        const center = Math.floor(GRID_SIZE / 2);
        this.snake = [
            { x: center, y: center },
            { x: center - 1, y: center },
            { x: center - 2, y: center },
        ];
        this.direction = "right";
        this.nextDirection = "right";
        this.food = null;
        this.score = 0;
        this.isGameOver = false;
        this.spawnFood();
    }

    spawnFood() {
        const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
        const empty = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    empty.push({ x, y });
                }
            }
        }
        if (empty.length === 0) {
            this.isGameOver = true;
            return;
        }
        this.food = empty[Math.floor(Math.random() * empty.length)];
    }

    setDirection(dir) {
        const opposites = { up: "down", down: "up", left: "right", right: "left" };
        if (opposites[dir] !== this.direction) {
            this.nextDirection = dir;
        }
    }

    update() {
        if (this.isGameOver) return;

        this.direction = this.nextDirection;
        const head = this.snake[0];
        const move = DIRECTIONS[this.direction];
        const newHead = { x: head.x + move.x, y: head.y + move.y };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            this.isGameOver = true;
            return;
        }

        // Self collision
        for (const segment of this.snake) {
            if (segment.x === newHead.x && segment.y === newHead.y) {
                this.isGameOver = true;
                return;
            }
        }

        this.snake.unshift(newHead);

        // Food collision
        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score++;
            this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    render() {
        const ctx = this.ctx;
        const size = this.displaySize;

        // ✅ keep cells square by deriving one cell size
        const cell = size / GRID_SIZE;
        const cellW = cell;
        const cellH = cell;

        // Background
        ctx.fillStyle = this.darkMode ? "#1a1a2e" : "#d4cfba";
        ctx.fillRect(0, 0, size, size);

        // Grid — clearly visible
        ctx.strokeStyle = this.darkMode ? "#2a2a44" : "#b8b3a0";
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellW, 0);
            ctx.lineTo(i * cellW, size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellH);
            ctx.lineTo(size, i * cellH);
            ctx.stroke();
        }

        // Food
        if (this.food) {
            const fx = this.food.x * cellW;
            const fy = this.food.y * cellH;
            const inset = 1;

            if (this.foodImage && this.foodImage.complete && this.foodImage.naturalWidth > 0) {
                ctx.drawImage(this.foodImage, fx + inset, fy + inset, cellW - inset * 2, cellH - inset * 2);
            } else {
                // Fallback blocky square
                ctx.fillStyle = this.darkMode ? "#ff4444" : "#cc2200";
                ctx.fillRect(fx + inset + 1, fy + inset + 1, cellW - inset * 2 - 2, cellH - inset * 2 - 2);

                ctx.fillStyle = this.darkMode ? "#ff8888" : "#ff6644";
                ctx.fillRect(fx + inset + 4, fy + inset + 4, cellW - inset * 2 - 8, cellH - inset * 2 - 8);
            }
        }

        // Snake body (draw from tail to head so head is on top)
        for (let i = this.snake.length - 1; i >= 0; i--) {
            const seg = this.snake[i];
            const sx = seg.x * cellW;
            const sy = seg.y * cellH;
            const inset = 1;

            if (i === 0) {
                // Head — draw custom image
                this._drawHead(sx, sy, cellW, cellH);
            } else {
                // Body segment — flat blocky squares
                ctx.fillStyle = this.darkMode ? "#44cc66" : "#338833";
                ctx.fillRect(sx + inset, sy + inset, cellW - inset * 2, cellH - inset * 2);

                // Inner lighter square for retro depth
                ctx.fillStyle = this.darkMode ? "#66ee88" : "#44aa44";
                ctx.fillRect(sx + inset + 2, sy + inset + 2, cellW - inset * 2 - 4, cellH - inset * 2 - 4);
            }
        }
    }

    _drawHead(x, y, w, h) {
        const ctx = this.ctx;
        const cx = x + w / 2;
        const cy = y + h / 2;

        const rotationMap = {
            right: 0,
            down: Math.PI / 2,
            left: Math.PI,
            up: -Math.PI / 2,
        };

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotationMap[this.direction]);

        if (this.headImage && this.headImage.complete && this.headImage.naturalWidth > 0) {
            ctx.drawImage(this.headImage, -w / 2, -h / 2, w, h);
        } else {
            // Fallback: blocky green head with pixel eyes
            ctx.fillStyle = this.darkMode ? "#22aa44" : "#226622";
            ctx.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);

            ctx.fillStyle = this.darkMode ? "#44dd66" : "#33aa33";
            ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);

            // Pixel eyes
            const ps = Math.max(2, Math.floor(w / 6));
            ctx.fillStyle = "#fff";
            ctx.fillRect(w * 0.1, -h * 0.3, ps, ps);
            ctx.fillRect(w * 0.1, h * 0.1, ps, ps);

            ctx.fillStyle = "#000";
            ctx.fillRect(w * 0.2, -h * 0.28, Math.ceil(ps / 2), Math.ceil(ps / 2));
            ctx.fillRect(w * 0.2, h * 0.12, Math.ceil(ps / 2), Math.ceil(ps / 2));
        }

        ctx.restore();
    }
}
