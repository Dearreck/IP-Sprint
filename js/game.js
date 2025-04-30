// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado del juego, el flujo entre pantallas,
// las interacciones del usuario, la puntuación,
// el desbloqueo de niveles y el temporizador.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';         // Constantes de configuración
import * as storage from './storage.js';       // Funciones para localStorage
import * as ui from './ui.js';             // Funciones y elementos de UI
import { getNextQuestion } from './questions.js'; // Función para obtener la siguiente pregunta
import { getTranslation } from './i18n.js';    // Función para obtener textos traducidos

// --- Variables de Estado del Juego ---
let currentUsername = '';          // Nombre del usuario actual
let currentUserData = {};          // Datos persistentes del usuario (niveles, rachas)
let currentScore = 0;              // Puntuación de la ronda actual
let currentLevel = '';             // Nivel actual ('Entry', 'Associate', etc.)
let currentGameMode = 'standard';  // Modo ('standard', 'mastery')
let currentQuestionData = null;    // Objeto con datos de la pregunta actual (claves i18n incluidas)
let questionsAnswered = 0;         // Contador de preguntas respondidas en la ronda
let roundResults = [];             // Array [true/false] de resultados de la ronda
let questionTimerInterval = null;  // ID del intervalo del temporizador
let timeLeft = 0;                  // Segundos restantes

// --- Funciones Auxiliares ---

/**
 * Obtiene la duración del temporizador para el nivel y modo actuales.
 * Consulta el objeto TIMER_DURATION_BY_LEVEL en config.js.
 * @returns {number|null} Duración en segundos o null si no aplica timer.
 */
