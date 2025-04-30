// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// ... (resto del código inicial igual que en v2) ...
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';
import { getTranslation } from './i18n.js';

// --- Variables de Estado del Juego ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard';
let currentQuestionData = null;
let questionsAnswered = 0;
let roundResults = [];
let questionTimerInterval = null;
let timeLeft = 0;

// --- Variables para rastrear el estado del feedback ---
let isFeedbackActive = false;
let lastAnswerCorrect = null;
let lastMasteryMode = false;
// --- NUEVO: Variable para guardar la opción incorrecta seleccionada ---
let lastSelectedOriginalValue = null;
// --- FIN NUEVO ---

// --- Funciones Auxiliares ---
/**
 * Obtiene la duración del temporizador para el nivel y modo actuales.
 * @returns {number|null} Duración en segundos o null si no aplica timer.
 */
function getTimerDurationForCurrentLevel() {
    try {
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error);
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 15;
    }
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el inicio de sesión inicial del usuario.
 * @param {string} username - El nombre de usuario ingresado.
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
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        ui.showSection(ui.userSetupSection);
    }
}

/**
 * Establece el nivel y modo seleccionados y comienza la ronda.
 * @param {string} level - Nivel seleccionado.
 * @param {string} mode - Modo seleccionado.
 */
export function selectLevelAndMode(level, mode) {
    currentLevel = level;
    currentGameMode = mode;
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
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null; // <-- Resetear aquí también
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection);
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    ui.showTimerDisplay(false);
    loadNextQuestion();
}

/**
 * Carga los datos de la siguiente pregunta y actualiza la UI.
 */
function loadNextQuestion() {
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null; // <-- Resetear aquí también

    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    clearInterval(questionTimerInterval);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        const questionDataResult = getNextQuestion(currentLevel);
        if (questionDataResult && questionDataResult.question && questionDataResult.options && Array.isArray(questionDataResult.options) && questionDataResult.correctAnswer !== undefined && questionDataResult.explanation !== undefined) {
            currentQuestionData = questionDataResult;

            const duration = getTimerDurationForCurrentLevel();
            if (duration !== null && duration > 0) {
                ui.showTimerDisplay(true);
                timeLeft = duration;
                ui.updateTimerDisplay(timeLeft);
                questionTimerInterval = setInterval(updateTimer, 1000);
            } else {
                ui.showTimerDisplay(false);
            }
            // Pasamos handleAnswerClick como callback para los botones
            ui.displayQuestion(currentQuestionData, handleAnswerClick);

        } else {
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) {
                 throw new Error(getTranslation('error_no_questions_for_level', { level: currentLevel }));
            } else {
                 throw new Error(getTranslation('error_invalid_question_data'));
            }
        }
    } catch (error) {
        console.error("Error en loadNextQuestion:", error);
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('error_loading_question_msg', { message: error.message });
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
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);

        isFeedbackActive = true;
        lastAnswerCorrect = false;
        lastMasteryMode = isMasteryStyle;
        lastSelectedOriginalValue = null; // Timeout significa que no seleccionó nada

        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        // Modificar texto para timeout
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
            // ... (lógica para traducir ca igual que antes) ...
             if (typeof ca === 'string') { translatedCorrectAnswer = getTranslation(ca) || ca; }
             else if (typeof ca === 'object') {
                  if (ca.classKey && ca.typeKey) translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.typeKey)}`;
                  else if (ca.classKey && ca.maskValue) translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation('option_mask', { mask: ca.maskValue })}`;
                  else if (ca.classKey && ca.portionKey) translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.portionKey, { portion: ca.portionValue || getTranslation('option_none') })}`;
                  else translatedCorrectAnswer = JSON.stringify(ca);
             } else { translatedCorrectAnswer = 'N/A'; }

            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
            if (feedbackContent) { feedbackContent.innerHTML = timeoutMsg; }
            else { const timeoutSpan = document.createElement('span'); timeoutSpan.innerHTML = timeoutMsg; ui.feedbackArea.prepend(timeoutSpan); }
            ui.feedbackArea.className = 'incorrect';
        }
    }
}

/**
 * Función intermedia para avanzar a la siguiente pregunta o terminar el juego.
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
 * Maneja el evento de clic en un botón de opción de respuesta.
 * @param {Event} event - El objeto del evento click.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval);
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');

    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer;
    let correctOriginalValueStr = '';
    // ... (lógica para construir correctOriginalValueStr igual que antes) ...
    if (typeof correctAnswerOriginal === 'string') {
        correctOriginalValueStr = correctAnswerOriginal;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.typeKey) {
        correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.typeKey}`;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.maskValue) {
        correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.maskValue}`;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.portionKey) {
        correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.portionKey},${correctAnswerOriginal.portionValue || 'None'}`;
    } else {
         correctOriginalValueStr = JSON.stringify(correctAnswerOriginal);
    }
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);

    roundResults.push(isCorrect);
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    isFeedbackActive = true;
    lastAnswerCorrect = isCorrect;
    lastMasteryMode = isMasteryStyle;
    // --- NUEVO: Guardar la opción seleccionada si fue incorrecta ---
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue;
    // --- FIN NUEVO ---

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200);
    } else {
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect'); // Marcar la seleccionada como incorrecta
    }
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}

