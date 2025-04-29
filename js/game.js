// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// ==================================================

// --- Importaciones ---
import * as config from './config.js'; // Importa TODAS las constantes necesarias
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';

// --- Variables de Estado ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard';
let currentQuestionData = null;
let correctAnswer = null;
let questionsAnswered = 0;
let roundResults = [];
let questionTimerInterval = null;
let timeLeft = 0;

// --- Funciones Principales ---
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
        alert(`Hubo un problema al cargar los datos del usuario: ${error.message}`);
        ui.showSection(ui.userSetupSection);
    }
}

export function selectLevelAndMode(level, mode) {
    currentLevel = level;
    currentGameMode = mode;
    startGame();
}

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

function loadNextQuestion() {
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null; correctAnswer = null; clearInterval(questionTimerInterval);
    ui.showTimerDisplay(false); if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');
    try {
        const questionDataResult = getNextQuestion(currentLevel);
        if (questionDataResult && questionDataResult.question && questionDataResult.options && Array.isArray(questionDataResult.options) && questionDataResult.correctAnswer !== undefined && questionDataResult.explanation !== undefined) {
            currentQuestionData = questionDataResult; correctAnswer = currentQuestionData.correctAnswer;
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery') || (currentLevel === 'Associate') || (currentLevel === 'Professional');
            ui.showTimerDisplay(timerCondition);
            if (timerCondition) { timeLeft = config.QUESTION_TIMER_DURATION; ui.updateTimerDisplay(timeLeft); questionTimerInterval = setInterval(updateTimer, 1000); }
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
        } else {
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) { throw new Error(`No hay preguntas disponibles para el nivel ${currentLevel} todavía.`); }
            else { throw new Error("Datos de pregunta inválidos o nulos recibidos del generador."); }
        }
    } catch (error) {
        console.error("Error en loadNextQuestion:", error);
        if (ui.questionText) ui.questionText.innerHTML = `Error al cargar pregunta: ${error.message}`;
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500);
    }
}

 function updateTimer() {
    timeLeft--; ui.updateTimerDisplay(timeLeft);
    if (timeLeft <= 0) {
        clearInterval(questionTimerInterval); if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');
        roundResults.push(false); const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            if (feedbackContent) { feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`; }
            else { const timeoutSpan = document.createElement('span'); timeoutSpan.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`; ui.feedbackArea.prepend(timeoutSpan); }
            ui.feedbackArea.className = 'incorrect';
        }
    }
}

 function proceedToNextStep() {
    clearInterval(questionTimerInterval); questionsAnswered++;
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame();
    } else {
        loadNextQuestion();
    }
}

 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval);
    if (!currentQuestionData || correctAnswer === null) { console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta."); return; }
    const selectedButton = event.target; const selectedAnswer = selectedButton.textContent;
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');
    let isCorrect = (selectedAnswer === correctAnswer); roundResults.push(isCorrect);
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
    if (isCorrect) {
        // --- Puntuación Simple ---
        currentScore += config.POINTS_PER_QUESTION; // Usa la constante fija
        // --- Fin Puntuación Simple ---
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

 function endGame() {
    clearInterval(questionTimerInterval);
    // --- Cálculo de Porcentaje y Ronda Perfecta con Puntuación Fija ---
    const maxScore = config.PERFECT_SCORE; // Usa la constante fija
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = currentScore === maxScore; // Verifica si se alcanzó la puntuación perfecta
    // --- Fin Cálculo ---
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    let message = `¡Partida completada! Puntuación: ${currentScore} / ${maxScore} (${scorePercentage.toFixed(0)}%)`;

    try {
        currentUserData = storage.getUserData(currentUsername);

        // --- Lógica de Racha/Desbloqueo (sin cambios aquí, ya usa isPerfect y meetsAssociateThreshold) ---
        if (currentLevel === 'Entry') {
            if (isPerfect) { // Desbloqueo Associate requiere 100%
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) { currentUserData.unlockedLevels.push('Associate'); currentUserData.entryPerfectStreak = 0; message = `¡3 Rondas Perfectas (100%)! ¡Nivel Associate Desbloqueado! 🎉`; }
                else if (!currentUserData.unlockedLevels.includes('Associate')) { message = `¡Ronda Perfecta (100%)! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`; }
                else { message = `¡Ronda Perfecta (100%)!`; }
            } else { if (currentUserData.entryPerfectStreak > 0) { message += " (Racha 100% reiniciada)"; } currentUserData.entryPerfectStreak = 0; }
        } else if (currentLevel === 'Associate') {
             if (meetsAssociateThreshold) { // Desbloqueo Pro requiere 90%
                currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) { currentUserData.unlockedLevels.push('Professional'); currentUserData.associatePerfectStreak = 0; message = `¡3 Rondas con +${config.MIN_SCORE_PERCENT_FOR_STREAK}%! ¡Nivel Professional Desbloqueado! 🏆`; }
                else if (!currentUserData.unlockedLevels.includes('Professional')) { message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)! Racha: ${currentUserData.associatePerfectStreak}/3.`; }
                else { message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)!`; }
             } else { if (currentUserData.associatePerfectStreak > 0) { message += " (Racha 90% reiniciada)"; } currentUserData.associatePerfectStreak = 0; }
        }
        // --- Fin Lógica Racha ---

        storage.saveUserData(currentUsername, currentUserData);
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode); // Guardar score con nivel/modo
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        ui.displayGameOver(currentScore, message, currentUserData);
        currentQuestionData = null;

    } catch (error) {
        console.error("Error en endGame:", error);
        ui.displayGameOver(currentScore, `Error al finalizar la partida: ${error.message}`, currentUserData);
    }
}

export function handleRestartRound() { startGame(); }
export function handleExitToMenu() { clearInterval(questionTimerInterval); handlePlayAgain(); }
export function handlePlayAgain() {
    if (currentUsername) { currentUserData = storage.getUserData(currentUsername); }
    else { currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 }; console.warn("handlePlayAgain llamado sin currentUsername establecido."); }
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}
export function initializeGame() { const initialHighScores = storage.loadHighScores(); ui.displayHighScores(initialHighScores); ui.showSection(ui.userSetupSection); }

