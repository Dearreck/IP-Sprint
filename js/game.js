// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// Maneja carga async de preguntas Essential desde JSON.
// CORREGIDO: refreshActiveGameUI ahora pasa datos completos a ui.displayFeedback.
// Versión sin console.log de depuración
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';
// Importar formateador específico para Essential (usado en refresh)
import { formatEssentialQuestionForUI } from './questions_essential.js';
import { getCurrentLanguage, getTranslation } from './i18n.js'; // Funciones de idioma

// --- Variables de Estado del Juego ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard';
let currentQuestionData = null;     // Datos formateados para la UI
let originalQuestionData = null;   // Datos crudos/originales (especialmente para Essential)
let questionsAnswered = 0;
let roundResults = [];
let questionTimerInterval = null;
let timeLeft = 0;
// Variables para refrescar UI durante feedback
let isFeedbackActive = false;
let lastAnswerCorrect = null;
let lastMasteryMode = false;
let lastSelectedOriginalValue = null; // Valor original de la opción incorrecta seleccionada

// --- Funciones Auxiliares ---

/**
 * Obtiene la duración del temporizador para el nivel y modo actual desde config.js.
 * @returns {number|null} Duración en segundos o null si no hay timer.
 */
function getTimerDurationForCurrentLevel() {
    try {
        if (!currentLevel) return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error); // Mantener error crítico
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 20;
    }
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login del usuario. Carga/Crea datos y muestra selección de nivel.
 * @param {string} username - Nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username;
    try {
        const allUserData = storage.getAllUserData();
        const defaultData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };

        if (allUserData[username]) {
            currentUserData = { ...defaultData, ...allUserData[username] };
            if (!currentUserData.unlockedLevels.includes('Essential')) {
                currentUserData.unlockedLevels.unshift('Essential');
            }
        } else {
            currentUserData = defaultData;
        }
        storage.saveUserData(username, currentUserData);
        currentUserData = storage.getUserData(currentUsername); // Recargar

        ui.updatePlayerInfo(currentUsername, '', '');
        // Pasar handler 'selectLevelAndMode' a la UI
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error); // Mantener error crítico
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        ui.showSection(ui.userSetupSection);
    }
}

/**
 * Callback llamado desde la UI al seleccionar un nivel. Inicia el juego.
 * @param {string} level - Nivel seleccionado.
 * @param {string} [mode='standard'] - Modo seleccionado.
 */
export function selectLevelAndMode(level, mode = 'standard') {
    currentLevel = level;
    currentGameMode = mode;
    startGame();
}

/**
 * Inicia una nueva ronda del juego. Resetea estado y carga la primera pregunta.
 */
export function startGame() {
    clearInterval(questionTimerInterval);
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = (currentLevel === 'Entry' && currentGameMode === 'mastery');
    lastSelectedOriginalValue = null;
    currentQuestionData = null;
    originalQuestionData = null;

    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection);
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    loadNextQuestion(); // Cargar primera pregunta (es async)
}

/**
 * Carga y muestra la siguiente pregunta. Es ASÍNCRONA.
 */
async function loadNextQuestion() {
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastSelectedOriginalValue = null;
    originalQuestionData = null;

    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    clearInterval(questionTimerInterval);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Esperar a que getNextQuestion (que puede ser async) resuelva
        const formattedQuestionData = await getNextQuestion(currentLevel);

        if (formattedQuestionData)
        {
            currentQuestionData = formattedQuestionData; // Guardar datos formateados
            // Guardar datos originales si existen (adjuntados por questions.js para Essential)
            if (currentQuestionData.rawData) {
                originalQuestionData = currentQuestionData.rawData;
                // delete currentQuestionData.rawData; // Opcional
            } else {
                 originalQuestionData = null; // O guardar copia si es necesario para refresco no-Essential
            }

            const duration = getTimerDurationForCurrentLevel();
            if (duration !== null && duration > 0) {
                ui.showTimerDisplay(true);
                timeLeft = duration;
                ui.updateTimerDisplay(timeLeft);
                questionTimerInterval = setInterval(updateTimer, 1000);
            } else {
                ui.showTimerDisplay(false);
            }
            // Mostrar pregunta usando los datos formateados
            ui.displayQuestion(currentQuestionData, handleAnswerClick);

        } else {
            console.error("[Game] No se pudo obtener la siguiente pregunta (getNextQuestion devolvió null)."); // Mantener error crítico
            throw new Error(getTranslation('error_loading_question_msg', { message: 'No question available' }) || 'Error loading question.');
        }
    } catch (error) {
        console.error("[Game] Error en loadNextQuestion:", error); // Mantener error crítico
        if (ui.questionText) ui.questionText.innerHTML = error.message || getTranslation('error_loading_question_msg', { message: 'Unknown error' });
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500);
    }
 }

