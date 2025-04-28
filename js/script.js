// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Iniciando IP Sprint JS..."); // Log inicial

    // --- Selección de Elementos del DOM ---
    const userSetupSection = document.getElementById('user-setup');
    const levelSelectSection = document.getElementById('level-select');
    const gameAreaSection = document.getElementById('game-area');
    const gameOverSection = document.getElementById('game-over');
    const highScoresSection = document.getElementById('high-scores-section');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');
    const levelButtonsContainer = document.getElementById('level-buttons-container');
    const unlockProgressDiv = document.getElementById('unlock-progress');
    const progressStarsSpan = document.getElementById('progress-stars');
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
    let currentUserData = {};
    let currentScore = 0;
    let currentLevel = '';
    let correctAnswer = null;
    let questionsAnswered = 0;
    const TOTAL_QUESTIONS_PER_GAME = 10;
    const MAX_HIGH_SCORES = 10;
    const POINTS_PER_QUESTION = 10;
    const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION;

    // Claves para localStorage
    const USER_DATA_KEY = 'ipSprintUserData';
    const HIGH_SCORES_KEY = 'ipSprintHighScores';

    // --- Funciones de Gestión de Datos de Usuario ---
    function getAllUserData() { /* ... (sin cambios) ... */
        return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {};
     }
    function getUserData(username) { /* ... (sin cambios) ... */
        const allUserData = getAllUserData();
        if (allUserData[username]) {
             allUserData[username].unlockedLevels = allUserData[username].unlockedLevels || ['Entry'];
             allUserData[username].entryPerfectStreak = allUserData[username].entryPerfectStreak || 0;
            return allUserData[username];
        } else { return { unlockedLevels: ['Entry'], entryPerfectStreak: 0 }; }
     }
    function saveUserData(username, userData) { /* ... (sin cambios) ... */
        if (!username) return;
        const allUserData = getAllUserData(); allUserData[username] = userData;
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
    // Asegúrate de que estas 6 funciones estén aquí completas
    function generateClassQuestion() {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'D' || info.class === 'E') info.defaultMask = 'N/A';
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E'].filter(c => c); // Asegurar que no haya clases vacías si getIpInfo falla
        correctAnswer = info.class;
        console.log("generateClassQuestion:", { ip, info, question, options, correctAnswer }); // Log de depuración
        return { question, options };
     }
    function generateTypeQuestion() {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 100);
         if(attempts >= 100) { // Fallback si no encontramos una adecuada rápido
             ip = '8.8.8.8'; info = getIpInfo(ip);
         }
        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada'];
        correctAnswer = info.type;
         console.log("generateTypeQuestion:", { ip, info, question, options, correctAnswer }); // Log de depuración
        return { question, options };
    }
    function generateDefaultMaskQuestion() {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C') && attempts < 100);
         if(attempts >= 100) { // Fallback
             ip = '192.168.1.1'; info = getIpInfo(ip);
         }
        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        correctAnswer = info.defaultMask;
         console.log("generateDefaultMaskQuestion:", { ip, info, question, options, correctAnswer }); // Log de depuración
        return { question, options };
    }
    function generateSelectClassQuestion() {
        const targetClasses = ['A', 'B', 'C'];
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set(); // Para evitar duplicados
        // Generar IP correcta
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).class === targetClass) { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { // Fallback
             if(targetClass === 'A') correctIp = '10.1.1.1';
             else if(targetClass === 'B') correctIp = '172.16.1.1';
             else correctIp = '192.168.1.1';
             ipSet.add(correctIp);
        }
        // Generar IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).class !== targetClass && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) incorrectIps.push(ip); } // Rellenar si faltan
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        console.log("generateSelectClassQuestion:", { question, options, correctAnswer }); // Log de depuración
        return { question, options };
     }
    function generateSelectPrivateIpQuestion() {
        const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Privada') { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) incorrectIps.push(ip); } // Rellenar
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
         console.log("generateSelectPrivateIpQuestion:", { question, options, correctAnswer }); // Log de depuración
        return { question, options };
     }
    function generateSelectIpByDefaultMaskQuestion() {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).defaultMask === targetMask) { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) incorrectIps.push(ip); } // Rellenar
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
         console.log("generateSelectIpByDefaultMaskQuestion:", { question, options, correctAnswer }); // Log de depuración
        return { question, options };
    }

    // --- Funciones UI / Flujo ---
    function showLevelSelection() { /* ... (sin cambios) ... */
        console.log("Mostrando selección de nivel para:", currentUsername); // Log
        userSetupSection.style.display = 'none'; gameAreaSection.style.display = 'none'; gameOverSection.style.display = 'none';
        levelButtonsContainer.innerHTML = ''; const unlocked = currentUserData.unlockedLevels || ['Entry'];
        unlocked.forEach(level => {
            const button = document.createElement('button'); button.textContent = `Jugar Nivel ${level}`;
            button.addEventListener('click', () => startGame(level)); levelButtonsContainer.appendChild(button);
        });
        updateUnlockProgressUI(); levelSelectSection.style.display = 'block';
    }
    function updateUnlockProgressUI() { /* ... (sin cambios) ... */
        if (!currentUserData.unlockedLevels?.includes('Associate')) { // Optional chaining
            const streak = currentUserData.entryPerfectStreak || 0; let stars = '';
            for (let i = 0; i < 3; i++) { stars += (i < streak) ? '★' : '☆'; }
            progressStarsSpan.textContent = stars; unlockProgressDiv.style.display = 'block';
        } else { unlockProgressDiv.style.display = 'none'; }
     }
    function startGame(levelToPlay) { /* ... (sin cambios) ... */
        console.log(`Iniciando juego para ${currentUsername} en nivel ${levelToPlay}`);
        currentLevel = levelToPlay; currentScore = 0; questionsAnswered = 0;
        scoreDisplay.textContent = currentScore; levelDisplay.textContent = currentLevel;
        userSetupSection.style.display = 'none'; levelSelectSection.style.display = 'none';
        gameOverSection.style.display = 'none'; gameAreaSection.style.display = 'block';
        loadNextQuestion();
     }
    function displayQuestion(questionHTML, optionsArray) { /* ... (sin cambios) ... */
        console.log("Mostrando pregunta:", questionHTML); // Log
        questionText.innerHTML = questionHTML; optionsContainer.innerHTML = '';
        optionsArray.forEach(optionText => {
            const button = document.createElement('button'); button.textContent = optionText;
            button.classList.add('option-button'); button.addEventListener('click', handleAnswerClick);
            optionsContainer.appendChild(button);
        });
        feedbackArea.textContent = ''; optionsContainer.classList.remove('options-disabled');
    }
    function loadNextQuestion() { /* ... (sin cambios) ... */
        console.log("Cargando siguiente pregunta..."); // Log
        feedbackArea.textContent = ''; optionsContainer.classList.remove('options-disabled');
        let questionData;
        if (currentLevel === 'Entry') {
            const questionTypes = [ generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion, generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion ];
            const randomIndex = getRandomInt(0, questionTypes.length - 1);
            const generatorFunction = questionTypes[randomIndex];
            console.log("Generador seleccionado:", generatorFunction.name); // Log
            try {
                questionData = generatorFunction();
            } catch (error) {
                console.error("Error al generar pregunta con:", generatorFunction.name, error);
                // Mostrar un error o intentar con otro tipo de pregunta? Por ahora, log.
                 questionText.innerHTML = "Error al generar pregunta. Intenta recargar.";
                 optionsContainer.innerHTML = '';
                return; // Detener si hay error
            }
        } else if (currentLevel === 'Associate') { /* ... (lógica placeholder) ... */
             questionText.innerHTML = `Pregunta de Nivel <strong>Associate</strong>... (¡Implementación Pendiente!)`;
             optionsContainer.innerHTML = '<p>Próximamente...</p>'; setTimeout(endGame, 2000); return;
        } else if (currentLevel === 'Professional') { /* ... (lógica placeholder) ... */
            questionText.innerHTML = `Pregunta de Nivel <strong>Professional</strong>... (¡Implementación Pendiente!)`;
             optionsContainer.innerHTML = '<p>Próximamente...</p>'; setTimeout(endGame, 2000); return;
        } else { console.error("Nivel desconocido:", currentLevel); showLevelSelection(); return; }

        // Asegurarse que questionData es válido antes de mostrar
        if (questionData && questionData.question && questionData.options) {
            displayQuestion(questionData.question, questionData.options);
        } else {
             console.error("questionData inválido recibido del generador:", questionData);
             questionText.innerHTML = "Error: Datos de pregunta inválidos.";
             optionsContainer.innerHTML = '';
             // Podríamos intentar cargar otra pregunta aquí
             setTimeout(loadNextQuestion, 1000); // Reintentar tras 1 seg
        }
    }
    function handleAnswerClick(event) { /* ... (sin cambios) ... */
        const selectedButton = event.target; const selectedAnswer = selectedButton.textContent;
        console.log("Respuesta seleccionada:", selectedAnswer, "Correcta:", correctAnswer); // Log
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
        console.log("Preguntas respondidas:", questionsAnswered, "/", TOTAL_QUESTIONS_PER_GAME); // Log
        if (questionsAnswered >= TOTAL_QUESTIONS_PER_GAME) { setTimeout(endGame, 1500); }
        else { setTimeout(loadNextQuestion, 1500); }
     }
    function endGame() { /* ... (sin cambios lógicos, sólo se añade console.log) ... */
        console.log("Juego terminado. Nivel:", currentLevel, "Puntuación final:", currentScore);
        const isPerfect = (currentScore === PERFECT_SCORE); let message = "¡Partida completada!";
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
        saveHighScore(currentUsername, currentScore); loadHighScores(); highScoreMessage.textContent = message; updateUnlockProgressUI();
        gameAreaSection.style.display = 'none'; levelSelectSection.style.display = 'none'; gameOverSection.style.display = 'block'; finalScoreDisplay.textContent = currentScore;
     }

    // --- Funciones de Puntuaciones Altas ---
    function saveHighScore(name, score) { /* ... (sin cambios) ... */
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
    function loadHighScores() { /* ... (sin cambios) ... */
        console.log("Cargando puntuaciones altas..."); // Log
        const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || []; scoreList.innerHTML = '';
        if (highScores.length === 0) { scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>'; return; }
        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, MAX_HIGH_SCORES);
        topScores.forEach(scoreItem => {
            const li = document.createElement('li'); li.textContent = `${scoreItem.name}: `;
            const strong = document.createElement('strong'); strong.textContent = scoreItem.score;
            li.appendChild(strong); scoreList.appendChild(li);
        });
        console.log("Puntuaciones altas mostradas."); // Log
     }

    // --- Lógica de Inicio y Event Listeners ---
    function handleUserLogin(username) { /* ... (sin cambios) ... */
         currentUsername = username; currentUserData = getUserData(username);
         saveUserData(username, currentUserData); // Guardar por si es usuario nuevo
         usernameDisplay.textContent = currentUsername;
         showLevelSelection();
     }
    loadHighScores();
    usernameForm.addEventListener('submit', (event) => { /* ... (sin cambios) ... */
        event.preventDefault(); const enteredUsername = usernameInput.value.trim();
        if (enteredUsername) { handleUserLogin(enteredUsername); }
        else { alert("Por favor, ingresa un nombre de usuario."); }
    });
    playAgainButton.addEventListener('click', showLevelSelection);

}); // Fin del DOMContentLoaded
