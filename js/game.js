// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado del juego, el flujo entre pantallas,
// las interacciones del usuario, la puntuación,
// el desbloqueo de niveles y el temporizador.
// ==================================================

// --- Importaciones de Módulos ---
// Importar constantes y configuraciones definidas en otros archivos.
import * as config from './config.js';         // Constantes (ej. preguntas por ronda, puntos, claves localStorage, duración timer)
import * as storage from './storage.js';       // Funciones para interactuar con localStorage (guardar/cargar datos)
import * as ui from './ui.js';             // Funciones y selectores de elementos para manipular la interfaz de usuario (DOM)
import { getNextQuestion } from './questions.js'; // Función que genera los datos de la siguiente pregunta según el nivel
import { getTranslation } from './i18n.js';    // Función para obtener textos traducidos

// --- Variables de Estado del Juego ---
// Estas variables guardan la información sobre el estado actual del juego
// mientras el usuario está jugando una sesión. Se reinician o actualizan
// según sea necesario.

let currentUsername = '';          // Nombre del usuario que está jugando actualmente.
let currentUserData = {};          // Objeto que contiene los datos persistentes del usuario cargados de localStorage
                                   // (ej. { unlockedLevels: [...], entryPerfectStreak: #, associatePerfectStreak: # }).
let currentScore = 0;              // Puntuación acumulada durante la ronda/partida actual.
let currentLevel = '';             // Nivel que se está jugando en la ronda actual (ej. 'Entry', 'Associate').
let currentGameMode = 'standard';  // Modo de juego ('standard' o 'mastery'). Determina reglas como el timer.
let currentQuestionData = null;    // Objeto que contiene toda la información de la pregunta actual
                                   // (devuelto por questions.js, incluye claves i18n y datos).
// let correctAnswer = null;       // Ya no se usa, la respuesta correcta está en currentQuestionData.correctAnswer
let questionsAnswered = 0;         // Contador de cuántas preguntas se han respondido en la ronda actual.
let roundResults = [];             // Array de booleanos (true/false) que registra si cada respuesta de la ronda fue correcta o no.
let questionTimerInterval = null;  // Guarda el ID devuelto por setInterval para el temporizador.
let timeLeft = 0;                  // Segundos restantes para responder la pregunta actual.

// --- Funciones Auxiliares ---

/**
 * Obtiene la duración del temporizador para el nivel y modo actuales.
 * Consulta el objeto TIMER_DURATION_BY_LEVEL en config.js.
 * @returns {number|null} Duración en segundos o null si no aplica timer.
 */
function getTimerDurationForCurrentLevel() {
    try {
        // Busca la configuración de tiempo para el nivel actual
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            // Devuelve la duración para el modo específico ('mastery')
            // o para 'standard' si no hay modo específico,
            // o null si no hay configuración para 'standard'.
            // El operador '??' (Nullish Coalescing) devuelve el operando derecho
            // si el izquierdo es null o undefined.
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        // Si no hay configuración para el nivel, usa el valor 'default' de la config.
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error);
        // Fallback seguro en caso de error.
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 15;
    }
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el inicio de sesión inicial del usuario.
 * Guarda el nombre, carga/crea los datos del usuario desde localStorage,
 * y muestra la pantalla de selección de nivel.
 * Exportada para ser llamada desde main.js.
 * @param {string} username - El nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username; // Guarda el nombre de usuario en el estado.
    try {
        // Carga los datos del usuario (o crea datos por defecto si es nuevo).
        currentUserData = storage.getUserData(username);
        // Guarda los datos (asegura consistencia).
        storage.saveUserData(username, currentUserData);
        // Actualiza la UI con el nombre (nivel y score se ponen al iniciar juego).
        ui.updatePlayerInfo(currentUsername, '', '');

        // Mostrar secciones de progreso y scores en la pantalla de selección de nivel.
        if (ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if (ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';

        // Genera y muestra los botones de nivel disponibles para el usuario.
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);

    } catch (error) {
        // Manejo de errores.
        console.error("Error durante handleUserLogin:", error);
        // TODO: Añadir clave 'error_loading_user_data' a JSONs
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        // Devuelve a la pantalla inicial.
        ui.showSection(ui.userSetupSection);
    }
}

/**
 * Establece el nivel y modo seleccionados por el usuario y comienza la ronda.
 * Llamada como callback desde los botones de nivel en ui.js.
 * @param {string} level - Nivel seleccionado ('Entry', 'Associate').
 * @param {string} mode - Modo seleccionado ('standard', 'mastery').
 */
