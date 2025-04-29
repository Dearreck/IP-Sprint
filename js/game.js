// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado del juego, el flujo entre pantallas,
// las interacciones del usuario, la puntuación,
// el desbloqueo de niveles y el temporizador.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import { getNextQuestion } from './questions.js';

// --- Variables de Estado del Juego ---
let currentUsername = '';
let currentUserData = {};
let currentScore = 0;
let currentLevel = '';
let currentGameMode = 'standard';
let currentQuestionData = null;
let correctAnswer = null;
let questionsAnswered = 0;
let roundResults = [];
let questionTimerInterval = null;
let timeLeft = 0;

// --- Funciones Auxiliares ---
function getPointsForCurrentLevel() {
    try {
        const levelConfig = config.POINTS_BY_LEVEL[currentLevel];
        if (levelConfig) {
            return levelConfig[currentGameMode] || levelConfig['standard'] || 0;
        } return 0;
    } catch (error) { console.error("Error obteniendo puntos por nivel:", error); return 0; }
}
function getMaxPossibleScore() {
    const pointsPerQ = getPointsForCurrentLevel();
    return config.TOTAL_QUESTIONS_PER_GAME * pointsPerQ;
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el inicio de sesión inicial del usuario.
 * Guarda el nombre, carga/crea los datos del usuario desde localStorage,
 * y muestra la pantalla de selección de nivel.
 * Exportada para ser llamada desde main.js cuando se envía el formulario.
 * @param {string} username - El nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    console.log("handleUserLogin iniciado para:", username); // DEBUG
    currentUsername = username;
    try {
        // Carga los datos existentes del usuario o crea datos por defecto si es nuevo.
        console.log("Cargando datos del usuario..."); // DEBUG
        currentUserData = storage.getUserData(username);
        console.log("Datos cargados:", currentUserData); // DEBUG

        // Guarda los datos (por si es un usuario nuevo o para asegurar consistencia).
        console.log("Guardando datos del usuario..."); // DEBUG
        storage.saveUserData(username, currentUserData);

        // Actualiza la información del jugador en la UI (aunque aún no sea visible).
        ui.updatePlayerInfo(currentUsername, '', '');

        // Asegura que las secciones de progreso y puntuaciones sean visibles
        // en la pantalla de selección de nivel.
        console.log("Mostrando secciones post-login..."); // DEBUG
        if (ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if (ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';

        // Llama a la función de UI para generar y mostrar los botones de nivel.
        // Pasa 'selectLevelAndMode' como la función que se ejecutará al hacer clic en un botón.
        console.log("Llamando a displayLevelSelection..."); // DEBUG
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
        console.log("handleUserLogin completado."); // DEBUG

    } catch (error) {
        // Manejo de errores si falla la carga/guardado de datos.
        console.error("Error durante handleUserLogin:", error); // Muestra el error en consola
        alert(`Hubo un problema al cargar los datos del usuario: ${error.message}`); // Muestra alerta más específica
        // Devuelve al usuario a la pantalla inicial si ocurre un error.
        ui.showSection(ui.userSetupSection);
    }
}

/**
 * Establece el nivel y modo seleccionados por el usuario y comienza la ronda.
 * Esta función es llamada como callback desde los botones generados por ui.displayLevelSelection.
 * @param {string} level - Nivel seleccionado (ej. 'Entry', 'Associate').
 * @param {string} mode - Modo seleccionado (ej. 'standard', 'mastery').
 */
export function selectLevelAndMode(level, mode) {
    console.log(`Nivel seleccionado: ${level}, Modo: ${mode}`); // DEBUG
    currentLevel = level;     // Guarda el nivel seleccionado en el estado del juego.
    currentGameMode = mode; // Guarda el modo seleccionado.
    startGame();            // Llama a la función para iniciar la ronda.
}

/**
 * Inicializa el estado para una nueva partida/ronda.
 * Limpia puntuación, contadores, resultados previos y temporizadores.
 * Muestra el área de juego y carga la primera pregunta.
 */
export function startGame() {
    console.log("startGame iniciado."); // DEBUG
    // Detiene cualquier temporizador de pregunta que pudiera estar activo de una ronda anterior.
    clearInterval(questionTimerInterval);
    // Reinicia las variables de estado de la ronda.
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;

    // Actualiza la información del jugador en la UI (nivel, score inicial 0).
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    // Muestra la sección principal del área de juego.
    ui.showSection(ui.gameAreaSection);
    // Actualiza las estrellas de progreso de la ronda (mostrándolas todas como pendientes).
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    // Oculta el display del temporizador inicialmente.
    ui.showTimerDisplay(false);

    // Carga la primera pregunta de la nueva ronda.
    loadNextQuestion();
}

/**
 * Carga los datos de la siguiente pregunta del nivel actual.
 * Obtiene la pregunta desde el módulo 'questions.js'.
 * Inicia el temporizador si el nivel/modo lo requiere.
 * Llama a la UI para mostrar la pregunta y las opciones.
 * Maneja errores si no se pueden cargar preguntas.
 */
function loadNextQuestion() {
    console.log("loadNextQuestion iniciado."); // DEBUG
    // --- Limpieza de la UI de la pregunta anterior ---
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    currentQuestionData = null;
    correctAnswer = null;
    clearInterval(questionTimerInterval);
    ui.showTimerDisplay(false);
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        console.log(`Obteniendo pregunta para nivel: ${currentLevel}`); // DEBUG
        const questionDataResult = getNextQuestion(currentLevel);
        console.log("Datos de pregunta recibidos:", questionDataResult); // DEBUG

        // --- Validación de los datos recibidos ---
        if (questionDataResult &&
            questionDataResult.question &&
            questionDataResult.options &&
            Array.isArray(questionDataResult.options) &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            currentQuestionData = questionDataResult;
            correctAnswer = currentQuestionData.correctAnswer;

            // --- Lógica del Temporizador ---
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery') ||
                                   (currentLevel === 'Associate') ||
                                   (currentLevel === 'Professional');
            console.log(`Timer activado para ${currentLevel} (${currentGameMode}): ${timerCondition}`); // DEBUG

            ui.showTimerDisplay(timerCondition);
            if (timerCondition) {
                timeLeft = config.QUESTION_TIMER_DURATION;
                ui.updateTimerDisplay(timeLeft);
                questionTimerInterval = setInterval(updateTimer, 1000);
            }
            // --- Fin Lógica Timer ---

            console.log("Mostrando pregunta en UI..."); // DEBUG
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);
            console.log("Pregunta mostrada."); // DEBUG

        } else {
            // --- Manejo de Error: Datos de Pregunta Inválidos ---
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) {
                 throw new Error(`No hay preguntas disponibles para el nivel ${currentLevel} todavía.`);
            } else {
                 throw new Error("Datos de pregunta inválidos o nulos recibidos del generador.");
            }
        }
    } catch (error) {
        // --- Manejo de Errores General en loadNextQuestion ---
        console.error("Error en loadNextQuestion:", error);
        if (ui.questionText) ui.questionText.innerHTML = `Error al cargar pregunta: ${error.message}`;
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        setTimeout(endGame, 2500); // Termina el juego si hay error
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo.
 * Se llama repetidamente a través de setInterval.
 * Si el tiempo llega a 0, considera la respuesta como incorrecta.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
        console.log("Tiempo agotado!"); // DEBUG
        // --- Tiempo Agotado ---
        clearInterval(questionTimerInterval);
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

        roundResults.push(false);
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);

        const timeoutFeedbackData = {
             ...currentQuestionData,
             questionsAnswered: questionsAnswered,
             totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
         };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        if (ui.feedbackArea) {
           const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
           if (feedbackContent) {
                feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`;
           } else {
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`;
                ui.feedbackArea.prepend(timeoutSpan);
           }
           ui.feedbackArea.className = 'incorrect';
        }
    }
}

