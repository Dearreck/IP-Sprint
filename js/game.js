// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado, flujo, interacciones y temporizador.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';         // Constantes de configuración
import * as storage from './storage.js';       // Funciones para localStorage
import * as ui from './ui.js';             // Funciones y elementos de UI
import { getNextQuestion } from './questions.js'; // Función para obtener la siguiente pregunta

// --- Variables de Estado del Juego ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard'; // 'standard' o 'mastery' (usado para Entry con timer y estilo)
let currentQuestionData = null;
let correctAnswer = null;
let questionsAnswered = 0;
let roundResults = [];
let questionTimerInterval = null;
let timeLeft = 0;

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login inicial del usuario.
 */
export function handleUserLogin(username) {
    currentUsername = username;
    try {
        currentUserData = storage.getUserData(username);
        storage.saveUserData(username, currentUserData);
        ui.updatePlayerInfo(currentUsername, '', '');

        if (ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if (ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';

        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert("Hubo un problema al cargar los datos del usuario.");
        ui.showSection(ui.userSetupSection);
    }
}

/**
 * Establece el nivel y modo seleccionados y comienza el juego.
 */
export function selectLevelAndMode(level, mode) {
    currentLevel = level;
    currentGameMode = mode; // Guardar modo
    startGame();
}

/**
 * Inicializa el estado para una nueva partida/ronda.
 */
export function startGame() {
    clearInterval(questionTimerInterval);
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;

    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection);
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery'); // Usa modo para estilo corona
    ui.showTimerDisplay(false); // Ocultar timer inicialmente

    loadNextQuestion();
}

/**
 * Carga la siguiente pregunta e inicia el temporizador SI CORRESPONDE.
 */
function loadNextQuestion() {
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    correctAnswer = null;
    clearInterval(questionTimerInterval); // Limpiar timer anterior
    ui.showTimerDisplay(false); // Ocultar por defecto
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        const questionDataResult = getNextQuestion(currentLevel);

        if (questionDataResult &&
            questionDataResult.question &&
            questionDataResult.options &&
            Array.isArray(questionDataResult.options) &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            currentQuestionData = questionDataResult;
            correctAnswer = currentQuestionData.correctAnswer;

            // --- INICIAR TIMER CONDICIONALMENTE ---
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery') ||
                                   (currentLevel === 'Associate') ||
                                   (currentLevel === 'Professional'); // Añadir Pro cuando se implemente

            ui.showTimerDisplay(timerCondition); // Mostrar u ocultar display del timer
            if (timerCondition) {
                timeLeft = config.QUESTION_TIMER_DURATION; // Establecer duración
                ui.updateTimerDisplay(timeLeft); // Mostrar tiempo inicial
                questionTimerInterval = setInterval(updateTimer, 1000); // Iniciar intervalo
            }
            // --- Fin Lógica Timer ---

            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
        } else {
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) {
                 throw new Error(`No hay preguntas disponibles para el nivel ${currentLevel} todavía.`);
            } else {
                 throw new Error("Datos de pregunta inválidos o nulos recibidos del generador.");
            }
        }
    } catch (error) {
        console.error("Error en loadNextQuestion:", error);
        if (ui.questionText) ui.questionText.innerHTML = `Error al cargar pregunta: ${error.message}`;
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500);
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
        clearInterval(questionTimerInterval);
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

        roundResults.push(false);
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery'); // Para estilo corona
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);

        const timeoutFeedbackData = {
             ...currentQuestionData,
             questionsAnswered: questionsAnswered,
             totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
         };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        if (ui.feedbackArea) {
           const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
           if (feedbackContent) {
                feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`;
           } else {
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`;
                ui.feedbackArea.prepend(timeoutSpan);
           }
           ui.feedbackArea.className = 'incorrect';
        }
    }
}

