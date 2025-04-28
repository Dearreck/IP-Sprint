// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado, flujo, interacciones y temporizador.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';         // Constantes de configuración
import * as storage from './storage.js';       // Funciones para localStorage
import * as ui from './ui.js';             // Funciones y elementos de UI
import { getNextQuestion } from './questions.js'; // Función para obtener la siguiente pregunta

// --- Variables de Estado del Juego ---
// Estas variables mantienen el estado actual del juego durante la sesión.

let currentUsername = '';          // Nombre del usuario actual
let currentUserData = {};          // Objeto con datos del usuario ({unlockedLevels, ...Streak})
let currentScore = 0;              // Puntuación de la ronda actual
let currentLevel = '';             // Nivel que se está jugando ('Entry', 'Associate', ...)
let currentGameMode = 'standard'; // Modo de juego ('standard', 'mastery')
let currentQuestionData = null;    // Objeto completo de la pregunta actual { question, options, correctAnswer, explanation }
let correctAnswer = null;          // La respuesta correcta para la comparación rápida
let questionsAnswered = 0;         // Contador de preguntas respondidas en la ronda actual
let roundResults = [];             // Array [true/false] para historial de aciertos/errores en la ronda
let questionTimerInterval = null;  // ID del intervalo del temporizador (para poder limpiarlo)
let timeLeft = 0;                  // Segundos restantes para la pregunta actual

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login inicial del usuario.
 * Carga o crea datos del usuario desde localStorage y muestra la pantalla de selección de nivel.
 * Exportada para ser llamada desde main.js.
 * @param {string} username - El nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username;
    try {
        currentUserData = storage.getUserData(username); // Carga o crea datos por defecto
        storage.saveUserData(username, currentUserData); // Guardar por si es nuevo
        ui.updatePlayerInfo(currentUsername, '', ''); // Actualizar display (aunque aún no se vea)

        // Mostrar secciones relevantes post-login
        if (ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if (ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';

        // Llamar a la función de UI para mostrar los botones de nivel
        // Pasa la función 'selectLevelAndMode' como callback para los botones
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert("Hubo un problema al cargar los datos del usuario.");
        ui.showSection(ui.userSetupSection); // Volver a pantalla inicial en caso de error
    }
}

/**
 * Establece el nivel y modo seleccionados por el usuario y comienza el juego.
 * Es llamada como callback desde la UI (displayLevelSelection).
 * @param {string} level - Nivel seleccionado ('Entry', 'Associate', etc.)
 * @param {string} mode - Modo seleccionado ('standard', 'mastery')
 */
export function selectLevelAndMode(level, mode) {
    currentLevel = level;
    currentGameMode = mode; // Guardar el modo elegido ('standard' o 'mastery')
    startGame(); // Iniciar el juego con esta configuración
}

/**
 * Inicializa el estado para una nueva partida/ronda.
 * Limpia contadores, puntuación, resultados y temporizadores. Muestra el área de juego.
 */
export function startGame() {
    clearInterval(questionTimerInterval); // Limpiar cualquier timer anterior
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = []; // Resetear historial de la ronda
    timeLeft = 0; // Resetear tiempo

    // Actualizar UI con info inicial de la ronda
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection); // Mostrar el área de juego principal
    // Mostrar estrellas de ronda (vacías), considerando el modo para estilo
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    // Ocultar timer por defecto (loadNextQuestion lo activará si aplica)
    ui.showTimerDisplay(false);

    loadNextQuestion(); // Cargar la primera pregunta de la ronda
}

/**
 * Carga los datos de la siguiente pregunta del nivel y modo actual.
 * Inicia el temporizador si corresponde (Entry en modo mastery).
 * Llama a la UI para mostrar la pregunta y opciones.
 * Maneja errores durante la generación o muestra.
 */
function loadNextQuestion() {
    // Limpiar estado visual de la pregunta anterior
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null; // Limpiar datos pregunta anterior
    correctAnswer = null;       // Limpiar respuesta correcta anterior
    clearInterval(questionTimerInterval); // Detener timer si corría
    ui.showTimerDisplay(false); // Ocultar display timer por defecto
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time'); // Quitar estilo de poco tiempo

    try {
        // Obtener datos de la siguiente pregunta desde el módulo questions
        const questionDataResult = getNextQuestion(currentLevel); // Llama a questions.js

        // Validar los datos recibidos del generador
        if (questionDataResult &&
            questionDataResult.question &&
            questionDataResult.options &&
            Array.isArray(questionDataResult.options) &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            currentQuestionData = questionDataResult; // Guardar datos completos globalmente
            correctAnswer = currentQuestionData.correctAnswer; // Asignar correctAnswer global para comparación rápida

            // INICIAR TIMER (solo si es Entry en modo mastery)
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery');
            ui.showTimerDisplay(timerCondition); // Mostrar u ocultar display del timer
            if (timerCondition) {
                timeLeft = config.QUESTION_TIMER_DURATION; // Establecer duración
                ui.updateTimerDisplay(timeLeft); // Mostrar tiempo inicial
                // Iniciar intervalo que llama a updateTimer cada segundo
                questionTimerInterval = setInterval(updateTimer, 1000);
            }

            // Mostrar la pregunta y opciones en la UI (pasa handleAnswerClick como callback)
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
        } else {
            // Error si el generador devolvió null o datos inválidos
            throw new Error("Datos de pregunta inválidos o nulos recibidos del generador.");
        }
    } catch (error) {
        // Manejo de errores centralizado si getNextQuestion o la validación fallan
        console.error("Error fatal en loadNextQuestion:", error);
        if (ui.questionText) ui.questionText.innerHTML = "Error al cargar pregunta.";
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        // Terminar el juego si hay un error grave cargando la pregunta
        setTimeout(endGame, 1500);
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo.
 * Si el tiempo llega a 0, lo considera respuesta incorrecta y muestra feedback/botón.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft); // Actualiza UI del timer

    if (timeLeft <= 0) {
        // --- TIEMPO AGOTADO ---
        clearInterval(questionTimerInterval); // Detener este timer
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar opciones

        roundResults.push(false); // Timeout cuenta como incorrecta
        const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMastery); // Actualizar estrellas ronda (roja/incorrecta)

        // Mostrar feedback de timeout (usa ui.displayFeedback para estructura base)
        const timeoutFeedbackData = {
             ...currentQuestionData, // Pasar datos pregunta actual
             questionsAnswered: questionsAnswered,
             totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
         };
        // Llama a UI.displayFeedback para que ponga el HTML base y el botón
        ui.displayFeedback(false, isMastery, timeoutFeedbackData, proceedToNextStep);

        // Añadir/Modificar texto específico de timeout en el feedback area
        if (ui.feedbackArea) {
           const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child'); // Buscar span del mensaje
           if (feedbackContent) {
                // Modificar el mensaje para indicar timeout
                feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong>`;
           } else {
                // Si por alguna razón no encontró el span, añadir un mensaje básico
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData.correctAnswer}</strong>`;
                ui.feedbackArea.prepend(timeoutSpan); // Ponerlo al inicio del feedback area
           }
           // Asegurar clase incorrecta
           ui.feedbackArea.className = 'incorrect';
        }
    }
}

