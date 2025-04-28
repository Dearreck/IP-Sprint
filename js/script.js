// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
    // Secciones principales
    const userSetupSection = document.getElementById('user-setup');
    const gameAreaSection = document.getElementById('game-area');
    const gameOverSection = document.getElementById('game-over');
    const highScoresSection = document.getElementById('high-scores-section'); // Asegúrate que exista en HTML si no está

    // Formulario de usuario
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');

    // Elementos del área de juego
    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');

    // Elementos de Game Over
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreMessage = document.getElementById('high-score-message');
    const playAgainButton = document.getElementById('play-again-button');

    // Lista de puntuaciones altas
    const scoreList = document.getElementById('score-list');

    // --- Variables de Estado del Juego ---
    let currentUsername = '';
    let currentScore = 0;
    let currentLevel = 'Entry'; // O podríamos definir niveles numéricamente 1, 2, 3
    // Aquí irán más variables: pregunta actual, datos de preguntas, etc.

    // --- Funciones ---

    /**
     * Carga y muestra las puntuaciones altas desde localStorage.
     * (Implementación básica por ahora)
     */
    function loadHighScores() {
        console.log("Intentando cargar puntuaciones..."); // Mensaje para depuración
        const highScores = JSON.parse(localStorage.getItem('ipSprintHighScores')) || [];

        scoreList.innerHTML = ''; // Limpiar lista actual

        if (highScores.length === 0) {
            scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>';
            return;
        }

        // Ordenar puntuaciones (de mayor a menor)
        highScores.sort((a, b) => b.score - a.score);

        // Mostrar las N mejores (ej. 5)
        const topScores = highScores.slice(0, 5);

        topScores.forEach(scoreItem => {
            const li = document.createElement('li');
            li.textContent = `${scoreItem.name}: `;
            const strong = document.createElement('strong');
            strong.textContent = scoreItem.score;
            li.appendChild(strong);
            scoreList.appendChild(li);
        });
         console.log("Puntuaciones cargadas:", highScores); // Mensaje para depuración
    }

     /**
     * Inicia una nueva partida.
     */
     function startGame() {
        console.log(`Iniciando juego para ${currentUsername} en nivel ${currentLevel}`);
        currentScore = 0;
        scoreDisplay.textContent = currentScore;
        levelDisplay.textContent = currentLevel; // Actualizar nivel si cambia

        // Ocultar otras secciones y mostrar área de juego
        userSetupSection.style.display = 'none';
        gameOverSection.style.display = 'none';
        gameAreaSection.style.display = 'block'; // Asegurar que se muestra

        // TODO: Generar y mostrar la primera pregunta del nivel actual
        loadNextQuestion();
    }

    /**
     * Carga la siguiente pregunta (placeholder).
     */
    function loadNextQuestion() {
        // Lógica para obtener una pregunta basada en currentLevel
        // Actualizar questionText y optionsContainer
        // Esta será la función principal del bucle del juego
        questionText.textContent = `Pregunta de Nivel ${currentLevel} para ${currentUsername}... (Implementación pendiente)`;
        optionsContainer.innerHTML = '<button class="option-button">Opción A (Pendiente)</button><button class="option-button">Opción B (Pendiente)</button>'; // Limpiar/poner placeholders
        feedbackArea.textContent = ''; // Limpiar feedback anterior
        optionsContainer.classList.remove('options-disabled'); // Habilitar opciones

        // TODO: Añadir event listeners a los nuevos botones de opción
    }

    // --- Lógica de Inicio y Event Listeners ---

    // 1. Cargar puntuaciones altas al iniciar
    loadHighScores();

    // 2. Manejar envío del formulario de nombre de usuario
    usernameForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que la página se recargue
        const enteredUsername = usernameInput.value.trim();

        if (enteredUsername) {
            currentUsername = enteredUsername;
            usernameDisplay.textContent = currentUsername; // Mostrar nombre en área de juego
            console.log("Usuario establecido:", currentUsername);

            // Iniciar el juego
            startGame();

        } else {
            // Opcional: Mostrar un mensaje de error si el nombre está vacío
            alert("Por favor, ingresa un nombre de usuario.");
        }
    });

    // TODO: Añadir event listener para el botón "Jugar de Nuevo"
    // playAgainButton.addEventListener('click', startGame);

    // TODO: Añadir event listener (probablemente en optionsContainer) para manejar clics en las respuestas


}); // Fin del DOMContentLoaded
