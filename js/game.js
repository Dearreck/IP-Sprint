// js/game.js
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';

// --- Variables de Estado del Juego (ahora en este módulo) ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard'; // 'standard' o 'mastery' (para Entry con timer)
let currentQuestionData = null; // Guarda {question, options, correctAnswer, explanation}
let questionsAnswered = 0;
let roundResults = []; // Guarda true/false por cada pregunta de la ronda
let questionTimerInterval = null;
let timeLeft = 0;

// --- Funciones Principales del Flujo del Juego ---

/** Maneja el login/carga inicial de datos del usuario */
export function handleUserLogin(username) {
    currentUsername = username;
    try {
        currentUserData = storage.getUserData(username);
        storage.saveUserData(username, currentUserData); // Guardar por si es nuevo usuario con datos default
        ui.updatePlayerInfo(currentUsername, '', ''); // Actualizar nombre en UI (nivel y score se actualizan al empezar)
        // Mostrar secciones post-login
        if(ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if(ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode); // Mostrar menú de niveles
    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert("Hubo un problema al cargar los datos del usuario.");
        ui.showSection(ui.userSetupSection); // Volver a pantalla inicial si hay error
    }
}

/** Llamada desde la UI cuando se selecciona un nivel y modo */
export function selectLevelAndMode(level, mode) {
    currentLevel = level;
    currentGameMode = mode;
    startGame(); // Iniciar el juego con el nivel y modo seleccionados
}

/** Inicia una nueva partida en el nivel y modo actuales */
export function startGame() {
    clearInterval(questionTimerInterval); // Limpiar timer anterior
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Actualizar info completa
    ui.showSection(ui.gameAreaSection); // Mostrar área de juego
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery'); // Mostrar estrellas de ronda (vacías)
    loadNextQuestion(); // Cargar la primera pregunta
}

/** Carga y muestra la siguiente pregunta */
function loadNextQuestion() {
    if(ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if(ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    clearInterval(questionTimerInterval); // Limpiar timer
    ui.showTimerDisplay(false); // Ocultar timer por defecto
    if(ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Obtener datos de la siguiente pregunta usando el generador centralizado
        questionDataResult = getNextQuestion(currentLevel);

        if (questionDataResult) {
            currentQuestionData = questionDataResult; // Guardar datos completos

             // INICIAR TIMER (si aplica para este modo/nivel)
             const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery');
             ui.showTimerDisplay(timerCondition); // Mostrar u ocultar según condición
             if (timerCondition) {
                 timeLeft = config.QUESTION_TIMER_DURATION;
                 ui.updateTimerDisplay(timeLeft);
                 questionTimerInterval = setInterval(updateTimer, 1000);
             }

            // Mostrar pregunta y opciones (pasa el handler desde este módulo)
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
        } else {
            // No se pudo generar pregunta (nivel no implementado o error)
            console.warn("No se pudo generar pregunta para nivel:", currentLevel);
            if(ui.questionText) ui.questionText.innerHTML = `Nivel ${currentLevel} pendiente o error.`;
            if(ui.optionsContainer) ui.optionsContainer.innerHTML = '';
            setTimeout(endGame, 1500); // Terminar el juego si no hay preguntas
        }
    } catch (error) {
        console.error("Error fatal en loadNextQuestion:", error);
        if(ui.questionText) ui.questionText.innerHTML = "Error al cargar pregunta.";
        if(ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 1500); // Terminar juego si hay error grave
    }
}

/** Actualiza el timer y maneja timeout */
function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft);
    if (timeLeft <= 0) {
        clearInterval(questionTimerInterval);
        if(ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');
        roundResults.push(false); // Timeout cuenta como incorrecta
        ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');

        // Mostrar feedback de timeout
        const feedbackHTML = `<div id="feedback-text-content"><span>¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong></span><span class="explanation">${currentQuestionData.explanation || ''}</span></div>`;
        if(ui.feedbackArea) { ui.feedbackArea.innerHTML = feedbackHTML; ui.feedbackArea.className = 'incorrect'; }

        // Crear y añadir botón "Siguiente"
        const buttonText = (questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'Ver Resultado Final &gt;&gt;' : 'Siguiente &gt;&gt;';
        const nextButton = document.createElement('button'); nextButton.id = 'next-question-button'; nextButton.textContent = buttonText;
        nextButton.addEventListener('click', proceedToNextStep);
        if(ui.feedbackArea) ui.feedbackArea.appendChild(nextButton);
    }
}

/** Función intermedia para avanzar */
function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Detener timer si se llamó manualmente
    questionsAnswered++;
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame();
    } else {
        loadNextQuestion();
    }
}

/** Maneja el clic en un botón de respuesta */
export function handleAnswerClick(event) { // Exportar si es llamada desde ui.js (o mantener aquí si ui.js importa game)
    clearInterval(questionTimerInterval); // Detener timer

    if (!currentQuestionData) { console.error("handleAnswerClick sin currentQuestionData"); return; }

    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;
    const isCorrect = (selectedAnswer === currentQuestionData.correctAnswer);
    roundResults.push(isCorrect);
    const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Actualizar score en UI
        ui.displayFeedback(isCorrect, isMastery, currentQuestionData, proceedToNextStep); // Mostrar feedback (simple)
        if(selectedButton) selectedButton.classList.add(isMastery ? 'mastery' : 'correct');
        // Avance automático
        setTimeout(proceedToNextStep, 1200);
    } else {
         // Mostrar feedback (con explicación y botón)
         ui.displayFeedback(isCorrect, isMastery, currentQuestionData, proceedToNextStep);
         if(selectedButton) selectedButton.classList.add('incorrect');
         // Resaltar correcta
         if(ui.optionsContainer) { Array.from(ui.optionsContainer.children).forEach(button => { if (button.textContent === currentQuestionData.correctAnswer) button.classList.add(isMastery ? 'mastery' : 'correct'); }); }
         // El listener del botón 'Siguiente' se añade dentro de displayFeedback si es necesario
    }
    ui.updateRoundProgressUI(roundResults, isMastery); // Actualizar estrellas de ronda
}