/**
 * Función intermedia llamada después de una respuesta (correcta automática o incorrecta manual).
 * Incrementa el contador de preguntas y decide si seguir o terminar la ronda.
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Detener timer si se llamó manualmente
    questionsAnswered++; // Incrementar contador AHORA
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame(); // Terminar si se alcanzó el límite
    } else {
        loadNextQuestion(); // Cargar la siguiente si no
    }
}

/**
 * Maneja el clic del usuario en un botón de opción de respuesta.
 * Verifica la respuesta, actualiza estado, muestra feedback, y decide el siguiente paso.
 * Exportada para que ui.js pueda asignarla como listener.
 * @param {Event} event - El objeto del evento click.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detener timer tan pronto se responde

    // Verificar que tenemos datos de la pregunta actual y respuesta correcta
    if (!currentQuestionData || correctAnswer === null) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;

    // Deshabilitar opciones para evitar múltiples clics
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    // Determinar si la respuesta es correcta
    let isCorrect = (selectedAnswer === correctAnswer);
    roundResults.push(isCorrect); // Registrar resultado para estrellas de ronda

    // Determinar si estamos en modo Realeza/Mastery
    const isMastery = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        // --- RESPUESTA CORRECTA ---
        currentScore += config.POINTS_PER_QUESTION; // Actualizar puntuación
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Reflejar en UI

        // Mostrar feedback simple de acierto
        ui.displayFeedback(isCorrect, isMastery, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMastery ? 'mastery' : 'correct'); // Estilo al botón

        // Avance automático a la siguiente pregunta/fin de juego
        setTimeout(proceedToNextStep, 1200);

    } else {
        // --- RESPUESTA INCORRECTA ---
        // Pasar todos los datos necesarios a displayFeedback para que muestre
        // explicación, respuesta correcta y cree el botón "Siguiente >>"
        const feedbackData = {
            ...currentQuestionData,
            questionsAnswered: questionsAnswered, // Pasar contador ANTES de incrementar
            totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
        };
        ui.displayFeedback(isCorrect, isMastery, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect'); // Marcar botón incorrecto
        // El resaltado de la respuesta correcta se hace dentro de ui.displayFeedback
        // El listener para el botón "Siguiente" también se añade en ui.displayFeedback
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
                // message se queda como "Partida completada!"
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
        // Añadir 'else if (currentLevel === 'Professional')' para futuras rachas/desbloqueos
        // --- Fin Lógica Racha ---

        storage.saveUserData(currentUsername, currentUserData); // Guardar TODOS los datos actualizados
        storage.saveHighScore(currentUsername, currentScore); // Guardar puntuación alta
        const highScores = storage.loadHighScores(); // Cargar scores para mostrar
        ui.displayHighScores(highScores); // Mostrar scores actualizados

        // Mostrar pantalla Game Over con info correcta
        ui.displayGameOver(currentScore, message, currentUserData); // El handler del botón se añade en main.js
        currentQuestionData = null; // Limpiar datos de la última pregunta

    } catch (error) { console.error("Error en endGame:", error); }
}

/**
 * Maneja el botón 'Reiniciar Ronda Actual'.
 * Exportada para que main.js la use como listener.
 */
export function handleRestartRound() {
    // Opcional: Añadir confirmación
    // if (!confirm("¿Seguro que quieres reiniciar esta ronda? Perderás el progreso actual.")) {
    //     return;
    // }
    startGame(); // Llama a startGame con el currentLevel y currentGameMode ya establecidos
}

/**
 * Maneja el botón 'Salir al Menú de Niveles'.
 * Exportada para que main.js la use como listener.
 */
export function handleExitToMenu() {
     // Opcional: Añadir confirmación
     // if (!confirm("¿Seguro que quieres salir? Perderás el progreso de esta ronda.")) {
     //     return;
     // }
     clearInterval(questionTimerInterval); // Detener timer si existe
     // Llama a handlePlayAgain que ya contiene la lógica para volver al menú
     handlePlayAgain();
}

/**
 * Maneja el botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over.
 * Exportada para que main.js la use como listener.
 */
export function handlePlayAgain() {
    // Recargar datos frescos por si acaso hubo un desbloqueo
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Si no hay usuario (raro aquí), usar defaults
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