/**
 * Actualiza el temporizador y maneja el tiempo agotado.
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
        lastSelectedOriginalValue = null; // No hubo selección

        // Usar los datos formateados actuales para el feedback
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // Asegurarse que correctAnswerDisplay exista para el mensaje de timeout
        if (!timeoutFeedbackData.correctAnswerDisplay && timeoutFeedbackData.correctAnswer) {
             const ca = timeoutFeedbackData.correctAnswer;
             const translated = getTranslation(ca);
             timeoutFeedbackData.correctAnswerDisplay = (translated && translated !== ca) ? translated : ca;
        }
        // Pasar null como último argumento (no hubo selección incorrecta)
        // El último argumento 'false' indica que NO es un refresco de UI
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep, null, false);

        // Modificar texto para indicar Timeout
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            const correctAnswerText = timeoutFeedbackData.correctAnswerDisplay || 'N/A'; // Usar el texto guardado
            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${correctAnswerText}</strong>` });
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

/**
 * Procede al siguiente paso (pregunta o fin de juego).
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval);
    questionsAnswered++;
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame();
    } else {
        loadNextQuestion(); // Cargar siguiente (es async)
    }
}

/**
 * Maneja el clic en un botón de opción.
 * @param {Event} event - El evento de clic.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval);
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("[Game] handleAnswerClick llamado sin datos de pregunta válidos."); // Mantener error crítico
        return;
    }

    const selectedButton = event.target;
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    // Comparar valor original del botón con el valor 'correctAnswer' de los datos formateados
    const isCorrect = (selectedOriginalValue === currentQuestionData.correctAnswer);

    roundResults.push(isCorrect);
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    isFeedbackActive = true;
    lastAnswerCorrect = isCorrect;
    lastMasteryMode = isMasteryStyle;
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue; // Guardar selección si fue incorrecta

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        // Pasar null como último argumento ya que no hubo selección incorrecta
        // El último 'false' indica que no es un refresco
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep, null, false);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200);
    } else {
        // Pasar los datos formateados actuales a displayFeedback
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // Pasar el valor original incorrecto seleccionado
        // El último 'false' indica que no es un refresco
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep, lastSelectedOriginalValue, false);
        if (selectedButton) selectedButton.classList.add('incorrect');
    }
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}

/**
 * Finaliza la ronda, actualiza datos y muestra pantalla Game Over.
 */
 function endGame() {
    clearInterval(questionTimerInterval);
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;
    originalQuestionData = null; // Limpiar datos originales

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
                     currentUserData.unlockedLevels.push('Associate');
                 }
             } else { currentUserData.entryPerfectStreak = 0; }
        } else if (currentLevel === 'Associate') {
              if (meetsAssociateThreshold) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     currentUserData.unlockedLevels.push('Professional');
                 }
              } else { currentUserData.associatePerfectStreak = 0; }
        }
        // Añadir lógica para Professional -> Expert

        storage.saveUserData(currentUsername, currentUserData); // Guardar cambios
        storage.saveHighScore(currentUsername, currentScore, currentLevel, 'standard'); // Guardar puntuación

        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);
        // Pasar el handler handlePlayAgain a ui.displayGameOver
        ui.displayGameOver(currentScore, currentUserData, currentLevel, handlePlayAgain);

        currentQuestionData = null; // Limpiar datos pregunta

    } catch (error) {
        console.error("Error en endGame:", error); // Mantener error crítico
        const fallbackData = currentUserData || { error: true, unlockedLevels: ['Essential'], name: currentUsername };
        ui.displayGameOver(currentScore, fallbackData, currentLevel, handlePlayAgain);
    }
}

/**
 * Reinicia la ronda actual.
 */
export function handleRestartRound() {
    startGame();
}