export function selectLevelAndMode(level, mode) {
    currentLevel = level;     // Guarda el nivel seleccionado.
    currentGameMode = mode; // Guarda el modo seleccionado.
    startGame();            // Inicia la ronda.
}

/**
 * Inicializa el estado para una nueva partida/ronda.
 * Limpia variables de estado, muestra el área de juego y carga la primera pregunta.
 */
export function startGame() {
    clearInterval(questionTimerInterval); // Detiene cualquier timer anterior.
    // Reinicia las variables de estado de la ronda.
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;

    // Actualiza la UI.
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection); // Muestra el área de juego.
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery'); // Muestra estrellas vacías.
    ui.showTimerDisplay(false); // Oculta el timer inicialmente.

    // Carga la primera pregunta.
    loadNextQuestion();
}

/**
 * Carga los datos de la siguiente pregunta del nivel actual.
 * Llama a la UI para mostrarla e inicia el temporizador si aplica.
 */
function loadNextQuestion() {
    // Limpieza de UI de la pregunta anterior.
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null; // Borra datos de pregunta anterior.
    // correctAnswer se establece al recibir nuevos datos.
    clearInterval(questionTimerInterval); // Limpia timer.
    ui.showTimerDisplay(false); // Oculta timer.
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time'); // Quita estilo de poco tiempo.

    try {
        // Obtiene los datos de la siguiente pregunta desde questions.js.
        const questionDataResult = getNextQuestion(currentLevel);

        // Valida los datos recibidos.
        if (questionDataResult && questionDataResult.question && questionDataResult.options && Array.isArray(questionDataResult.options) && questionDataResult.correctAnswer !== undefined && questionDataResult.explanation !== undefined) {
            // Guarda los datos completos de la pregunta actual.
            currentQuestionData = questionDataResult;

            // --- Lógica del Temporizador ---
            const duration = getTimerDurationForCurrentLevel(); // Obtiene duración para este nivel/modo.

            if (duration !== null && duration > 0) { // Si aplica timer...
                ui.showTimerDisplay(true); // Muestra el display.
                timeLeft = duration;       // Establece la duración.
                ui.updateTimerDisplay(timeLeft); // Muestra el tiempo inicial.
                // Inicia el intervalo que llamará a updateTimer cada 1000ms (1 segundo).
                questionTimerInterval = setInterval(updateTimer, 1000);
            } else {
                ui.showTimerDisplay(false); // Oculta si no aplica.
            }
            // --- Fin Lógica Timer ---

            // Muestra la pregunta y opciones en la UI, pasando los datos completos.
            // ui.js se encargará de traducir.
            ui.displayQuestion(currentQuestionData, handleAnswerClick);

        } else {
            // Manejo de Error: Datos de Pregunta Inválidos.
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) {
                // TODO: Añadir clave 'error_no_questions_for_level' a JSONs
                 throw new Error(getTranslation('error_no_questions_for_level', { level: currentLevel }));
            } else {
                // TODO: Añadir clave 'error_invalid_question_data' a JSONs
                 throw new Error(getTranslation('error_invalid_question_data'));
            }
        }
    } catch (error) {
        // Manejo de Errores General.
        console.error("Error en loadNextQuestion:", error);
        // TODO: Añadir clave 'error_loading_question_msg' a JSONs
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('error_loading_question_msg', { message: error.message });
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500); // Termina el juego si hay error.
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo.
 * Se llama repetidamente a través de setInterval.
 * Si el tiempo llega a 0, considera la respuesta como incorrecta.
 */
 function updateTimer() {
    timeLeft--; // Decrementa el tiempo.
    ui.updateTimerDisplay(timeLeft); // Actualiza UI.

    // Si se acabó el tiempo.
    if (timeLeft <= 0) {
        clearInterval(questionTimerInterval); // Detiene el timer actual.
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilita opciones.

        roundResults.push(false); // Marca como incorrecta.
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle); // Actualiza estrellas.

        // Muestra feedback de tiempo agotado.
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // ui.js se encarga de traducir la respuesta correcta dentro de displayFeedback
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        // Modifica el texto del feedback para indicar timeout (usa traducción).
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            // Traduce la respuesta correcta para el mensaje de timeout
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
            if (typeof ca === 'string') { translatedCorrectAnswer = getTranslation(ca) || ca; }
            else if (typeof ca === 'object') { /* ... lógica para traducir objetos de respuesta ... */
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
 * Función intermedia llamada después de procesar una respuesta.
 * Incrementa contador y decide si seguir o terminar.
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Asegura detener timer.
    questionsAnswered++; // Incrementa contador.
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame(); // Termina la ronda.
    } else {
        loadNextQuestion(); // Carga siguiente pregunta.
    }
}

