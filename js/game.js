// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// ==================================================

// --- Importaciones de Módulos ---
import *:// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';        // Constantes de configuración
import * as storage from './storage.js';       // Funciones de LocalStorage
import * as ui from './ui.js';             // Funciones y selectores de UI
import { getNextQuestion } from './questions.js'; // Función para obtener preguntas
import { getTranslation } from './i18n.js';    // Función de traducción

// --- Variables de Estado del Juego ---
let currentUsername = '';           // Nombre del usuario actual
let currentUserData = {};           // Datos del usuario (niveles desbloq., rachas)
let currentScore = 0;               // Puntuación de la ronda actual
let currentLevel = '';              // Nivel seleccionado para jugar ('Essential', 'Entry', etc.)
let currentGameMode = 'standard';   // Modo de juego (por defecto 'standard')
let currentQuestionData = null;     // Datos de la pregunta actual
let questionsAnswered = 0;          // Contador de preguntas respondidas en la ronda
let roundResults = [];              // Array para guardar resultados (true/false) de la ronda
let questionTimerInterval = null;   // Intervalo del temporizador
let timeLeft = 0;                   // Tiempo restante para la pregunta
// Variables para refrescar UI en cambio de idioma durante feedback
let isFeedbackActive = false;
let lastAnswerCorrect = null;
let lastMasteryMode = false; // Mantenido por si se reintroduce Mastery
let lastSelectedOriginalValue = null;

// --- Funciones Auxiliares ---

/**
 * Obtiene la duración del temporizador para el nivel y modo actual.
 * @returns {number|null} Duración en segundos o null si no hay timer.
 */
function getTimerDurationForCurrentLevel() {
    try {
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            // Devuelve la duración para el modo actual o 'standard' como fallback, o null
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        // Si no hay config para el nivel, usa el default
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error);
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 20; // Fallback general
    }
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login del usuario. Carga sus datos y muestra la pantalla de selección de nivel.
 * @param {string} username - Nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username;
    try {
        // Obtiene datos o crea default con 'Essential' como base desbloqueada
        const allUserData = storage.getAllUserData();
        // --- MODIFICADO: Nivel base es 'Essential' ---
        const defaultData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };

        if (allUserData[username]) {
            currentUserData = { ...defaultData, ...allUserData[username] };
            // Asegurarse de que Essential siempre esté, por si datos antiguos no lo tenían
            if (!currentUserData.unlockedLevels.includes('Essential')) {
                currentUserData.unlockedLevels.unshift('Essential'); // Añadir al inicio
            }
        } else {
            currentUserData = defaultData;
        }

        storage.saveUserData(username, currentUserData); // Guardar datos actualizados/nuevos
        ui.updatePlayerInfo(currentUsername, '', ''); // Limpiar info de nivel/puntos inicial

        // --- MODIFICADO: Llamar a la nueva función de UI ---
        // Pasar la función selectLevelAndMode como handler para los clics en el stepper
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);

        // Mostrar High Scores (si aún se desea en esta pantalla)
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        ui.showSection(ui.userSetupSection); // Volver al login en caso de error
    }
}

/**
 * Se llama cuando se selecciona un nivel desde la UI (Stepper).
 * Establece el nivel y modo, y comienza el juego.
 * @param {string} level - Nivel seleccionado ('Essential', 'Entry', etc.).
 * @param {string} mode - Modo seleccionado (actualmente siempre 'standard').
 */
export function selectLevelAndMode(level, mode = 'standard') {
    currentLevel = level;
    currentGameMode = mode; // Guardar el modo aunque ahora sea fijo
    startGame();
}

/**
 * Inicia una nueva ronda del juego para el nivel y modo seleccionados.
 */
export function startGame() {
    // Reiniciar estado de la ronda
    clearInterval(questionTimerInterval); // Limpiar cualquier timer anterior
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false; // Resetear estado de refresco
    lastSelectedOriginalValue = null;

    // Actualizar UI inicial del juego
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Mostrar nivel y score 0
    ui.showSection(ui.gameAreaSection); // Mostrar el área de juego
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery'); // Mostrar estrellas vacías
    ui.showTimerDisplay(false); // Ocultar timer inicialmente
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time'); // Resetear estilo timer

    // Cargar la primera pregunta
    loadNextQuestion();
}

/**
 * Carga y muestra la siguiente pregunta o finaliza el juego si se completó la ronda.
 */
