// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
    const userSetupSection = document.getElementById('user-setup');
    const gameAreaSection = document.getElementById('game-area');
    const gameOverSection = document.getElementById('game-over');
    const highScoresSection = document.getElementById('high-scores-section');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');
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
    let currentScore = 0;
    let currentLevel = 'Entry';
    let correctAnswer = null;
    let questionsAnswered = 0;
    const TOTAL_QUESTIONS_PER_GAME = 10;
    const MAX_HIGH_SCORES = 10;

    // --- Funciones de Utilidad ---
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateRandomIp() {
        const oct1 = getRandomInt(1, 254);
        const oct2 = getRandomInt(0, 255);
        const oct3 = getRandomInt(0, 255);
        const oct4 = getRandomInt(1, 254);
        return `${oct1}.${oct2}.${oct3}.${oct4}`;
    }

    function getIpInfo(ipString) {
        const octets = ipString.split('.').map(Number);
        const firstOctet = octets[0];
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Generadores de Preguntas (Nivel Entry) ---
    function generateClassQuestion() { /* ... (código como arriba) ... */
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'D' || info.class === 'E') info.defaultMask = 'N/A';
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E'];
        correctAnswer = info.class;
        return { question, options };
     }
    function generateTypeQuestion() { /* ... (código como arriba) ... */
        let ip, info;
        do { ip = generateRandomIp(); info = getIpInfo(ip); }
        while (info.type === 'N/A' || info.type === 'Loopback');
        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada'];
        correctAnswer = info.type;
        return { question, options };
    }
    function generateDefaultMaskQuestion() { /* ... (código como arriba) ... */
        let ip, info;
        do { ip = generateRandomIp(); info = getIpInfo(ip); }
        while (info.class !== 'A' && info.class !== 'B' && info.class !== 'C');
        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        correctAnswer = info.defaultMask;
        return { question, options };
    }
    function generateSelectClassQuestion() { /* ... (código como arriba) ... */
        const targetClasses = ['A', 'B', 'C'];
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0;
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).class === targetClass) correctIp = ip; attempts++; }
        if (!correctIp) correctIp = generateRandomIp();
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).class !== targetClass) incorrectIps.push(ip); attempts++; }
        while(incorrectIps.length < 3) incorrectIps.push(generateRandomIp());
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        return { question, options };
     }
    function generateSelectPrivateIpQuestion() { /* ... (código como arriba) ... */
        const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0;
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Privada') correctIp = ip; attempts++; }
        if (!correctIp) correctIp = '192.168.1.1';
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Pública') incorrectIps.push(ip); attempts++; }
        while(incorrectIps.length < 3) incorrectIps.push('8.8.8.8');
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        return { question, options };
     }
    function generateSelectIpByDefaultMaskQuestion() { /* ... (código como arriba) ... */
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0;
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); if (getIpInfo(ip).defaultMask === targetMask) correctIp = ip; attempts++; }
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask) incorrectIps.push(ip); attempts++; }
        while(incorrectIps.length < 3) incorrectIps.push('8.8.8.8');
        const options = [correctIp, ...incorrectIps]; shuffleArray(options); correctAnswer = correctIp;
        return { question, options };
    }

    // --- Funciones de Juego Principales ---
    function displayQuestion(questionHTML, optionsArray) { /* ... (sin cambios) ... */
        questionText.innerHTML = questionHTML;
        optionsContainer.innerHTML = '';
        optionsArray.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.classList.add('option-button');
            button.addEventListener('click', handleAnswerClick);
            optionsContainer.appendChild(button);
        });
        feedbackArea.textContent = '';
        optionsContainer.classList.remove('options-disabled');
    }

    function loadNextQuestion() { /* ... (actualizado como arriba para incluir nuevos tipos en el array) ... */
        feedbackArea.textContent = '';
        optionsContainer.classList.remove('options-disabled');
        let questionData;

        if (currentLevel === 'Entry') {
            const questionTypes = [
                generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion,
                generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion
            ];
            const randomIndex = getRandomInt(0, questionTypes.length - 1);
            const generatorFunction = questionTypes[randomIndex];
            questionData = generatorFunction();
        } else {
            questionText.textContent = `¡Próximamente Nivel ${currentLevel}!`;
            optionsContainer.innerHTML = '';
            setTimeout(endGame, 500);
            return;
        }
        displayQuestion(questionData.question, questionData.options);
     }

    function handleAnswerClick(event) { /* ... (sin cambios) ... */
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.textContent;
        optionsContainer.classList.add('options-disabled');
        if (selectedAnswer === correctAnswer) {
            currentScore += 10; scoreDisplay.textContent = currentScore;
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

    function endGame() { /* ... (sin cambios) ... */
        console.log("Juego terminado. Puntuación final:", currentScore);
        gameAreaSection.style.display = 'none'; gameOverSection.style.display = 'block';
        finalScoreDisplay.textContent = currentScore;
        saveHighScore(currentUsername, currentScore); loadHighScores();
        highScoreMessage.textContent = "¡Partida completada!";
     }

    function saveHighScore(name, score) { /* ... (versión actualizada sin duplicados) ... */
        if (!name || score === undefined) return;
        const highScores = JSON.parse(localStorage.getItem('ipSprintHighScores')) || [];
        const newScore = { name, score };
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        const uniqueUserScores = []; const userNames = new Set();
        for (const scoreEntry of highScores) { if (!userNames.has(scoreEntry.name)) { uniqueUserScores.push(scoreEntry); userNames.add(scoreEntry.name); } }
        const finalScores = uniqueUserScores.slice(0, MAX_HIGH_SCORES);
        localStorage.setItem('ipSprintHighScores', JSON.stringify(finalScores));
        console.log("Puntuaciones (únicas por usuario y top N) guardadas:", finalScores);
     }

    function loadHighScores() { /* ... (sin cambios) ... */
        const highScores = JSON.parse(localStorage.getItem('ipSprintHighScores')) || [];
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

    function startGame() { /* ... (sin cambios) ... */
        console.log(`Iniciando juego para ${currentUsername} en nivel ${currentLevel}`);
        currentScore = 0; questionsAnswered = 0; scoreDisplay.textContent = currentScore;
        levelDisplay.textContent = currentLevel; userSetupSection.style.display = 'none';
        gameOverSection.style.display = 'none'; gameAreaSection.style.display = 'block';
        loadNextQuestion();
     }

    // --- Lógica de Inicio y Event Listeners ---
    loadHighScores();
    usernameForm.addEventListener('submit', (event) => { /* ... (sin cambios) ... */
        event.preventDefault(); const enteredUsername = usernameInput.value.trim();
        if (enteredUsername) { currentUsername = enteredUsername; usernameDisplay.textContent = currentUsername; startGame(); }
        else { alert("Por favor, ingresa un nombre de usuario."); }
    });
    playAgainButton.addEventListener('click', startGame);

}); // Fin del DOMContentLoaded