/**
 * Maneja el evento de clic del usuario en un botón de opción de respuesta.
 * Compara la respuesta usando el valor original guardado en el botón.
 * Actualiza puntuación, muestra feedback y avanza.
 * @param {Event} event - El objeto del evento click.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detiene timer.
    // Verifica que haya datos de pregunta cargados.
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    // Obtiene el valor original (sin traducir) guardado en el atributo data.
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');

    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilita opciones.

    // --- Comparación usando Valores Originales ---
    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer; // Respuesta correcta (puede ser string u objeto)

    // Reconstruye el valor original esperado de la respuesta correcta para comparar.
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

    // Compara el valor original del botón con el valor original reconstruido de la respuesta correcta.
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    // --- Fin Comparación ---

    roundResults.push(isCorrect); // Registra resultado.
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        // --- Respuesta Correcta ---
        currentScore += config.POINTS_PER_QUESTION; // Suma puntos (valor fijo).
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Actualiza UI.
        // Muestra feedback (pasando datos completos para que ui.js traduzca la correcta si es necesario).
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct'); // Resalta botón.
        setTimeout(proceedToNextStep, 1200); // Avance automático.
    } else {
        // --- Respuesta Incorrecta ---
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        // Muestra feedback (pasando datos completos).
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect'); // Marca botón incorrecto.
    }
    ui.updateRoundProgressUI(roundResults, isMasteryStyle); // Actualiza estrellas.
}

/**
 * Finaliza la partida/ronda actual. Calcula resultados, actualiza rachas/desbloqueos,
 * guarda datos, y muestra la pantalla de Game Over con mensajes traducidos.
 */
 function endGame() {
    clearInterval(questionTimerInterval); // Asegura detener timer.
    const maxScore = config.PERFECT_SCORE; // Usa puntuación perfecta fija.
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = currentScore === maxScore; // Verifica si es 100%.
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK; // Verifica si cumple 90%.

    // --- Construcción del Mensaje Final con i18n ---
    let baseMessage = getTranslation('game_over_base_message', {
        score: currentScore,
        maxScore: maxScore,
        percentage: scorePercentage.toFixed(0)
    });
    let extraMessage = ''; // Mensaje adicional sobre racha o desbloqueo.

    try {
        currentUserData = storage.getUserData(currentUsername); // Recarga datos frescos.

        // --- Lógica de Racha y Desbloqueo de Niveles ---
        if (currentLevel === 'Entry') {
            // Desbloqueo de Associate requiere 100%
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0; // Resetea racha al desbloquear.
                    // Mensaje traducido de nivel desbloqueado.
                    extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') });
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    // Mensaje traducido de progreso de racha.
                    extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak });
                } else {
                    // Mensaje traducido de ronda perfecta simple.
                    extraMessage = getTranslation('game_over_good_round_entry');
                }
            } else {
                // Si no fue perfecta, resetea racha y añade mensaje traducido.
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
                    currentUserData.associatePerfectStreak = 0; // Resetea racha Associate.
                    // Mensaje traducido específico para desbloquear Pro.
                    extraMessage = getTranslation('game_over_level_unlocked_pro');
                } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                    // Mensaje traducido de progreso de racha.
                    extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak });
                } else {
                    // Mensaje traducido de buena ronda en Associate.
                    extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK });
                }
             } else {
                  // Si no alcanzó 90%, resetea racha y añade mensaje traducido.
                  if (currentUserData.associatePerfectStreak > 0) {
                      extraMessage = getTranslation('game_over_streak_reset_90');
                  }
                 currentUserData.associatePerfectStreak = 0;
             }
        }
        // TODO: Añadir lógica para Nivel Professional si hay más niveles después.
        // --- Fin Lógica Racha ---

        // Combinar mensaje base con el extra (si existe).
        const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;

        // Guardar datos actualizados del usuario y la puntuación alta.
        storage.saveUserData(currentUsername, currentUserData);
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode);
        // Cargar y mostrar puntuaciones actualizadas.
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        // Mostrar pantalla Game Over con el mensaje final traducido.
        ui.displayGameOver(currentScore, finalMessage, currentUserData);
        currentQuestionData = null; // Limpiar datos de la última pregunta.

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