function getTimerDurationForCurrentLevel() {
    try {
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            // Devuelve duración para modo actual o 'standard' como fallback, o null
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        // Usa default general si no hay config para el nivel
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error);
        // Fallback seguro
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
        ui.updatePlayerInfo(currentUsername, '', ''); // Nivel y score se actualizan al iniciar juego
        // Mostrar secciones relevantes en pantalla de selección de nivel
        if (ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if (ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';
        // Mostrar botones de nivel
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        // TODO: Añadir clave 'error_loading_user_data' a JSONs
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        ui.showSection(ui.userSetupSection); // Volver al inicio si hay error
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
    clearInterval(questionTimerInterval); // Limpiar timer anterior
    // Reiniciar estado de la ronda
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;
    // Actualizar UI e iniciar carga de pregunta
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection);
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    ui.showTimerDisplay(false); // Ocultar timer por defecto
    loadNextQuestion();
}

/**
 * Carga los datos de la siguiente pregunta y actualiza la UI.
 */
function loadNextQuestion() {
    // Limpiar UI previa
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null; // Limpiar datos pregunta anterior
    clearInterval(questionTimerInterval); // Limpiar timer
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Obtener datos de la nueva pregunta
        const questionDataResult = getNextQuestion(currentLevel);
        // Validar datos recibidos
        if (questionDataResult && questionDataResult.question && questionDataResult.options && Array.isArray(questionDataResult.options) && questionDataResult.correctAnswer !== undefined && questionDataResult.explanation !== undefined) {
            currentQuestionData = questionDataResult; // Guardar datos nuevos

            // Iniciar timer si aplica para este nivel/modo
            const duration = getTimerDurationForCurrentLevel();
            if (duration !== null && duration > 0) {
                ui.showTimerDisplay(true);
                timeLeft = duration;
                ui.updateTimerDisplay(timeLeft);
                questionTimerInterval = setInterval(updateTimer, 1000);
            } else {
                ui.showTimerDisplay(false);
            }

            // Mostrar pregunta y opciones (ui.js se encarga de traducir)
            ui.displayQuestion(currentQuestionData, handleAnswerClick);
        } else {
            // Manejar error si no hay preguntas o datos inválidos
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) {
                // TODO: Añadir clave 'error_no_questions_for_level' a JSONs
                 throw new Error(getTranslation('error_no_questions_for_level', { level: currentLevel }));
            } else {
                // TODO: Añadir clave 'error_invalid_question_data' a JSONs
                 throw new Error(getTranslation('error_invalid_question_data'));
            }
        }
    } catch (error) {
        // Manejo de errores al cargar pregunta
        console.error("Error en loadNextQuestion:", error);
        // TODO: Añadir clave 'error_loading_question_msg' a JSONs
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('error_loading_question_msg', { message: error.message });
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500); // Terminar juego tras mostrar error
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft);

    // Si se agota el tiempo
    if (timeLeft <= 0) {
        clearInterval(questionTimerInterval);
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar opciones

        roundResults.push(false); // Marcar como incorrecta
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle); // Actualizar estrellas

        // Mostrar feedback de tiempo agotado (ui.js traduce la respuesta correcta)
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        // Modificar texto específico para timeout
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            // Traducir respuesta correcta para el mensaje
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
            if (typeof ca === 'string') { translatedCorrectAnswer = getTranslation(ca) || ca; }
            else if (typeof ca === 'object') { /* ... lógica para traducir objetos ... */
                 if (ca.classKey && ca.typeKey) translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.typeKey)}`;
                 else if (ca.classKey && ca.maskValue) translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation('option_mask', { mask: ca.maskValue })}`;
                 else if (ca.classKey && ca.portionKey) translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.portionKey, { portion: ca.portionValue || getTranslation('option_none') })}`;
                 else translatedCorrectAnswer = JSON.stringify(ca);
            } else { translatedCorrectAnswer = 'N/A'; }
            // Usar clave traducida para mensaje de timeout
            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
            if (feedbackContent) { feedbackContent.innerHTML = timeoutMsg; }
            else { const timeoutSpan = document.createElement('span'); timeoutSpan.innerHTML = timeoutMsg; ui.feedbackArea.prepend(timeoutSpan); }
            ui.feedbackArea.className = 'incorrect'; // Asegurar estilo incorrecto
        }
    }
}

/**
 * Función intermedia para avanzar a la siguiente pregunta o terminar el juego.
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Detener timer
    questionsAnswered++; // Incrementar contador
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame(); // Terminar ronda
    } else {
        loadNextQuestion(); // Cargar siguiente
    }
}

/**
 * Maneja el evento de clic en un botón de opción de respuesta.
 * Compara usando el valor original del botón.
 * @param {Event} event - El objeto del evento click.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detener timer
    // Validar estado
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    // Obtener valor original del atributo data-*
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');

    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar botones

    // --- Comparación usando Valores Originales ---
    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer; // Respuesta correcta original (string u objeto)

    // Reconstruir el string del valor original esperado para comparar
    let correctOriginalValueStr = '';
    if (typeof correctAnswerOriginal === 'string') {
        correctOriginalValueStr = correctAnswerOriginal;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.typeKey) {
        correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.typeKey}`;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.maskValue) {
        correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.maskValue}`;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal.classKey && correctAnswerOriginal.portionKey) {
        correctOriginalValueStr = `${correctAnswerOriginal.classKey},${correctAnswerOriginal.portionKey},${correctAnswerOriginal.portionValue || 'None'}`;
    } else {
         correctOriginalValueStr = JSON.stringify(correctAnswerOriginal); // Fallback
    }

    // Comparar valor original del botón con el esperado
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    // --- Fin Comparación ---

    roundResults.push(isCorrect); // Registrar resultado
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        // --- Respuesta Correcta ---
        currentScore += config.POINTS_PER_QUESTION; // Sumar puntos (valor fijo)
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Actualizar UI
        // Mostrar feedback (ui.js traduce la respuesta correcta si es necesario)
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct'); // Resaltar botón
        setTimeout(proceedToNextStep, 1200); // Avance automático
    } else {
        // --- Respuesta Incorrecta ---
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // Mostrar feedback (ui.js traduce la respuesta correcta y añade botón "Siguiente")
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect'); // Marcar botón incorrecto
    }
    ui.updateRoundProgressUI(roundResults, isMasteryStyle); // Actualizar estrellas
}

/**
 * Finaliza la partida/ronda actual. Calcula resultados, actualiza rachas/desbloqueos,
 * guarda datos, y muestra la pantalla de Game Over con mensajes traducidos.
 */
 function endGame() {
    clearInterval(questionTimerInterval); // Asegura detener timer
    const maxScore = config.PERFECT_SCORE; // Usa puntuación perfecta fija
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = currentScore === maxScore; // Verifica si es 100%
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK; // Verifica si cumple 90%

    // --- Construcción del Mensaje Final con i18n ---
    let baseMessage = getTranslation('game_over_base_message', {
        score: currentScore,
        maxScore: maxScore,
        percentage: scorePercentage.toFixed(0)
    });
    let extraMessage = ''; // Mensaje adicional sobre racha o desbloqueo

    try {
        currentUserData = storage.getUserData(currentUsername); // Recarga datos frescos

        // --- Lógica de Racha y Desbloqueo de Niveles ---
        if (currentLevel === 'Entry') {
            // Desbloqueo de Associate requiere 100%
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0; // Resetea racha al desbloquear
                    extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') });
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak });
                } else {
                    extraMessage = getTranslation('game_over_good_round_entry');
                }
            } else {
                // Si no fue perfecta, resetea racha y añade mensaje traducido
                if (currentUserData.entryPerfectStreak > 0) {
                    extraMessage = getTranslation('game_over_streak_reset_100');
                }
                currentUserData.entryPerfectStreak = 0;
            }
        } else if (currentLevel === 'Associate') {
             // Desbloqueo de Professional requiere 90%
             if (meetsAssociateThreshold) {
                currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                    currentUserData.unlockedLevels.push('Professional');
                    currentUserData.associatePerfectStreak = 0; // Resetea racha Associate
                    extraMessage = getTranslation('game_over_level_unlocked_pro');
                } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                    extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak });
                } else {
                    extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK });
                }
             } else {
                  // Si no alcanzó 90%, resetea racha y añade mensaje traducido
                  if (currentUserData.associatePerfectStreak > 0) {
                      extraMessage = getTranslation('game_over_streak_reset_90');
                  }
                 currentUserData.associatePerfectStreak = 0;
             }
        }
        // --- Fin Lógica Racha ---

        // Combinar mensaje base con el extra (si existe)
        const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;

        // Guardar datos actualizados del usuario y la puntuación alta
        storage.saveUserData(currentUsername, currentUserData);
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode);
        // Cargar y mostrar puntuaciones actualizadas
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        // Mostrar pantalla Game Over con el mensaje final traducido
        ui.displayGameOver(currentScore, finalMessage, currentUserData);
        currentQuestionData = null; // Limpiar datos de la última pregunta

    } catch (error) {
        console.error("Error en endGame:", error);
        // TODO: Añadir clave 'error_end_game' a JSONs
        ui.displayGameOver(currentScore, getTranslation('error_end_game', { message: error.message }), currentUserData);
    }
}

/**
 * Maneja el evento del botón 'Reiniciar Ronda Actual'.
 * Exportada para main.js.
 */
export function handleRestartRound() {
    // Simplemente reinicia la ronda con la configuración actual.
    startGame();
}

/**
 * Maneja el evento del botón 'Salir al Menú de Niveles'.
 * Exportada para main.js.
 */
export function handleExitToMenu() {
     clearInterval(questionTimerInterval); // Detiene el timer si está activo.
     handlePlayAgain(); // Muestra el menú de niveles.
}

/**
 * Maneja el evento del botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over.
 * Exportada para main.js.
 */
export function handlePlayAgain() {
    // Recarga los datos del usuario para reflejar posibles desbloqueos.
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Fallback si no hay usuario (poco probable).
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername establecido.");
    }
    // Muestra la pantalla de selección de nivel.
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/**
 * Función de inicialización general del juego.
 * Llamada una vez desde main.js cuando el DOM está listo.
 * Exportada para main.js.
 */
export function initializeGame() {
    // Carga y muestra las puntuaciones altas iniciales.
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    // Muestra la primera pantalla que ve el usuario: el formulario para ingresar nombre.
    ui.showSection(ui.userSetupSection);
}
