// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Maneja el estado del juego, el flujo entre pantallas,
// las interacciones del usuario, la puntuación,
// el desbloqueo de niveles y el temporizador.
// ==================================================

// --- Importaciones de Módulos ---
// Importar constantes y configuraciones definidas en otros archivos.
import * as config from './config.js';         // Constantes (ej. preguntas por ronda, puntos, claves localStorage)
import * as storage from './storage.js';       // Funciones para interactuar con localStorage (guardar/cargar datos)
import * as ui from './ui.js';             // Funciones y selectores de elementos para manipular la interfaz de usuario (DOM)
import { getNextQuestion } from './questions.js'; // Función que genera los datos de la siguiente pregunta según el nivel

// --- Variables de Estado del Juego ---
// Estas variables guardan la información sobre el estado actual del juego
// mientras el usuario está jugando una sesión. Se reinician o actualizan
// según sea necesario.

let currentUsername = '';          // Nombre del usuario que está jugando actualmente.
let currentUserData = {};          // Objeto que contiene los datos persistentes del usuario cargados de localStorage
                                   // (ej. { unlockedLevels: ['Entry', 'Associate'], entryPerfectStreak: 1, associatePerfectStreak: 0 }).
let currentScore = 0;              // Puntuación acumulada durante la ronda/partida actual. Se reinicia al empezar una nueva.
let currentLevel = '';             // Nivel que se está jugando en la ronda actual (ej. 'Entry', 'Associate').
let currentGameMode = 'standard';  // Modo de juego ('standard' o 'mastery'). Determina reglas como el timer o puntuación.
let currentQuestionData = null;    // Objeto que contiene toda la información de la pregunta actual
                                   // (ej. { question: "...", options: [...], correctAnswer: "...", explanation: "..." }).
let correctAnswer = null;          // Guarda solo la respuesta correcta de la pregunta actual para una comparación rápida.
let questionsAnswered = 0;         // Contador de cuántas preguntas se han respondido en la ronda actual.
let roundResults = [];             // Array de booleanos (true/false) que registra si cada respuesta de la ronda fue correcta o no. Usado para las estrellas de progreso.
let questionTimerInterval = null;  // Guarda el ID devuelto por setInterval para el temporizador de la pregunta. Se usa para poder detenerlo (clearInterval).
let timeLeft = 0;                  // Segundos restantes para responder la pregunta actual (si el timer está activo).

// --- Funciones Auxiliares ---

/**
 * Obtiene los puntos que se otorgan por una respuesta correcta
 * según el nivel y modo de juego actuales, consultando la configuración.
 * @returns {number} Los puntos correspondientes o 0 si hay un error.
 */
function getPointsForCurrentLevel() {
    try {
        // Accede a la estructura POINTS_BY_LEVEL en config.js usando el nivel actual
        const levelConfig = config.POINTS_BY_LEVEL[currentLevel];
        if (levelConfig) {
            // Dentro del nivel, busca los puntos para el modo actual (ej. 'standard' o 'mastery')
            // Si no existe una entrada específica para el modo, usa 'standard' como fallback.
            // Si no existe 'standard', devuelve 0.
            return levelConfig[currentGameMode] || levelConfig['standard'] || 0;
        }
        // Si el nivel actual no está definido en POINTS_BY_LEVEL, devuelve 0.
        return 0;
    } catch (error) {
        // Captura cualquier error inesperado durante el acceso a la configuración.
        console.error("Error obteniendo puntos por nivel:", error);
        return 0; // Devuelve 0 como valor seguro en caso de error.
    }
}

/**
 * Calcula la puntuación máxima posible para la ronda actual,
 * basándose en el número de preguntas y los puntos por pregunta del nivel/modo actual.
 * @returns {number} La puntuación máxima posible para la ronda.
 */
