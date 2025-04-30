// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado del juego, el flujo entre pantallas,
// las interacciones del usuario, la puntuación,
// el desbloqueo de niveles y el temporizador.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';
import { getTranslation } from './i18n.js'; // Importar función de traducción

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
            ui.displayQuestion(currentQuestionData, handleAnswerClick);
        } else {
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) { throw new Error(getTranslation('error_no_questions_for_level', { level: currentLevel })); }
            else { throw new Error(getTranslation('error_invalid_question_data')); }
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
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
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
 * Compara la respuesta usando el valor original guardado en el botón.
 * @param {Event} event - El objeto del evento click.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval);
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) { console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta."); return; }
    const selectedButton = event.target;
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    // --- Comparación usando Valores Originales ---
    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer;
    let correctOriginalValueStr = '';
    if (typeof correctAnswerOriginal === 'string') { correctOriginalValueStr = correctAnswerOriginal; }
    else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.typeKey) { correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.typeKey}`; }
    else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.maskValue) { correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.maskValue}`; }
    else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.portionKey) { correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.portionKey},${correctAnswerOriginal.portionValue || 'None'}`; }
    else { correctOriginalValueStr = JSON.stringify(correctAnswerOriginal); }
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    // --- Fin Comparación ---

    roundResults.push(isCorrect);
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200);
    } else {
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect');
    }
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}

/**
 * Finaliza la partida/ronda actual. Calcula resultados, actualiza rachas/desbloqueos,
 * guarda datos, y muestra la pantalla de Game Over con mensajes traducidos.
 */
 function endGame() {
    clearInterval(questionTimerInterval);
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    // --- Construcción del Mensaje Final con i18n (CORREGIDO) ---
    let baseMessage = getTranslation('game_over_base_message', {
        score: currentScore,
        maxScore: maxScore,
        percentage: scorePercentage.toFixed(0)
    });
    let extraMessage = '';

    try {
        currentUserData = storage.getUserData(currentUsername);

        // Lógica de Racha/Desbloqueo usando getTranslation
        if (currentLevel === 'Entry') {
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0;
                    extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') });
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak });
                } else {
                    extraMessage = getTranslation('game_over_good_round_entry');
                }
            } else {
                if (currentUserData.entryPerfectStreak > 0) {
                    extraMessage = getTranslation('game_over_streak_reset_100');
                }
                currentUserData.entryPerfectStreak = 0;
            }
        } else if (currentLevel === 'Associate') {
             if (meetsAssociateThreshold) {
                currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                    currentUserData.unlockedLevels.push('Professional');
                    currentUserData.associatePerfectStreak = 0;
                    extraMessage = getTranslation('game_over_level_unlocked_pro');
                } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                    extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak });
                } else {
                    extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK });
                }
             } else {
                  if (currentUserData.associatePerfectStreak > 0) {
                      extraMessage = getTranslation('game_over_streak_reset_90');
                  }
                 currentUserData.associatePerfectStreak = 0;
             }
        }
        // --- Fin Lógica Racha ---

        // Combinar mensaje base con el extra (si existe)
        const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;

        // Guardar datos y mostrar UI
        storage.saveUserData(currentUsername, currentUserData);
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode);
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);
        ui.displayGameOver(currentScore, finalMessage, currentUserData); // Pasar el mensaje final traducido
        currentQuestionData = null;

    } catch (error) {
        console.error("Error en endGame:", error);
        // TODO: Añadir clave 'error_end_game' a JSONs
        ui.displayGameOver(currentScore, getTranslation('error_end_game', { message: error.message }), currentUserData);
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
     handlePlayAgain();
}

/**
 * Maneja el evento del botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over.
 */
export function handlePlayAgain() {
    if (currentUsername) { currentUserData = storage.getUserData(currentUsername); }
    else { currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 }; console.warn("handlePlayAgain llamado sin currentUsername establecido."); }
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
