// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// CORREGIDO: Pasa 'currentUsername' explícitamente a ui.displayLevelSelection
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
let isFeedbackActive = false;       // Indica si el feedback está activo en pantalla
let lastAnswerCorrect = null;       // Guarda si la última respuesta fue correcta
let lastMasteryMode = false;        // Guarda si se usó el modo Mastery (para estilo)
let lastSelectedOriginalValue = null; // Guarda el valor de la opción incorrecta seleccionada

// --- Funciones Auxiliares ---

/**
 * Obtiene la duración del temporizador para el nivel y modo actual desde config.js.
 * @returns {number|null} Duración en segundos o null si no hay timer.
 */
function getTimerDurationForCurrentLevel() {
    try {
        // Busca la configuración del nivel actual
        const levelConfig = config.TIMER_DURATION_BY_LEVEL[currentLevel];
        if (levelConfig) {
            // Devuelve la duración para el modo actual, o 'standard' si no existe, o null
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        // Si no hay config para el nivel, usa el default global
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error);
        // Fallback general si todo falla
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 20;
    }
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login del usuario. Carga sus datos y muestra la pantalla de selección de nivel.
 * Llamada desde main.js al enviar el formulario de usuario.
 * @param {string} username - Nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username; // Guardar el nombre de usuario globalmente
    try {
        // Obtiene datos existentes o crea datos por defecto
        const allUserData = storage.getAllUserData();
        // El nivel base desbloqueado por defecto ahora es 'Essential'
        const defaultData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };

        if (allUserData[username]) {
            // Si el usuario existe, mezcla sus datos con los default para asegurar nuevos campos
            currentUserData = { ...defaultData, ...allUserData[username] };
            // Asegura que 'Essential' esté presente, por si eran datos antiguos
            if (!currentUserData.unlockedLevels.includes('Essential')) {
                currentUserData.unlockedLevels.unshift('Essential'); // Añadir al principio
            }
        } else {
            // Si es un usuario nuevo, usa los datos por defecto
            currentUserData = defaultData;
        }

        // Guarda los datos (actualizados o nuevos) en localStorage
        storage.saveUserData(username, currentUserData);
        // Limpia la info de nivel/puntos en la UI del juego (si estaba visible)
        ui.updatePlayerInfo(currentUsername, '', '');

        // Llama a la función de UI para mostrar el stepper y la tarjeta de nivel
        // --- CORREGIDO: Pasar currentUsername explícitamente ---
        // Pasamos currentUserData (para rachas, etc.) Y currentUsername
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);

        // Carga y muestra las puntuaciones altas globales
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        // Muestra un mensaje de error al usuario
        alert(getTranslation('error_loading_user_data', { message: error.message }));
        // Vuelve a mostrar la pantalla de login si hubo un error grave
        ui.showSection(ui.userSetupSection);
    }
}

/**
 * Se llama cuando se selecciona un nivel desde la UI (clic en el Stepper).
 * Establece el nivel y modo actual, y comienza el juego.
 * @param {string} level - Nivel seleccionado ('Essential', 'Entry', etc.).
 * @param {string} [mode='standard'] - Modo seleccionado (actualmente siempre 'standard').
 */
export function selectLevelAndMode(level, mode = 'standard') {
    console.log(`Nivel seleccionado: ${level}, Modo: ${mode}`); // Log para depuración
    currentLevel = level;
    currentGameMode = mode; // Guardar el modo aunque ahora sea fijo 'standard'
    startGame(); // Iniciar la partida
}

/**
 * Inicia una nueva ronda del juego para el nivel y modo seleccionados.
 * Resetea el estado de la ronda y carga la primera pregunta.
 */
export function startGame() {
    // Reiniciar variables de estado de la ronda
    clearInterval(questionTimerInterval); // Limpiar cualquier temporizador anterior
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    lastMasteryMode = (currentLevel === 'Entry' && currentGameMode === 'mastery'); // Determinar si es modo Mastery
    lastSelectedOriginalValue = null;

    // Actualizar UI para el inicio de la ronda
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Mostrar Nivel y Puntos 0
    ui.showSection(ui.gameAreaSection); // Mostrar el área principal del juego
    ui.updateRoundProgressUI(roundResults, lastMasteryMode); // Mostrar estrellas de progreso (vacías)
    ui.showTimerDisplay(false); // Ocultar el temporizador inicialmente
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time'); // Quitar estilo de tiempo bajo

    // Cargar la primera pregunta de la ronda
    loadNextQuestion();
}