/**
 * Finaliza la partida/ronda actual.
 */
 function endGame() {
    clearInterval(questionTimerInterval);
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null; // <-- Resetear aquí también

    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    try {
        currentUserData = storage.getUserData(currentUsername);
        // ... (lógica de racha y desbloqueo igual que antes) ...
         if (currentLevel === 'Entry') {
             if (isPerfect) {
                 currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                 if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                     currentUserData.unlockedLevels.push('Associate');
                     currentUserData.entryPerfectStreak = 0;
                 }
             } else {
                 currentUserData.entryPerfectStreak = 0;
             }
         } else if (currentLevel === 'Associate') {
              if (meetsAssociateThreshold) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     currentUserData.unlockedLevels.push('Professional');
                     currentUserData.associatePerfectStreak = 0;
                 }
              } else {
                  currentUserData.associatePerfectStreak = 0;
              }
         }

        storage.saveUserData(currentUsername, currentUserData);
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode);
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        ui.displayGameOver(currentScore, currentUserData, currentLevel);
        currentQuestionData = null;

    } catch (error) {
        console.error("Error en endGame:", error);
        ui.displayGameOver(currentScore, { error: getTranslation('error_end_game', { message: error.message }) }, currentLevel);
    }
}

/**
 * Maneja el evento del botón 'Reiniciar Ronda Actual'.
 */
export function handleRestartRound() {
    startGame();
}

/**
 * Maneja el evento del botón 'Salir al Menú de Niveles'.
 */
export function handleExitToMenu() {
     clearInterval(questionTimerInterval);
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null; // <-- Resetear aquí también
     handlePlayAgain();
}

/**
 * Maneja el evento del botón 'Jugar de Nuevo / Elegir Nivel'.
 */
export function handlePlayAgain() {
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername establecido.");
    }
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/**
 * Función de inicialización general del juego.
 */
export function initializeGame() {
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    ui.showSection(ui.userSetupSection);
}

/**
 * Refresca la UI del área de juego (pregunta o feedback)
 * después de un cambio de idioma.
 */