function getMaxPossibleScore() {
    // Obtiene los puntos por pregunta para el nivel/modo actual.
    const pointsPerQ = getPointsForCurrentLevel();
    // Multiplica por el número total de preguntas definido en la configuración.
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
    currentUsername = username; // Guarda el nombre de usuario en la variable de estado.
    try {
        // Carga los datos existentes del usuario o crea datos por defecto si es nuevo.
        currentUserData = storage.getUserData(username);
        // Guarda los datos (por si es un usuario nuevo o para asegurar consistencia).
        storage.saveUserData(username, currentUserData);
        // Actualiza la información del jugador en la UI (aunque aún no sea visible).
        ui.updatePlayerInfo(currentUsername, '', ''); // Nivel y score iniciales vacíos/cero.

        // Asegura que las secciones de progreso y puntuaciones sean visibles
        // en la pantalla de selección de nivel.
        if (ui.highScoresSection) ui.highScoresSection.style.display = 'block';
        if (ui.unlockProgressSection) ui.unlockProgressSection.style.display = 'block';

        // Llama a la función de UI para generar y mostrar los botones de nivel.
        // Pasa 'selectLevelAndMode' como la función que se ejecutará al hacer clic en un botón.
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);

    } catch (error) {
        // Manejo de errores si falla la carga/guardado de datos.
        console.error("Error durante handleUserLogin:", error);
        alert("Hubo un problema al cargar los datos del usuario.");
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
    // Detiene cualquier temporizador de pregunta que pudiera estar activo de una ronda anterior.
    clearInterval(questionTimerInterval);
    // Reinicia las variables de estado de la ronda.
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = []; // Limpia el historial de aciertos/errores.
    timeLeft = 0;      // Reinicia el tiempo restante.

    // Actualiza la información del jugador en la UI (nivel, score inicial 0).
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    // Muestra la sección principal del área de juego.
    ui.showSection(ui.gameAreaSection);
    // Actualiza las estrellas de progreso de la ronda (mostrándolas todas como pendientes).
    // Pasa el modo para aplicar estilo de corona si es 'mastery'.
    ui.updateRoundProgressUI(roundResults, currentGameMode === 'mastery');
    // Oculta el display del temporizador inicialmente. Se mostrará si el nivel/modo lo requiere.
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
    // --- Limpieza de la UI de la pregunta anterior ---
    // Limpia el área de feedback (mensajes de correcto/incorrecto).
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    // Rehabilita los botones de opción (quitando la clase 'options-disabled').
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    // Limpia los datos de la pregunta anterior.
    currentQuestionData = null;
    correctAnswer = null;
    // Detiene el temporizador si estaba activo.
    clearInterval(questionTimerInterval);
    // Oculta el display del timer por defecto.
    ui.showTimerDisplay(false);
    // Quita el estilo de "poco tiempo" si lo tenía.
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Llama a la función en questions.js para obtener el objeto de la siguiente pregunta.
        const questionDataResult = getNextQuestion(currentLevel);

        // --- Validación de los datos recibidos ---
        // Verifica que se recibió un objeto válido con todas las propiedades necesarias.
        if (questionDataResult &&
            questionDataResult.question &&
            questionDataResult.options &&
            Array.isArray(questionDataResult.options) &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            // Guarda los datos completos de la pregunta en la variable de estado.
            currentQuestionData = questionDataResult;
            // Guarda la respuesta correcta para fácil acceso.
            correctAnswer = currentQuestionData.correctAnswer;

            // --- Lógica del Temporizador ---
            // Define la condición para activar el timer:
            // - Nivel Entry en modo 'mastery' O
            // - Nivel Associate (cualquier modo, ya que siempre tiene timer) O
            // - Nivel Professional (cualquier modo, futuro)
            const timerCondition = (currentLevel === 'Entry' && currentGameMode === 'mastery') ||
                                   (currentLevel === 'Associate') ||
                                   (currentLevel === 'Professional'); // Preparado para futuro

            // Muestra u oculta el elemento del timer en la UI según la condición.
            ui.showTimerDisplay(timerCondition);
            if (timerCondition) {
                // Si el timer debe activarse:
                timeLeft = config.QUESTION_TIMER_DURATION; // Establece la duración desde config.js.
                ui.updateTimerDisplay(timeLeft);          // Muestra el tiempo inicial en la UI.
                // Inicia el intervalo que llamará a updateTimer cada 1000ms (1 segundo).
                questionTimerInterval = setInterval(updateTimer, 1000);
            }
            // --- Fin Lógica Timer ---

            // Llama a la función de UI para mostrar la pregunta y los botones de opción.
            // Pasa 'handleAnswerClick' como la función que se ejecutará cuando se haga clic en una opción.
            ui.displayQuestion(currentQuestionData.question, currentQuestionData.options, handleAnswerClick);

        } else {
            // --- Manejo de Error: Datos de Pregunta Inválidos ---
            // Si getNextQuestion devuelve null o un objeto inválido:
            // Comprueba si es porque no hay preguntas implementadas para niveles superiores.
            if (!questionDataResult && (currentLevel === 'Associate' || currentLevel === 'Professional')) {
                 // Lanza un error específico indicando que faltan preguntas para ese nivel.
                 throw new Error(`No hay preguntas disponibles para el nivel ${currentLevel} todavía.`);
            } else {
                 // Lanza un error genérico si los datos son inválidos por otra razón.
                 throw new Error("Datos de pregunta inválidos o nulos recibidos del generador.");
            }
        }
    } catch (error) {
        // --- Manejo de Errores General en loadNextQuestion ---
        console.error("Error en loadNextQuestion:", error);
        // Muestra un mensaje de error en el área de la pregunta.
        if (ui.questionText) ui.questionText.innerHTML = `Error al cargar pregunta: ${error.message}`;
        // Limpia las opciones.
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        // Termina el juego después de un breve retraso para que el usuario vea el error.
        setTimeout(endGame, 2500);
    }
 }