function loadNextQuestion() {
    isFeedbackActive = false; // Ya no estamos en feedback
    lastAnswerCorrect = null; // Resetear estado de refresco
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;

    // Limpiar UI de la pregunta anterior
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null; // Limpiar datos pregunta anterior
    clearInterval(questionTimerInterval); // Limpiar timer anterior
    ui.showTimerDisplay(false); // Ocultar timer por defecto
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Obtener la siguiente pregunta para el nivel actual
        const questionDataResult = getNextQuestion(currentLevel);

        // Validar datos de la pregunta recibida
        if (questionDataResult &&
            questionDataResult.question && questionDataResult.question.key &&
            Array.isArray(questionDataResult.options) && questionDataResult.options.length > 0 &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            currentQuestionData = questionDataResult; // Guardar datos de la pregunta actual

            // Configurar y mostrar el temporizador si aplica
            const duration = getTimerDurationForCurrentLevel();
            if (duration !== null && duration > 0) {
                ui.showTimerDisplay(true);
                timeLeft = duration;
                ui.updateTimerDisplay(timeLeft);
                questionTimerInterval = setInterval(updateTimer, 1000); // Iniciar cuenta atrás
            } else {
                ui.showTimerDisplay(false); // No mostrar timer si duration es null o 0
            }

            // Mostrar la pregunta y opciones en la UI
            // Pasamos handleAnswerClick como la función a ejecutar cuando se pulse una opción
            ui.displayQuestion(currentQuestionData, handleAnswerClick);

        } else {
            // Error si no se obtienen datos válidos (ej. no hay preguntas para el nivel)
            throw new Error(getTranslation('error_invalid_question_data'));
        }
    } catch (error) {
        console.error("Error en loadNextQuestion:", error);
        // Mostrar mensaje de error en la UI y terminar la partida tras un breve delay
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('error_loading_question_msg', { message: error.message });
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500); // Terminar juego si no se puede cargar pregunta
    }
 }

