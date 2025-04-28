// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
    const userSetupSection = document.getElementById('user-setup');
    const levelSelectSection = document.getElementById('level-select'); // NUEVO
    const gameAreaSection = document.getElementById('game-area');
    const gameOverSection = document.getElementById('game-over');
    const highScoresSection = document.getElementById('high-scores-section');

    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');

    const levelButtonsContainer = document.getElementById('level-buttons-container'); // NUEVO
    const unlockProgressDiv = document.getElementById('unlock-progress'); // NUEVO
    const progressStarsSpan = document.getElementById('progress-stars'); // NUEVO

    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');

    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreMessage = document.getElementById('high-score-message');
    const playAgainButton = document.getElementById('play-again-button');

    const scoreList = document.getElementById('score-list');

    // --- Variables de Estado del Juego ---
    let currentUsername = '';
    let currentUserData = {}; // Almacenará { unlockedLevels: [], entryPerfectStreak: 0, ... }
    let currentScore = 0;
    let currentLevel = ''; // Se establece al seleccionar nivel
    let correctAnswer = null;
    let questionsAnswered = 0;
    const TOTAL_QUESTIONS_PER_GAME = 10;
    const MAX_HIGH_SCORES = 10;
    const POINTS_PER_QUESTION = 10; // Definir puntos por pregunta
    const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION; // Puntuación perfecta

    // Claves para localStorage
    const USER_DATA_KEY = 'ipSprintUserData';
    const HIGH_SCORES_KEY = 'ipSprintHighScores';

    // --- Funciones de Gestión de Datos de Usuario ---

    /** Obtiene todos los datos de usuario de localStorage */
    function getAllUserData() {
        return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {};
    }

    /** Obtiene los datos de un usuario específico o valores por defecto */
    function getUserData(username) {
        const allUserData = getAllUserData();
        if (allUserData[username]) {
            // Asegurarse de que tenga las propiedades esperadas
             allUserData[username].unlockedLevels = allUserData[username].unlockedLevels || ['Entry'];
             allUserData[username].entryPerfectStreak = allUserData[username].entryPerfectStreak || 0;
            return allUserData[username];
        } else {
            // Valores por defecto para nuevo usuario
            return { unlockedLevels: ['Entry'], entryPerfectStreak: 0 };
        }
    }

    /** Guarda los datos actualizados de un usuario específico */
    function saveUserData(username, userData) {
        if (!username) return;
        const allUserData = getAllUserData();
        allUserData[username] = userData;
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
        console.log(`Datos guardados para ${username}:`, userData);
    }


    // --- Funciones de Utilidad ---
    function getRandomInt(min, max) { /* ... (sin cambios) ... */
        min = Math.ceil(min); max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
     }
    function generateRandomIp() { /* ... (sin cambios) ... */
        const oct1 = getRandomInt(1, 254); const oct2 = getRandomInt(0, 255);
        const oct3 = getRandomInt(0, 255); const oct4 = getRandomInt(1, 254);
        return `${oct1}.${oct2}.${oct3}.${oct4}`;
     }
    function getIpInfo(ipString) { /* ... (sin cambios) ... */
        const octets = ipString.split('.').map(Number); const firstOctet = octets[0];
        let ipClass = ''; let ipType = 'Pública'; let defaultMask = 'N/A';
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'N/A'; }
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'N/A'; }
        else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; }
        if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { if (ipType !== 'Loopback') ipType = 'Privada'; }
        return { class: ipClass, type: ipType, defaultMask: defaultMask };
     }
    function shuffleArray(array) { /* ... (sin cambios) ... */
        for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
     }

    // --- Generadores de Preguntas (Nivel Entry) ---
    // (generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion,
    //  generateSelectClassQuestion, generateSelectPrivateIpQuestion,
    //  generateSelectIpByDefaultMaskQuestion)
    // SIN CAMBIOS - Coloca aquí las 6 funciones generadoras que ya teníamos

    function generateClassQuestion() { /* ... (código existente) ... */ }
    function generateTypeQuestion() { /* ... (código existente) ... */ }
    function generateDefaultMaskQuestion() { /* ... (código existente) ... */ }
    function generateSelectClassQuestion() { /* ... (código existente) ... */ }
    function generateSelectPrivateIpQuestion() { /* ... (código existente) ... */ }
    function generateSelectIpByDefaultMaskQuestion() { /* ... (código existente) ... */ }


    // --- Funciones UI / Flujo ---

    /** Muestra la pantalla de selección de nivel */
    function showLevelSelection() {
        userSetupSection.style.display = 'none';
        gameAreaSection.style.display = 'none';
        gameOverSection.style.display = 'none';

        levelButtonsContainer.innerHTML = ''; // Limpiar botones anteriores
        const unlocked = currentUserData.unlockedLevels || ['Entry']; // Asegurar al menos Entry

        unlocked.forEach(level => {
            const button = document.createElement('button');
            button.textContent = `Jugar Nivel ${level}`;
            button.addEventListener('click', () => startGame(level)); // Iniciar juego con el nivel elegido
            levelButtonsContainer.appendChild(button);
        });

        updateUnlockProgressUI(); // Mostrar/actualizar estrellas
        levelSelectSection.style.display = 'block'; // Mostrar esta sección
    }

     /** Actualiza la UI de progreso de desbloqueo (estrellas) */
    function updateUnlockProgressUI() {
        // Solo mostrar progreso para Associate si aún no está desbloqueado
        if (!currentUserData.unlockedLevels.includes('Associate')) {
            const streak = currentUserData.entryPerfectStreak || 0;
            let stars = '';
            for (let i = 0; i < 3; i++) {
                stars += (i < streak) ? '★' : '☆'; // Estrella llena o vacía
            }
            progressStarsSpan.textContent = stars;
            unlockProgressDiv.style.display = 'block'; // Mostrar progreso
        } else {
            unlockProgressDiv.style.display = 'none'; // Ocultar si Associate ya está desbloqueado
        }
    }

    /** Inicia una nueva partida en el nivel especificado */
    function startGame(levelToPlay) {
        console.log(`Iniciando juego para ${currentUsername} en nivel ${levelToPlay}`);
        currentLevel = levelToPlay; // Establecer nivel actual
        currentScore = 0;
        questionsAnswered = 0;
        scoreDisplay.textContent = currentScore;
        levelDisplay.textContent = currentLevel; // Mostrar nivel actual

        userSetupSection.style.display = 'none';
        levelSelectSection.style.display = 'none'; // Ocultar selección de nivel
        gameOverSection.style.display = 'none';
        gameAreaSection.style.display = 'block'; // Mostrar área de juego

        loadNextQuestion();
    }

    function displayQuestion(questionHTML, optionsArray) { /* ... (sin cambios) ... */
        questionText.innerHTML = questionHTML; optionsContainer.innerHTML = '';
        optionsArray.forEach(optionText => {
            const button = document.createElement('button'); button.textContent = optionText;
            button.classList.add('option-button'); button.addEventListener('click', handleAnswerClick);
            optionsContainer.appendChild(button);
        });
        feedbackArea.textContent = ''; optionsContainer.classList.remove('options-disabled');
    }

    function loadNextQuestion() { /* ... (modificado para usar currentLevel y manejar otros niveles) ... */
        feedbackArea.textContent = ''; optionsContainer.classList.remove('options-disabled');
        let questionData;

        if (currentLevel === 'Entry') {
            const questionTypes = [ generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion, generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion ];
            const randomIndex = getRandomInt(0, questionTypes.length - 1);
            const generatorFunction = questionTypes[randomIndex];
            questionData = generatorFunction();
        } else if (currentLevel === 'Associate') {
             // TODO: Implementar generadores para Associate
             questionText.innerHTML = `Pregunta de Nivel <strong>Associate</strong>... (¡Implementación Pendiente!)`;
             optionsContainer.innerHTML = '<p>Próximamente...</p>';
             setTimeout(endGame, 2000); // Terminar el juego por ahora
             return;
        } else if (currentLevel === 'Professional') {
             // TODO: Implementar generadores para Professional
             questionText.innerHTML = `Pregunta de Nivel <strong>Professional</strong>... (¡Implementación Pendiente!)`;
             optionsContainer.innerHTML = '<p>Próximamente...</p>';
              setTimeout(endGame, 2000); // Terminar el juego por ahora
             return;
        } else {
             // Nivel desconocido? Volver a selección
             console.error("Nivel desconocido:", currentLevel);
             showLevelSelection();
             return;
        }
        displayQuestion(questionData.question, questionData.options);
    }

    function handleAnswerClick(event) { /* ... (sin cambios en la lógica de acierto/fallo y puntuación) ... */
        const selectedButton = event.target; const selectedAnswer = selectedButton.textContent;
        optionsContainer.classList.add('options-disabled');
        if (selectedAnswer === correctAnswer) {
            currentScore += POINTS_PER_QUESTION; scoreDisplay.textContent = currentScore;
            feedbackArea.textContent = "¡Correcto! ✔️"; feedbackArea.className = 'correct';
            selectedButton.classList.add('correct');
        } else {
            feedbackArea.textContent = `Incorrecto. La respuesta era: ${correctAnswer} ❌`; feedbackArea.className = 'incorrect';
            selectedButton.classList.add('incorrect');
            Array.from(optionsContainer.children).forEach(button => { if (button.textContent === correctAnswer) button.classList.add('correct'); });
        }
        questionsAnswered++;
        if (questionsAnswered >= TOTAL_QUESTIONS_PER_GAME) { setTimeout(endGame, 1500); }
        else { setTimeout(loadNextQuestion, 1500); }
    }

    /** Finaliza la partida, actualiza datos de usuario y muestra pantalla Game Over */
    function endGame() {
        console.log("Juego terminado. Nivel:", currentLevel, "Puntuación final:", currentScore);

        const isPerfect = (currentScore === PERFECT_SCORE);
        let message = "¡Partida completada!"; // Mensaje por defecto

        // Actualizar racha y desbloqueo SOLO si se jugó en Entry
        if (currentLevel === 'Entry') {
             // Obtener datos actuales para este usuario
             currentUserData = getUserData(currentUsername); // Asegurar tener los últimos datos

            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                console.log("Ronda perfecta en Entry! Racha actual:", currentUserData.entryPerfectStreak);

                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0; // Resetear al desbloquear
                     message = "¡3 Rondas Perfectas! ¡Nivel Associate Desbloqueado! 🎉";
                    console.log("Nivel Associate desbloqueado!");
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                     message = `¡Ronda Perfecta! Racha: ${currentUserData.entryPerfectStreak}/3. ¡Sigue así!`;
                } else {
                     message = "¡Ronda Perfecta!"; // Ya tenía Associate desbloqueado
                }
            } else {
                // No fue perfecta, resetear racha si había alguna
                 if (currentUserData.entryPerfectStreak > 0) {
                     console.log("Racha de rondas perfectas reiniciada.");
                 }
                currentUserData.entryPerfectStreak = 0;
                message = "¡Partida completada!"; // Mensaje normal si no fue perfecta
            }
            // Guardar los datos actualizados del usuario (racha y/o niveles)
             saveUserData(currentUsername, currentUserData);
        } else {
             // Lógica si se termina en otro nivel (Associate, Pro) - por ahora solo mensaje estándar
             message = "¡Partida completada!";
        }

        // Guardar puntuación alta (la función ya maneja duplicados y top N)
        saveHighScore(currentUsername, currentScore);
        // Recargar y mostrar la lista actualizada
        loadHighScores();
        // Actualizar el mensaje final y las estrellas (si aplica)
        highScoreMessage.textContent = message;
        updateUnlockProgressUI(); // Actualizar estrellas al final


        // Mostrar pantalla Game Over
        gameAreaSection.style.display = 'none';
        levelSelectSection.style.display = 'none'; // Asegurar que selección esté oculta
        gameOverSection.style.display = 'block';
        finalScoreDisplay.textContent = currentScore;
    }

    // --- Funciones de Puntuaciones Altas ---
    function saveHighScore(name, score) { /* ... (sin cambios, usa HIGH_SCORES_KEY) ... */
        if (!name || score === undefined) return;
        const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
        const newScore = { name, score }; highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        const uniqueUserScores = []; const userNames = new Set();
        for (const scoreEntry of highScores) { if (!userNames.has(scoreEntry.name)) { uniqueUserScores.push(scoreEntry); userNames.add(scoreEntry.name); } }
        const finalScores = uniqueUserScores.slice(0, MAX_HIGH_SCORES);
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(finalScores));
        console.log("Puntuaciones (únicas por usuario y top N) guardadas:", finalScores);
     }
    function loadHighScores() { /* ... (sin cambios, usa HIGH_SCORES_KEY) ... */
        const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
        scoreList.innerHTML = '';
        if (highScores.length === 0) { scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>'; return; }
        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, MAX_HIGH_SCORES);
        topScores.forEach(scoreItem => {
            const li = document.createElement('li'); li.textContent = `${scoreItem.name}: `;
            const strong = document.createElement('strong'); strong.textContent = scoreItem.score;
            li.appendChild(strong); scoreList.appendChild(li);
        });
     }


    // --- Lógica de Inicio y Event Listeners ---

    /** Maneja el login inicial o el regreso al menú */
    function handleUserLogin(username) {
         currentUsername = username;
         currentUserData = getUserData(username); // Cargar datos del usuario
         // Guardar por si es usuario nuevo y necesita estructura default
         saveUserData(username, currentUserData);
         usernameDisplay.textContent = currentUsername; // Actualizar display por si acaso
         showLevelSelection(); // Mostrar pantalla de selección de nivel
    }

    // Cargar puntuaciones al inicio
    loadHighScores();

    // Listener para el formulario de username
    usernameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const enteredUsername = usernameInput.value.trim();
        if (enteredUsername) {
            handleUserLogin(enteredUsername); // Llama a la nueva función de manejo
        } else {
            alert("Por favor, ingresa un nombre de usuario.");
        }
    });

    // Listener para el botón "Jugar de Nuevo" (ahora "Elegir Nivel")
    // Debería llevar de vuelta a la selección de nivel
    playAgainButton.addEventListener('click', showLevelSelection); // Cambiado de startGame a showLevelSelection


    // --- TODO ---
    // Implementar generadores de preguntas para Associate y Professional
    // Refinar generación de IP si es necesario (ej. para asegurar tipos específicos)
    // Mejorar UI/UX (animaciones más fluidas, mensajes más claros, etc.)

}); // Fin del DOMContentLoaded