/**
 * Actualiza el temporizador de la pregunta cada segundo.
 * Se llama repetidamente a través de setInterval.
 * Si el tiempo llega a 0, considera la respuesta como incorrecta.
 */
 function updateTimer() {
    timeLeft--; // Decrementa el tiempo restante.
    ui.updateTimerDisplay(timeLeft); // Actualiza la UI para mostrar el nuevo tiempo.

    // Comprueba si el tiempo se ha agotado.
    if (timeLeft <= 0) {
        // --- Tiempo Agotado ---
        clearInterval(questionTimerInterval); // Detiene el temporizador actual.
        // Deshabilita los botones de opción para que no se pueda responder.
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

        // Registra el timeout como una respuesta incorrecta en el historial de la ronda.
        roundResults.push(false);
        // Determina si se debe usar el estilo 'mastery' (corona) para las estrellas.
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        // Actualiza las estrellas de progreso de la ronda (añadiendo una roja).
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);

        // Prepara los datos necesarios para mostrar el feedback de timeout.
        const timeoutFeedbackData = {
             ...currentQuestionData, // Incluye los datos de la pregunta (respuesta correcta, explicación).
             questionsAnswered: questionsAnswered, // Pasa el contador actual.
             totalQuestions: config.TOTAL_QUESTIONS_PER_GAME // Pasa el total de preguntas.
         };
        // Llama a la función de UI para mostrar el feedback base (incorrecto) y el botón "Siguiente".
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        // --- Modifica el texto del feedback para indicar que fue por tiempo ---
        if (ui.feedbackArea) {
           // Busca el primer span dentro del contenedor de texto del feedback.
           const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
           if (feedbackContent) {
                // Si lo encuentra, modifica su contenido HTML.
                feedbackContent.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`;
           } else {
                // Si no lo encuentra (raro), crea un span nuevo y lo añade al principio.
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = `¡Tiempo Agotado! ⌛ La respuesta correcta era: <strong>${currentQuestionData?.correctAnswer || 'N/A'}</strong>`;
                ui.feedbackArea.prepend(timeoutSpan);
           }
           // Asegura que el área de feedback tenga la clase 'incorrect' (roja).
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
    // Detiene el timer (importante si se hizo clic antes de que llegara a 0).
    clearInterval(questionTimerInterval);
    // Incrementa el contador de preguntas respondidas *después* de procesar la respuesta actual.
    questionsAnswered++;
    // Comprueba si se ha alcanzado el número total de preguntas por ronda.
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame(); // Termina la ronda si se completaron todas las preguntas.
    } else {
        loadNextQuestion(); // Carga la siguiente pregunta si aún quedan.
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
    // Detiene el temporizador tan pronto como el usuario hace clic en una opción.
    clearInterval(questionTimerInterval);

    // Validación: Asegura que haya datos de la pregunta actual cargados.
    if (!currentQuestionData || correctAnswer === null) {
        console.error("handleAnswerClick llamado sin datos de pregunta o respuesta correcta.");
        return; // Sale de la función si no hay datos válidos.
    }

    // Obtiene el botón que fue presionado y su texto (la respuesta seleccionada).
    const selectedButton = event.target;
    const selectedAnswer = selectedButton.textContent;

    // Deshabilita todos los botones de opción para evitar clics múltiples.
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    // Compara la respuesta seleccionada con la respuesta correcta guardada.
    let isCorrect = (selectedAnswer === correctAnswer);
    // Registra el resultado (true/false) en el historial de la ronda.
    roundResults.push(isCorrect);

    // Determina si se debe usar el estilo 'mastery' (corona) basado en nivel y modo.
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    // --- Procesamiento según si la respuesta es Correcta o Incorrecta ---
    if (isCorrect) {
        // --- Respuesta Correcta ---
        // Obtiene los puntos correspondientes al nivel/modo actual.
        const pointsEarned = getPointsForCurrentLevel();
        // Suma los puntos a la puntuación de la ronda.
        currentScore += pointsEarned;
        // Actualiza la puntuación mostrada en la UI.
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        // Muestra el feedback de "Correcto" en la UI.
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        // Añade la clase CSS 'correct' o 'mastery' al botón presionado para resaltarlo.
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct');
        // Espera un breve momento (1.2 segundos) antes de pasar a la siguiente pregunta/fin.
        setTimeout(proceedToNextStep, 1200);

    } else {
        // --- Respuesta Incorrecta ---
        // Prepara los datos necesarios para la función de feedback.
        const feedbackData = {
            ...currentQuestionData, // Pasa todos los datos de la pregunta (incluye explicación).
            questionsAnswered: questionsAnswered, // Pasa el número de preguntas respondidas *antes* de incrementar.
            totalQuestions: config.TOTAL_QUESTIONS_PER_GAME
        };
        // Llama a la función de UI para mostrar el feedback de "Incorrecto",
        // la respuesta correcta, la explicación y el botón "Siguiente".
        // Pasa 'proceedToNextStep' como la función a ejecutar al hacer clic en "Siguiente".
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        // Añade la clase CSS 'incorrect' al botón presionado para resaltarlo en rojo.
        if (selectedButton) selectedButton.classList.add('incorrect');
        // Nota: El resaltado del botón correcto y la adición del listener al botón "Siguiente"
        // se manejan dentro de ui.displayFeedback.
    }

    // Actualiza las estrellas de progreso de la ronda (añade verde/corona o roja).
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}


/**
 * Finaliza la partida/ronda actual.
 * Calcula el porcentaje de acierto, verifica si se cumple la condición de racha
 * para desbloquear el siguiente nivel, guarda los datos actualizados del usuario
 * y la puntuación alta, y muestra la pantalla de Game Over.
 */
 function endGame() {
    // Asegura detener cualquier temporizador activo.
    clearInterval(questionTimerInterval);
    // Calcula la puntuación máxima posible para esta ronda.
    const maxScore = getMaxPossibleScore();
    // Calcula el porcentaje de acierto (evitando división por cero).
    const scorePercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    // Determina si la ronda fue perfecta (100%).
    const isPerfect = maxScore > 0 && currentScore === maxScore;
    // Determina si se alcanzó el umbral del 90% (para desbloquear Professional).
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    // Mensaje base para la pantalla de Game Over.
    let message = `¡Partida completada! Puntuación: ${currentScore} / ${maxScore} (${scorePercentage.toFixed(0)}%)`;

    try {
        // Recarga los datos más recientes del usuario desde localStorage.
        currentUserData = storage.getUserData(currentUsername);

        // --- Lógica de Racha y Desbloqueo de Niveles ---
        if (currentLevel === 'Entry') {
            // Para desbloquear Associate, se requiere racha de 3 rondas perfectas (100%).
            if (isPerfect) {
                // Incrementa la racha de rondas perfectas en Entry.
                currentUserData.entryPerfectStreak = (currentUserData.entryPerfectStreak || 0) + 1;
                // Comprueba si se alcanzó la racha de 3 y si Associate aún no está desbloqueado.
                if (currentUserData.entryPerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Associate')) {
                    currentUserData.unlockedLevels.push('Associate'); // Añade Associate a la lista.
                    currentUserData.entryPerfectStreak = 0; // Resetea la racha de Entry.
                    message = `¡3 Rondas Perfectas (100%)! ¡Nivel Associate Desbloqueado! 🎉`; // Mensaje de desbloqueo.
                } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                    // Si no se desbloqueó pero fue perfecta, informa la racha actual.
                    message = `¡Ronda Perfecta (100%)! Racha (Entry): ${currentUserData.entryPerfectStreak}/3.`;
                } else {
                    // Si ya tenía Associate desbloqueado, solo felicita.
                    message = `¡Ronda Perfecta (100%)!`;
                }
            } else {
                // Si la ronda no fue perfecta, resetea la racha de Entry.
                if (currentUserData.entryPerfectStreak > 0) { message += " (Racha 100% reiniciada)"; }
                currentUserData.entryPerfectStreak = 0;
            }
        } else if (currentLevel === 'Associate') {
             // Para desbloquear Professional, se requiere racha de 3 rondas con 90% o más.
             if (meetsAssociateThreshold) {
                // Incrementa la racha de rondas con 90%+ en Associate.
                currentUserData.associatePerfectStreak = (currentUserData.associatePerfectStreak || 0) + 1;
                // Comprueba si se alcanzó la racha de 3 y si Professional no está desbloqueado.
                if (currentUserData.associatePerfectStreak >= 3 && !currentUserData.unlockedLevels.includes('Professional')) {
                    currentUserData.unlockedLevels.push('Professional'); // Añade Professional.
                    currentUserData.associatePerfectStreak = 0; // Resetea la racha de Associate.
                    message = `¡3 Rondas con +${config.MIN_SCORE_PERCENT_FOR_STREAK}%! ¡Nivel Professional Desbloqueado! 🏆`; // Mensaje de desbloqueo.
                } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                    // Si no se desbloqueó pero cumplió el umbral, informa la racha.
                    message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)! Racha: ${currentUserData.associatePerfectStreak}/3.`;
                } else {
                    // Si ya tenía Professional, solo indica buena ronda.
                    message = `¡Buena ronda en Associate (+${config.MIN_SCORE_PERCENT_FOR_STREAK}%)!`;
                }
             } else {
                  // Si no se alcanzó el umbral del 90%, resetea la racha de Associate.
                  if (currentUserData.associatePerfectStreak > 0) { message += " (Racha 90% reiniciada)"; }
                 currentUserData.associatePerfectStreak = 0;
             }
        }
        // TODO: Añadir 'else if (currentLevel === 'Professional')' para futuras lógicas (ej. mensajes especiales).
        // --- Fin Lógica Racha ---

        // Guarda los datos actualizados del usuario (niveles desbloqueados, rachas) en localStorage.
        storage.saveUserData(currentUsername, currentUserData);
        // Guarda la puntuación obtenida en esta ronda, asociada al usuario, nivel y modo.
        storage.saveHighScore(currentUsername, currentScore, currentLevel, currentGameMode);
        // Carga la lista actualizada de mejores puntuaciones.
        const highScores = storage.loadHighScores();
        // Muestra la lista actualizada en la UI.
        ui.displayHighScores(highScores);

        // Muestra la pantalla de Game Over con la puntuación y el mensaje final.
        ui.displayGameOver(currentScore, message, currentUserData);
        // Limpia los datos de la última pregunta jugada.
        currentQuestionData = null;

    } catch (error) {
        // Manejo de errores durante el proceso de fin de juego.
        console.error("Error en endGame:", error);
        // Podría mostrar un mensaje de error genérico en la pantalla de Game Over si falla.
        ui.displayGameOver(currentScore, "Error al guardar datos.", currentUserData);
    }
}