/**
 * Carga y muestra la siguiente pregunta de la ronda actual.
 * Si no hay más preguntas, finaliza el juego.
 */
function loadNextQuestion() {
    // Resetear estados relacionados con el feedback anterior
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    // lastMasteryMode ya se estableció en startGame o handleAnswerClick
    lastSelectedOriginalValue = null;

    // Limpiar elementos de la UI de la pregunta/feedback anterior
    if (ui.feedbackArea) { ui.feedbackArea.innerHTML = ''; ui.feedbackArea.className = ''; }
    if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled'); // Habilitar botones
    currentQuestionData = null; // Borrar datos de la pregunta anterior
    clearInterval(questionTimerInterval); // Limpiar temporizador
    ui.showTimerDisplay(false); // Ocultar timer
    if (ui.timerDisplayDiv) ui.timerDisplayDiv.classList.remove('low-time');

    try {
        // Obtener datos de la siguiente pregunta usando el módulo questions.js
        const questionDataResult = getNextQuestion(currentLevel);

        // Validar que los datos recibidos son correctos y completos
        if (questionDataResult &&
            questionDataResult.question && questionDataResult.question.key &&
            Array.isArray(questionDataResult.options) && questionDataResult.options.length > 0 &&
            questionDataResult.correctAnswer !== undefined &&
            questionDataResult.explanation !== undefined)
        {
            currentQuestionData = questionDataResult; // Almacenar datos de la pregunta actual

            // Configurar e iniciar el temporizador si corresponde al nivel/modo
            const duration = getTimerDurationForCurrentLevel();
            if (duration !== null && duration > 0) {
                ui.showTimerDisplay(true); // Mostrar el display del timer
                timeLeft = duration;       // Establecer tiempo inicial
                ui.updateTimerDisplay(timeLeft); // Mostrar tiempo inicial
                questionTimerInterval = setInterval(updateTimer, 1000); // Iniciar intervalo de 1 seg
            } else {
                ui.showTimerDisplay(false); // Ocultar si no hay timer
            }

            // Llamar a la función de UI para mostrar la pregunta y las opciones
            // Se pasa handleAnswerClick como la función callback para los botones de opción
            ui.displayQuestion(currentQuestionData, handleAnswerClick);

        } else {
            // Lanzar error si los datos de la pregunta son inválidos o no se encontraron
            console.error("Datos de pregunta inválidos recibidos:", questionDataResult);
            throw new Error(getTranslation('error_invalid_question_data') || 'Invalid question data received.');
        }
    } catch (error) {
        console.error("Error en loadNextQuestion:", error);
        // Mostrar mensaje de error en la UI
        if (ui.questionText) ui.questionText.innerHTML = getTranslation('error_loading_question_msg', { message: error.message });
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        // Finalizar el juego después de un breve momento si no se puede cargar la pregunta
        setTimeout(endGame, 2500);
    }
 }

/**
 * Función llamada cada segundo por el intervalo del temporizador.
 * Actualiza la UI del timer y maneja el evento de tiempo agotado.
 */
 function updateTimer() {
    timeLeft--; // Decrementar tiempo restante
    ui.updateTimerDisplay(timeLeft); // Actualizar visualización

    // Comprobar si el tiempo llegó a cero
    if (timeLeft <= 0) {
        clearInterval(questionTimerInterval); // Detener el intervalo
        if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled'); // Deshabilitar botones

        roundResults.push(false); // Registrar como respuesta incorrecta
        // Determinar si se aplica estilo Mastery
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle); // Actualizar estrellas de progreso

        // Preparar para mostrar feedback de tiempo agotado
        isFeedbackActive = true;
        lastAnswerCorrect = false;
        lastMasteryMode = isMasteryStyle;
        lastSelectedOriginalValue = null; // No hubo selección

        // Llamar a displayFeedback para mostrar la explicación y el botón "Siguiente"
        const timeoutFeedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData, proceedToNextStep);

        // Sobrescribir el texto inicial del feedback para indicar "Tiempo Agotado"
        if (ui.feedbackArea) {
            const feedbackContent = ui.feedbackArea.querySelector('#feedback-text-content span:first-child');
            let translatedCorrectAnswer = '';
            const ca = currentQuestionData?.correctAnswer;
            // Lógica para obtener la representación string de la respuesta correcta (igual que en displayFeedback)
             if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
             else if (typeof ca === 'object' && ca !== null) { let textParts = []; if (ca.classKey) textParts.push(getTranslation(ca.classKey)); if (ca.typeKey) textParts.push(getTranslation(ca.typeKey)); if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue })); if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); } if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); } else { translatedCorrectAnswer = JSON.stringify(ca); } }
             else { translatedCorrectAnswer = ca?.toString() ?? 'N/A'; }

            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
            if (feedbackContent) {
                feedbackContent.innerHTML = timeoutMsg; // Reemplazar texto
            } else { // Si el elemento no se encontró, añadirlo (fallback)
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = timeoutMsg;
                ui.feedbackArea.prepend(timeoutSpan);
            }
            ui.feedbackArea.className = 'incorrect'; // Asegurar estilo de incorrecto
        }
    }
}