/**
 * Sale al menú de selección de nivel.
 */
export function handleExitToMenu() {
     clearInterval(questionTimerInterval);
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null;
     originalQuestionData = null; // Limpiar datos originales
     handlePlayAgain();
}

/**
 * Vuelve a la pantalla de selección de nivel.
 */
export function handlePlayAgain() {
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername); // Recargar datos
    } else {
         currentUserData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername."); // Mantener warning
         initializeGame(); // Volver al login si no hay usuario
         return;
    }
    // Pasar handler 'selectLevelAndMode' a la UI
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
}

/**
 * Inicializa el juego al cargar la página.
 */
export function initializeGame() {
    if (ui.highScoresSection) {
         const initialHighScores = storage.loadHighScores();
         ui.displayHighScores(initialHighScores);
    }
    ui.showSection(ui.userSetupSection); // Mostrar login
}

/**
 * Refresca la UI activa si el idioma cambia.
 * AHORA reformatea datos y pasa info completa a displayFeedback.
 */
export function refreshActiveGameUI() {
    if (!currentUsername) { return; } // Salir si no hay usuario
    const newLang = getCurrentLanguage(); // Obtener el nuevo idioma

    // Refresco Básico
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);
    if (questionTimerInterval) {
        ui.showTimerDisplay(true);
        ui.updateTimerDisplay(timeLeft);
        ui.timerDisplayDiv.classList.toggle('low-time', timeLeft <= 5);
    } else {
        ui.showTimerDisplay(false);
    }

    // Refresco de Contenido Específico
    let dataForUI = null;

    // --- Obtener/Reformatear Datos para el Nuevo Idioma ---
    if (currentLevel === 'Essential' && originalQuestionData) {
        // Reformatear desde los datos crudos guardados
        dataForUI = formatEssentialQuestionForUI(originalQuestionData, newLang);
        // Adjuntar rawData de nuevo por si se cambia idioma otra vez antes de avanzar
        if(dataForUI) dataForUI.rawData = originalQuestionData;
    } else if (currentQuestionData) {
        // Para niveles no-Essential, reusamos los datos actuales.
        // TODO: Mejorar esto si los generadores no-Essential no usan claves i18n
        dataForUI = currentQuestionData;
        console.warn(`[Game] Refrescando UI no-Essential (${currentLevel}), el texto puede no actualizarse si no usa claves i18n.`); // Mantener warning
    }
    // --- Fin Obtener/Reformatear ---


    // --- Actualizar la UI correcta con los datos obtenidos/reformateados ---
    if (isFeedbackActive && lastAnswerCorrect !== null) {
        // Si estábamos en feedback y tenemos datos...
        if (dataForUI) {
             dataForUI.questionsAnswered = questionsAnswered; // Añadir info necesaria
             dataForUI.totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
             // Llamar a ui.displayFeedback con los datos reformateados, la selección incorrecta original y el flag isRefresh=true
             ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, dataForUI, proceedToNextStep, lastSelectedOriginalValue, true); // <--- Añadido isRefresh=true
        } else { console.error("[Game] No se pudieron obtener/formatear datos para refrescar feedback."); } // Mantener error crítico

    } else if (currentQuestionData && dataForUI) { // Si se estaba mostrando una pregunta y tenemos datos...
        // Llamar a ui.displayQuestion con los datos reformateados
        ui.displayQuestion(dataForUI, handleAnswerClick);
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    } else if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none') {
        // Refrescar selección de nivel (no necesita dataForUI)
        currentUserData = storage.getUserData(currentUsername);
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
    } else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none') {
        // Refrescar Game Over (no necesita dataForUI)
        currentUserData = storage.getUserData(currentUsername);
        const lastScoreText = ui.finalScoreDisplay?.textContent;
        const lastScore = parseInt(lastScoreText || '0', 10);
        const lastLevelPlayed = getCurrentLevel();
        // Pasar el handler handlePlayAgain
        ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed, handlePlayAgain);
    } else {
        // Estado desconocido o sin datos para refrescar
        console.warn("[Game] Refrescando UI en estado inesperado o sin datos."); // Mantener warning
    }
}

// --- Funciones para obtener estado actual ---
export function getCurrentUsername() { return currentUsername; }
export function getCurrentLevel() { return currentLevel; }

