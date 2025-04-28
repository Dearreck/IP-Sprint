// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
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

    // --- Variables de Estado del Juego ---
    let currentUsername = '';
    let currentUserData = {};
    let currentScore = 0;
    let currentLevel = '';
    let correctAnswer = null;
    let questionsAnswered = 0;
    let roundResults = []; // Guarda true/false por cada pregunta de la ronda
    const TOTAL_QUESTIONS_PER_GAME = 10;
    const MAX_HIGH_SCORES = 10;
    const POINTS_PER_QUESTION = 10;
    const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION;
    const USER_DATA_KEY = 'ipSprintUserData';
    const HIGH_SCORES_KEY = 'ipSprintHighScores';

    // --- Funciones de Gestión de Datos de Usuario ---
    function getAllUserData() {
        try { return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {}; }
        catch (error) { console.error("Error al parsear UserData:", error); return {}; }
    }
    function getUserData(username) {
        const allUserData = getAllUserData();
        if (allUserData[username]) {
             allUserData[username].unlockedLevels = allUserData[username].unlockedLevels || ['Entry'];
             allUserData[username].entryPerfectStreak = allUserData[username].entryPerfectStreak || 0;
             allUserData[username].associatePerfectStreak = allUserData[username].associatePerfectStreak || 0;
            return allUserData[username];
        } else {
            return { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
        }
     }
    function saveUserData(username, userData) {
        if (!username || !userData) return;
        const allUserData = getAllUserData(); allUserData[username] = userData;
        try { localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData)); }
        catch (error) { console.error("Error al guardar UserData:", error); }
     }

    // --- Funciones de Utilidad ---
    function getRandomInt(min, max) {
        min = Math.ceil(min); max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
     }
    function generateRandomIp() {
        const oct1 = getRandomInt(1, 254); const oct2 = getRandomInt(0, 255);
        const oct3 = getRandomInt(0, 255); const oct4 = getRandomInt(1, 254);
        return `${oct1}.${oct2}.${oct3}.${oct4}`;
     }
    function getIpInfo(ipString) {
        try {
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
        } catch (error) { console.error("Error en getIpInfo con IP:", ipString, error); return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; }
     }
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
     }

    // --- Generadores de Preguntas (Nivel Entry) ---
    function generateClassQuestion() {
        const ip = generateRandomIp(); const info = getIpInfo(ip);
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E']; correctAnswer = info.class;
        if (!options.includes(correctAnswer)) correctAnswer = options[0];
        return { question, options };
     }
    function generateTypeQuestion() {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '8.8.8.8'; info = getIpInfo(ip); }
        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada']; correctAnswer = info.type;
         if (!options.includes(correctAnswer)) correctAnswer = options[0];
        return { question, options };
    }
    function generateDefaultMaskQuestion() {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C') && attempts < 100);
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }
        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; correctAnswer = info.defaultMask;
        if (!options.includes(correctAnswer)) correctAnswer = options[0];
        return { question, options };
    }
    function generateSelectClassQuestion() {
        const targetClasses = ['A', 'B', 'C']; const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).class === targetClass) { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).class !== targetClass && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } else { attempts++; if(attempts > 500) break;} }
        if(incorrectIps.length < 3) incorrectIps.push('8.8.8.8', '8.8.4.4', '1.1.1.1');
        incorrectIps = incorrectIps.slice(0, 3);
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        return { question, options };
     }
    function generateSelectPrivateIpQuestion() {
        const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Privada') { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } else { attempts++; if(attempts > 500) break;} }
        if(incorrectIps.length < 3) incorrectIps.push('8.8.8.8', '8.8.4.4', '1.1.1.1');
        incorrectIps = incorrectIps.slice(0, 3);
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        return { question, options };
     }
    function generateSelectIpByDefaultMaskQuestion() {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).defaultMask === targetMask) { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } else { attempts++; if(attempts > 500) break;} }
        if(incorrectIps.length < 3) incorrectIps.push('8.8.8.8', '8.8.4.4', '1.1.1.1');
        incorrectIps = incorrectIps.slice(0, 3);
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        return { question, options };
    }

    // --- Funciones UI / Flujo ---
    function updateUnlockProgressUI() {
        try {
             if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan) return;
             unlockProgressSection.style.display = 'block';
             const unlocked = currentUserData.unlockedLevels || ['Entry'];
             const entryStreak = currentUserData.entryPerfectStreak || 0;
             const associateStreak = currentUserData.associatePerfectStreak || 0;
             let targetLevel = null; let currentStreak = 0; let progressTitle = ""; let showProgress = false;
             if (!unlocked.includes('Associate')) { targetLevel = 'Associate'; currentStreak = entryStreak; progressTitle = "Progreso para Nivel Associate:"; showProgress = true; }
             else if (!unlocked.includes('Professional')) { targetLevel = 'Professional'; currentStreak = associateStreak; progressTitle = "Progreso para Nivel Professional:"; showProgress = true; }
             else { targetLevel = 'None'; progressTitle = "¡Todos los niveles desbloqueados!"; showProgress = false; }
             const titleElement = unlockProgressDiv.querySelector('h4'); if (titleElement) titleElement.textContent = progressTitle;
             if (showProgress) { let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; } progressStarsSpan.textContent = stars; unlockProgressDiv.style.display = 'block'; }
             else { unlockProgressDiv.style.display = 'none'; }
         } catch(error) { console.error("Error en updateUnlockProgressUI:", error); }
    }
    function updateRoundProgressUI() {
        try {
             if (!roundProgressStarsDiv) return;
             let starsHTML = '';
             for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) {
                 if (i < roundResults.length) {
                     starsHTML += roundResults[i] ? '<i class="fas fa-star star-correct"></i>' : '<i class="fas fa-star star-incorrect"></i>';
                 } else {
                     starsHTML += '<i class="far fa-star star-pending"></i>';
                 }
             }
             roundProgressStarsDiv.innerHTML = starsHTML;
         } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
    }
    function showLevelSelection() {
        try {
            if (!currentUserData || !currentUserData.unlockedLevels) { console.error("currentUserData no listo en showLevelSelection"); return; }
            if(userSetupSection) userSetupSection.style.display = 'none'; if(gameAreaSection) gameAreaSection.style.display = 'none'; if(gameOverSection) gameOverSection.style.display = 'none';
            if(levelButtonsContainer) levelButtonsContainer.innerHTML = ''; const unlocked = currentUserData.unlockedLevels;
            unlocked.forEach(level => {
                const button = document.createElement('button'); button.textContent = `Jugar Nivel ${level}`;
                button.addEventListener('click', () => startGame(level)); if(levelButtonsContainer) levelButtonsContainer.appendChild(button);
            });
            if(levelSelectSection) levelSelectSection.style.display = 'block'; if(unlockProgressSection) unlockProgressSection.style.display = 'block'; if(highScoresSection) highScoresSection.style.display = 'block';
            updateUnlockProgressUI();
        } catch (error) { console.error("Error en showLevelSelection:", error); }
    }
    function startGame(levelToPlay) {
        currentLevel = levelToPlay; currentScore = 0; questionsAnswered = 0; roundResults = []; // Resetear resultados de ronda
        if(scoreDisplay) scoreDisplay.textContent = currentScore; if(levelDisplay) levelDisplay.textContent = currentLevel;
        if(userSetupSection) userSetupSection.style.display = 'none'; if(levelSelectSection) levelSelectSection.style.display = 'none';
        if(gameOverSection) gameOverSection.style.display = 'none'; if(unlockProgressSection) unlockProgressSection.style.display = 'none';
        if(highScoresSection) highScoresSection.style.display = 'none'; if(gameAreaSection) gameAreaSection.style.display = 'block';
        updateRoundProgressUI(); loadNextQuestion();
     }
    function displayQuestion(questionHTML, optionsArray) {
        try {
             if(!questionText || !optionsContainer || !feedbackArea) { console.error("Elementos de UI faltan en displayQuestion"); return; }
             questionText.innerHTML = questionHTML; optionsContainer.innerHTML = '';
             if (!optionsArray || !Array.isArray(optionsArray)) { throw new Error("optionsArray inválido"); }
             optionsArray.forEach(optionText => {
                 const button = document.createElement('button'); button.textContent = optionText; button.classList.add('option-button');
                 button.addEventListener('click', handleAnswerClick); optionsContainer.appendChild(button);
             });
             feedbackArea.textContent = ''; feedbackArea.className = ''; // Resetear clases feedback
             optionsContainer.classList.remove('options-disabled');
         } catch (error) { console.error("Error en displayQuestion:", error); }
    }
    function loadNextQuestion() {
        if(feedbackArea) feedbackArea.textContent = ''; if(optionsContainer) optionsContainer.classList.remove('options-disabled');
        let questionData = null;
        try {
            let generatorFunction = null;
            if (currentLevel === 'Entry') {
                const questionTypes = [ generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion, generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion ];
                const randomIndex = getRandomInt(0, questionTypes.length - 1); generatorFunction = questionTypes[randomIndex];
            } else if (currentLevel === 'Associate') { questionText.innerHTML = `Pregunta Nivel <strong>Associate</strong>... (Pendiente)`; optionsContainer.innerHTML = ''; setTimeout(endGame, 1000); return; }
            else if (currentLevel === 'Professional') { questionText.innerHTML = `Pregunta Nivel <strong>Professional</strong>... (Pendiente)`; optionsContainer.innerHTML = ''; setTimeout(endGame, 1000); return; }
            else { console.error("Nivel desconocido:", currentLevel); showLevelSelection(); return; }
            if (generatorFunction) { questionData = generatorFunction(); } else { throw new Error("No se pudo seleccionar generador."); }
            if (questionData && questionData.question && questionData.options && Array.isArray(questionData.options)) { displayQuestion(questionData.question, questionData.options); }
            else { throw new Error("questionData inválido generado por " + (generatorFunction ? generatorFunction.name : 'undefined')); }
        } catch (error) { console.error("Error en loadNextQuestion:", error); if(questionText) questionText.innerHTML = "Error al cargar pregunta."; if(optionsContainer) optionsContainer.innerHTML = ''; setTimeout(endGame, 1500); }
     }
     /** Función intermedia para avanzar */
     function proceedToNextStep() {
        questionsAnswered++;
        if (questionsAnswered >= TOTAL_QUESTIONS_PER_GAME) {
             endGame();
        } else {
             loadNextQuestion();
        }
    }
    /** Maneja el clic en un botón de respuesta */
    function handleAnswerClick(event) {
        const selectedButton = event.target; const selectedAnswer = selectedButton.textContent;
        if(optionsContainer) optionsContainer.classList.add('options-disabled');
        let isCorrect = (selectedAnswer === correctAnswer);
        roundResults.push(isCorrect); // Guardar resultado de esta pregunta

        if (isCorrect) {
            currentScore += POINTS_PER_QUESTION;
            if(scoreDisplay) scoreDisplay.textContent = currentScore;
            if(feedbackArea) { feedbackArea.textContent = "¡Correcto! ✔️"; feedbackArea.className = 'correct'; }
            if(selectedButton) selectedButton.classList.add('correct');
            // AVANCE AUTOMÁTICO
            setTimeout(proceedToNextStep, 1200); // Avanzar tras pausa
        } else {
            // incorrecto
            if(feedbackArea) {
                feedbackArea.textContent = `Incorrecto. La respuesta era: ${correctAnswer} ❌`;
                feedbackArea.className = 'incorrect';
            }
            if(selectedButton) selectedButton.classList.add('incorrect');
            if(optionsContainer) { Array.from(optionsContainer.children).forEach(button => { if (button.textContent === correctAnswer) button.classList.add('correct'); }); }

            // Crear y mostrar botón "Siguiente"
            const existingNextButton = document.getElementById('next-question-button');
            if(existingNextButton) existingNextButton.remove();
            const nextButton = document.createElement('button');
            nextButton.id = 'next-question-button';
            nextButton.textContent = (questionsAnswered + 1 >= TOTAL_QUESTIONS_PER_GAME) ? 'Ver Resultado Final' : 'Siguiente Pregunta'; // +1 porque questionsAnswered aún no se incrementó aquí
            nextButton.addEventListener('click', proceedToNextStep); // Llama a la función intermedia
            if(feedbackArea) feedbackArea.appendChild(nextButton);
        }
        correctAnswer = null; // Limpiar respuesta
        updateRoundProgressUI(); // Actualizar estrellas (amarillas o rojas)
        // questionsAnswered se incrementa en proceedToNextStep
     }
    /** Finaliza la partida */
    function endGame() {
        const isPerfect = (currentScore === PERFECT_SCORE); let message = "¡Partida completada!";
        try {
            currentUserData = getUserData(currentUsername);
            if (currentLevel === 'Entry') {
                if (isPerfect) {
                    currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                    if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) { currentUserData.unlockedLevels.push('Associate'); currentUserData.entryPerfectStreak = 0; message = "¡3 Rondas Perfectas! ¡Nivel Associate Desbloqueado! 🎉"; }
                    else if (!currentUserData.unlockedLevels.includes('Associate')) { message = `¡Ronda Perfecta! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`; } else { message = "¡Ronda Perfecta!"; }
                } else { if (currentUserData.entryPerfectStreak > 0) { /*Log opcional*/ } currentUserData.entryPerfectStreak = 0; message = "¡Partida completada!"; }
            } else if (currentLevel === 'Associate') {
                 if (isPerfect) {
                     currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                     if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) { currentUserData.unlockedLevels.push('Professional'); currentUserData.associatePerfectStreak = 0; message = "¡3 Rondas Perfectas! ¡Nivel Professional Desbloqueado! 🏆"; }
                     else if (!currentUserData.unlockedLevels.includes('Professional')) { message = `¡Ronda Perfecta en Associate! Racha: ${currentUserData.associatePerfectStreak}/3.`; } else { message = "¡Ronda Perfecta en Associate!"; }
                 } else { if (currentUserData.associatePerfectStreak > 0) { /*Log opcional*/ } currentUserData.associatePerfectStreak = 0; message = "¡Partida completada!"; }
            } else { message = "¡Partida completada!"; }
            saveUserData(currentUsername, currentUserData); saveHighScore(currentUsername, currentScore); loadHighScores();
            if(highScoreMessage) highScoreMessage.textContent = message; if(finalScoreDisplay) finalScoreDisplay.textContent = currentScore;
            if(gameAreaSection) gameAreaSection.style.display = 'none'; if(levelSelectSection) levelSelectSection.style.display = 'none';
            if(gameOverSection) gameOverSection.style.display = 'block'; if(unlockProgressSection) unlockProgressSection.style.display = 'block'; if(highScoresSection) highScoresSection.style.display = 'block';
             updateUnlockProgressUI();
         } catch (error) { console.error("Error en endGame:", error); }
     }

    // --- Funciones de Puntuaciones Altas ---
    function saveHighScore(name, score) { if (!name || score === undefined) return; try { const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || []; const newScore = { name, score }; highScores.push(newScore); highScores.sort((a, b) => b.score - a.score); const uniqueUserScores = []; const userNames = new Set(); for (const scoreEntry of highScores) { if (!userNames.has(scoreEntry.name)) { uniqueUserScores.push(scoreEntry); userNames.add(scoreEntry.name); } } const finalScores = uniqueUserScores.slice(0, MAX_HIGH_SCORES); localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(finalScores)); } catch (error) { console.error("Error en saveHighScore:", error); } }
    function loadHighScores() { try { const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || []; if(!scoreList) return; scoreList.innerHTML = ''; if (highScores.length === 0) { scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>'; return; } highScores.sort((a, b) => b.score - a.score); const topScores = highScores.slice(0, MAX_HIGH_SCORES); topScores.forEach(scoreItem => { const li = document.createElement('li'); li.textContent = `${scoreItem.name}: `; const strong = document.createElement('strong'); strong.textContent = scoreItem.score; li.appendChild(strong); scoreList.appendChild(li); }); } catch (error) { console.error("Error en loadHighScores:", error); if(scoreList) scoreList.innerHTML = '<li>Error al cargar puntuaciones.</li>'; } }

    // --- Lógica de Inicio y Event Listeners ---
    function handleUserLogin(username) {
         currentUsername = username;
         try {
             currentUserData = getUserData(username); saveUserData(username, currentUserData);
             if(usernameDisplay) usernameDisplay.textContent = currentUsername;
             if(highScoresSection) highScoresSection.style.display = 'block'; if(unlockProgressSection) unlockProgressSection.style.display = 'block';
             showLevelSelection();
         } catch (error) { console.error("Error durante handleUserLogin:", error); alert("Hubo un problema al cargar los datos del usuario."); /* ... */ }
    }
    loadHighScores();
    if (usernameForm) { usernameForm.addEventListener('submit', (event) => { event.preventDefault(); const enteredUsername = usernameInput.value.trim(); if (enteredUsername) { handleUserLogin(enteredUsername); } else { alert("Por favor, ingresa un nombre de usuario."); } }); } else { console.error("#username-form no encontrado"); }
    if(playAgainButton) { playAgainButton.addEventListener('click', showLevelSelection); } else { console.error("#play-again-button no encontrado"); }

    // Ocultar secciones post-login al inicio
    if(levelSelectSection) levelSelectSection.style.display = 'none'; if(unlockProgressSection) unlockProgressSection.style.display = 'none'; if(highScoresSection) highScoresSection.style.display = 'none'; if(gameAreaSection) gameAreaSection.style.display = 'none'; if(gameOverSection) gameOverSection.style.display = 'none';

}); // Fin del DOMContentLoaded
