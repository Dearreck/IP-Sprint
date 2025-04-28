// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Iniciando IP Sprint JS...");

    // --- Selección de Elementos del DOM ---
    const userSetupSection = document.getElementById('user-setup');
    const levelSelectSection = document.getElementById('level-select');
    const gameAreaSection = document.getElementById('game-area');
    const gameOverSection = document.getElementById('game-over');
    const unlockProgressSection = document.getElementById('unlock-progress-section'); // Contenedor sección
    const highScoresSection = document.getElementById('high-scores-section');

    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');

    const levelButtonsContainer = document.getElementById('level-buttons-container');
    const unlockProgressDiv = document.getElementById('unlock-progress'); // Div interno
    const progressStarsSpan = document.getElementById('progress-stars');

    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const roundProgressStarsDiv = document.getElementById('round-progress-stars'); // Progreso ronda

    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');

    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreMessage = document.getElementById('high-score-message');
    const playAgainButton = document.getElementById('play-again-button');

    const scoreList = document.getElementById('score-list');

    // --- Variables de Estado del Juego ---
    let currentUsername = '';
    let currentUserData = {};
    let currentScore = 0;
    let currentLevel = '';
    let correctAnswer = null;
    let questionsAnswered = 0;
    let correctAnswersThisRound = 0; // Contador de aciertos en la ronda actual
    const TOTAL_QUESTIONS_PER_GAME = 10;
    const MAX_HIGH_SCORES = 10;
    const POINTS_PER_QUESTION = 10;
    const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION;

    // Claves para localStorage
    const USER_DATA_KEY = 'ipSprintUserData';
    const HIGH_SCORES_KEY = 'ipSprintHighScores';

    // --- Funciones de Gestión de Datos de Usuario ---
    function getAllUserData() { /* ... (sin cambios) ... */ return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {}; }
    function getUserData(username) { /* ... (sin cambios) ... */
        const allUserData = getAllUserData();
        if (allUserData[username]) {
             allUserData[username].unlockedLevels = allUserData[username].unlockedLevels || ['Entry'];
             allUserData[username].entryPerfectStreak = allUserData[username].entryPerfectStreak || 0;
            return allUserData[username];
        } else { return { unlockedLevels: ['Entry'], entryPerfectStreak: 0 }; }
     }
    function saveUserData(username, userData) { /* ... (sin cambios) ... */
        if (!username) return; const allUserData = getAllUserData(); allUserData[username] = userData;
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData)); console.log(`Datos guardados para ${username}:`, userData);
     }

    // --- Funciones de Utilidad ---
    function getRandomInt(min, max) { /* ... (sin cambios) ... */ }
    function generateRandomIp() { /* ... (sin cambios) ... */ }
    function getIpInfo(ipString) { /* ... (sin cambios) ... */ }
    function shuffleArray(array) { /* ... (sin cambios) ... */ }

    // --- Generadores de Preguntas (Nivel Entry) ---
    function generateClassQuestion() { /* ... (sin cambios + console.log) ... */ }
    function generateTypeQuestion() { /* ... (sin cambios + console.log) ... */ }
    function generateDefaultMaskQuestion() { /* ... (sin cambios + console.log) ... */ }
    function generateSelectClassQuestion() { /* ... (sin cambios + console.log) ... */ }
    function generateSelectPrivateIpQuestion() { /* ... (sin cambios + console.log) ... */ }
    function generateSelectIpByDefaultMaskQuestion() { /* ... (sin cambios + console.log) ... */ }


    // --- Funciones UI / Flujo ---

    /** Actualiza la UI de progreso de DESBLOQUEO de nivel (3 estrellas) */
    function updateUnlockProgressUI() {
        if (!currentUserData || !unlockProgressSection) return; // Comprobar si existen

        // Mostrar siempre la sección después del login, pero ajustar el contenido
        unlockProgressSection.style.display = 'block';

        if (!currentUserData.unlockedLevels?.includes('Associate')) {
            const streak = currentUserData.entryPerfectStreak || 0; let stars = '';
            for (let i = 0; i < 3; i++) { stars += (i < streak) ? '★' : '☆'; }
            progressStarsSpan.textContent = stars;
            unlockProgressDiv.style.display = 'block'; // Mostrar div interno con estrellas
        } else {
            // Si Associate ya está desbloqueado, ocultar las estrellas y el título h4
            unlockProgressDiv.style.display = 'none';
            // Opcional: Mostrar un mensaje diferente en la sección
            // unlockProgressSection.innerHTML = '<p>¡Nivel Associate ya desbloqueado!</p>';
        }
     }

    /** Actualiza las estrellas de progreso DENTRO de la ronda actual */
    function updateRoundProgressUI() {
        if (!roundProgressStarsDiv) return;
        let starsHTML = '';
        for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) {
            if (i < correctAnswersThisRound) { starsHTML += '<i class="fas fa-star"></i>'; }
            else { starsHTML += '<i class="far fa-star"></i>'; }
        }
        roundProgressStarsDiv.innerHTML = starsHTML;
    }

    /** Muestra la pantalla de selección de nivel */
     function showLevelSelection() {
         console.log("Mostrando selección de nivel para:", currentUsername);
         userSetupSection.style.display = 'none';
         gameAreaSection.style.display = 'none';
         gameOverSection.style.display = 'none';
         // Mostrar secciones relevantes post-login
         levelSelectSection.style.display = 'block';
         unlockProgressSection.style.display = 'block'; // Mostrar siempre
         highScoresSection.style.display = 'block';   // Mostrar siempre

         levelButtonsContainer.innerHTML = '';
         const unlocked = currentUserData.unlockedLevels || ['Entry'];
         unlocked.forEach(level => {
             const button = document.createElement('button');
             button.textContent = `Jugar Nivel ${level}`;
             button.addEventListener('click', () => startGame(level));
             levelButtonsContainer.appendChild(button);
         });

         updateUnlockProgressUI(); // Actualizar estrellas de desbloqueo
     }

    /** Inicia una nueva partida en el nivel especificado */
    function startGame(levelToPlay) {
        console.log(`Iniciando juego para ${currentUsername} en nivel ${levelToPlay}`);
        currentLevel = levelToPlay; currentScore = 0; questionsAnswered = 0; correctAnswersThisRound = 0; // Resetear estrellas ronda
        scoreDisplay.textContent = currentScore; levelDisplay.textContent = currentLevel;

        userSetupSection.style.display = 'none';
        levelSelectSection.style.display = 'none';
        gameOverSection.style.display = 'none';
        unlockProgressSection.style.display = 'none'; // Ocultar progreso desbloqueo durante partida
        highScoresSection.style.display = 'none';  // Ocultar scores durante partida
        gameAreaSection.style.display = 'block';

        updateRoundProgressUI(); // Mostrar estrellas de ronda (vacías)
        loadNextQuestion();
    }

    function displayQuestion(questionHTML, optionsArray) { /* ... (sin cambios) ... */ }

    function loadNextQuestion() { /* ... (sin cambios lógicos internos, pero revisar los console.log/error handling) ... */ }

    function handleAnswerClick(event) { /* ... (Lógica de resetear/incrementar correctAnswersThisRound y llamar a updateRoundProgressUI() ya estaba bien) ... */
        const selectedButton = event.target; const selectedAnswer = selectedButton.textContent;
        console.log("Respuesta seleccionada:", selectedAnswer, "Correcta:", correctAnswer);
        optionsContainer.classList.add('options-disabled');
        if (selectedAnswer === correctAnswer) {
            currentScore += POINTS_PER_QUESTION; correctAnswersThisRound++; // Incrementar
            scoreDisplay.textContent = currentScore; feedbackArea.textContent = "¡Correcto! ✔️";
            feedbackArea.className = 'correct'; selectedButton.classList.add('correct');
        } else {
            correctAnswersThisRound = 0; // Resetear
            feedbackArea.textContent = `Incorrecto. La respuesta era: ${correctAnswer} ❌`; feedbackArea.className = 'incorrect';
            selectedButton.classList.add('incorrect');
            Array.from(optionsContainer.children).forEach(button => { if (button.textContent === correctAnswer) button.classList.add('correct'); });
        }
        updateRoundProgressUI(); // Actualizar estrellas de ronda
        questionsAnswered++;
        console.log("Preguntas respondidas:", questionsAnswered, "/", TOTAL_QUESTIONS_PER_GAME);
        if (questionsAnswered >= TOTAL_QUESTIONS_PER_GAME) { setTimeout(endGame, 1500); }
        else { setTimeout(loadNextQuestion, 1500); }
    }

    function endGame() { /* ... (Lógica interna sin cambios, pero ajustamos visibilidad al final) ... */
        console.log("Juego terminado. Nivel:", currentLevel, "Puntuación final:", currentScore);
        const isPerfect = (currentScore === PERFECT_SCORE); let message = "¡Partida completada!";
         // ... (Lógica de racha y desbloqueo como antes) ...
        if (currentLevel === 'Entry') {
            currentUserData = getUserData(currentUsername);
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                console.log("Ronda perfecta en Entry! Racha actual:", currentUserData.entryPerfectStreak);
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate'); currentUserData.entryPerfectStreak = 0;
                     message = "¡3 Rondas Perfectas! ¡Nivel Associate Desbloqueado! 🎉"; console.log("Nivel Associate desbloqueado!");
                } else if (!currentUserData.unlockedLevels.includes('Associate')) { message = `¡Ronda Perfecta! Racha: ${currentUserData.entryPerfectStreak}/3. ¡Sigue así!`; }
                 else { message = "¡Ronda Perfecta!"; }
            } else { if (currentUserData.entryPerfectStreak > 0) { console.log("Racha de rondas perfectas reiniciada."); } currentUserData.entryPerfectStreak = 0; message = "¡Partida completada!"; }
             saveUserData(currentUsername, currentUserData);
        } else { message = "¡Partida completada!"; }

        saveHighScore(currentUsername, currentScore);
        loadHighScores(); // Cargar scores actualizados
        highScoreMessage.textContent = message; // Mensaje de fin de ronda/desbloqueo
        updateUnlockProgressUI(); // Mostrar estado actual de estrellas de desbloqueo

        // Mostrar/Ocultar Secciones al final
        gameAreaSection.style.display = 'none';
        levelSelectSection.style.display = 'none'; // Mantener oculta la selección
        gameOverSection.style.display = 'block'; // Mostrar Game Over
        unlockProgressSection.style.display = 'block'; // Mostrar progreso desbloqueo
        highScoresSection.style.display = 'block'; // Mostrar puntuaciones
        finalScoreDisplay.textContent = currentScore;
     }

    // --- Funciones de Puntuaciones Altas ---
    function saveHighScore(name, score) { /* ... (sin cambios) ... */ }
    function loadHighScores() { /* ... (sin cambios) ... */ }

    // --- Lógica de Inicio y Event Listeners ---
    function handleUserLogin(username) {
         currentUsername = username;
         currentUserData = getUserData(username);
         saveUserData(username, currentUserData); // Guardar por si es nuevo
         usernameDisplay.textContent = currentUsername;
         // Mostrar secciones post-login relevantes
         highScoresSection.style.display = 'block'; // Mostrar scores
         unlockProgressSection.style.display = 'block';// Mostrar progreso desbloqueo
         showLevelSelection(); // Mostrar menú de niveles
    }
    loadHighScores(); // Cargar scores al inicio (antes del login)
    usernameForm.addEventListener('submit', (event) => { /* ... (sin cambios) ... */ });
    playAgainButton.addEventListener('click', showLevelSelection); // Vuelve a selección

    // Ocultar secciones post-login al inicio
    levelSelectSection.style.display = 'none';
    unlockProgressSection.style.display = 'none';
    highScoresSection.style.display = 'none';


}); // Fin del DOMContentLoaded