/**
 * Procede al siguiente paso después de mostrar el feedback.
 * Carga la siguiente pregunta o finaliza el juego si se completó la ronda.
 * Llamada al hacer clic en "Siguiente" o automáticamente tras respuesta correcta.
 */
 function proceedToNextStep() {
    clearInterval(questionTimerInterval); // Detener timer (si aún corre)
    questionsAnswered++; // Incrementar contador de preguntas respondidas

    // Comprobar si se alcanzó el número total de preguntas por ronda
    if (questionsAnswered >= config.TOTAL_QUESTIONS_PER_GAME) {
        endGame(); // Finalizar la partida
    } else {
        loadNextQuestion(); // Cargar la siguiente pregunta
    }
}

/**
 * Maneja el evento de clic en un botón de opción de respuesta.
 * Evalúa la respuesta, actualiza puntuación, muestra feedback y decide el siguiente paso.
 * @param {Event} event - El evento de clic del botón.
 */
 export function handleAnswerClick(event) {
    clearInterval(questionTimerInterval); // Detener el temporizador inmediatamente
    // Validar que tenemos datos de la pregunta actual
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("handleAnswerClick llamado sin datos de pregunta válidos.");
        return;
    }

    const selectedButton = event.target;
    // Obtener el valor original guardado en el atributo data-* (clave i18n o valor directo)
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');
    // Deshabilitar todos los botones de opción
    if (ui.optionsContainer) ui.optionsContainer.classList.add('options-disabled');

    let isCorrect = false;
    const correctAnswerOriginal = currentQuestionData.correctAnswer;

    // --- Lógica para comparar respuesta seleccionada con la correcta ---
    // Convierte la respuesta correcta (sea string u objeto) a un string comparable
    let correctOriginalValueStr = '';
    if (typeof correctAnswerOriginal === 'string') {
        correctOriginalValueStr = correctAnswerOriginal;
    } else if (typeof correctAnswerOriginal === 'object' && correctAnswerOriginal !== null) {
        // Construir string a partir de las claves/valores del objeto respuesta
        let originalValueParts = [];
        if (correctAnswerOriginal.classKey) originalValueParts.push(correctAnswerOriginal.classKey);
        if (correctAnswerOriginal.typeKey) originalValueParts.push(correctAnswerOriginal.typeKey);
        if (correctAnswerOriginal.maskValue) originalValueParts.push(correctAnswerOriginal.maskValue);
        if (correctAnswerOriginal.portionKey) {
             originalValueParts.push(correctAnswerOriginal.portionKey);
             originalValueParts.push(correctAnswerOriginal.portionValue || 'None');
        }
        correctOriginalValueStr = originalValueParts.join(','); // Usar coma como separador
    } else {
         correctOriginalValueStr = correctAnswerOriginal?.toString() ?? 'N/A'; // Fallback para otros tipos
    }
    // Comparar el valor del botón con el string de la respuesta correcta
    isCorrect = (selectedOriginalValue === correctOriginalValueStr);
    // --- Fin Lógica Comparación ---

    roundResults.push(isCorrect); // Añadir resultado al array de la ronda
    // Determinar si se usa estilo Mastery
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    // Guardar estado para posible refresco de UI si cambia idioma durante feedback
    isFeedbackActive = true;
    lastAnswerCorrect = isCorrect;
    lastMasteryMode = isMasteryStyle;
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue;

    // Si la respuesta es correcta
    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION; // Aumentar puntuación
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore); // Actualizar UI
        // Mostrar feedback positivo (sin explicación detallada)
        ui.displayFeedback(isCorrect, isMasteryStyle, currentQuestionData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct'); // Resaltar botón
        // Pasar a la siguiente pregunta automáticamente después de un breve delay
        setTimeout(proceedToNextStep, 1200);
    }
    // Si la respuesta es incorrecta
    else {
        // Mostrar feedback negativo (con explicación detallada)
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep);
        if (selectedButton) selectedButton.classList.add('incorrect'); // Resaltar botón incorrecto
        // No se llama a proceedToNextStep aquí, se espera al clic en "Siguiente"
    }

    // Actualizar las estrellas de progreso de la ronda en la UI
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}