/** Finaliza la partida */
function endGame() {
    clearInterval(questionTimerInterval); // Asegurar detener timer
    const isPerfect = (currentScore === config.PERFECT_SCORE);
    let message = "¡Partida completada!";

    try {
        currentUserData = storage.getUserData(currentUsername); // Recargar datos

        // --- Lógica de Racha/Desbloqueo ---
        if (currentLevel === 'Entry') {
            if (isPerfect) { currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1; if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) { currentUserData.unlockedLevels.push('Associate'); currentUserData.entryPerfectStreak = 0; message = "¡3 Rondas Perfectas! ¡Nivel Associate Desbloqueado! 🎉"; } else if (!currentUserData.unlockedLevels.includes('Associate')) { message = `¡Ronda Perfecta! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`; } else { message = "¡Ronda Perfecta!"; } }
            else { currentUserData.entryPerfectStreak = 0; /* message remains */ }
        } else if (currentLevel === 'Associate') {
             if (isPerfect) { currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1; if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) { currentUserData.unlockedLevels.push('Professional'); currentUserData.associatePerfectStreak = 0; message = "¡3 Rondas Perfectas! ¡Nivel Professional Desbloqueado! 🏆"; } else if (!currentUserData.unlockedLevels.includes('Professional')) { message = `¡Ronda Perfecta en Associate! Racha: ${currentUserData.associatePerfectStreak}/3.`; } else { message = "¡Ronda Perfecta en Associate!"; } }
             else { currentUserData.associatePerfectStreak = 0; /* message remains */ }
        } // ... more levels ...
        // --- Fin Lógica Racha ---

        storage.saveUserData(currentUsername, currentUserData); // Guardar datos usuario
        storage.saveHighScore(currentUsername, currentScore); // Guardar high score
        const highScores = storage.loadHighScores(); // Cargar scores para mostrar
        ui.displayHighScores(highScores); // Mostrar scores actualizados

        // Mostrar pantalla Game Over con info correcta
        ui.displayGameOver(currentScore, message, handlePlayAgain, currentUserData);
        currentQuestionData = null; // Limpiar

    } catch (error) { console.error("Error en endGame:", error); }
}

/** Maneja el botón 'Jugar de Nuevo / Elegir Nivel' */
export function handlePlayAgain() { // Exportar para que main.js la use
    // Simplemente vuelve a mostrar la selección de nivel
     ui.showSection(ui.levelSelectSection); // Asegurar que la sección correcta se muestra
     showLevelSelectionLogic(); // Llamar a la lógica interna que puebla los botones etc.
}

/** Lógica interna para mostrar selección de nivel (llamada por login y play again) */
function showLevelSelectionLogic() {
     if (!currentUserData) currentUserData = storage.getUserData(currentUsername); // Asegurar datos
     ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/** Inicializa el juego */
export function initializeGame() { // Exportar para main.js
    const highScores = storage.loadHighScores();
    ui.displayHighScores(highScores);
    // Ocultar secciones relevantes al inicio
     ui.showSection(ui.userSetupSection);
}