/**
 * Función intermedia llamada después de procesar una respuesta (correcta o incorrecta).
 * Incrementa el contador de preguntas respondidas y decide si cargar la siguiente
 * pregunta o terminar la ronda.
 */
 function proceedToNextStep() {
    console.log("proceedToNextStep llamado."); // DEBUG
    clearInterval(questionTimerInterval);
    questionsAnswered++;
    console.log(`Preguntas respondidas: ${questionsAnswered}/${config.TOTAL_QUESTIONS_PER_GAME}`); // DEBUG
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        console.log("Fin de la ronda, llamando a endGame..."); // DEBUG
        endGame();
    } else {
        console.log("Cargando siguiente pregunta..."); // DEBUG
        loadNextQuestion();
    }
}

/**
 * Maneja el evento de clic del usuario en un botón de opción de respuesta.
 * Verifica si la respuesta es correcta, actualiza la puntuación,
 * muestra el feedback apropiado, y llama a proceedToNextStep.
 * Exportada para que ui.js pueda asignarla como listener a los botones de opción.
 * @param {Event} event - El objeto del evento click que contiene información sobre el botón presionado.
 */
 export function handleAnswerClick(event) {
    console.log("handleAnswerClick llamado."); // DEBUG
    clearInterval(questionTimerInterval);

    if (!currentQuestionData || correctAnswer === null) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return;
    }

    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;
    console.log(`Respuesta seleccionada: ${selectedAnswer}, Correcta: ${correctAnswer}`); // DEBUG

    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    let isCorrect = (selectedAnswer === correctAnswer);
    roundResults.push(isCorrect);
    console.log(`Respuesta fue correcta: ${isCorrect}`); // DEBUG

    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    if (isCorrect) {
        const pointsEarned = getPointsForCurrentLevel();
        currentScore += pointsEarned;
        console.log(`Puntos ganados: ${pointsEarned}, Score total: ${currentScore}`); // DEBUG
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        // Avance automático después de un tiempo
        setTimeout(proceedToNextStep, 1200);

    } else {
        console.log("Respuesta incorrecta, mostrando feedback y botón siguiente."); // DEBUG
        const feedbackData = {
            ...currentQuestionData,
            questionsAnswered: questionsAnswered,
            totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
        };
        // Mostrar feedback y botón "Siguiente". El listener se añade en ui.js
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect');
    }

    // Actualizar estrellas de progreso de la ronda
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}


