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
    let questionsAnswered = 0; // Contador de preguntas respondidas
    const TOTAL_QUESTIONS_PER_GAME = 10; // Definir cuántas preguntas por partida (ej. 10)
    const MAX_HIGH_SCORES = 10; // Máximo de puntuaciones a guardar

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
        let ipClass = '';
        let ipType = 'Pública';
        let defaultMask = 'N/A';

        if (firstOctet >= 1 && firstOctet <= 126) {
            ipClass = 'A'; defaultMask = '255.0.0.0';
        } else if (firstOctet >= 128 && firstOctet <= 191) {
            ipClass = 'B'; defaultMask = '255.255.0.0';
        } else if (firstOctet >= 192 && firstOctet <= 223) {
            ipClass = 'C'; defaultMask = '255.255.255.0';
        } else if (firstOctet >= 224 && firstOctet <= 239) {
            ipClass = 'D'; ipType = 'N/A';
        } else if (firstOctet >= 240 && firstOctet <= 255) {
            ipClass = 'E'; ipType = 'N/A';
        } else if (firstOctet === 127) {
            ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0';
        }

        if (firstOctet === 10 ||
            (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
            (firstOctet === 192 && octets[1] === 168)) {
            if (ipType !== 'Loopback') ipType = 'Privada';
        }

        return { class: ipClass, type: ipType, defaultMask: defaultMask };
    }

    // --- Generadores de Preguntas (Nivel Entry) ---
    function generateClassQuestion() {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'D' || info.class === 'E') info.defaultMask = 'N/A';
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E'];
        correctAnswer = info.class;
        return { question, options };
    }

    function generateTypeQuestion() {
        let ip, info;
        do {
            ip = generateRandomIp(); info = getIpInfo(ip);
        } while (info.type === 'N/A' || info.type === 'Loopback');
        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada'];
        correctAnswer = info.type;
        return { question, options };
    }

    function generateDefaultMaskQuestion() {
        let ip, info;
        do {
            ip = generateRandomIp(); info = getIpInfo(ip);
        } while (info.class !== 'A' && info.class !== 'B' && info.class !== 'C');
        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        correctAnswer = info.defaultMask;
        return { question, options };
    }

    // --- Funciones de Juego Principales ---
    function displayQuestion(questionHTML, optionsArray) {
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

    function loadNextQuestion() {
        feedbackArea.textContent = '';
        optionsContainer.classList.remove('options-disabled');
        let questionData;

        if (currentLevel === 'Entry') {
            const questionTypes = [generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion];
            const randomIndex = getRandomInt(0, questionTypes.length - 1);
            const generatorFunction = questionTypes[randomIndex];
            questionData = generatorFunction();
        } else {
            questionText.textContent = `¡Próximamente Nivel ${currentLevel}!`;
            optionsContainer.innerHTML = '';
            setTimeout(endGame, 500); // Terminar si llegamos a un nivel no implementado
            return;
        }
        displayQuestion(questionData.question, questionData.options);
    }

    function handleAnswerClick(event) {
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.textContent;

        optionsContainer.classList.add('options-disabled');

        if (selectedAnswer === correctAnswer) {
            currentScore += 10;
            scoreDisplay.textContent = currentScore;
            feedbackArea.textContent = "¡Correcto! ✔️";
            feedbackArea.className = 'correct';
            selectedButton.classList.add('correct');
        } else {
            feedbackArea.textContent = `Incorrecto. La respuesta era: ${correctAnswer} ❌`;
            feedbackArea.className = 'incorrect';
            selectedButton.classList.add('incorrect');
            Array.from(optionsContainer.children).forEach(button => {
                if (button.textContent === correctAnswer) {
                    button.classList.add('correct');
                }
            });
        }

        questionsAnswered++;

        if (questionsAnswered >= TOTAL_QUESTIONS_PER_GAME) {
            setTimeout(endGame, 1500);
        } else {
            setTimeout(loadNextQuestion, 1500);
        }
    }

    function endGame() {
        console.log("Juego terminado. Puntuación final:", currentScore);
        gameAreaSection.style.display = 'none';
        gameOverSection.style.display = 'block';
        finalScoreDisplay.textContent = currentScore;
        saveHighScore(currentUsername, currentScore);
        loadHighScores();
        highScoreMessage.textContent = "¡Partida completada!";
    }

    /**
     * Guarda la puntuación en localStorage, asegurando una sola entrada
     * (la mejor) por usuario y manteniendo las N mejores puntuaciones globales.
     * @param {string} name - Nombre del jugador.
     * @param {number} score - Puntuación obtenida.
     */
    function saveHighScore(name, score) {
        if (!name || score === undefined) return; // No guardar si falta algo

        // const MAX_HIGH_SCORES = 10; // Definida arriba ahora
        const highScores = JSON.parse(localStorage.getItem('ipSprintHighScores')) || [];
        const newScore = { name, score };

        // 1. Añadir la nueva puntuación temporalmente
        highScores.push(newScore);

        // 2. Ordenar todas las puntuaciones (incluida la nueva) de mayor a menor
        highScores.sort((a, b) => b.score - a.score);

        // 3. Filtrar para quedarse solo con la MEJOR puntuación de cada usuario único
        const uniqueUserScores = [];
        const userNames = new Set(); // Para rastrear usuarios ya añadidos a la lista final

        for (const scoreEntry of highScores) {
            // Si aún no hemos añadido una puntuación para este usuario...
            if (!userNames.has(scoreEntry.name)) {
                // ...la añadimos (como está ordenada, esta será su mejor puntuación)
                uniqueUserScores.push(scoreEntry);
                // Y marcamos que ya hemos procesado a este usuario
                userNames.add(scoreEntry.name);
            }
        }

        // 4. Recortar la lista de puntuaciones únicas a las N mejores globales
        const finalScores = uniqueUserScores.slice(0, MAX_HIGH_SCORES);

        // 5. Guardar la lista final y filtrada en localStorage
        localStorage.setItem('ipSprintHighScores', JSON.stringify(finalScores));
        console.log("Puntuaciones (únicas por usuario y top N) guardadas:", finalScores);
    }

    function loadHighScores() {
        const highScores = JSON.parse(localStorage.getItem('ipSprintHighScores')) || [];
        scoreList.innerHTML = '';
        if (highScores.length === 0) {
            scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>';
            return;
        }
        highScores.sort((a, b) => b.score - a.score); // Asegurar orden al mostrar
        const topScores = highScores.slice(0, MAX_HIGH_SCORES); // Mostrar hasta N
        topScores.forEach(scoreItem => {
            const li = document.createElement('li');
            li.textContent = `${scoreItem.name}: `;
            const strong = document.createElement('strong');
            strong.textContent = scoreItem.score;
            li.appendChild(strong);
            scoreList.appendChild(li);
        });
    }

    function startGame() {
        console.log(`Iniciando juego para ${currentUsername} en nivel ${currentLevel}`);
        currentScore = 0;
        questionsAnswered = 0; // Resetear contador
        scoreDisplay.textContent = currentScore;
        levelDisplay.textContent = currentLevel;
        userSetupSection.style.display = 'none';
        gameOverSection.style.display = 'none'; // Ocultar Game Over
        gameAreaSection.style.display = 'block'; // Mostrar Área de Juego
        loadNextQuestion();
    }

    // --- Lógica de Inicio y Event Listeners ---
    loadHighScores();

    usernameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const enteredUsername = usernameInput.value.trim();
        if (enteredUsername) {
            currentUsername = enteredUsername;
            usernameDisplay.textContent = currentUsername;
            startGame();
        } else {
            alert("Por favor, ingresa un nombre de usuario.");
        }
    });

    playAgainButton.addEventListener('click', startGame); // Hacer que el botón llame a startGame

    // --- TODO ---
    // Añadir más tipos de preguntas (inversas Entry, niveles Associate/Pro)
    // Implementar lógica de cambio de nivel
    // Mejorar mensaje de high score en endGame
    // Refinar generación de IP si es necesario

}); // Fin del DOMContentLoaded
