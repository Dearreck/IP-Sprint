// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Añadidos logs para depurar Essential y paso de handler.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';
import { getTranslation } from './i18n.js';

// --- Variables de Estado del Juego ---
let currentUsername = '';
let currentUserData = {}; // Debe contener unlockedLevels, etc. No el nombre.
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
        // Asegurarse que currentLevel tenga un valor antes de buscar
        if (!currentLevel) return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error);
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 20;
    }
}

// --- Funciones Principales del Flujo del Juego ---

export function handleUserLogin(username) {
    currentUsername = username;
    console.log(`[Game] handleUserLogin para: ${username}`); // Log
    try {
        const allUserData = storage.getAllUserData();
        const defaultData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };

        if (allUserData[username]) {
            currentUserData = { ...defaultData, ...allUserData[username] };
            // --- Log y Corrección para Essential ---
            if (!currentUserData.unlockedLevels.includes('Essential')) {
                console.log(`[Game] Usuario existente sin Essential. Añadiendo...`); // Log
                currentUserData.unlockedLevels.unshift('Essential'); // Añade al principio
            }
        } else {
            console.log(`[Game] Usuario nuevo. Usando datos por defecto.`); // Log
            currentUserData = defaultData;
        }
        // --- Log para verificar niveles desbloqueados ANTES de guardar ---
        console.log(`[Game] Niveles desbloqueados ANTES de guardar:`, JSON.stringify(currentUserData.unlockedLevels));

        storage.saveUserData(username, currentUserData); // Guardar datos actualizados

        // --- Log para verificar niveles desbloqueados DESPUÉS de guardar y ANTES de pasar a UI ---
        // Recargar explícitamente para asegurar que usamos lo guardado
        currentUserData = storage.getUserData(currentUsername);
        console.log(`[Game] Niveles desbloqueados a pasar a UI:`, JSON.stringify(currentUserData.unlockedLevels));


        ui.updatePlayerInfo(currentUsername, '', ''); // Limpiar UI

        // --- Log para verificar handler antes de pasar ---
        console.log(`[Game] Pasando a displayLevelSelection. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`);
        // Pasar los niveles desbloqueados (que deben incluir Essential) y el handler
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);

        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        ui.showSection(ui.userSetupSection);
    }
}

// --- Esta es la función que se pasa como handler ---
export function selectLevelAndMode(level, mode = 'standard') {
    console.log(`[Game] Nivel seleccionado vía Handler: ${level}, Modo: ${mode}`); // Log específico
    currentLevel = level;
    currentGameMode = mode;
    startGame();
}

export function startGame() {
    console.log(`[Game] Iniciando juego - Nivel: ${currentLevel}, Modo: ${currentGameMode}`); // Log
    clearInterval(questionTimerInterval);
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = (currentLevel === 'Entry' && currentGameMode === 'mastery');
    lastSelectedOriginalValue = null;

    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection);
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    loadNextQuestion();
}

function loadNextQuestion() {
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastSelectedOriginalValue = null;

    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    clearInterval(questionTimerInterval);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        console.log(`[Game] Obteniendo pregunta para nivel: ${currentLevel}`); // Log
        const questionDataResult = getNextQuestion(currentLevel);
        if (questionDataResult &&
            questionDataResult.question && questionDataResult.question.key &&
            Array.isArray(questionDataResult.options) && questionDataResult.options.length > 0 &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            currentQuestionData = questionDataResult;
            const duration = getTimerDurationForCurrentLevel();
            console.log(`[Game] Duración timer para ${currentLevel}/${currentGameMode}: ${duration}`); // Log
            if (duration !== null && duration > 0) {
                ui.showTimerDisplay(true);
                timeLeft = duration;
                ui.updateTimerDisplay(timeLeft);
                questionTimerInterval = setInterval(updateTimer, 1000);
            } else {
                ui.showTimerDisplay(false);
            }
            // Pasar handleAnswerClick como callback
            ui.displayQuestion(currentQuestionData, handleAnswerClick);
        } else {
            console.error("[Game] Datos de pregunta inválidos recibidos:", questionDataResult);
            throw new Error(getTranslation('error_invalid_question_data') || 'Invalid question data received.');
        }
    } catch (error) {
        console.error("[Game] Error en loadNextQuestion:", error);
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('error_loading_question_msg', { message: error.message });
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500);
    }
}