/**
 * Finaliza la partida/ronda actual.
 * Calcula el porcentaje de acierto, verifica si se cumple la condición de racha
 * para desbloquear el siguiente nivel, guarda los datos actualizados del usuario
 * y la puntuación alta, y muestra la pantalla de Game Over.
 */
 function endGame() {
    console.log("endGame iniciado."); // DEBUG
    clearInterval(questionTimerInterval);
    const maxScore = getMaxPossibleScore();
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    const isPerfect = maxScore > 0 && currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    let message = `¡Partida completada! Puntuación: ${currentScore} / ${maxScore} (${scorePercentage.toFixed(0)}%)`;
    console.log(`Resultado final: Score=${currentScore}, Porcentaje=${scorePercentage.toFixed(0)}%, Perfecta=${isPerfect}, CumpleUmbralAssociate=${meetsAssociateThreshold}`); // DEBUG

    try {
        console.log("Cargando datos de usuario para actualizar racha/desbloqueo..."); // DEBUG
        currentUserData = storage.getUserData(currentUsername);

        // --- Lógica de Racha y Desbloqueo de Niveles ---
        if (currentLevel === 'Entry') {
            // Desbloqueo de Associate requiere 100%
            if (isPerfect) {
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                console.log(`Ronda Entry perfecta. Racha Entry ahora: ${currentUserData.entryPerfectStreak}`); // DEBUG
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate');
                    currentUserData.entryPerfectStreak = 0;
                    message = `¡3 Rondas Perfectas (100%)! ¡Nivel Associate Desbloqueado! 🎉`;
                    console.log("Nivel Associate DESBLOQUEADO!"); // DEBUG
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    message = `¡Ronda Perfecta (100%)! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`;
                } else { message = `¡Ronda Perfecta (100%)!`; }
            } else {
                if (currentUserData.entryPerfectStreak > 0) { message += " (Racha 100% reiniciada)"; console.log("Racha Entry reiniciada."); } // DEBUG
                currentUserData.entryPerfectStreak = 0;
            }
        } else if (currentLevel === 'Associate') {
             // Desbloqueo de Professional requiere 90%
             if (meetsAssociateThreshold) {
                currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                console.log(`Ronda Associate >= 90%. Racha Associate ahora: ${currentUserData.associatePerfectStreak}`); // DEBUG
                if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                    currentUserData.unlockedLevels.push('Professional');
                    currentUserData.associatePerfectStreak = 0;
                    message = `¡3 Rondas con +${config.MIN_SCORE_PERCENT_FOR_STREAK}%! ¡Nivel Professional Desbloqueado! 🏆`;
                    console.log("Nivel Professional DESBLOQUEADO!"); // DEBUG
                } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                    message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)! Racha: ${currentUserData.associatePerfectStreak}/3.`;
                } else { message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)!`; }
             } else {
                  if (currentUserData.associatePerfectStreak > 0) { message += " (Racha 90% reiniciada)"; console.log("Racha Associate reiniciada."); } // DEBUG
                 currentUserData.associatePerfectStreak = 0;
             }
        }
        // --- Fin Lógica Racha ---

        console.log("Guardando datos de usuario actualizados:", currentUserData); // DEBUG
        storage.saveUserData(currentUsername, currentUserData);
        console.log(`Guardando high score: User=${currentUsername}, Score=${currentScore}, Level=${currentLevel}, Mode=${currentGameMode}`); // DEBUG
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode);
        console.log("Cargando y mostrando high scores..."); // DEBUG
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        console.log("Mostrando pantalla Game Over."); // DEBUG
        ui.displayGameOver(currentScore, message, currentUserData);
        currentQuestionData = null; // Limpiar datos de la última pregunta

    } catch (error) {
        console.error("Error en endGame:", error);
        ui.displayGameOver(currentScore, `Error al finalizar la partida: ${error.message}`, currentUserData);
    }
}