/**
 * Maneja el evento del botón 'Reiniciar Ronda Actual'.
 * Simplemente vuelve a llamar a startGame() para reiniciar la ronda con el mismo nivel/modo.
 * Exportada para main.js.
 */
export function handleRestartRound() {
    // Opcional: Añadir una confirmación al usuario antes de reiniciar.
    // if (!confirm("¿Seguro que quieres reiniciar esta ronda? Perderás el progreso actual.")) { return; }
    startGame();
}

/**
 * Maneja el evento del botón 'Salir al Menú de Niveles'.
 * Detiene el timer y llama a handlePlayAgain() que muestra la selección de nivel.
 * Exportada para main.js.
 */
export function handleExitToMenu() {
     // Opcional: Añadir confirmación.
     // if (!confirm("¿Seguro que quieres salir? Perderás el progreso de esta ronda.")) { return; }
     clearInterval(questionTimerInterval); // Detiene el timer si está activo.
     handlePlayAgain(); // Llama a la función que muestra el menú de niveles.
}

/**
 * Maneja el evento del botón 'Jugar de Nuevo / Elegir Nivel' en la pantalla Game Over.
 * Recarga los datos del usuario (por si hubo desbloqueos) y muestra la pantalla de selección de nivel.
 * Exportada para main.js.
 */
export function handlePlayAgain() {
    // Recarga los datos del usuario actual para asegurar que la lista de niveles esté actualizada.
    if (currentUsername) {
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Si por alguna razón no hay usuario (poco probable aquí), usa datos por defecto.
         currentUserData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
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
    // Carga las puntuaciones altas guardadas para mostrarlas desde el inicio.
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    // Muestra la primera pantalla que ve el usuario: el formulario para ingresar nombre.
    ui.showSection(ui.userSetupSection);
}
