document.addEventListener('DOMContentLoaded', () => {
    const ufo = document.getElementById('ufo');
    const gameArea = document.getElementById('gameArea');
    const startMenu = document.getElementById('startMenu');
    const startButton = document.getElementById('startButton');
    const endGameScreen = document.getElementById('endGameScreen');
    const restartButton = document.getElementById('restartButton');
    const scoreDisplay = document.createElement('div');
    const healthBar = document.createElement('div');
    const hillsCanvas = document.createElement('canvas');

    hillsCanvas.id = 'hillsCanvas';
    hillsCanvas.width = 800;
    gameArea.appendChild(hillsCanvas);

    scoreDisplay.id = 'scoreDisplay';
    scoreDisplay.textContent = 'Score: 0';
    gameArea.appendChild(scoreDisplay);

    healthBar.id = 'healthBar';
    healthBar.textContent = 'Health: 🛸🛸🛸';
    gameArea.appendChild(healthBar);

    const hillsContext = hillsCanvas.getContext('2d');
    const step = 40;
    let x = 50;
    let y = gameArea.clientHeight / 2;
    let score = 0;
    let health = 3;
    let gameRunning = false;
    let lastPlayerShotTime = Date.now();
    let lastEnemyShotTime = Date.now();
    let hillsOffset = 0;
    const enemySpawnInterval = 1000; // Spawn an enemy every second
    const maxEnemies = 3; // Maximum of 1 enemy on screen at a time
    const enemySpeed = 250; // Adjusted to take 3 seconds to cross the game area

    const drawHills = () => {
        hillsContext.clearRect(0, 0, hillsCanvas.width, hillsCanvas.height);
        hillsContext.fillStyle = 'green';
        hillsContext.beginPath();
        hillsContext.moveTo(0, hillsCanvas.height);
        for (let i = 0; i <= hillsCanvas.width; i += 20) {
            const y = Math.sin((i + hillsOffset) / 20) * 20 + hillsCanvas.height - 40;
            hillsContext.lineTo(i, y);
        }
        hillsContext.lineTo(hillsCanvas.width, hillsCanvas.height);
        hillsContext.closePath();
        hillsContext.fill();
    };

    const moveUFO = (event) => {
        if (!gameRunning) return;

        switch (event.key) {
            case 'ArrowUp':
                if (y - step > 0) y -= step;
                break;
            case 'ArrowDown':
                if (y + step < gameArea.clientHeight) y += step;
                break;
            case 'ArrowLeft':
                if (x - step > 0) x -= step;
                break;
            case 'ArrowRight':
                if (x + step < gameArea.clientWidth) x += step;
                break;
        }
        ufo.style.zIndex = '1'; // Ensures UFO is in front of hills
        ufo.style.left = `${x}px`;
        ufo.style.top = `${y}px`;
    };

    const shootProjectile = (event) => {
        if (!gameRunning || event.key !== ' ') return;

        const currentTime = Date.now();
        if (currentTime - lastPlayerShotTime < 500) return;

        lastPlayerShotTime = currentTime;

        const projectile = document.createElement('div');
        projectile.className = 'projectile';
        projectile.textContent = '💥';
        gameArea.appendChild(projectile);

        const ufoRect = ufo.getBoundingClientRect();
        let projX = ufoRect.right - gameArea.getBoundingClientRect().left;
        let projY = (ufoRect.top + ufoRect.bottom) / 2 - gameArea.getBoundingClientRect().top;

        projectile.style.left = `${projX}px`;
        projectile.style.top = `${projY}px`;

        const projectileSpeed = step / 2;

        const moveProjectile = () => {
            projX += projectileSpeed;
            if (projX < gameArea.clientWidth) {
                projectile.style.left = `${projX}px`;

                detectProjectileCollision(projectile);

                requestAnimationFrame(moveProjectile);
            } else {
                gameArea.removeChild(projectile);
            }
        };

        moveProjectile();
    };

    const detectProjectileCollision = (projectile) => {
        const projectileRect = projectile.getBoundingClientRect();

        const enemies = document.querySelectorAll('.enemy');
        enemies.forEach((enemy) => {
            const enemyRect = enemy.getBoundingClientRect();

            if (projectileRect.right >= enemyRect.left &&
                projectileRect.left <= enemyRect.right &&
                projectileRect.bottom >= enemyRect.top &&
                projectileRect.top <= enemyRect.bottom) {

                gameArea.removeChild(projectile);
                gameArea.removeChild(enemy);

                showExplosion(projectileRect.left, projectileRect.top);

                incrementScore(10);

                // Exit the function after one collision
                return;
            }
        });

        const houses = document.querySelectorAll('.house');
        houses.forEach((house) => {
            const houseRect = house.getBoundingClientRect();

            if (projectileRect.right >= houseRect.left &&
                projectileRect.left <= houseRect.right &&
                projectileRect.bottom >= houseRect.top &&
                projectileRect.top <= houseRect.bottom) {

                gameArea.removeChild(projectile);
                gameArea.removeChild(house);
                showExplosion(projectileRect.left, projectileRect.top);
                incrementScore(10);
            }
        });
    };

    const incrementScore = (points) => {
        score += points;
        scoreDisplay.textContent = `Score: ${score}`;
    };

    const spawnEnemy = () => {
        if (!gameRunning) return;

        const enemyCount = document.querySelectorAll('.enemy').length;
        if (enemyCount >= maxEnemies) return;

        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        const enemyEmojis = ['🚁', '🎈', '🛰️', '✈️', '🐙'];
        enemy.textContent = enemyEmojis[Math.floor(Math.random() * enemyEmojis.length)];
        if (enemy.textContent === '✈️') {
            enemy.classList.add('rotated-plane'); // Add the rotated class for ✈️
        }

        gameArea.appendChild(enemy);

        let enemyX = gameArea.clientWidth;
        let enemyY = Math.random() * (gameArea.clientHeight - 100);
        enemy.style.left = `${enemyX}px`;
        enemy.style.top = `${enemyY}px`;

        const moveEnemy = () => {
            enemyX -= (gameArea.clientWidth + enemy.offsetWidth) / enemySpeed;
            enemy.style.left = `${enemyX}px`;

            // Randomly move enemy up or down every 3 seconds
            const currentTime = Date.now();
            if (currentTime - lastEnemyShotTime > 1000) { // Change interval to 3000 ms (3 seconds)
                lastEnemyShotTime = currentTime;
                const randomDirection = Math.random() < 0.5 ? -1 : 1; // -1 for up, 1 for down
                enemyY += randomDirection * 40;
                enemy.style.top = `${enemyY}px`;

                // Call shootEnemyProjectile only once per enemy every 3 seconds
                shootEnemyProjectile(enemy);
            }

            detectPlayerCollision(enemy);

            if (enemyX > -enemy.offsetWidth) {
                requestAnimationFrame(moveEnemy);
            } else {
                gameArea.removeChild(enemy);
            }
        };

        moveEnemy();
    };

    const shootEnemyProjectile = (enemy) => {
        const enemyRect = enemy.getBoundingClientRect();
        const enemyProjectile = document.createElement('div');
        enemyProjectile.className = 'enemy-projectile';
        enemyProjectile.textContent = '💥';
        gameArea.appendChild(enemyProjectile);

        const ufoRect = ufo.getBoundingClientRect();
        let projX = enemyRect.left - gameArea.getBoundingClientRect().left;
        let projY = (enemyRect.top + enemyRect.bottom) / 2 - gameArea.getBoundingClientRect().top;

        const enemyProjectileSpeed = step / 2;

        const moveEnemyProjectile = () => {
            projX -= enemyProjectileSpeed;
            enemyProjectile.style.left = `${projX}px`;
            enemyProjectile.style.top = `${projY}px`;

            detectPlayerCollision(enemyProjectile);

            if (projX > gameArea.clientWidth ||
                projY > gameArea.clientHeight ||
                projX < 0 || projY < 0) {
                gameArea.removeChild(enemyProjectile);
            } else {
                requestAnimationFrame(moveEnemyProjectile);
            }
        };

        moveEnemyProjectile();
    };


    const detectPlayerCollision = (enemyProjectile) => {
        const enemyProjectileRect = enemyProjectile.getBoundingClientRect();
        const ufoRect = ufo.getBoundingClientRect();

        if (enemyProjectileRect.right >= ufoRect.left &&
            enemyProjectileRect.left <= ufoRect.right &&
            enemyProjectileRect.bottom >= ufoRect.top &&
            enemyProjectileRect.top <= ufoRect.bottom) {
            gameArea.removeChild(enemyProjectile);
            incrementScore(10);
            reduceHealth();

            if (health <= 0) {
                endGame();
            }
        }
    };

    const reduceHealth = () => {
        if (health > 0) {
            health--;
            updateHealthDisplay();
        }
    };

    const updateHealthDisplay = () => {
        let healthText = 'Health: ';
        for (let i = 0; i < health; i++) {
            healthText += '🛸';
        }
        healthBar.textContent = healthText;
    };

    const endGame = () => {
        gameRunning = false;
        endGameScreen.style.display = 'block';
        document.getElementById('finalScore').textContent = score;

        const existingEnemies = document.querySelectorAll('.enemy');
        existingEnemies.forEach((enemy) => {
            gameArea.removeChild(enemy);
        });

        const existingProjectiles = document.querySelectorAll('.projectile');
        existingProjectiles.forEach((projectile) => {
            gameArea.removeChild(projectile);
        });

        const existingEnemyProjectiles = document.querySelectorAll('.enemy-projectile');
        existingEnemyProjectiles.forEach((projectile) => {
            gameArea.removeChild(projectile);
        });
    };

    const showExplosion = (x, y) => {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.textContent = '💥';
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        gameArea.appendChild(explosion);

        // Remove explosion after a short delay
        setTimeout(() => {
            gameArea.removeChild(explosion);
        }, -0); // Adjust delay as needed
    };

    const startGame = () => {
        gameArea.style.width = '800px';
        gameArea.style.height = '600px';
        startMenu.style.display = 'none';
        gameArea.style.display = 'block';

        x = 50;
        y = gameArea.clientHeight / 2;
        ufo.style.left = `${x}px`;
        ufo.style.top = `${y}px`;

        const existingEnemies = document.querySelectorAll('.enemy');
        existingEnemies.forEach((enemy) => {
            gameArea.removeChild(enemy);
        });

        score = 0;
        health = 3;
        scoreDisplay.textContent = `Score: ${score}`;
        updateHealthDisplay();

        gameRunning = true;
        setInterval(spawnEnemy, enemySpawnInterval); // Use setInterval to spawn enemies every second
    };

    const restartGame = () => {
        endGameScreen.style.display = 'none';
        startGame();
    };

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    document.addEventListener('keydown', moveUFO);
    document.addEventListener('keydown', shootProjectile);

    hillsCanvas.style.position = 'absolute';
    hillsCanvas.style.bottom = '0';
    hillsCanvas.style.left = '0';

    const animateHills = () => {
        if (gameRunning) {
            hillsOffset += 2;
            drawHills();
            requestAnimationFrame(animateHills);
        }
    };

    animateHills();

    const spawnHouse = () => {
        if (!gameRunning) return;
    
        const houses = ['🏡', '🏠', '🏘️', '🏯', '🏰', '🚙'];
        const houseEmoji = houses[Math.floor(Math.random() * houses.length)];
    
        const house = document.createElement('div');
        house.className = 'house';
        house.textContent = houseEmoji;
        gameArea.appendChild(house);
    
        let houseX = gameArea.clientWidth;
        let houseY = gameArea.clientHeight - 80;
    
        house.style.position = 'absolute';
        house.style.left = `${houseX}px`;
        house.style.top = `${houseY}px`;
    
        const houseSpeed = 2;
    
        const moveHouse = () => {
            houseX -= houseSpeed;
            if (houseX > 40) {
                house.style.left = `${houseX}px`;
    
                detectHouseCollision(house);
    
                requestAnimationFrame(moveHouse);
            } else {
                gameArea.removeChild(house);
            }
        };
    
        moveHouse();
        setTimeout(spawnHouse, 7500);
    };
    

    const detectHouseCollision = (house) => {
        const houseRect = house.getBoundingClientRect();
        const ufoRect = ufo.getBoundingClientRect();

        if (houseRect.right >= ufoRect.left &&
            houseRect.left <= ufoRect.right &&
            houseRect.bottom >= ufoRect.top &&
            houseRect.top <= ufoRect.bottom) {

            gameArea.removeChild(house);
            incrementScore(10);
        }
    };

    startButton.addEventListener('click', () => {
        startGame();
        animateHills(); // Start hills animation
        spawnHouse(); // Start house spawn
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const ufo = document.getElementById('ufo');
    const gameArea = document.getElementById('gameArea');
    const startMenu = document.getElementById('startMenu');
    const startButton = document.getElementById('startButton');
    const endGameScreen = document.getElementById('endGameScreen');
    const restartButton = document.getElementById('restartButton');
    const scoreDisplay = document.createElement('div');
    const healthBar = document.createElement('div');
    const hillsCanvas = document.createElement('canvas');

    const stars = Array.from({ length: 500 }, () => ({
        x: Math.random() * 800, // Width of Canvas
        y: Math.random() * 600, // Height of Canvas
    }));

    hillsCanvas.id = 'hillsCanvas';
    hillsCanvas.width = 800;
    gameArea.appendChild(hillsCanvas);

    scoreDisplay.id = 'scoreDisplay';
    scoreDisplay.textContent = 'Score: 0';
    gameArea.appendChild(scoreDisplay);

    healthBar.id = 'healthBar';
    healthBar.textContent = 'Health: 🛸🛸🛸';
    gameArea.appendChild(healthBar);

    const hillsContext = hillsCanvas.getContext('2d');
    const step = 40;
    let x = 50;
    let y = gameArea.clientHeight / 2;
    let score = 0;
    let health = 3;
    let gameRunning = false;
    let lastPlayerShotTime = Date.now();
    let lastEnemyShotTime = Date.now();
    let hillsOffset = 0;
    const enemySpawnInterval = 1000;
    const maxEnemies = 3;
    const enemySpeed = 250;

    const drawStars = () => {
        hillsContext.fillStyle = 'white';
        stars.forEach(star => {
            hillsContext.fillRect(star.x, star.y, 2, 2);
        });
    };

    const drawHills = () => {
        hillsContext.clearRect(0, 0, hillsCanvas.width, hillsCanvas.height);
        drawStars();
        hillsContext.fillStyle = 'green';
        hillsContext.beginPath();
        hillsContext.moveTo(0, hillsCanvas.height);
        for (let i = 0; i <= hillsCanvas.width; i += 20) {
            const y = Math.sin((i + hillsOffset) / 20) * 20 + hillsCanvas.height - 40;
            hillsContext.lineTo(i, y);
        }
        hillsContext.lineTo(hillsCanvas.width, hillsCanvas.height);
        hillsContext.closePath();
        hillsContext.fill();
    };

    const moveUFO = (event) => {
        if (!gameRunning) return;

        switch (event.key) {
            case 'ArrowUp':
                if (y - step > 0) y -= step;
                break;
            case 'ArrowDown':
                if (y + step < gameArea.clientHeight) y += step;
                break;
            case 'ArrowLeft':
                if (x - step > 0) x -= step;
                break;
            case 'ArrowRight':
                if (x + step < gameArea.clientWidth) x += step;
                break;
        }
        ufo.style.zIndex = '1';
        ufo.style.left = `${x}px`;
        ufo.style.top = `${y}px`;
    };

    const shootProjectile = (event) => {
        if (!gameRunning || event.key !== ' ') return;

        const currentTime = Date.now();
        if (currentTime - lastPlayerShotTime < 500) return;

        lastPlayerShotTime = currentTime;

        const projectile = document.createElement('div');
        projectile.className = 'projectile';
        projectile.textContent = '💥';
        gameArea.appendChild(projectile);

        const ufoRect = ufo.getBoundingClientRect();
        let projX = ufoRect.right - gameArea.getBoundingClientRect().left;
        let projY = (ufoRect.top + ufoRect.bottom) / 2 - gameArea.getBoundingClientRect().top;

        projectile.style.left = `${projX}px`;
        projectile.style.top = `${projY}px`;

        const projectileSpeed = step / 2;

        const moveProjectile = () => {
            projX += projectileSpeed;
            if (projX < gameArea.clientWidth) {
                projectile.style.left = `${projX}px`;

                detectProjectileCollision(projectile);

                requestAnimationFrame(moveProjectile);
            } else {
                gameArea.removeChild(projectile);
            }
        };

        moveProjectile();
    };

    const detectProjectileCollision = (projectile) => {
        const projectileRect = projectile.getBoundingClientRect();

        const enemies = document.querySelectorAll('.enemy');
        enemies.forEach((enemy) => {
            const enemyRect = enemy.getBoundingClientRect();

            if (projectileRect.right >= enemyRect.left &&
                projectileRect.left <= enemyRect.right &&
                projectileRect.bottom >= enemyRect.top &&
                projectileRect.top <= enemyRect.bottom) {

                gameArea.removeChild(projectile);
                gameArea.removeChild(enemy);

                showExplosion(projectileRect.left, projectileRect.top);

                incrementScore(10);

                return;
            }
        });

        const houses = document.querySelectorAll('.house');
        houses.forEach((house) => {
            const houseRect = house.getBoundingClientRect();

            if (projectileRect.right >= houseRect.left &&
                projectileRect.left <= houseRect.right &&
                projectileRect.bottom >= houseRect.top &&
                projectileRect.top <= houseRect.bottom) {

                gameArea.removeChild(projectile);
                gameArea.removeChild(house);
                showExplosion(projectileRect.left, projectileRect.top);
                incrementScore(10);
            }
        });
    };

    const incrementScore = (points) => {
        score += points;
        scoreDisplay.textContent = `Score: ${score}`;
    };

    const spawnEnemy = () => {
        if (!gameRunning) return;

        const enemyCount = document.querySelectorAll('.enemy').length;
        if (enemyCount >= maxEnemies) return;

        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        const enemyEmojis = ['🚁', '🎈', '🛰️', '✈️', '🐙'];
        enemy.textContent = enemyEmojis[Math.floor(Math.random() * enemyEmojis.length)];
        if (enemy.textContent === '✈️') {
            enemy.classList.add('rotated-plane'); // Add the rotated class for ✈️
        }

        gameArea.appendChild(enemy);

        let enemyX = gameArea.clientWidth;
        let enemyY = Math.random() * (gameArea.clientHeight - 100);
        enemy.style.left = `${enemyX}px`;
        enemy.style.top = `${enemyY}px`;

        const moveEnemy = () => {
            enemyX -= (gameArea.clientWidth + enemy.offsetWidth) / enemySpeed;
            enemy.style.left = `${enemyX}px`;

            const currentTime = Date.now();
            if (currentTime - lastEnemyShotTime > 1000) { // Change interval to 3000 ms (3 seconds)
                lastEnemyShotTime = currentTime;
                const randomDirection = Math.random() < 0.5 ? -1 : 1; // -1 for up, 1 for down
                enemyY += randomDirection * 40;
                enemy.style.top = `${enemyY}px`;

                shootEnemyProjectile(enemy);
            }

            detectPlayerCollision(enemy);

            if (enemyX > -enemy.offsetWidth) {
                requestAnimationFrame(moveEnemy);
            } else {
                gameArea.removeChild(enemy);
            }
        };

        moveEnemy();
    };

    const shootEnemyProjectile = (enemy) => {
        const enemyRect = enemy.getBoundingClientRect();
        const enemyProjectile = document.createElement('div');
        enemyProjectile.className = 'enemy-projectile';
        enemyProjectile.textContent = '💥';
        gameArea.appendChild(enemyProjectile);

        const ufoRect = ufo.getBoundingClientRect();
        let projX = enemyRect.left - gameArea.getBoundingClientRect().left;
        let projY = (enemyRect.top + enemyRect.bottom) / 2 - gameArea.getBoundingClientRect().top;

        const enemyProjectileSpeed = step / 2;

        const moveEnemyProjectile = () => {
            projX -= enemyProjectileSpeed;
            enemyProjectile.style.left = `${projX}px`;
            enemyProjectile.style.top = `${projY}px`;

            detectPlayerCollision(enemyProjectile);

            if (projX > gameArea.clientWidth ||
                projY > gameArea.clientHeight ||
                projX < 0 || projY < 0) {
                gameArea.removeChild(enemyProjectile);
            } else {
                requestAnimationFrame(moveEnemyProjectile);
            }
        };

        moveEnemyProjectile();
    };

    const detectPlayerCollision = (enemyProjectile) => {
        const enemyProjectileRect = enemyProjectile.getBoundingClientRect();
        const ufoRect = ufo.getBoundingClientRect();

        if (enemyProjectileRect.right >= ufoRect.left &&
            enemyProjectileRect.left <= ufoRect.right &&
            enemyProjectileRect.bottom >= ufoRect.top &&
            enemyProjectileRect.top <= ufoRect.bottom) {
            gameArea.removeChild(enemyProjectile);
            incrementScore(10);
            reduceHealth();

            if (health <= 0) {
                endGame();
            }
        }
    };

    const reduceHealth = () => {
        if (health > 0) {
            health--;
            updateHealthDisplay();
        }
    };

    const updateHealthDisplay = () => {
        let healthText = 'Health: ';
        for (let i = 0; i < health; i++) {
            healthText += '🛸';
        }
        healthBar.textContent = healthText;
    };

    const endGame = () => {
        gameRunning = false;
        endGameScreen.style.display = 'block';
        document.getElementById('finalScore').textContent = score;

        const existingEnemies = document.querySelectorAll('.enemy');
        existingEnemies.forEach((enemy) => {
            gameArea.removeChild(enemy);
        });

        const existingProjectiles = document.querySelectorAll('.projectile');
        existingProjectiles.forEach((projectile) => {
            gameArea.removeChild(projectile);
        });

        const existingEnemyProjectiles = document.querySelectorAll('.enemy-projectile');
        existingEnemyProjectiles.forEach((projectile) => {
            gameArea.removeChild(projectile);
        });
    };

    const showExplosion = (x, y) => {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.textContent = '💥';
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        gameArea.appendChild(explosion);

        setTimeout(() => {
            gameArea.removeChild(explosion);
        }, 500);
    };

    const startGame = () => {
        gameArea.style.width = '800px';
        gameArea.style.height = '600px';
        startMenu.style.display = 'none';
        gameArea.style.display = 'block';

        x = 50;
        y = gameArea.clientHeight / 2;
        ufo.style.left = `${x}px`;
        ufo.style.top = `${y}px`;
        const existingEnemies = document.querySelectorAll('.enemy');
        existingEnemies.forEach((enemy) => {
            gameArea.removeChild(enemy);
        });

        score = 0;
        health = 3;
        scoreDisplay.textContent = `Score: ${score}`;
        updateHealthDisplay();

        gameRunning = true;
        setInterval(spawnEnemy, enemySpawnInterval); // Use setInterval to spawn enemies every second
    };

    const restartGame = () => {
        endGameScreen.style.display = 'none';
        startGame();
    };

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    document.addEventListener('keydown', moveUFO);
    document.addEventListener('keydown', shootProjectile);

    hillsCanvas.style.position = 'absolute';
    hillsCanvas.style.bottom = '0';
    hillsCanvas.style.left = '0';

    const animateHills = () => {
        if (gameRunning) {
            hillsOffset += 2;
            drawHills();
            requestAnimationFrame(animateHills);
        }
    };

    animateHills();

    const spawnHouse = () => {
        if (!gameRunning) return;

        const houses = ['🏡', '🏠', '🏘️', '🏯', '🏰', '🚙'];
        const houseEmoji = houses[Math.floor(Math.random() * houses.length)];

        const house = document.createElement('div');
        house.className = 'house';
        house.textContent = houseEmoji;
        gameArea.appendChild(house);

        let houseX = gameArea.clientWidth;
        let houseY = gameArea.clientHeight - 80;

        house.style.position = 'absolute';
        house.style.left = `${houseX}px`;
        house.style.top = `${houseY}px`;

        const houseSpeed = 2;

        const moveHouse = () => {
            houseX -= houseSpeed;
            if (houseX > 40) {
                house.style.left = `${houseX}px`;

                detectHouseCollision(house);

                requestAnimationFrame(moveHouse);
            } else {
                gameArea.removeChild(house);
            }
        };

        moveHouse();
        setTimeout(spawnHouse, 7500);
    };

    const detectHouseCollision = (house) => {
        const houseRect = house.getBoundingClientRect();
        const ufoRect = ufo.getBoundingClientRect();

        if (houseRect.right >= ufoRect.left &&
            houseRect.left <= ufoRect.right &&
            houseRect.bottom >= ufoRect.top &&
            houseRect.top <= ufoRect.bottom) {

            gameArea.removeChild(house);
            incrementScore(10);
        }
    };

    startButton.addEventListener('click', () => {
        startGame();
        animateHills(); // Start hills animation
        spawnHouse(); // Start house spawn
    });

    // Additional feature: UFO can shoot projectiles on the hills canvas
    const shootUFOProjectile = () => {
        if (!gameRunning) return;

        const currentTime = Date.now();
        if (currentTime - lastPlayerShotTime < 500) return;

        lastPlayerShotTime = currentTime;

        const ufoProjectile = document.createElement('div');
        ufoProjectile.className = 'ufo-projectile';
        ufoProjectile.textContent = '💥';
        gameArea.appendChild(ufoProjectile);

        const ufoRect = ufo.getBoundingClientRect();
        let projX = ufoRect.right - gameArea.getBoundingClientRect().left;
        let projY = (ufoRect.top + ufoRect.bottom) / 2 - gameArea.getBoundingClientRect().top;

        ufoProjectile.style.left = `${projX}px`;
        ufoProjectile.style.top = `${projY}px`;

        const projectileSpeed = step / 2;

        const moveUFOProjectile = () => {
            projX += projectileSpeed;
            if (projX < gameArea.clientWidth) {
                ufoProjectile.style.left = `${projX}px`;

                detectUFOProjectileCollision(ufoProjectile);

                requestAnimationFrame(moveUFOProjectile);
            } else {
                gameArea.removeChild(ufoProjectile);
            }
        };

        moveUFOProjectile();
    };

    const detectUFOProjectileCollision = (ufoProjectile) => {
        const ufoProjectileRect = ufoProjectile.getBoundingClientRect();

        const enemies = document.querySelectorAll('.enemy');
        enemies.forEach((enemy) => {
            const enemyRect = enemy.getBoundingClientRect();

            if (ufoProjectileRect.right >= enemyRect.left &&
                ufoProjectileRect.left <= enemyRect.right &&
                ufoProjectileRect.bottom >= enemyRect.top &&
                ufoProjectileRect.top <= enemyRect.bottom) {

                gameArea.removeChild(ufoProjectile);
                gameArea.removeChild(enemy);

                showExplosion(ufoProjectileRect.left, ufoProjectileRect.top);

                incrementScore(10);

                return;
            }
        });

        const houses = document.querySelectorAll('.house');
        houses.forEach((house) => {
            const houseRect = house.getBoundingClientRect();

            if (ufoProjectileRect.right >= houseRect.left &&
                ufoProjectileRect.left <= houseRect.right &&
                ufoProjectileRect.bottom >= houseRect.top &&
                ufoProjectileRect.top <= houseRect.bottom) {

                gameArea.removeChild(ufoProjectile);
                gameArea.removeChild(house);
                showExplosion(ufoProjectileRect.left, ufoProjectileRect.top);
                incrementScore(10);
            }
        });
    };

    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            shootUFOProjectile();
        }
    });
});