/**
 * Maneja el evento del botón 'Reiniciar Ronda Actual'.
 * Simplemente vuelve a llamar a startGame() para reiniciar la ronda con el mismo nivel/modo.
 * Exportada para main.js.
 */
export function handleRestartRound() {
    console.log("handleRestartRound llamado."); // DEBUG
    startGame();
}

/**
 * Maneja el evento del botón 'Salir al Menú de Niveles'.
 * Detiene el timer y llama a handlePlayAgain() que muestra la selección de nivel.
 * Exportada para main.js.
 */
export function handleExitToMenu() {
     console.log("handleExitToMenu llamado."); // DEBUG
     clearInterval(questionTimerInterval);
     handlePlayAgain();
}

/**
 * Maneja el evento del botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over.
 * Recarga los datos del usuario (por si hubo desbloqueos) y muestra la pantalla de selección de nivel.
 * Exportada para main.js.
 */
export function handlePlayAgain() {
    console.log("handlePlayAgain llamado."); // DEBUG
    // Recarga los datos del usuario actual para asegurar que la lista de niveles esté actualizada.
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Si por alguna razón no hay usuario (poco probable aquí), usa datos por defecto.
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername establecido."); // DEBUG
    }
    // Llama a la función de UI para mostrar la selección de nivel actualizada.
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
}

/**
 * Función de inicialización general del juego.
 * Se llama una vez cuando el DOM está cargado (desde main.js).
 * Carga las puntuaciones iniciales y muestra la pantalla de configuración de usuario.
 * Exportada para main.js.
 */
export function initializeGame() {
    console.log("initializeGame llamado."); // DEBUG
    // Carga las puntuaciones altas guardadas para mostrarlas desde el inicio.
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    // Muestra la primera pantalla que ve el usuario: el formulario para ingresar nombre.
    ui.showSection(ui.userSetupSection);
}
