// js/game.js
// Contiene la lógica principal del juego, manejo de estado y flujo.

// Importar módulos necesarios
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js'; // Importar funciones y elementos de UI
import { getNextQuestion } from './questions.js'; // Importar generador de preguntas

// --- Variables de Estado del Juego ---
let currentUsername = '';
let currentUserData = {}; // Almacena { unlockedLevels: [], entryPerfectStreak: 0, ... }
let currentScore = 0;
let currentLevel = ''; // Nivel actual ('Entry', 'Associate', etc.)
let currentGameMode = 'standard'; // Modo actual ('standard' o 'mastery')
let currentQuestionData = null; // Guarda { question, options, correctAnswer, explanation }
let questionsAnswered = 0; // Contador para la ronda actual
let roundResults = []; // Guarda historial de aciertos (true/false) en la ronda actual
let questionTimerInterval = null; // Referencia al intervalo del timer
let timeLeft = 0; // Tiempo restante para la pregunta actual

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login inicial del usuario. Carga/crea datos y muestra selección de nivel.
 * @param {string} username - El nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username;
    try {
        currentUserData = storage.getUserData(username); // Carga o crea datos por defecto
        storage.saveUserData(username, currentUserData); // Guardar por si es un usuario nuevo
        ui.updatePlayerInfo(currentUsername, '', ''); // Actualizar display (aunque esté oculto)

        // Mostrar secciones relevantes post-login
        if(ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if(ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';

        // Llamar a la función de UI para mostrar los botones de nivel
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert("Hubo un problema al cargar los datos del usuario.");
        ui.showSection(ui.userSetupSection); // Volver a pantalla inicial si hay error grave
    }
}

/**
 * Establece el nivel y modo seleccionados por el usuario y comienza el juego.
 * Llamada desde la UI cuando se hace clic en un botón de nivel.
 * @param {string} level - Nivel seleccionado ('Entry', 'Associate', etc.)
 * @param {string} mode - Modo seleccionado ('standard', 'mastery')
 */
export function selectLevelAndMode(level, mode) {
    currentLevel = level;
    currentGameMode = mode; // Guardar el modo elegido
    startGame(); // Iniciar el juego con esta configuración
}

/**
 * Inicializa el estado para una nueva partida/ronda.
 */
export function startGame() {
    clearInterval(questionTimerInterval); // Limpiar cualquier timer anterior
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = []; // Resetear historial de la ronda
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Info inicial
    ui.showSection(ui.gameAreaSection); // Mostrar el área de juego
    // Mostrar estrellas de ronda (vacías), considerando el modo para coronas
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    loadNextQuestion(); // Cargar la primera pregunta
}

/**
 * Carga los datos de la siguiente pregunta, inicia el timer si aplica, y actualiza la UI.
 */
function loadNextQuestion() {
    // Limpiar estado de la pregunta anterior
    if(ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if(ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null; // Limpiar datos globales de la pregunta
    correctAnswer = null; // Limpiar respuesta global
    clearInterval(questionTimerInterval); // Detener timer si corría
    ui.showTimerDisplay(false); // Ocultar timer por defecto
    if(ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time'); // Quitar estilo low-time

    try {
        // Obtener datos de la siguiente pregunta desde el módulo questions
        const questionDataResult = getNextQuestion(currentLevel);

        // Validar los datos recibidos
        if (questionDataResult && questionDataResult.question && questionDataResult.options && Array.isArray(questionDataResult.options) && questionDataResult.correctAnswer !== undefined && questionDataResult.explanation !== undefined) {
            currentQuestionData = questionDataResult; // Guardar datos completos globalmente
            correctAnswer = currentQuestionData.correctAnswer; // Guardar respuesta para comparación rápida

            // INICIAR TIMER (solo si es Entry en modo mastery)
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery');
            ui.showTimerDisplay(timerCondition); // Mostrar u ocultar display
            if (timerCondition) {
                timeLeft = config.QUESTION_TIMER_DURATION;
                ui.updateTimerDisplay(timeLeft); // Mostrar tiempo inicial
                // Iniciar intervalo, guardar ID para poder limpiarlo
                questionTimerInterval = setInterval(updateTimer, 1000);
            }

            // Mostrar la pregunta y opciones en la UI (pasar el handler de respuesta)
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
        } else {
            // No se pudo generar pregunta (nivel no implementado o error en generador)
            throw new Error("Datos de pregunta inválidos o nulos recibidos del generador.");
        }
    } catch (error) {
        // Manejo de errores al cargar/generar pregunta
        console.error("Error fatal en loadNextQuestion:", error);
        if(ui.questionText) ui.questionText.innerHTML = "Error al cargar pregunta.";
        if(ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        // Terminar el juego si hay un error grave cargando la pregunta
        setTimeout(endGame, 1500);
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo y maneja el caso de tiempo agotado.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft); // Actualiza UI del timer

    if (timeLeft <= 0) {
        // --- TIEMPO AGOTADO ---
        clearInterval(questionTimerInterval); // Detener este timer
        if(ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar opciones

        roundResults.push(false); // Timeout cuenta como incorrecta
        const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMastery); // Actualizar estrellas (mostrar una roja/incorrecta)

        // Mostrar feedback de timeout (usa ui.displayFeedback pero adaptamos el texto)
        // Creamos un objeto similar a questionData para pasar a displayFeedback
        const timeoutFeedbackData = {
             ...currentQuestionData, // Usar datos de la pregunta actual
             questionsAnswered: questionsAnswered, // Pasar contadores
             totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
         };
        // Llamamos a la función de UI, indicando que fue incorrecto
        ui.displayFeedback(false, isMastery, timeoutFeedbackData, proceedToNextStep);

        // Añadir/Modificar texto específico de timeout en el feedback area
        if(ui.feedbackArea) {
           const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child'); // Buscar el span del mensaje
           if(feedbackContent) {
                feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong>`; // Cambiar texto
           } else { // Si displayFeedback no creó el span (porque falló?), añadirlo
                ui.feedbackArea.innerHTML = `<div id="feedback-text-content"><span>¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong></span><span class="explanation">${currentQuestionData.explanation || ''}</span></div>` + ui.feedbackArea.innerHTML;
           }
        }
    }
}

/**
 * Función intermedia llamada después de una respuesta (automática o manual)
 * para decidir si cargar la siguiente pregunta o terminar el juego.
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Detener timer si se llamó manualmente antes de tiempo
    questionsAnswered++; // Incrementar contador de preguntas de la ronda
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
         endGame(); // Terminar si se alcanzó el límite
    } else {
         loadNextQuestion(); // Cargar la siguiente si no
    }
}

/**
 * Maneja el clic del usuario en un botón de opción de respuesta.
 * Es exportada para que ui.js pueda asignarla como listener.
 * @param {Event} event - El objeto del evento click.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detener timer tan pronto se responde

    // Verificar que tenemos datos de la pregunta actual
    if (!currentQuestionData) { console.error("handleAnswerClick llamado sin currentQuestionData"); return; }

    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;

    // Deshabilitar opciones para evitar múltiples clics
    if(ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    // Determinar si la respuesta es correcta
    let isCorrect = (selectedAnswer === currentQuestionData.correctAnswer);
    roundResults.push(isCorrect); // Registrar resultado para estrellas de ronda

    // Determinar si estamos en modo Realeza/Mastery
    const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        // --- RESPUESTA CORRECTA ---
        currentScore += config.POINTS_PER_QUESTION; // Actualizar puntuación
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Reflejar en UI

        // Mostrar feedback simple de acierto (la función de UI se encarga del estilo mastery/correct)
        ui.displayFeedback(isCorrect, isMastery, currentQuestionData, proceedToNextStep);
        if(selectedButton) selectedButton.classList.add(isMastery ? 'mastery' : 'correct'); // Estilo al botón

        // Avance automático a la siguiente pregunta/fin de juego
        setTimeout(proceedToNextStep, 1200);

    } else {
        // --- RESPUESTA INCORRECTA ---
         // Pasar todos los datos necesarios a displayFeedback para que muestre
         // explicación, respuesta correcta y cree el botón "Siguiente >>"
         const feedbackData = {
             ...currentQuestionData,
             questionsAnswered: questionsAnswered,
             totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
         };
        ui.displayFeedback(isCorrect, isMastery, feedbackData, proceedToNextStep);
        if(selectedButton) selectedButton.classList.add('incorrect'); // Marcar botón incorrecto
        // El resaltado de la respuesta correcta se hace dentro de ui.displayFeedback
    }

    // Actualizar estrellas de progreso de la ronda (amarillas/verdes/púrpuras o rojas)
    ui.updateRoundProgressUI(roundResults, isMastery);
}


/**
 * Finaliza la partida actual, calcula rachas, desbloquea niveles,
 * guarda datos, y muestra la pantalla de Game Over.
 */
 function endGame() {
    clearInterval(questionTimerInterval); // Asegurar detener timer
    const isPerfect = (currentScore === config.PERFECT_SCORE);
    let message = "¡Partida completada!"; // Mensaje por defecto

    try {
        currentUserData = storage.getUserData(currentUsername); // Recargar datos frescos

        // --- Lógica de Racha/Desbloqueo ---
        if (currentLevel === 'Entry') {
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0; // Resetear racha al desbloquear
                    message = "¡3 Rondas Perfectas! ¡Nivel Associate Desbloqueado! 🎉";
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    message = `¡Ronda Perfecta! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`;
                } else { message = "¡Ronda Perfecta!"; } // Ya tenía Associate desbloqueado
            } else {
                if (currentUserData.entryPerfectStreak > 0) { /* Opcional: Log reseteo */ }
                currentUserData.entryPerfectStreak = 0; // Resetear racha Entry si no fue perfecta
                // message se queda como "Partida completada!" si no fue perfecta
            }
        } else if (currentLevel === 'Associate') {
            // Lógica para racha de Associate -> desbloqueo de Professional
             if (isPerfect) {
                 currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                 if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                     currentUserData.unlockedLevels.push('Professional');
                     currentUserData.associatePerfectStreak = 0; // Resetear racha Associate
                     message = "¡3 Rondas Perfectas! ¡Nivel Professional Desbloqueado! 🏆";
                 } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                     message = `¡Ronda Perfecta en Associate! Racha: ${currentUserData.associatePerfectStreak}/3.`;
                 } else { message = "¡Ronda Perfecta en Associate!"; } // Ya tenía Pro desbloqueado
             } else {
                  if (currentUserData.associatePerfectStreak > 0) { /* Opcional: Log reseteo */ }
                 currentUserData.associatePerfectStreak = 0; // Resetear racha Associate si no fue perfecta
                 // message se queda como "Partida completada!"
             }
             // TODO: Implementar preguntas de Associate en questions.js
        }
        // Añadir 'else if (currentLevel === 'Professional')' si hay más niveles/rachas
        // --- Fin Lógica Racha ---

        storage.saveUserData(currentUsername, currentUserData); // Guardar TODOS los datos actualizados
        storage.saveHighScore(currentUsername, currentScore); // Guardar puntuación alta
        const highScores = storage.loadHighScores(); // Cargar scores para mostrar
        ui.displayHighScores(highScores); // Mostrar scores actualizados

        // Mostrar pantalla Game Over con info correcta (pasa handler del botón)
        ui.displayGameOver(currentScore, message, currentUserData); // El listener del botón se añade en main.js
        currentQuestionData = null; // Limpiar datos de la última pregunta

    } catch (error) { console.error("Error en endGame:", error); }
}

/**
 * Maneja el botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over.
 * Exportada para que main.js la use como listener.
 */
export function handlePlayAgain() {
    // Recargar datos frescos por si acaso hubo un desbloqueo
    if(currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Esto no debería pasar si el juego terminó, pero por seguridad
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
    }
    // Llama a la función de UI para mostrar la selección de nivel actualizada
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/**
 * Inicializa el estado del juego al cargar la página.
 * Exportada para que main.js la llame.
 */
export function initializeGame() {
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    // Ocultar todas las secciones excepto el setup inicial
    ui.showSection(ui.userSetupSection);
}
