// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// Incluye manejo async para preguntas Essential y logs de depuración.
// CORREGIDO: Exportar handleAnswerClick.
// CORREGIDO: Añadir listeners de botones de juego en startGame.
// CORREGIDO: Lógica de refresco durante feedback.
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
    console.log(`[Game] handleUserLogin para: ${username}`); // Log
    try {
        const allUserData = storage.getAllUserData();
        const defaultData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };

        if (allUserData[username]) {
            currentUserData = { ...defaultData, ...allUserData[username] };
            // Asegurar que unlockedLevels sea un array y contenga Essential
            if (!currentUserData.unlockedLevels || !Array.isArray(currentUserData.unlockedLevels)) {
                 console.warn("[Game] currentUserData.unlockedLevels inválido, reiniciando a ['Essential']"); // Log de advertencia
                 currentUserData.unlockedLevels = ['Essential']; // Forzar un array válido
            } else if (!currentUserData.unlockedLevels.includes('Essential')) {
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

        // --- LOGS DE DIAGNÓSTICO ---
        console.log("--- Diagnóstico ANTES de llamar a ui.displayLevelSelection ---");
        console.log("currentUserData:", currentUserData);
        console.log("typeof currentUserData:", typeof currentUserData);
        console.log("currentUserData.unlockedLevels:", currentUserData ? currentUserData.unlockedLevels : 'N/A');
        console.log("Array.isArray(currentUserData.unlockedLevels):", currentUserData ? Array.isArray(currentUserData.unlockedLevels) : 'N/A');
        console.log("currentUsername:", currentUsername);
        console.log("typeof currentUsername:", typeof currentUsername);
        console.log("levelSelectHandler:", selectLevelAndMode);
        console.log("typeof levelSelectHandler:", typeof selectLevelAndMode);
        // Verificar elementos de UI directamente desde aquí
        console.log("ui.levelStepperContainer:", ui.levelStepperContainer ? 'Encontrado' : 'NO Encontrado');
        console.log("ui.levelCardContent:", ui.levelCardContent ? 'Encontrado' : 'NO Encontrado');
        console.log("config.LEVELS:", config.LEVELS ? JSON.stringify(config.LEVELS) : 'NO Encontrado');
        console.log("--- Fin Diagnóstico ---");
        // --- FIN LOGS ---

        // Pasar los niveles desbloqueados (que deben incluir Essential), los datos del usuario, el nombre y el handler
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
    console.log(`[Game] Nivel seleccionado vía Handler: ${level}, Modo: ${mode}`); // Log específico
    currentLevel = level;
    currentGameMode = mode;
    startGame();
}

/**
 * Inicia una nueva ronda del juego. Resetea estado, añade listeners y carga la primera pregunta.
 */
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
    currentQuestionData = null;
    originalQuestionData = null;

    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection); // Mostrar área de juego ANTES de buscar botones
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    // --- Añadir listeners a botones de control de juego ---
    const restartBtn = document.getElementById('restart-round-button');
    const exitBtn = document.getElementById('exit-to-menu-button');

    if (restartBtn) {
        const newRestartBtn = restartBtn.cloneNode(true); // Clonar para limpiar listeners
        if(restartBtn.parentNode) restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
        newRestartBtn.addEventListener('click', handleRestartRound);
        console.log("[Game] Listener añadido a #restart-round-button."); // Log
    } else {
         console.error("[Game] #restart-round-button no encontrado en startGame."); // Mantener error crítico
    }

    if (exitBtn) {
        const newExitBtn = exitBtn.cloneNode(true); // Clonar para limpiar listeners
        if(exitBtn.parentNode) exitBtn.parentNode.replaceChild(newExitBtn, exitBtn);
        newExitBtn.addEventListener('click', handleExitToMenu);
        console.log("[Game] Listener añadido a #exit-to-menu-button."); // Log
    } else {
         console.error("[Game] #exit-to-menu-button no encontrado en startGame."); // Mantener error crítico
    }
    // --- Fin añadir listeners ---

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
        console.log(`[Game] Obteniendo pregunta para nivel: ${currentLevel}`); // Log
        // Esperar a que getNextQuestion (que puede ser async) resuelva
        const formattedQuestionData = await getNextQuestion(currentLevel);

        if (formattedQuestionData)
        {
            currentQuestionData = formattedQuestionData; // Guardar datos formateados
            // Guardar datos originales si existen
            if (currentQuestionData.rawData) {
                originalQuestionData = currentQuestionData.rawData;
                console.log("[Game] Datos originales guardados:", originalQuestionData); // Log
            } else {
                 originalQuestionData = null;
                 console.log("[Game] No se guardaron datos originales (No-Essential o faltantes)."); // Log
            }

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
            // Mostrar pregunta usando los datos formateados
            ui.displayQuestion(currentQuestionData, handleAnswerClick); // Pasar el handler correcto

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
        console.log("[Game] Tiempo agotado!"); // Log
        clearInterval(questionTimerInterval);
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

        roundResults.push(false);
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);

        isFeedbackActive = true;
        lastAnswerCorrect = false;
        lastMasteryMode = isMasteryStyle;
        lastSelectedOriginalValue = null; // No hubo selección

        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        if (!timeoutFeedbackData.correctAnswerDisplay && timeoutFeedbackData.correctAnswer) {
             const ca = timeoutFeedbackData.correctAnswer;
             const translated = getTranslation(ca);
             timeoutFeedbackData.correctAnswerDisplay = (translated && translated !== ca) ? translated : ca;
        }
        // Pasar null como último argumento (no hubo selección incorrecta) y isRefresh=false
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep, null, false);

        // Modificar texto para indicar Timeout
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            const correctAnswerText = timeoutFeedbackData.correctAnswerDisplay || 'N/A';
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
    console.log("[Game] Proceeding to next step..."); // Log
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
 * ESTA FUNCIÓN AHORA SE EXPORTA.
 * @param {Event} event - El evento de clic.
 */
 export function handleAnswerClick(event) {
    console.log("[Game] handleAnswerClick iniciado"); // Log
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
    console.log(`[Game] Respuesta: ${isCorrect ? 'Correcta' : 'Incorrecta'}. Seleccionado (value): ${selectedOriginalValue}, Correcto (value): ${currentQuestionData.correctAnswer}`); // Log

    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        // Pasar null como último argumento (no hubo selección incorrecta) y isRefresh=false
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep, null, false);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        setTimeout(proceedToNextStep, 1200);
    } else {
        // Pasar los datos formateados actuales a displayFeedback
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // Pasar el valor original incorrecto seleccionado y isRefresh=false
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep, lastSelectedOriginalValue, false);
        if (selectedButton) selectedButton.classList.add('incorrect');
    }
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}