/**
 * Actualiza el temporizador cada segundo y maneja el caso de tiempo agotado.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft); // Actualizar UI del timer

    if (timeLeft <= 0) { // Si se acaba el tiempo
        clearInterval(questionTimerInterval); // Detener el timer
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar opciones

        roundResults.push(false); // Marcar como incorrecta
        // Determinar si se usa estilo Mastery (solo para Entry por ahora)
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle); // Actualizar estrellas

        // Mostrar feedback de tiempo agotado
        isFeedbackActive = true; // Marcar que estamos en feedback
        lastAnswerCorrect = false;
        lastMasteryMode = isMasteryStyle;
        lastSelectedOriginalValue = null; // No hubo selección
        // Añadir datos necesarios para que displayFeedback funcione
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        // Modificar el texto del feedback para indicar Timeout
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
            // Lógica para traducir la respuesta correcta (igual que en displayFeedback)
             if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
             else if (typeof ca === 'object' && ca !== null) { let textParts = []; if (ca.classKey) textParts.push(getTranslation(ca.classKey)); if (ca.typeKey) textParts.push(getTranslation(ca.typeKey)); if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue })); if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); } if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); } else { translatedCorrectAnswer = JSON.stringify(ca); } }
             else { translatedCorrectAnswer = ca?.toString() ?? 'N/A'; }

            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
            if (feedbackContent) { feedbackContent.innerHTML = timeoutMsg; }
            else { const timeoutSpan = document.createElement('span'); timeoutSpan.innerHTML = timeoutMsg; ui.feedbackArea.prepend(timeoutSpan); }
            ui.feedbackArea.className = 'incorrect'; // Estilo de incorrecto para timeout
        }
    }
}

/**
 * Procede al siguiente paso después de mostrar el feedback (siguiente pregunta o fin de juego).
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Asegurarse de limpiar el timer
    questionsAnswered++; // Incrementar contador de preguntas
    // Comprobar si se alcanzó el total de preguntas
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame(); // Finalizar la partida
    } else {
        loadNextQuestion(); // Cargar la siguiente pregunta
    }
}

/**
 * Maneja el evento de clic en un botón de opción de respuesta.
 * @param {Event} event - El evento de clic.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detener timer al responder
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar opciones

    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer;

    // --- Lógica para comparar respuesta seleccionada con la correcta ---
    // (Maneja strings y objetos de respuesta)
    let correctOriginalValueStr = '';
    if (typeof correctAnswerOriginal === 'string') {
        correctOriginalValueStr = correctAnswerOriginal;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal !== null) {
        let originalValueParts = [];
        if (correctAnswerOriginal.classKey) originalValueParts.push(correctAnswerOriginal.classKey);
        if (correctAnswerOriginal.typeKey) originalValueParts.push(correctAnswerOriginal.typeKey);
        if (correctAnswerOriginal.maskValue) originalValueParts.push(correctAnswerOriginal.maskValue);
        if (correctAnswerOriginal.portionKey) {
             originalValueParts.push(correctAnswerOriginal.portionKey);
             originalValueParts.push(correctAnswerOriginal.portionValue || 'None');
        }
        correctOriginalValueStr = originalValueParts.join(','); // Coma como separador estándar
    } else {
         correctOriginalValueStr = correctAnswerOriginal?.toString() ?? 'N/A'; // Fallback
    }

    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    // --- Fin Lógica Comparación ---

    roundResults.push(isCorrect); // Guardar resultado de la pregunta
    // Determinar si se usa estilo Mastery (solo Entry por ahora)
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    // Guardar estado para posible refresco de UI
    isFeedbackActive = true;
    lastAnswerCorrect = isCorrect;
    lastMasteryMode = isMasteryStyle;
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue; // Solo guardar selección si fue incorrecta

    // Actualizar puntuación si es correcta
    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Actualizar UI de puntos
        // Mostrar feedback positivo y pasar a la siguiente pregunta tras un delay
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct'); // Marcar botón como correcto
        setTimeout(proceedToNextStep, 1200); // Delay antes de pasar a la siguiente
    } else {
        // Mostrar feedback negativo (con explicación) y esperar clic en "Siguiente"
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect'); // Marcar botón como incorrecto
        // No se llama a proceedToNextStep automáticamente, espera al botón
    }

    // Actualizar estrellas de progreso de la ronda
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}

/**
 * Finaliza la ronda actual, calcula rachas, desbloqueos, guarda datos y muestra Game Over.
 */
 function endGame() {
    clearInterval(questionTimerInterval); // Detener timer si aún corre
    // Resetear estado de refresco
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;

    // Calcular resultados finales
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
    const isPerfect = currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK; // >= 90%

    try {
        // Cargar los datos más recientes del usuario
        currentUserData = storage.getUserData(currentUsername);

        // --- Lógica de Rachas y Desbloqueo ---
        // (Asumiendo que Essential es base y no desbloquea nada)
        if (currentLevel === 'Entry') {
             // Racha para desbloquear Associate (requiere 100%)
             if (isPerfect) {
                 currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                 // Desbloquear Associate si se alcanzan 3 rachas perfectas y aún no está desbloqueado
                 if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                     currentUserData.unlockedLevels.push('Associate');
                     // Opcional: Resetear racha al desbloquear
                     // currentUserData.entryPerfectStreak = 0;
                 }
             } else {
                 // Si no es perfecta, resetear racha de Entry
                 currentUserData.entryPerfectStreak = 0;
             }
        } else if (currentLevel === 'Associate') {
             // Racha para desbloquear Professional (requiere >= 90%)
              if (meetsAssociateThreshold) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 // Desbloquear Professional si se alcanzan 3 rachas >= 90% y aún no está desbloqueado
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     currentUserData.unlockedLevels.push('Professional');
                     // Opcional: Resetear racha al desbloquear
                     // currentUserData.associatePerfectStreak = 0;
                 }
              } else {
                  // Si no cumple el umbral, resetear racha de Associate
                  currentUserData.associatePerfectStreak = 0;
              }
        }
        // Añadir lógica similar si Professional desbloquea Expert

        // Guardar datos actualizados del usuario (niveles, rachas)
        storage.saveUserData(currentUsername, currentUserData);

        // Guardar la puntuación alta para este nivel/modo
        // Asumimos 'standard' ya que no hay selección de modo en la UI principal
        storage.saveHighScore(currentUsername, currentScore, currentLevel, 'standard');

        // Recargar y mostrar High Scores globales actualizados
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        // Mostrar pantalla de Game Over con datos actualizados
        ui.displayGameOver(currentScore, currentUserData, currentLevel);

        currentQuestionData = null; // Limpiar datos de la pregunta finalizada

    } catch (error) {
        console.error("Error en endGame:", error);
        // Intentar mostrar Game Over incluso si hubo error guardando
        // Pasar currentUserData si existe, o un objeto indicando error
        ui.displayGameOver(currentScore, currentUserData || { error: true, unlockedLevels: ['Essential'] }, currentLevel);
    }
}

/**
 * Reinicia la ronda actual con el mismo nivel y modo.
 */
export function handleRestartRound() {
    // Simplemente llama a startGame, que ya usa currentLevel y currentGameMode
    startGame();
}

/**
 * Sale de la ronda actual y vuelve al menú de selección de nivel.
 */
