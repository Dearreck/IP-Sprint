// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Añadidos console.log para depurar Game Over
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
let isFeedbackActive = false;
let lastAnswerCorrect = null;
let lastMasteryMode = false;
let lastSelectedOriginalValue = null;

// --- Funciones Auxiliares ---
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
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection);
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    ui.showTimerDisplay(false);
    loadNextQuestion();
}

function loadNextQuestion() {
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;

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
        lastSelectedOriginalValue = null;
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
             if (typeof ca === 'string') { translatedCorrectAnswer = getTranslation(ca) || ca; }
             else if (typeof ca === 'object') {
                  let textParts = [];
                  if (ca.classKey) textParts.push(getTranslation(ca.classKey));
                  if (ca.typeKey) textParts.push(getTranslation(ca.typeKey));
                  if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue }));
                  if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); }
                  if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); }
                  else { translatedCorrectAnswer = JSON.stringify(ca); }
             } else { translatedCorrectAnswer = 'N/A'; }
            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
            if (feedbackContent) { feedbackContent.innerHTML = timeoutMsg; }
            else { const timeoutSpan = document.createElement('span'); timeoutSpan.innerHTML = timeoutMsg; ui.feedbackArea.prepend(timeoutSpan); }
            ui.feedbackArea.className = 'incorrect';
        }
    }
}

 function proceedToNextStep() {
    clearInterval(questionTimerInterval);
    questionsAnswered++;
    // --- DEBUG LOG ---
    console.log(`Proceeding: Answered ${questionsAnswered}, Total ${config.TOTAL_QUESTIONS_PER_GAME}`);
    // --- END DEBUG LOG ---
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        // --- DEBUG LOG ---
        console.log("Condition met, calling endGame()");
        // --- END DEBUG LOG ---
        endGame();
    } else {
        loadNextQuestion();
    }
}

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
    let originalValueParts = [];
    if (typeof correctAnswerOriginal === 'string') {
        correctOriginalValueStr = correctAnswerOriginal;
    } else if (typeof correctAnswerOriginal === 'object') {
        if (correctAnswerOriginal.classKey) originalValueParts.push(correctAnswerOriginal.classKey);
        if (correctAnswerOriginal.typeKey) originalValueParts.push(correctAnswerOriginal.typeKey);
        if (correctAnswerOriginal.maskValue) originalValueParts.push(correctAnswerOriginal.maskValue);
        if (correctAnswerOriginal.portionKey) {
             originalValueParts.push(correctAnswerOriginal.portionKey);
             originalValueParts.push(correctAnswerOriginal.portionValue || 'None');
        }
        correctOriginalValueStr = originalValueParts.join(',');
    } else {
         correctOriginalValueStr = 'N/A';
    }
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    roundResults.push(isCorrect);
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
    isFeedbackActive = true;
    lastAnswerCorrect = isCorrect;
    lastMasteryMode = isMasteryStyle;
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue;
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

 function endGame() {
    // --- DEBUG LOG ---
    console.log("endGame function started");
    // --- END DEBUG LOG ---
    clearInterval(questionTimerInterval);
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    try {
        currentUserData = storage.getUserData(currentUsername);
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
    // --- DEBUG LOG ---
    console.log("endGame function finished");
    // --- END DEBUG LOG ---
}

export function handleRestartRound() {
    startGame();
}

export function handleExitToMenu() {
     clearInterval(questionTimerInterval);
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null;
     handlePlayAgain();
}

export function handlePlayAgain() {
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername establecido.");
    }
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

export function initializeGame() {
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    ui.showSection(ui.userSetupSection);
}

export function refreshActiveGameUI() {
    if (!currentUsername) { console.warn("Intentando refrescar UI sin usuario activo."); return; }
    if (!currentQuestionData && !isFeedbackActive) { console.warn("Intentando refrescar UI sin datos de pregunta ni feedback activo."); if (ui.questionText) ui.questionText.innerHTML = getTranslation('loading_question'); if (ui.optionsContainer) ui.optionsContainer.innerHTML = ''; if (ui.feedbackArea) ui.feedbackArea.innerHTML = ''; return; }
    if (isFeedbackActive && lastAnswerCorrect !== null && currentQuestionData) {
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, feedbackData, proceedToNextStep);
         try {
            const correctOriginalValue = currentQuestionData.correctAnswer;
            let correctOriginalValueStr = '';
            let originalValueParts = [];
            if (typeof correctOriginalValue === 'string') { correctOriginalValueStr = correctOriginalValue; }
            else if (typeof correctOriginalValue === 'object') { if (correctOriginalValue.classKey) originalValueParts.push(correctOriginalValue.classKey); if (correctOriginalValue.typeKey) originalValueParts.push(correctOriginalValue.typeKey); if (correctOriginalValue.maskValue) originalValueParts.push(correctOriginalValue.maskValue); if (correctOriginalValue.portionKey) { originalValueParts.push(correctOriginalValue.portionKey); originalValueParts.push(correctOriginalValue.portionValue || 'None'); } correctOriginalValueStr = originalValueParts.join(','); }
            else { correctOriginalValueStr = 'N/A'; }
            if (ui.optionsContainer) {
                 Array.from(ui.optionsContainer.children).forEach(button => {
                     const btnValue = button.getAttribute('data-original-value');
                     button.classList.remove('correct', 'incorrect', 'mastery');
                     if (btnValue === correctOriginalValueStr) { button.classList.add(lastMasteryMode ? 'mastery' : 'correct'); }
                     if (!lastAnswerCorrect && btnValue === lastSelectedOriginalValue) { button.classList.add('incorrect'); }
                 });
             }
         } catch(e){ console.error("Error resaltando botones al refrescar feedback", e); }
    } else if (currentQuestionData) {
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    } else {
        if (ui.questionText) ui.questionText.innerHTML = ''; if (ui.optionsContainer) ui.optionsContainer.innerHTML = ''; if (ui.feedbackArea) ui.feedbackArea.innerHTML = '';
        console.warn("Refrescando UI en estado inesperado (sin pregunta ni feedback activo).");
    }
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

export function getCurrentUsername() { return currentUsername; }
export function getCurrentQuestionData() { return currentQuestionData; }
export function getCurrentLevel() { return currentLevel; }
export function getCurrentScore() { return currentScore; }