/**
 * Finaliza la ronda actual.
 * Calcula y guarda rachas, comprueba desbloqueos, guarda puntuación,
 * actualiza high scores y muestra la pantalla de Game Over.
 */
 function endGame() {
    clearInterval(questionTimerInterval); // Asegurarse de detener el timer
    // Resetear estados de refresco
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
        // Cargar datos frescos del usuario antes de modificar
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
        // Añadir lógica similar si Professional desbloquea Expert aquí

        // Guardar datos actualizados del usuario (niveles, rachas)
        storage.saveUserData(currentUsername, currentUserData);

        // Guardar la puntuación alta para este nivel (asumiendo modo 'standard')
        storage.saveHighScore(currentUsername, currentScore, currentLevel, 'standard');

        // Recargar y mostrar High Scores globales actualizados
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        // Mostrar pantalla de Game Over con los datos finales
        ui.displayGameOver(currentScore, currentUserData, currentLevel);

        currentQuestionData = null; // Limpiar datos de la última pregunta

    } catch (error) {
        console.error("Error en endGame:", error);
        // Intentar mostrar Game Over incluso con error, pasando datos disponibles
        ui.displayGameOver(currentScore, currentUserData || { error: true, unlockedLevels: ['Essential'] }, currentLevel);
    }
}

/**
 * Reinicia la ronda actual con el mismo nivel y modo.
 * Llamada desde el botón "Reiniciar Ronda".
 */
export function handleRestartRound() {
    // Llama a startGame, que usa las variables currentLevel y currentGameMode ya establecidas
    startGame();
}

/**
 * Sale de la ronda actual y vuelve al menú de selección de nivel.
 * Llamada desde el botón "Menú Niveles".
 */
export function handleExitToMenu() {
     clearInterval(questionTimerInterval); // Detener timer
     // Resetear estados de refresco para evitar problemas si se vuelve a entrar rápido
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null;
     // Llama a la función que muestra la pantalla de selección de nivel
     handlePlayAgain(); // Reutiliza la lógica de volver al menú
}

/**
 * Vuelve a la pantalla de selección de nivel.
 * Llamada desde el botón en Game Over o desde handleExitToMenu.
 */
export function handlePlayAgain() {
    if (currentUsername) {
         // Recargar datos frescos por si hubo desbloqueos
         currentUserData = storage.getUserData(currentUsername);
    } else {
         // Fallback si no hay usuario (no debería ocurrir en flujo normal)
         currentUserData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         console.warn("handlePlayAgain llamado sin currentUsername.");
         // Si no hay usuario, lo mejor es volver al inicio (login)
         initializeGame();
         return;
    }
    // Llama a la función de UI para mostrar el stepper/tarjeta actualizados
    // --- CORREGIDO: Pasar currentUsername explícitamente ---
    ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
}

/**
 * Inicializa el juego al cargar la página. Muestra la pantalla de login.
 * Llamada desde main.js.
 */
export function initializeGame() {
    // Carga y muestra high scores iniciales (si la sección está visible)
    if (ui.highScoresSection) {
         const initialHighScores = storage.loadHighScores();
         ui.displayHighScores(initialHighScores);
         // Podríamos decidir ocultarla inicialmente hasta que se muestre levelSelect o gameOver
         // ui.highScoresSection.style.display = 'none';
    }
    // Muestra la pantalla de login inicial
    ui.showSection(ui.userSetupSection);
}

/**
 * Refresca la UI del área de juego si el idioma cambia mientras se está jugando.
 * Reconstruye la pregunta o el feedback con las nuevas traducciones.
 * Llamada desde main.js.
 */