/**
 * Función intermedia llamada después de una respuesta.
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval);
    questionsAnswered++;
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame();
    } else {
        loadNextQuestion();
    }
}

/**
 * Maneja el clic del usuario en un botón de opción de respuesta.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval);

    if (!currentQuestionData || correctAnswer === null) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;

    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    let isCorrect = (selectedAnswer === correctAnswer);
    roundResults.push(isCorrect);

    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery'); // Para estilo corona

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200);
    } else {
        const feedbackData = {
            ...currentQuestionData,
            questionsAnswered: questionsAnswered,
            totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
        };
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect');
    }

    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}


/**
 * Finaliza la partida actual, calcula rachas, desbloquea niveles, guarda datos y muestra Game Over.
 */
 function endGame() {
    clearInterval(questionTimerInterval); // Asegurar detener timer
    const scorePercentage = (currentScore / config.PERFECT_SCORE) * 100;
    const isPerfect = (currentScore === config.PERFECT_SCORE); // 100%
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK; // 90%
    let message = `¡Partida completada! Puntuación: ${currentScore} (${scorePercentage.toFixed(0)}%)`; // Mensaje base

    try {
        currentUserData = storage.getUserData(currentUsername); // Recargar datos frescos

        // --- Lógica de Racha/Desbloqueo (Actualizada con reglas diferenciadas) ---
        if (currentLevel === 'Entry') {
            // Desbloqueo de Associate requiere 100%
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0; // Resetear racha al desbloquear
                    message = `¡3 Rondas Perfectas (100%)! ¡Nivel Associate Desbloqueado! 🎉`;
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    message = `¡Ronda Perfecta (100%)! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`;
                } else { message = `¡Ronda Perfecta (100%)!`; } // Ya tenía Associate desbloqueado
            } else {
                if (currentUserData.entryPerfectStreak > 0) { message += " (Racha 100% reiniciada)"; }
                currentUserData.entryPerfectStreak = 0; // Resetear racha Entry si no fue perfecta
            }
        } else if (currentLevel === 'Associate') {
             // Desbloqueo de Professional requiere 90%
             if (meetsAssociateThreshold) {
                currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                    currentUserData.unlockedLevels.push('Professional');
                    currentUserData.associatePerfectStreak = 0; // Resetear racha Associate
                    message = `¡3 Rondas con +${config.MIN_SCORE_PERCENT_FOR_STREAK}%! ¡Nivel Professional Desbloqueado! 🏆`;
                } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                    message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)! Racha: ${currentUserData.associatePerfectStreak}/3.`;
                } else { message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)!`; } // Ya tenía Pro desbloqueado
             } else {
                  if (currentUserData.associatePerfectStreak > 0) { message += " (Racha 90% reiniciada)"; }
                 currentUserData.associatePerfectStreak = 0; // Resetear racha Associate si no alcanzó umbral
             }
        }
        // Añadir 'else if (currentLevel === 'Professional')' para futuras lógicas
        // --- Fin Lógica Racha ---

        storage.saveUserData(currentUsername, currentUserData); // Guardar TODOS los datos actualizados
        storage.saveHighScore(currentUsername, currentScore); // Guardar puntuación alta
        const highScores = storage.loadHighScores(); // Cargar scores para mostrar
        ui.displayHighScores(highScores); // Mostrar scores actualizados

        ui.displayGameOver(currentScore, message, currentUserData);
        currentQuestionData = null;

    } catch (error) { console.error("Error en endGame:", error); }
}

/**
 * Maneja el botón 'Reiniciar Ronda Actual'.
 */
export function handleRestartRound() {
    startGame();
}

/**
 * Maneja el botón 'Salir al Menú de Niveles'.
 */
export function handleExitToMenu() {
     clearInterval(questionTimerInterval);
     handlePlayAgain();
}

/**
 * Maneja el botón 'Jugar de Nuevo / Elegir Nivel' en Game Over.
 */
export function handlePlayAgain() {
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
    }
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/**
 * Inicializa el estado del juego al cargar la página.
 */
export function initializeGame() {
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    ui.showSection(ui.userSetupSection);
}