export function refreshActiveGameUI() {
    if (!currentUsername) {
        console.warn("Intentando refrescar UI sin usuario activo.");
        return;
    }
    if (!currentQuestionData && !isFeedbackActive) {
        console.warn("Intentando refrescar UI sin datos de pregunta ni feedback activo.");
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('loading_question');
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        if (ui.feedbackArea) ui.feedbackArea.innerHTML = '';
        return;
    }

    // Comprobar si el feedback estaba activo
    if (isFeedbackActive && lastAnswerCorrect !== null && currentQuestionData) {
        // Primero, volver a mostrar la pregunta (traducida)
        // Pasamos handleAnswerClick aunque los botones estarán deshabilitados
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        // Asegurar que las opciones queden deshabilitadas
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

        // Luego, volver a mostrar el feedback (traducido)
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // La llamada a displayFeedback usará el idioma actual cargado en i18n
        // y ahora debería generar la explicación dinámicamente (ver cambios en ui.js)
        ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, feedbackData, proceedToNextStep);

        // --- Re-resaltar botones (Correcto e Incorrecto Seleccionado) ---
         try {
            const correctOriginalValue = currentQuestionData.correctAnswer;
            let correctOriginalValueStr = '';
            // ... (lógica para construir correctOriginalValueStr igual que antes) ...
            if (typeof correctOriginalValue === 'string') { correctOriginalValueStr = correctOriginalValue; }
            else if (typeof correctOriginalValue === 'object' && correctOriginalValue.classKey && correctOriginalValue.typeKey) { correctOriginalValueStr = `${correctOriginalValue.classKey},${correctOriginalValue.typeKey}`; }
            else if (typeof correctOriginalValue === 'object' && correctOriginalValue.classKey && correctOriginalValue.maskValue) { correctOriginalValueStr = `${correctOriginalValue.classKey},${correctOriginalValue.maskValue}`; }
            else if (typeof correctOriginalValue === 'object' && correctOriginalValue.classKey && correctOriginalValue.portionKey) { correctOriginalValueStr = `${correctOriginalValue.classKey},${correctOriginalValue.portionKey},${correctOriginalValue.portionValue || 'None'}`; }
            else { correctOriginalValueStr = JSON.stringify(correctOriginalValue); }


            if (ui.optionsContainer) {
                 Array.from(ui.optionsContainer.children).forEach(button => {
                     const btnValue = button.getAttribute('data-original-value');
                     button.classList.remove('correct', 'incorrect', 'mastery'); // Limpiar clases

                     // Marcar la correcta
                     if (btnValue === correctOriginalValueStr) {
                         button.classList.add(lastMasteryMode ? 'mastery' : 'correct');
                     }
                     // --- NUEVO: Marcar la incorrecta que se seleccionó ---
                     if (!lastAnswerCorrect && btnValue === lastSelectedOriginalValue) {
                         button.classList.add('incorrect');
                     }
                     // --- FIN NUEVO ---
                 });
                 // La clase 'options-disabled' ya se añadió arriba
             }
         } catch(e){ console.error("Error resaltando botones al refrescar feedback", e); }
        // --- Fin re-resaltado ---

    } else if (currentQuestionData) {
        // Si el feedback no estaba activo, volver a mostrar la pregunta
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');

    } else {
        // Caso raro: feedback no activo Y no hay datos de pregunta. Limpiar.
        if (ui.questionText) ui.questionText.innerHTML = '';
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        if (ui.feedbackArea) ui.feedbackArea.innerHTML = '';
        console.warn("Refrescando UI en estado inesperado (sin pregunta ni feedback activo).");
    }

    // Siempre refrescar elementos comunes del área de juego
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    if (questionTimerInterval) {
        ui.showTimerDisplay(true);
        ui.updateTimerDisplay(timeLeft);
        if (timeLeft <= 5) ui.timerDisplayDiv.classList.add('low-time');
        else ui.timerDisplayDiv.classList.remove('low-time');
    } else {
        ui.showTimerDisplay(false);
    }
}

/**
 * Devuelve el nombre de usuario actual.
 * @returns {string} El nombre de usuario.
 */
export function getCurrentUsername() {
    return currentUsername;
}

/**
 * Devuelve los datos de la pregunta actual.
 * @returns {object|null} Los datos de la pregunta actual o null.
 */
export function getCurrentQuestionData() {
    return currentQuestionData;
}

/**
 * Devuelve el nivel actual.
 * @returns {string} El nivel actual.
 */
export function getCurrentLevel() {
    return currentLevel;
}

/**
 * Devuelve la puntuación actual.
 * @returns {number} La puntuación actual.
 */
export function getCurrentScore() {
    return currentScore;
}