export function refreshActiveGameUI() {
    if (!currentUsername) { console.warn("Intentando refrescar UI sin usuario activo."); return; }

    // Refrescar info básica (nombre, nivel, puntos)
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    // Refrescar estrellas de progreso
    ui.updateRoundProgressUI(roundResults, lastMasteryMode); // Usa el estado guardado de mastery
    // Refrescar estado del timer
    if (questionTimerInterval) { // Si el timer estaba activo
        ui.showTimerDisplay(true);
        ui.updateTimerDisplay(timeLeft); // Mostrar tiempo restante actual
        // Reaplicar estilo de tiempo bajo si corresponde
        ui.timerDisplayDiv.classList.toggle('low-time', timeLeft <= 5);
    } else {
        ui.showTimerDisplay(false); // Ocultar si no estaba activo
    }

    // Si el feedback estaba activo cuando cambió el idioma...
    if (isFeedbackActive && lastAnswerCorrect !== null && currentQuestionData) {
        // ... volver a generar el feedback con los datos guardados y traducciones nuevas
        const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
        ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, feedbackData, proceedToNextStep);

        // Reaplicar resaltado de botones (correcto/incorrecto)
         try {
            const ca = currentQuestionData.correctAnswer;
            let correctOriginalValueStr = '';
            // ... (lógica para obtener correctOriginalValueStr - igual que en handleAnswerClick)
             if (typeof ca === 'string') { correctOriginalValueStr = ca; }
             else if (typeof ca === 'object' && ca !== null) { let parts = []; if (ca.classKey) parts.push(ca.classKey); if (ca.typeKey) parts.push(ca.typeKey); if (ca.maskValue) parts.push(ca.maskValue); if (ca.portionKey) { parts.push(ca.portionKey); parts.push(ca.portionValue || 'None'); } correctOriginalValueStr = parts.join(','); }
             else { correctOriginalValueStr = ca?.toString() ?? 'N/A'; }

            if (ui.optionsContainer) {
                 Array.from(ui.optionsContainer.children).forEach(button => {
                     const btnValue = button.getAttribute('data-original-value');
                     button.classList.remove('correct', 'incorrect', 'mastery'); // Limpiar
                     // Resaltar correcto
                     if (btnValue === correctOriginalValueStr) {
                         button.classList.add(lastMasteryMode ? 'mastery' : 'correct');
                     }
                     // Resaltar incorrecto seleccionado (si aplica)
                     if (!lastAnswerCorrect && btnValue === lastSelectedOriginalValue) {
                         button.classList.add('incorrect');
                     }
                 });
                 // Re-deshabilitar opciones ya que estamos en feedback
                 ui.optionsContainer.classList.add('options-disabled');
             }
         } catch(e){ console.error("Error resaltando botones al refrescar feedback", e); }

    }
    // Si se estaba mostrando una pregunta (no feedback)...
    else if (currentQuestionData) {
        // ... volver a mostrar la pregunta con traducciones nuevas
        ui.displayQuestion(currentQuestionData, handleAnswerClick);
        // Asegurarse que las opciones estén habilitadas
        if (ui.optionsContainer) ui.optionsContainer.classList.remove('options-disabled');
    }
    // --- CORREGIDO: Refrescar Level Select si estaba activo ---
    // (Esto maneja el caso de cambiar idioma en la pantalla de selección)
    else if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none') {
        console.log("Refrescando Level Selection UI por cambio de idioma...");
        currentUserData = storage.getUserData(currentUsername); // Recargar datos
        // Pasar username explícitamente
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);
    }
    // Si no hay ni pregunta ni feedback activo (estado inesperado)
    else {
        // Limpiar área de juego
        if (ui.questionText) ui.questionText.innerHTML = '';
        if (ui.optionsContainer) ui.optionsContainer.innerHTML = '';
        if (ui.feedbackArea) ui.feedbackArea.innerHTML = '';
        console.warn("Refrescando UI en estado inesperado (sin pregunta ni feedback activo).");
    }
}

// --- Funciones para obtener estado actual (usadas por main.js) ---
export function getCurrentUsername() { return currentUsername; }
export function getCurrentLevel() { return currentLevel; }
// No exportamos otras variables de estado internas para mantener encapsulamiento.