function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
        console.log("[Game] Tiempo agotado!"); // Log
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
             if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
             else if (typeof ca === 'object' && ca !== null) { let textParts = []; if (ca.classKey) textParts.push(getTranslation(ca.classKey)); if (ca.typeKey) textParts.push(getTranslation(ca.typeKey)); if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue })); if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); } if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); } else { translatedCorrectAnswer = JSON.stringify(ca); } }
             else { translatedCorrectAnswer = ca?.toString() ?? 'N/A'; }

            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
            if (feedbackContent) {
                feedbackContent.innerHTML = timeoutMsg;
            } else {
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = timeoutMsg;
                ui.feedbackArea.prepend(timeoutSpan);
            }
            ui.feedbackArea.className = 'incorrect';
        }
    }
}

function proceedToNextStep() {
    console.log("[Game] Proceeding to next step..."); // Log
    clearInterval(questionTimerInterval);
    questionsAnswered++;
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame();
    } else {
        loadNextQuestion();
    }
}

export function handleAnswerClick(event) {
    console.log("[Game] handleAnswerClick iniciado"); // Log
    clearInterval(questionTimerInterval);
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("[Game] handleAnswerClick llamado sin datos de pregunta válidos.");
        return;
    }

    const selectedButton = event.target;
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer;
    let correctOriginalValueStr = '';
    if (typeof correctAnswerOriginal === 'string') { correctOriginalValueStr = correctAnswerOriginal; }
    else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal !== null) { let originalValueParts = []; if (correctAnswerOriginal.classKey) originalValueParts.push(correctAnswerOriginal.classKey); if (correctAnswerOriginal.typeKey) originalValueParts.push(correctAnswerOriginal.typeKey); if (correctAnswerOriginal.maskValue) originalValueParts.push(correctAnswerOriginal.maskValue); if (correctAnswerOriginal.portionKey) { originalValueParts.push(correctAnswerOriginal.portionKey); originalValueParts.push(correctAnswerOriginal.portionValue || 'None'); } correctOriginalValueStr = originalValueParts.join(','); }
    else { correctOriginalValueStr = correctAnswerOriginal?.toString() ?? 'N/A'; }
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    console.log(`[Game] Respuesta: ${isCorrect ? 'Correcta' : 'Incorrecta'}. Seleccionado: ${selectedOriginalValue}, Correcto: ${correctOriginalValueStr}`); // Log

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
    console.log(`[Game] Finalizando juego. Score: ${currentScore}`); // Log
    clearInterval(questionTimerInterval);
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;

    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
    const isPerfect = currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    try {
        currentUserData = storage.getUserData(currentUsername); // Cargar datos frescos

        // --- Lógica de Rachas y Desbloqueo ---
        if (currentLevel === 'Entry') {
             if (isPerfect) {
                 currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                 if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                     console.log("[Game] Desbloqueando Associate!");
                     currentUserData.unlockedLevels.push('Associate');
                 }
             } else {
                 currentUserData.entryPerfectStreak = 0;
             }
        } else if (currentLevel === 'Associate') {
              if (meetsAssociateThreshold) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     console.log("[Game] Desbloqueando Professional!");
                     currentUserData.unlockedLevels.push('Professional');
                 }
              } else {
                  currentUserData.associatePerfectStreak = 0;
              }
        }
        // Añadir lógica para Professional -> Expert

        console.log(`[Game] Guardando datos post-juego. Nuevos niveles desbloqueados:`, JSON.stringify(currentUserData.unlockedLevels)); // Log
        storage.saveUserData(currentUsername, currentUserData);
        storage.saveHighScore(currentUsername, currentScore, currentLevel, 'standard');

        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);
        ui.displayGameOver(currentScore, currentUserData, currentLevel);

        currentQuestionData = null;

    } catch (error) {
        console.error("Error en endGame:", error);
        ui.displayGameOver(currentScore, currentUserData || { error: true, unlockedLevels: ['Essential'], name: currentUsername }, currentLevel);
    }
}