/**
 * Finaliza la ronda, actualiza datos y muestra pantalla Game Over.
 */
 function endGame() {
    console.log(`[Game] Finalizando juego. Score: ${currentScore}`); // Log
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
                     console.log("[Game] Desbloqueando Associate!"); // Log
                     currentUserData.unlockedLevels.push('Associate');
                 }
             } else { currentUserData.entryPerfectStreak = 0; }
        } else if (currentLevel === 'Associate') {
              if (meetsAssociateThreshold) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     console.log("[Game] Desbloqueando Professional!"); // Log
                     currentUserData.unlockedLevels.push('Professional');
                 }
              } else { currentUserData.associatePerfectStreak = 0; }
        }
        // Añadir lógica para Professional -> Expert

        console.log(`[Game] Guardando datos post-juego. Nuevos niveles desbloqueados:`, JSON.stringify(currentUserData.unlockedLevels)); // Log
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
    console.log("[Game] Reiniciando ronda..."); // Log
    startGame();
}

/**
 * Sale al menú de selección de nivel.
 */
export function handleExitToMenu() {
     console.log("[Game] Saliendo al menú..."); // Log
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
    console.log("[Game] handlePlayAgain ejecutado."); // Log
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername); // Recargar datos
    } else {
         currentUserData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername."); // Mantener warning
         initializeGame(); // Volver al login si no hay usuario
         return;
    }
    // Pasar handler 'selectLevelAndMode' a la UI
    console.log(`[Game] Pasando a displayLevelSelection desde PlayAgain. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`); // Log
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
}

/**
 * Inicializa el juego al cargar la página.
 */
export function initializeGame() {
    console.log("[Game] Inicializando juego..."); // Log
    if (ui.highScoresSection) {
         const initialHighScores = storage.loadHighScores();
         ui.displayHighScores(initialHighScores);
    }
    ui.showSection(ui.userSetupSection); // Mostrar login
}

/**
 * Refresca la UI activa si el idioma cambia.
 * AHORA reformatea datos y llama a UI para redibujar pregunta/opciones/feedback.
 */
export function refreshActiveGameUI() {
    if (!currentUsername) { return; } // Salir si no hay usuario
    const newLang = getCurrentLanguage(); // Obtener el nuevo idioma
    console.log(`[Game] Refrescando UI activa para idioma: ${newLang}`); // Log

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
        console.log(`[Game] Reformateando datos Essential para refresco (Lang: ${newLang})`); // Log
        dataForUI = formatEssentialQuestionForUI(originalQuestionData, newLang);
        if(dataForUI) dataForUI.rawData = originalQuestionData; // Re-adjuntar datos crudos
    } else if (currentQuestionData) {
        // Para niveles no-Essential, reusamos datos actuales (limitación conocida)
        dataForUI = currentQuestionData;
        console.warn(`[Game] Refrescando UI no-Essential (${currentLevel}), el texto puede no actualizarse si no usa claves i18n.`); // Mantener warning
    }
    // --- Fin Obtener/Reformatear ---


    // --- Actualizar la UI correcta con los datos obtenidos/reformateados ---
    if (isFeedbackActive && lastAnswerCorrect !== null) {
        // Si estábamos en feedback y tenemos datos...
        if (dataForUI) {
             console.log("[Game] Llamando a ui.displayFeedback con isRefresh=true"); // Log
             dataForUI.questionsAnswered = questionsAnswered; // Añadir info necesaria
             dataForUI.totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
             // Llamar a ui.displayFeedback con isRefresh=true
             ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, dataForUI, proceedToNextStep, lastSelectedOriginalValue, true);
        } else { console.error("[Game] No se pudieron obtener/formatear datos para refrescar feedback."); } // Mantener error crítico

    } else if (currentQuestionData && dataForUI) { // Si se estaba mostrando una pregunta y tenemos datos...
        console.log("[Game] Llamando a ui.displayQuestion para refresco"); // Log
        // Llamar a ui.displayQuestion con los datos reformateados
        ui.displayQuestion(dataForUI, handleAnswerClick); // Pasar handler correcto
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    } else if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none') {
        // Refrescar selección de nivel (no necesita dataForUI)
        console.log("[Game] Refrescando Level Selection UI..."); // Log
        currentUserData = storage.getUserData(currentUsername);
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
    } else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none') {
        // Refrescar Game Over (no necesita dataForUI)
        console.log("[Game] Refrescando Game Over UI..."); // Log
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

