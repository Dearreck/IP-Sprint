// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Iniciando IP Sprint JS...");

    // --- Selección de Elementos del DOM ---
    // (Asegúrate que estos IDs coincidan EXACTAMENTE con tu HTML)
    const userSetupSection = document.getElementById('user-setup');
    const levelSelectSection = document.getElementById('level-select');
    const gameAreaSection = document.getElementById('game-area');
    const gameOverSection = document.getElementById('game-over');
    const unlockProgressSection = document.getElementById('unlock-progress-section');
    const highScoresSection = document.getElementById('high-scores-section');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');
    const levelButtonsContainer = document.getElementById('level-buttons-container');
    const unlockProgressDiv = document.getElementById('unlock-progress');
    const progressStarsSpan = document.getElementById('progress-stars');
    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const roundProgressStarsDiv = document.getElementById('round-progress-stars');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreMessage = document.getElementById('high-score-message');
    const playAgainButton = document.getElementById('play-again-button');
    const scoreList = document.getElementById('score-list');

    // Log para verificar selección inicial (solo como ejemplo de depuración)
    // console.log("Elementos iniciales:", { userSetupSection, levelSelectSection, gameAreaSection });

    // --- Variables de Estado del Juego ---
    let currentUsername = '';
    let currentUserData = {};
    let currentScore = 0;
    let currentLevel = '';
    let correctAnswer = null;
    let questionsAnswered = 0;
    let correctAnswersThisRound = 0;
    const TOTAL_QUESTIONS_PER_GAME = 10;
    const MAX_HIGH_SCORES = 10;
    const POINTS_PER_QUESTION = 10;
    const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION;
    const USER_DATA_KEY = 'ipSprintUserData';
    const HIGH_SCORES_KEY = 'ipSprintHighScores';

    // --- Funciones de Gestión de Datos de Usuario ---
    function getAllUserData() {
        try {
            return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {};
        } catch (error) {
            console.error("Error al parsear UserData de localStorage:", error);
            return {};
        }
    }
    function getUserData(username) {
        console.log(`getUserData para: ${username}`); // Log
        const allUserData = getAllUserData();
        if (allUserData[username]) {
             allUserData[username].unlockedLevels = allUserData[username].unlockedLevels || ['Entry'];
             allUserData[username].entryPerfectStreak = allUserData[username].entryPerfectStreak || 0;
             console.log("Datos existentes encontrados:", allUserData[username]); // Log
            return allUserData[username];
        } else {
            console.log("Usuario nuevo, devolviendo datos por defecto."); // Log
            return { unlockedLevels: ['Entry'], entryPerfectStreak: 0 };
        }
     }
    function saveUserData(username, userData) {
        if (!username || !userData) {
             console.error("Intento de guardar datos inválidos para usuario:", username, userData); // Log error
             return;
        }
        console.log(`saveUserData para ${username}:`, userData); // Log
        const allUserData = getAllUserData();
        allUserData[username] = userData;
        try {
             localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
        } catch (error) {
             console.error("Error al guardar UserData en localStorage:", error); // Log error
        }
     }

    // --- Funciones de Utilidad ---
    // (getRandomInt, generateRandomIp, getIpInfo, shuffleArray sin cambios)
    function getRandomInt(min, max) { /* ... */ }
    function generateRandomIp() { /* ... */ }
    function getIpInfo(ipString) { /* ... */ }
    function shuffleArray(array) { /* ... */ }

    // --- Generadores de Preguntas (Nivel Entry) ---
    // (Las 6 funciones generadoras sin cambios lógicos, pero con sus logs internos)
     function generateClassQuestion() { /* ... con console.log interno ... */ }
     function generateTypeQuestion() { /* ... con console.log interno ... */ }
     function generateDefaultMaskQuestion() { /* ... con console.log interno ... */ }
     function generateSelectClassQuestion() { /* ... con console.log interno ... */ }
     function generateSelectPrivateIpQuestion() { /* ... con console.log interno ... */ }
     function generateSelectIpByDefaultMaskQuestion() { /* ... con console.log interno ... */ }


    // --- Funciones UI / Flujo ---
    function updateUnlockProgressUI() { /* ... (sin cambios lógicos) ... */
         try {
             if (!currentUserData || !unlockProgressSection || !progressStarsSpan) return;
             unlockProgressSection.style.display = 'block'; // Asegurar que sección esté visible
             if (!currentUserData.unlockedLevels?.includes('Associate')) {
                 const streak = currentUserData.entryPerfectStreak || 0; let stars = '';
                 for (let i = 0; i < 3; i++) { stars += (i < streak) ? '★' : '☆'; }
                 progressStarsSpan.textContent = stars;
                 unlockProgressDiv.style.display = 'block';
             } else {
                 unlockProgressDiv.style.display = 'none';
             }
         } catch(error) { console.error("Error en updateUnlockProgressUI:", error); } // Log error
     }
    function updateRoundProgressUI() { /* ... (sin cambios lógicos) ... */
        try {
             if (!roundProgressStarsDiv) return; let starsHTML = '';
             for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) { starsHTML += (i < correctAnswersThisRound) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'; }
             roundProgressStarsDiv.innerHTML = starsHTML;
         } catch(error) { console.error("Error en updateRoundProgressUI:", error); } // Log error
    }
    function showLevelSelection() {
        console.log("Mostrando selección de nivel para:", currentUsername);
        try {
            userSetupSection.style.display = 'none'; // <-- Ocultar Bienvenida
            gameAreaSection.style.display = 'none';
            gameOverSection.style.display = 'none';

            levelButtonsContainer.innerHTML = '';
            const unlocked = currentUserData.unlockedLevels || ['Entry'];
            console.log("Niveles desbloqueados:", unlocked); // Log

            if (!unlocked || unlocked.length === 0) { // Seguridad extra
                console.error("¡No hay niveles desbloqueados para mostrar!");
                 levelButtonsContainer.innerHTML = '<p>Error: No se encontraron niveles.</p>';
                 levelSelectSection.style.display = 'block'; // Mostrar sección aunque haya error
                 unlockProgressSection.style.display = 'block';
                 highScoresSection.style.display = 'block';
                 return;
            }

            unlocked.forEach(level => {
                const button = document.createElement('button');
                button.textContent = `Jugar Nivel ${level}`;
                button.addEventListener('click', () => startGame(level));
                levelButtonsContainer.appendChild(button);
            });

            updateUnlockProgressUI(); // Actualizar estrellas desbloqueo

            // Mostrar secciones relevantes post-login
            levelSelectSection.style.display = 'block'; // <-- Mostrar Selección Nivel
            unlockProgressSection.style.display = 'block';
            highScoresSection.style.display = 'block';
             console.log("Secciones post-login mostradas."); // Log

        } catch (error) {
            console.error("Error en showLevelSelection:", error); // Log error
        }
    }
    function startGame(levelToPlay) { /* ... (sin cambios lógicos) ... */
        console.log(`Iniciando juego para ${currentUsername} en nivel ${levelToPlay}`);
        currentLevel = levelToPlay; currentScore = 0; questionsAnswered = 0; correctAnswersThisRound = 0;
        scoreDisplay.textContent = currentScore; levelDisplay.textContent = currentLevel;
        userSetupSection.style.display = 'none'; levelSelectSection.style.display = 'none';
        gameOverSection.style.display = 'none'; unlockProgressSection.style.display = 'none';
        highScoresSection.style.display = 'none'; gameAreaSection.style.display = 'block';
        updateRoundProgressUI(); loadNextQuestion();
     }
    function displayQuestion(questionHTML, optionsArray) { /* ... (sin cambios lógicos + console.log) ... */
        console.log("Mostrando pregunta:", questionHTML);
        try {
             questionText.innerHTML = questionHTML; optionsContainer.innerHTML = '';
             optionsArray.forEach(optionText => {
                 const button = document.createElement('button'); button.textContent = optionText;
                 button.classList.add('option-button'); button.addEventListener('click', handleAnswerClick);
                 optionsContainer.appendChild(button);
             });
             feedbackArea.textContent = ''; optionsContainer.classList.remove('options-disabled');
         } catch (error) { console.error("Error en displayQuestion:", error); } // Log error
    }
    function loadNextQuestion() { /* ... (sin cambios lógicos + console.log + try/catch) ... */
        console.log("Cargando siguiente pregunta..."); feedbackArea.textContent = ''; optionsContainer.classList.remove('options-disabled');
        let questionData;
        try {
            if (currentLevel === 'Entry') {
                const questionTypes = [ generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion, generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion ];
                const randomIndex = getRandomInt(0, questionTypes.length - 1);
                const generatorFunction = questionTypes[randomIndex];
                console.log("Generador seleccionado:", generatorFunction.name);
                questionData = generatorFunction();
            } else if (currentLevel === 'Associate') { /* ... */ return; }
            else if (currentLevel === 'Professional') { /* ... */ return; }
            else { console.error("Nivel desconocido:", currentLevel); showLevelSelection(); return; }

            if (questionData && questionData.question && questionData.options && Array.isArray(questionData.options)) {
                displayQuestion(questionData.question, questionData.options);
            } else {
                 console.error("questionData inválido recibido:", questionData);
                 questionText.innerHTML = "Error: Datos de pregunta inválidos."; optionsContainer.innerHTML = '';
                 setTimeout(loadNextNextQuestion, 1000); // Reintentar
            }
        } catch (error) {
            console.error("Error fatal en loadNextQuestion:", error); // Log error grave
            questionText.innerHTML = "Error al cargar pregunta."; optionsContainer.innerHTML = '';
        }
     }
    function handleAnswerClick(event) { /* ... (sin cambios lógicos + console.log) ... */ }
    function endGame() { /* ... (sin cambios lógicos + console.log) ... */ }

    // --- Funciones de Puntuaciones Altas ---
    function saveHighScore(name, score) { /* ... (sin cambios lógicos + console.log) ... */ }
    function loadHighScores() { /* ... (sin cambios lógicos + console.log) ... */ }


    // --- Lógica de Inicio y Event Listeners ---
    function handleUserLogin(username) {
         console.log("handleUserLogin llamado con:", username); // Log
         currentUsername = username;
         try {
             currentUserData = getUserData(username); // Cargar datos del usuario
             saveUserData(username, currentUserData); // Guardar por si es nuevo
             usernameDisplay.textContent = currentUsername;
             showLevelSelection(); // Mostrar pantalla de selección de nivel
         } catch (error) {
             console.error("Error durante handleUserLogin:", error); // Log error
             alert("Hubo un problema al cargar los datos del usuario.");
         }
    }

    // Cargar puntuaciones al inicio (puede quedar antes o después de listeners)
    loadHighScores();

    // Listener para el formulario de username
    if (usernameForm) { // Verificar que el formulario existe antes de añadir listener
        usernameForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Siempre prevenir default
            console.log("Formulario de usuario enviado."); // Log
            const enteredUsername = usernameInput.value.trim();
            if (enteredUsername) {
                handleUserLogin(enteredUsername);
            } else {
                alert("Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("No se encontró el formulario #username-form"); // Log error si no existe
    }

    // Listener para el botón "Jugar de Nuevo"
    if(playAgainButton) { // Verificar que existe
        playAgainButton.addEventListener('click', showLevelSelection);
    } else {
         console.error("No se encontró el botón #play-again-button"); // Log error si no existe
    }


    // Ocultar secciones post-login al inicio
    if(levelSelectSection) levelSelectSection.style.display = 'none';
    if(unlockProgressSection) unlockProgressSection.style.display = 'none';
    if(highScoresSection) highScoresSection.style.display = 'none';
    if(gameAreaSection) gameAreaSection.style.display = 'none';
    if(gameOverSection) gameOverSection.style.display = 'none';

    console.log("Setup inicial de JS completado."); // Log final

}); // Fin del DOMContentLoaded
