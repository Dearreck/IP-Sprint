// js/game.js
// Contiene la lógica principal del juego, manejo de estado y flujo.

// Importar módulos necesarios
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js'; // Importar funciones y elementos de UI
import { getNextQuestion } from './questions.js'; // Importar generador de preguntas

// --- Variables de Estado del Juego (ahora en este módulo) ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard'; // 'standard' o 'mastery' (para Entry con timer)
let currentQuestionData = null; // Guarda { question, options, correctAnswer, explanation }
let correctAnswer = null; // Guarda solo la respuesta correcta para comparación rápida en handleAnswerClick
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
        ui.updatePlayerInfo(currentUsername, '', ''); // Solo nombre inicialmente
        // Mostrar secciones post-login
        if(ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if(ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';
        // Pasa la función que manejará la selección desde la UI
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert("Hubo un problema al cargar los datos del usuario.");
        ui.showSection(ui.userSetupSection); // Volver a pantalla inicial si hay error grave
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
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Info inicial
    ui.showSection(ui.gameAreaSection); // Mostrar área de juego
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery'); // Mostrar estrellas de ronda (vacías)
    loadNextQuestion(); // Cargar la primera pregunta
}

/** Carga y muestra la siguiente pregunta */
function loadNextQuestion() {
    // Limpiar estado de la pregunta anterior
    if(ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if(ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    correctAnswer = null; // Limpiar respuesta anterior también
    clearInterval(questionTimerInterval);
    ui.showTimerDisplay(false);
    if(ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Obtener datos de la siguiente pregunta desde el módulo questions
        const questionDataResult = getNextQuestion(currentLevel); // Llama al módulo questions

        // Validar datos recibidos del generador
        if (questionDataResult && questionDataResult.question && questionDataResult.options && Array.isArray(questionDataResult.options) && questionDataResult.correctAnswer !== undefined && questionDataResult.explanation !== undefined) {
            currentQuestionData = questionDataResult; // Guardar datos completos globalmente
            // ***** CORRECCIÓN CLAVE: Asignar correctAnswer global *****
            correctAnswer = currentQuestionData.correctAnswer;
            // *******************************************************

            // INICIAR TIMER (si aplica)
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery');
            ui.showTimerDisplay(timerCondition); // Mostrar u ocultar display
            if (timerCondition) {
                timeLeft = config.QUESTION_TIMER_DURATION;
                ui.updateTimerDisplay(timeLeft); // Mostrar tiempo inicial
                // Iniciar intervalo, guardar ID para poder limpiarlo
                questionTimerInterval = setInterval(updateTimer, 1000);
            }

            // Mostrar pregunta y opciones (pasa el handler de respuesta)
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
        } else {
            // Error si el generador devolvió null o datos inválidos
            throw new Error("Datos de pregunta inválidos o nulos recibidos del generador.");
        }
    } catch (error) {
        // Manejo de errores simplificado en catch
        console.error("Error fatal en loadNextQuestion:", error);
        if(ui.questionText) ui.questionText.innerHTML = "Error al cargar pregunta.";
        if(ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        // Terminar el juego si hay un error grave cargando la pregunta
        setTimeout(endGame, 1500);
    }
 }


/** Actualiza el timer y maneja timeout */
 function updateTimer() {
     timeLeft--;
     ui.updateTimerDisplay(timeLeft); // Actualiza UI del timer
     if (timeLeft <= 0) {
         clearInterval(questionTimerInterval);
         if(ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');
         roundResults.push(false); // Timeout cuenta como incorrecta
         const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');
         ui.updateRoundProgressUI(roundResults, isMastery); // Actualizar estrellas ronda

         // Mostrar feedback de timeout (usa ui.displayFeedback pero adaptamos el texto)
         const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
         ui.displayFeedback(false, isMastery, timeoutFeedbackData, proceedToNextStep); // Llama a la función de UI

         // Añadir texto específico de timeout
         if(ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            if(feedbackContent) { feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong>`; }
            else { ui.feedbackArea.innerHTML = `<div id="feedback-text-content"><span>¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong></span><span class="explanation">${currentQuestionData.explanation || ''}</span></div>` + ui.feedbackArea.innerHTML; }
         }
     }
 }


/** Función intermedia para avanzar */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval);
    questionsAnswered++;
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame();
    } else {
        loadNextQuestion();
    }
}

/** Maneja el clic en un botón de respuesta */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detener timer al responder

    if (!currentQuestionData || correctAnswer === null) { console.error("handleAnswerClick sin datos de pregunta o respuesta correcta."); return; }

    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;
    if(ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    let isCorrect = (selectedAnswer === correctAnswer); // Comparar con correctAnswer global
    roundResults.push(isCorrect);
    const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        ui.displayFeedback(isCorrect, isMastery, currentQuestionData, proceedToNextStep);
        if(selectedButton) selectedButton.classList.add(isMastery ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200); // Avance automático
    } else {
         const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(isCorrect, isMastery, feedbackData, proceedToNextStep);
        if(selectedButton) selectedButton.classList.add('incorrect');
        // El resaltado de la correcta se hace dentro de ui.displayFeedback
    }
    ui.updateRoundProgressUI(roundResults, isMastery);
 }

/** Finaliza la partida */
 function endGame() {
    clearInterval(questionTimerInterval); // Asegurar detener timer
    const isPerfect = (currentScore === config.PERFECT_SCORE);
    let message = "¡Partida completada!";
    try {
        currentUserData = storage.getUserData(currentUsername); // Recargar datos
        // --- Lógica de Racha/Desbloqueo ---
        if (currentLevel === 'Entry') { if (isPerfect) { currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1; if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) { currentUserData.unlockedLevels.push('Associate'); currentUserData.entryPerfectStreak = 0; message = "¡3 Rondas Perfectas! ¡Nivel Associate Desbloqueado! 🎉"; } else if (!currentUserData.unlockedLevels.includes('Associate')) { message = `¡Ronda Perfecta! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`; } else { message = "¡Ronda Perfecta!"; } } else { currentUserData.entryPerfectStreak = 0; } }
        else if (currentLevel === 'Associate') { if (isPerfect) { currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1; if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) { currentUserData.unlockedLevels.push('Professional'); currentUserData.associatePerfectStreak = 0; message = "¡3 Rondas Perfectas! ¡Nivel Professional Desbloqueado! 🏆"; } else if (!currentUserData.unlockedLevels.includes('Professional')) { message = `¡Ronda Perfecta en Associate! Racha: ${currentUserData.associatePerfectStreak}/3.`; } else { message = "¡Ronda Perfecta en Associate!"; } } else { currentUserData.associatePerfectStreak = 0; } }
        // --- Fin Lógica Racha ---
        storage.saveUserData(currentUsername, currentUserData); // Guardar TODOS los datos actualizados
        storage.saveHighScore(currentUsername, currentScore); // Guardar puntuación alta
        const highScores = storage.loadHighScores(); // Cargar scores para mostrar
        ui.displayHighScores(highScores); // Mostrar scores actualizados
        // Mostrar pantalla Game Over con info correcta
        ui.displayGameOver(currentScore, message, currentUserData); // El handler del botón se añade en main.js
        currentQuestionData = null; // Limpiar
    } catch (error) { console.error("Error en endGame:", error); }
 }

/** Maneja el botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over */
 export function handlePlayAgain() {
    if(currentUsername) { currentUserData = storage.getUserData(currentUsername); }
    else { currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 }; }
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/** Inicializa el juego */
 export function initializeGame() {
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    ui.showSection(ui.userSetupSection); // Mostrar solo el setup inicial
}
