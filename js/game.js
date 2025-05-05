// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// Maneja carga async de preguntas Essential desde JSON.
// Pasa handlers correctamente y maneja refresco de UI por idioma.
// Versión sin console.log
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';        // Constantes de configuración
import * as storage from './storage.js';       // Funciones de LocalStorage
import * as ui from './ui.js';             // Funciones y selectores de UI
import { getNextQuestion } from './questions.js'; // Función para obtener preguntas (async)
// Importar formateador específico para Essential (usado en refresh)
import { formatEssentialQuestionForUI } from './questions_essential.js';
import { getCurrentLanguage, getTranslation } from './i18n.js'; // Funciones de idioma

// --- Variables de Estado del Juego ---
let currentUsername = '';           // Nombre del usuario actual
let currentUserData = {};           // Datos del usuario (niveles desbloq., rachas)
let currentScore = 0;               // Puntuación de la ronda actual
let currentLevel = '';              // Nivel seleccionado para jugar
let currentGameMode = 'standard';   // Modo de juego
let currentQuestionData = null;     // Datos formateados de la pregunta actual para la UI
let originalQuestionData = null;   // Datos crudos/originales de la pregunta (para refresco Essential)
let questionsAnswered = 0;          // Contador de preguntas respondidas
let roundResults = [];              // Array para guardar resultados (true/false) de la ronda
let questionTimerInterval = null;   // Intervalo del temporizador
let timeLeft = 0;                   // Tiempo restante
// Variables para refrescar UI en cambio de idioma durante feedback
let isFeedbackActive = false;
let lastAnswerCorrect = null;
let lastMasteryMode = false;
let lastSelectedOriginalValue = null;

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
        // Recargar para asegurar consistencia
        currentUserData = storage.getUserData(currentUsername);

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
    currentQuestionData = null; // Asegurar que se limpia
    originalQuestionData = null; // Asegurar que se limpia

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
    originalQuestionData = null; // Resetear datos originales

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
                // delete currentQuestionData.rawData; // Opcional: limpiar si no se necesita más
            } else {
                 originalQuestionData = null; // No hay datos crudos para otros niveles (por ahora)
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
        lastSelectedOriginalValue = null;

        // Usar los datos formateados actuales para el feedback
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // Asegurarse que displayFeedback tenga la info necesaria (correctAnswerDisplay)
        if (!timeoutFeedbackData.correctAnswerDisplay && timeoutFeedbackData.correctAnswer) {
             // Si falta, intentar obtenerla (esto puede fallar si correctAnswer es complejo y no string/clave)
             const ca = timeoutFeedbackData.correctAnswer;
             const translated = getTranslation(ca); // Intenta traducir clave V/F
             timeoutFeedbackData.correctAnswerDisplay = (translated && translated !== ca) ? translated : ca;
        }
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

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
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue;

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        // Pasar los datos formateados actuales a displayFeedback
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200);
    } else {
        // Pasar los datos formateados actuales a displayFeedback
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
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
             } else {
                 currentUserData.entryPerfectStreak = 0;
             }
        } else if (currentLevel === 'Associate') {
              if (meetsAssociateThreshold) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     currentUserData.unlockedLevels.push('Professional');
                 }
              } else {
                  currentUserData.associatePerfectStreak = 0;
              }
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
 */
export function refreshActiveGameUI() {
    if (!currentUsername) { return; } // Salir si no hay usuario
    const newLang = getCurrentLanguage();

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
    if (isFeedbackActive && lastAnswerCorrect !== null) {
        let feedbackDataForUI = null;
        if (currentLevel === 'Essential' && originalQuestionData) {
            feedbackDataForUI = formatEssentialQuestionForUI(originalQuestionData, newLang);
        } else if (currentQuestionData) {
             // Para no-Essential, necesitamos regenerar o tener datos originales
             // Por ahora, reusamos los datos actuales (puede mostrar idioma incorrecto)
             feedbackDataForUI = currentQuestionData;
             console.warn("[Game] Refrescando feedback no-Essential, puede mostrar idioma anterior.");
        }
        if (feedbackDataForUI) {
             feedbackDataForUI.questionsAnswered = questionsAnswered;
             feedbackDataForUI.totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
             ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, feedbackDataForUI, proceedToNextStep);
        } else { console.error("[Game] No se pudieron obtener/formatear datos para refrescar feedback."); }

    } else if (currentQuestionData) {
        let questionDataForUI = null;
        if (currentLevel === 'Essential' && originalQuestionData) {
             questionDataForUI = formatEssentialQuestionForUI(originalQuestionData, newLang);
        } else if (currentQuestionData) {
            // Reusar datos actuales para no-Essential (misma advertencia)
             questionDataForUI = currentQuestionData;
              console.warn("[Game] Refrescando pregunta no-Essential, puede mostrar idioma anterior.");
        }
        if (questionDataForUI) {
            ui.displayQuestion(questionDataForUI, handleAnswerClick);
            if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
        } else { console.error("[Game] No se pudieron obtener/formatear datos para refrescar pregunta."); }

    } else if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none') {
        currentUserData = storage.getUserData(currentUsername);
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
    } else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none') {
        currentUserData = storage.getUserData(currentUsername);
        const lastScoreText = ui.finalScoreDisplay?.textContent;
        const lastScore = parseInt(lastScoreText || '0', 10);
        const lastLevelPlayed = getCurrentLevel();
        ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed, handlePlayAgain);
    } else {
        // Estado desconocido, no hacer nada o limpiar
    }
}

// --- Funciones para obtener estado actual ---
export function getCurrentUsername() { return currentUsername; }
export function getCurrentLevel() { return currentLevel; }

