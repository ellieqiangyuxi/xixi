document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game-canvas");
    const scoreDisplay = document.getElementById("score-display");
    const scoreEl = document.getElementById("score");
    const finalScoreEl = document.getElementById("final-score");

    const startScreen = document.getElementById("start-screen");
    const pauseScreen = document.getElementById("pause-screen");
    const gameOverScreen = document.getElementById("game-over-screen");

    const startBtn = document.getElementById("start-btn");
    const restartBtn = document.getElementById("restart-btn");

    // HUD buttons
    const pauseBtn = document.getElementById("pause-btn");
    const menuBtn = document.getElementById("menu-btn");

    // Pause overlay buttons
    const resumeBtn = document.getElementById("resume-btn");
    const pauseMenuBtn = document.getElementById("pause-menu-btn");

    // Game over overlay buttons
    const gameoverMenuBtn = document.getElementById("gameover-menu-btn");

    const themeToggle = document.getElementById("theme-toggle");
    const titleEl = document.querySelector("header h1");

    // Theme toggle
    function isDark() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    function applyTheme(dark) {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("xixi-snake-theme", dark ? "dark" : "light");
    }

    // Load saved preference, default to light
    const savedTheme = localStorage.getItem("xixi-snake-theme");
    if (savedTheme === "dark") {
        applyTheme(true);
    }

    themeToggle.addEventListener("click", () => {
        applyTheme(!isDark());
    });

    // Preload snake head image
    const headImage = new Image();
    headImage.src = "assets/snake-head.png";

    // Sizing — game screen fills available space in the console
    const container = document.getElementById("game-container");

    let currentIntervalMs = null; // remember speed for resume
    let loopTimer = null;

    function resizeCanvas() {
        const consoleEl = document.getElementById("console");
        const headerEl = document.querySelector("header");
        const consoleStyle = getComputedStyle(consoleEl);

        // Available width inside console
        const consoleInnerW = consoleEl.clientWidth;
        const availW = consoleInnerW - 20 - 6; // console-top padding + container border

        // Available height inside viewport (no dpad now)
        const vh = window.innerHeight;
        const headerH = headerEl ? headerEl.offsetHeight : 36;
        const consoleBorderTop = parseFloat(consoleStyle.borderTopWidth) || 0;
        const consoleBorderBottom = parseFloat(consoleStyle.borderBottomWidth) || 0;
        const verticalChrome = headerH + consoleBorderTop + consoleBorderBottom + 30;
        const availH = vh - verticalChrome;

        // Largest square that fits
        const size = Math.max(100, Math.floor(Math.min(availW, availH)));

        // ✅ Let CSS aspect-ratio keep it square.
        // Make it full width, but cap max width by available square size.
        container.style.width = "100%";
        container.style.maxWidth = size + "px";

        // Read back actual rendered size (width drives height via aspect-ratio)
        const actualSize = container.clientWidth;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = actualSize * dpr;
        canvas.height = actualSize * dpr;

        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (game) {
            game.displaySize = actualSize;
        }
    }

    window.addEventListener("resize", resizeCanvas);

    // Game instance
    let game = new Game(canvas, headImage);
    resizeCanvas();

    // Controls (D-pad removed)
    let controls = new Controls(canvas);
    controls.onDirection((dir) => {
        game.setDirection(dir);
    });

    // Preload food images
    const foodImages = {
        angela: new Image(),
        tangyuan: new Image(),
    };
    foodImages.angela.src = "assets/angela.png";
    foodImages.tangyuan.src = "assets/tangyuan.png";

    function getSelectedSpeed() {
        const checked = document.querySelector('input[name="speed"]:checked');
        return checked ? checked.value : "normal";
    }

    function getSelectedFood() {
        const checked = document.querySelector('input[name="food"]:checked');
        return checked ? checked.value : "angela";
    }

    function clearLoop() {
        if (loopTimer) {
            clearInterval(loopTimer);
            loopTimer = null;
        }
    }

    function setTitleToDefault() {
        titleEl.textContent = "Xixi Snake";
        document.title = "Xixi Snake";
    }

    function showMainMenu() {
        clearLoop();

        // Hide gameplay overlays / HUD
        scoreDisplay.classList.remove("visible");
        pauseScreen.classList.add("hidden");
        gameOverScreen.classList.add("hidden");

        // Show start screen overlay
        startScreen.classList.remove("hidden");

        setTitleToDefault();

        // Optional: reset game state so the first frame is clean
        game.reset();
        game.darkMode = isDark();
        game.render();
    }

    function startLoop(interval) {
        clearLoop();
        loopTimer = setInterval(() => {
            game.darkMode = isDark();
            game.update();

            if (game.isGameOver) {
                clearLoop();
                showGameOver();
                return;
            }

            scoreEl.textContent = game.score;
            game.render();
        }, interval);
    }

    function startGame() {
        const speed = getSelectedSpeed();
        const interval = SPEED_MAP[speed];
        currentIntervalMs = interval;

        const foodChoice = getSelectedFood();
        game.foodImage = foodImages[foodChoice];

        const foodName = foodChoice === "angela" ? "Angela" : "Tangyuan";
        titleEl.textContent = "Xixi Eats " + foodName;
        document.title = "Xixi Eats " + foodName;

        game.reset();
        resizeCanvas();

        scoreEl.textContent = "0";
        scoreDisplay.classList.add("visible");

        startScreen.classList.add("hidden");
        pauseScreen.classList.add("hidden");
        gameOverScreen.classList.add("hidden");

        game.darkMode = isDark();
        game.render();

        startLoop(interval);
    }

    function pauseGame() {
        if (!loopTimer) return; // already paused / not running
        clearLoop();
        pauseScreen.classList.remove("hidden");
    }

    function resumeGame() {
        if (loopTimer) return; // already running
        pauseScreen.classList.add("hidden");

        // If somehow resume happens without a stored interval, fall back to current selected speed
        const interval = currentIntervalMs ?? SPEED_MAP[getSelectedSpeed()];
        currentIntervalMs = interval;
        startLoop(interval);
    }

    function showGameOver() {
        finalScoreEl.textContent = game.score;
        scoreDisplay.classList.remove("visible");
        pauseScreen.classList.add("hidden");
        gameOverScreen.classList.remove("hidden");
    }

    // ---- Wire up buttons ----
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

    // HUD buttons
    if (pauseBtn) pauseBtn.addEventListener("click", pauseGame);
    if (menuBtn) menuBtn.addEventListener("click", showMainMenu);

    // Pause overlay buttons
    if (resumeBtn) resumeBtn.addEventListener("click", resumeGame);
    if (pauseMenuBtn) pauseMenuBtn.addEventListener("click", showMainMenu);

    // Game over overlay menu button
    if (gameoverMenuBtn) gameoverMenuBtn.addEventListener("click", showMainMenu);

    // Allow space bar to start/restart; Escape to pause/resume
    document.addEventListener("keydown", (e) => {
        if (e.key === " " || e.code === "Space") {
            if (!startScreen.classList.contains("hidden")) {
                e.preventDefault();
                startGame();
            } else if (!gameOverScreen.classList.contains("hidden")) {
                e.preventDefault();
                startGame();
            }
        }

        if (e.key === "Escape") {
            // Toggle pause/resume only during gameplay
            if (startScreen.classList.contains("hidden") && gameOverScreen.classList.contains("hidden")) {
                e.preventDefault();
                if (loopTimer) pauseGame();
                else resumeGame();
            }
        }
    });
});