export function handleRestartRound() {
    console.log("[Game] Reiniciando ronda..."); // Log
    startGame();
}

export function handleExitToMenu() {
     console.log("[Game] Saliendo al menú..."); // Log
     clearInterval(questionTimerInterval);
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null;
     handlePlayAgain();
}

export function handlePlayAgain() {
    console.log("[Game] Volviendo a selección de nivel..."); // Log
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername); // Recargar datos
    } else {
         currentUserData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername.");
         initializeGame();
         return;
    }
    // --- Log para verificar handler antes de pasar ---
    console.log(`[Game] Pasando a displayLevelSelection desde PlayAgain. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`);
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode); // Pasar handler
}

export function initializeGame() {
    console.log("[Game] Inicializando juego...");
    if (ui.highScoresSection) {
         const initialHighScores = storage.loadHighScores();
         ui.displayHighScores(initialHighScores);
    }
    ui.showSection(ui.userSetupSection); // Mostrar login
}

export function refreshActiveGameUI() {
    if (!currentUsername) { console.warn("Intentando refrescar UI sin usuario activo."); return; }
    console.log("[Game] Refrescando UI activa...");

    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);
    if (questionTimerInterval) {
        ui.showTimerDisplay(true);
        ui.updateTimerDisplay(timeLeft);
        ui.timerDisplayDiv.classList.toggle('low-time', timeLeft <= 5);
    } else {
        ui.showTimerDisplay(false);
    }

    if (isFeedbackActive && lastAnswerCorrect !== null && currentQuestionData) {
        console.log("[Game] Refrescando Feedback UI...");
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, feedbackData, proceedToNextStep);
         try {
            const ca = currentQuestionData.correctAnswer;
            let correctOriginalValueStr = '';
             if (typeof ca === 'string') { correctOriginalValueStr = ca; }
             else if (typeof ca === 'object' && ca !== null) { let parts = []; if (ca.classKey) parts.push(ca.classKey); if (ca.typeKey) parts.push(ca.typeKey); if (ca.maskValue) parts.push(ca.maskValue); if (ca.portionKey) { parts.push(ca.portionKey); parts.push(ca.portionValue || 'None'); } correctOriginalValueStr = parts.join(','); }
             else { correctOriginalValueStr = ca?.toString() ?? 'N/A'; }

            if (ui.optionsContainer) {
                 Array.from(ui.optionsContainer.children).forEach(button => {
                     const btnValue = button.getAttribute('data-original-value');
                     button.classList.remove('correct', 'incorrect', 'mastery');
                     if (btnValue === correctOriginalValueStr) { button.classList.add(lastMasteryMode ? 'mastery' : 'correct'); }
                     if (!lastAnswerCorrect && btnValue === lastSelectedOriginalValue) { button.classList.add('incorrect'); }
                 });
                 ui.optionsContainer.classList.add('options-disabled');
             }
         } catch(e){ console.error("Error resaltando botones al refrescar feedback", e); }
    }
    else if (currentQuestionData) {
        console.log("[Game] Refrescando Question UI...");
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    }
    else if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none') {
        console.log("[Game] Refrescando Level Selection UI...");
        currentUserData = storage.getUserData(currentUsername);
        // --- Log para verificar handler antes de pasar ---
        console.log(`[Game] Pasando a displayLevelSelection desde Refresh. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`);
        // Asegurarse que selectLevelAndMode es la función correcta
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
    }
    else {
        if (ui.questionText) ui.questionText.innerHTML = '';
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        if (ui.feedbackArea) ui.feedbackArea.innerHTML = '';
        console.warn("[Game] Refrescando UI en estado inesperado.");
    }
}

// --- Funciones para obtener estado actual ---
export function getCurrentUsername() { return currentUsername; }
export function getCurrentLevel() { return currentLevel; }

