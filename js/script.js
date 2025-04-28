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
    let correctAnswer = null; // Para guardar la respuesta correcta de la pregunta actual

    // --- Funciones de Utilidad ---

    /** Genera un entero aleatorio entre min (incluido) y max (incluido) */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Genera una dirección IPv4 aleatoria como string */
    function generateRandomIp() {
        // Genera 4 octetos aleatorios
        const oct1 = getRandomInt(1, 254); // Evitar 0 y 255 en el primero por simplicidad
        const oct2 = getRandomInt(0, 255);
        const oct3 = getRandomInt(0, 255);
        const oct4 = getRandomInt(1, 254); // Evitar 0 y 255 en el último por simplicidad
        return `${oct1}.${oct2}.${oct3}.${oct4}`;
        // NOTA: Podríamos hacerla más sofisticada para generar IPs de clases/tipos específicos
    }

    /**
     * Obtiene información sobre una IP (Clase, Tipo, Máscara Default)
     * @param {string} ipString - La IP en formato string "x.x.x.x"
     * @returns {object} - Objeto con { class, type, defaultMask }
     */
    function getIpInfo(ipString) {
        const octets = ipString.split('.').map(Number);
        const firstOctet = octets[0];
        let ipClass = '';
        let ipType = 'Pública'; // Asumir pública por defecto
        let defaultMask = 'N/A';

        // Determinar Clase y Máscara Default
        if (firstOctet >= 1 && firstOctet <= 126) {
            ipClass = 'A';
            defaultMask = '255.0.0.0';
        } else if (firstOctet >= 128 && firstOctet <= 191) {
            ipClass = 'B';
            defaultMask = '255.255.0.0';
        } else if (firstOctet >= 192 && firstOctet <= 223) {
            ipClass = 'C';
            defaultMask = '255.255.255.0';
        } else if (firstOctet >= 224 && firstOctet <= 239) {
            ipClass = 'D'; // Multicast
            ipType = 'N/A'; // No aplica Pública/Privada
        } else if (firstOctet >= 240 && firstOctet <= 255) {
            ipClass = 'E'; // Experimental
            ipType = 'N/A';
        } else if (firstOctet === 127) {
            ipClass = 'A'; // Loopback es técnicamente Clase A
            ipType = 'Loopback';
            defaultMask = '255.0.0.0';
        }
        // Considerar APIPA? 169.254.x.x -> Podría ser tipo 'APIPA'

        // Determinar Tipo (Privada?) sobreescribe si aplica
        if (firstOctet === 10 ||
            (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
            (firstOctet === 192 && octets[1] === 168)) {
            ipType = 'Privada';
        }
        // Podríamos añadir chequeo para APIPA aquí si quisiéramos un tipo específico

        return { class: ipClass, type: ipType, defaultMask: defaultMask };
    }


    // --- Generadores de Preguntas (Nivel Entry) ---

    /** Genera una pregunta sobre la Clase de una IP */
    function generateClassQuestion() {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        // Evitar D y E para preguntas de clase sencillas por ahora? O incluirlas? Incluyamoslas.
        if (info.class === 'D' || info.class === 'E') { // Asegurar que no preguntemos máscaras de D/E
             info.defaultMask = 'N/A'; // Reafirmar
        }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E']; // Opciones de respuesta
        correctAnswer = info.class; // Guardar respuesta correcta

        return { question, options };
    }

     /** Genera una pregunta sobre el Tipo (Pública/Privada) de una IP */
    function generateTypeQuestion() {
        let ip, info;
        // Generar IPs hasta encontrar una que no sea Clase D o E (donde el tipo es N/A)
         do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
        } while (info.type === 'N/A' || info.type === 'Loopback'); // Excluir D, E, Loopback

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada'];
        correctAnswer = info.type;

        return { question, options };
    }

     /** Genera una pregunta sobre la Máscara por Defecto de una IP */
     function generateDefaultMaskQuestion() {
        let ip, info;
        // Generar IPs hasta encontrar una Clase A, B o C
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
        } while (info.class !== 'A' && info.class !== 'B' && info.class !== 'C');

        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        correctAnswer = info.defaultMask;

        return { question, options };
    }

    // --- Funciones de Juego Principales ---

    /**
     * Muestra la pregunta y las opciones en la interfaz.
     * @param {string} questionHTML - El texto/HTML de la pregunta.
     * @param {string[]} optionsArray - Un array con los textos de las opciones.
     */
    function displayQuestion(questionHTML, optionsArray) {
        questionText.innerHTML = questionHTML; // Usar innerHTML por si hay etiquetas como <strong>
        optionsContainer.innerHTML = ''; // Limpiar opciones anteriores

        optionsArray.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.classList.add('option-button');
            button.addEventListener('click', handleAnswerClick); // Añadir listener
            optionsContainer.appendChild(button);
        });

        feedbackArea.textContent = ''; // Limpiar feedback
        optionsContainer.classList.remove('options-disabled'); // Habilitar botones
    }


    /**
     * Carga la siguiente pregunta basada en el nivel actual.
     */
    function loadNextQuestion() {
        feedbackArea.textContent = ''; // Limpiar feedback anterior
        optionsContainer.classList.remove('options-disabled'); // Asegurar que opciones estén habilitadas

        let questionData;

        // Por ahora, solo preguntas de Nivel Entry
        if (currentLevel === 'Entry') {
            // Elegir aleatoriamente un tipo de pregunta de Entry
            const questionTypes = [
                generateClassQuestion,
                generateTypeQuestion,
                generateDefaultMaskQuestion
                // TODO: Añadir aquí las funciones para las preguntas inversas
                // generateSelectPrivateIpQuestion,
                // generateSelectClassQuestion
            ];
            const randomIndex = getRandomInt(0, questionTypes.length - 1);
            const generatorFunction = questionTypes[randomIndex];
            questionData = generatorFunction(); // Llama a la función generadora
        } else {
            // TODO: Lógica para niveles Associate y Professional
            questionText.textContent = `¡Próximamente Nivel ${currentLevel}!`;
            optionsContainer.innerHTML = '';
            return; // Salir si no es Entry por ahora
        }

        // Muestra la pregunta generada
        displayQuestion(questionData.question, questionData.options);
    }

    /**
     * Maneja el clic en un botón de respuesta.
     * @param {Event} event - El objeto del evento click.
     */
    function handleAnswerClick(event) {
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.textContent;

        // Deshabilitar todos los botones después de la selección
        optionsContainer.classList.add('options-disabled');

        // Comprobar si la respuesta es correcta
        if (selectedAnswer === correctAnswer) {
            // Respuesta Correcta
            currentScore += 10; // Aumentar puntuación (ej. 10 puntos)
            scoreDisplay.textContent = currentScore; // Actualizar marcador
            feedbackArea.textContent = "¡Correcto! ✔️";
            feedbackArea.className = 'correct'; // Aplicar clase CSS para color verde
            selectedButton.classList.add('correct'); // Marcar botón seleccionado como correcto
        } else {
            // Respuesta Incorrecta
            feedbackArea.textContent = `Incorrecto. La respuesta era: ${correctAnswer} ❌`;
            feedbackArea.className = 'incorrect'; // Aplicar clase CSS para color rojo
            selectedButton.classList.add('incorrect'); // Marcar botón seleccionado como incorrecto

            // Opcional: Resaltar también la respuesta correcta
             Array.from(optionsContainer.children).forEach(button => {
                if (button.textContent === correctAnswer) {
                    button.classList.add('correct'); // Mostrar cuál era la correcta
                }
            });
        }

        // Esperar un poco y cargar la siguiente pregunta
        setTimeout(loadNextQuestion, 1500); // Espera 1.5 segundos
    }


    /**
     * Carga y muestra las puntuaciones altas desde localStorage.
     */
    function loadHighScores() {
        const highScores = JSON.parse(localStorage.getItem('ipSprintHighScores')) || [];
        scoreList.innerHTML = '';
        if (highScores.length === 0) {
            scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>';
            return;
        }
        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, 5);
        topScores.forEach(scoreItem => {
            const li = document.createElement('li');
            li.textContent = `${scoreItem.name}: `;
            const strong = document.createElement('strong');
            strong.textContent = scoreItem.score;
            li.appendChild(strong);
            scoreList.appendChild(li);
        });
    }

    /**
     * Inicia una nueva partida.
     */
     function startGame() {
        console.log(`Iniciando juego para ${currentUsername} en nivel ${currentLevel}`);
        currentScore = 0;
        scoreDisplay.textContent = currentScore;
        levelDisplay.textContent = currentLevel;
        userSetupSection.style.display = 'none';
        gameOverSection.style.display = 'none';
        gameAreaSection.style.display = 'block';
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

    // --- TODO ---
    // Añadir event listener para el botón "Jugar de Nuevo"
    // Implementar la lógica de fin de juego (cuándo llamar a gameOverSection)
    // Implementar el guardado de puntuaciones en localStorage
    // Implementar la lógica para los niveles Associate y Professional
    // Añadir más tipos de preguntas inversas al Nivel Entry


}); // Fin del DOMContentLoaded