export function handleExitToMenu() {
     clearInterval(questionTimerInterval); // Detener timer
     // Resetear estados de refresco
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null;
     // Llama a la función que muestra la pantalla de selección de nivel
     handlePlayAgain(); // Reutiliza la lógica de volver al menú
}

/**
 * Se llama desde el botón "Elegir Nivel" en Game Over o al salir del juego.
 * Muestra la pantalla de selección de nivel actualizada.
 */
export function handlePlayAgain() {
    if (currentUsername) {
         // Recargar datos frescos del usuario por si hubo desbloqueos
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Esto no debería pasar si el flujo es correcto, pero como fallback:
         currentUserData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername establecido.");
    }
    // Mostrar la pantalla de selección de nivel con los datos actuales
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/**
 * Inicializa el juego al cargar la página (llamado desde main.js).
 */
export function initializeGame() {
    // Carga y muestra high scores iniciales
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    // Muestra la pantalla de login
    ui.showSection(ui.userSetupSection);
}

/**
 * Refresca la UI del área de juego si el idioma cambia mientras se está jugando.
 * Reconstruye la pregunta o el feedback con las nuevas traducciones.
 */
export function refreshActiveGameUI() {
    if (!currentUsername) { console.warn("Intentando refrescar UI sin usuario activo."); return; }

    // Refrescar información del jugador (nivel, puntos)
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    // Refrescar estrellas de progreso
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    // Refrescar estado del timer
    if (questionTimerInterval) {
        ui.showTimerDisplay(true);
        ui.updateTimerDisplay(timeLeft);
        if (timeLeft <= 5) ui.timerDisplayDiv.classList.add('low-time');
        else ui.timerDisplayDiv.classList.remove('low-time');
    } else {
        ui.showTimerDisplay(false);
    }

    // Si estábamos mostrando feedback, volver a mostrarlo traducido
    if (isFeedbackActive && lastAnswerCorrect !== null && currentQuestionData) {
        // Volver a llamar a displayFeedback con los datos guardados
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, feedbackData, proceedToNextStep);

        // Reaplicar resaltado de botones (correcto/incorrecto)
         try {
            const ca = currentQuestionData.correctAnswer;
            let correctOriginalValueStr = '';
            // ... (lógica para obtener correctOriginalValueStr igual que en handleAnswerClick)
             if (typeof ca === 'string') { correctOriginalValueStr = ca; }
             else if (typeof ca === 'object' && ca !== null) { let parts = []; if (ca.classKey) parts.push(ca.classKey); if (ca.typeKey) parts.push(ca.typeKey); if (ca.maskValue) parts.push(ca.maskValue); if (ca.portionKey) { parts.push(ca.portionKey); parts.push(ca.portionValue || 'None'); } correctOriginalValueStr = parts.join(','); }
             else { correctOriginalValueStr = ca?.toString() ?? 'N/A'; }

            if (ui.optionsContainer) {
                 Array.from(ui.optionsContainer.children).forEach(button => {
                     const btnValue = button.getAttribute('data-original-value');
                     button.classList.remove('correct', 'incorrect', 'mastery'); // Limpiar clases previas
                     // Resaltar correcto
                     if (btnValue === correctOriginalValueStr) {
                         button.classList.add(lastMasteryMode ? 'mastery' : 'correct');
                     }
                     // Resaltar incorrecto (si aplica)
                     if (!lastAnswerCorrect && btnValue === lastSelectedOriginalValue) {
                         button.classList.add('incorrect');
                     }
                 });
             }
             // Re-deshabilitar opciones
             ui.optionsContainer.classList.add('options-disabled');
         } catch(e){ console.error("Error resaltando botones al refrescar feedback", e); }

    }
    // Si estábamos mostrando una pregunta, volver a mostrarla traducida
    else if (currentQuestionData) {
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        // Asegurarse que las opciones no estén deshabilitadas si no hay feedback activo
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    }
    // Si no hay ni pregunta ni feedback activo (estado raro), limpiar
    else {
        if (ui.questionText) ui.questionText.innerHTML = '';
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        if (ui.feedbackArea) ui.feedbackArea.innerHTML = '';
        console.warn("Refrescando UI en estado inesperado (sin pregunta ni feedback activo).");
    }
}

// --- Funciones para obtener estado actual (usadas por main.js para refrescar) ---
export function getCurrentUsername() { return currentUsername; }
export function getCurrentLevel() { return currentLevel; }
// Nota: getCurrentQuestionData, getCurrentScore no parecen ser usadas externamente ahora.
