// js/game.js
// ==================================================
// Lógica Principal del Juego IP Sprint
// Adaptado para Nivel Essential y UI Stepper+Tarjeta
// Incluye manejo async para preguntas Essential y logs de depuración.
// CORREGIDO: Exportar handleAnswerClick.
// CORREGIDO: Añadir listeners de botones de juego en startGame.
// CORREGIDO: Lógica de refresco durante feedback.
// CORREGIDO: Lógica de desbloqueo en endGame para evitar TypeError.
// CORREGIDO: Llamada a ui.displayGameOver en endGame para incluir nombre de usuario.
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
let currentUserData = {}; // Contendrá { unlockedLevels: [...], etc } SIN el nombre
let currentScore = 0;
let currentLevel = ''; // Nivel actual que se está JUGANDO
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
            // Intenta obtener la duración para el modo específico, si no, para 'standard', si no, null
            return levelConfig[currentGameMode] ?? levelConfig['standard'] ?? null;
        }
        // Si no hay config para el nivel, usa el default
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? null;
    } catch (error) {
        console.error("Error obteniendo duración del timer:", error); // Mantener error crítico
        return config.TIMER_DURATION_BY_LEVEL['default'] ?? 20; // Fallback a 20 segundos si todo falla
    }
}

// --- Funciones Principales del Flujo del Juego ---

/**
 * Maneja el login del usuario. Carga/Crea datos y muestra selección de nivel.
 * @param {string} username - Nombre de usuario ingresado.
 */
export function handleUserLogin(username) {
    currentUsername = username; // Guardar nombre de usuario globalmente
    console.log(`[Game] handleUserLogin para: ${username}`); // Log
    let userDataFromStorage; // Variable local para los datos cargados
    try {
        const allUserData = storage.getAllUserData();
        // Definir datos por defecto con Essential siempre desbloqueado
        const defaultData = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };

        if (allUserData[username]) {
            // Usar los datos existentes, asegurando que los defaults estén presentes si faltan
            userDataFromStorage = { ...defaultData, ...allUserData[username] };

            // Asegurar que unlockedLevels sea un array y contenga Essential
            if (!userDataFromStorage.unlockedLevels || !Array.isArray(userDataFromStorage.unlockedLevels)) {
                 console.warn("[Game] currentUserData.unlockedLevels inválido en datos guardados, reiniciando a ['Essential']");
                 userDataFromStorage.unlockedLevels = ['Essential'];
            } else if (!userDataFromStorage.unlockedLevels.includes('Essential')) {
                 console.log(`[Game] Usuario existente sin Essential. Añadiendo Essential a unlockedLevels.`);
                 // Añadir Essential si falta, preferiblemente al principio
                 if (!userDataFromStorage.unlockedLevels.includes('Essential')) {
                     userDataFromStorage.unlockedLevels.unshift('Essential');
                 }
            }
        } else {
            console.log(`[Game] Usuario nuevo. Usando datos por defecto.`);
            userDataFromStorage = defaultData; // Usar los defaults definidos arriba
        }

        console.log(`[Game] Niveles desbloqueados ANTES de guardar:`, JSON.stringify(userDataFromStorage.unlockedLevels));

        // Guardar los datos (posiblemente actualizados o por defecto)
        storage.saveUserData(username, userDataFromStorage);

        // **Importante:** Asignar los datos cargados/actualizados a la variable global currentUserData
        currentUserData = userDataFromStorage;
        console.log(`[Game] Niveles desbloqueados cargados y asignados a currentUserData:`, JSON.stringify(currentUserData.unlockedLevels));


        ui.updatePlayerInfo(currentUsername, '', ''); // Limpiar info de nivel/puntos en UI

        // Pasar los niveles desbloqueados, datos, nombre y handler a la UI
        // La función displayLevelSelection SÍ espera el objeto de datos SIN el nombre.
        ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, currentUsername, selectLevelAndMode);

        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

    } catch (error) {
        console.error("Error durante handleUserLogin:", error);
        alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
        ui.showSection(ui.userSetupSection); // Volver al login en caso de error
    }
}

/**
 * Callback llamado desde la UI al seleccionar un nivel. Inicia el juego.
 * @param {string} level - Nivel seleccionado.
 * @param {string} [mode='standard'] - Modo seleccionado.
 */
export function selectLevelAndMode(level, mode = 'standard') {
    console.log(`[Game] Nivel seleccionado vía Handler: ${level}, Modo: ${mode}`);
    // Validar que el nivel seleccionado exista en la configuración
    if (!config.LEVELS.includes(level)) {
        console.error(`[Game] Intento de iniciar nivel inválido: ${level}`);
        alert(`Error: El nivel "${level}" no es válido.`);
        // Podríamos volver a la pantalla de selección o mostrar un error más persistente
        handlePlayAgain(); // Volver a la selección de nivel
        return;
    }
    currentLevel = level; // Establecer el nivel que se va a jugar
    currentGameMode = mode;
    startGame();
}

/**
 * Inicia una nueva ronda del juego. Resetea estado, añade listeners y carga la primera pregunta.
 */
export function startGame() {
    console.log(`[Game] Iniciando juego - Nivel: ${currentLevel}, Modo: ${currentGameMode}`);
    clearInterval(questionTimerInterval);
    currentScore = 0;
    questionsAnswered = 0;
    roundResults = [];
    timeLeft = 0;
    isFeedbackActive = false;
    lastAnswerCorrect = null;
    // Determinar si se usa estilo Mastery basado en config (Entry nivel y mastery modo)
    lastMasteryMode = (currentLevel === 'Entry' && currentGameMode === 'mastery');
    lastSelectedOriginalValue = null;
    currentQuestionData = null;
    originalQuestionData = null;

    // Actualizar la UI con la info del jugador para esta ronda
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.showSection(ui.gameAreaSection); // Mostrar área de juego ANTES de buscar botones
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);

    // Inicializar y posiblemente ocultar timer
    const initialDuration = getTimerDurationForCurrentLevel();
    if (initialDuration !== null && initialDuration > 0) {
        ui.showTimerDisplay(true);
        timeLeft = initialDuration; // Establecer tiempo inicial
        ui.updateTimerDisplay(timeLeft); // Mostrar tiempo inicial
        // Buscar el div del timer aquí para asegurar que existe antes de manipular clases
        const timerDiv = document.getElementById('timer-display');
        if (timerDiv) timerDiv.classList.remove('low-time');
    } else {
        ui.showTimerDisplay(false); // Ocultar si no hay timer para este nivel/modo
    }


    // --- Añadir listeners a botones de control de juego ---
    const restartBtn = document.getElementById('restart-round-button');
    const exitBtn = document.getElementById('exit-to-menu-button');

    // Limpiar listeners anteriores clonando el botón
    if (restartBtn) {
        const newRestartBtn = restartBtn.cloneNode(true);
        if(restartBtn.parentNode) restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
        newRestartBtn.addEventListener('click', handleRestartRound);
        console.log("[Game] Listener añadido a #restart-round-button.");
    } else {
         console.error("[Game] #restart-round-button no encontrado en startGame.");
    }

    if (exitBtn) {
        const newExitBtn = exitBtn.cloneNode(true);
        if(exitBtn.parentNode) exitBtn.parentNode.replaceChild(newExitBtn, exitBtn);
        newExitBtn.addEventListener('click', handleExitToMenu);
        console.log("[Game] Listener añadido a #exit-to-menu-button.");
    } else {
         console.error("[Game] #exit-to-menu-button no encontrado en startGame.");
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
    currentQuestionData = null; // Limpiar datos de pregunta anterior

    // Limpiar UI de pregunta/feedback anterior
    const feedbackArea = document.getElementById('feedback-area');
    const optionsContainer = document.getElementById('options-container');
    const questionText = document.getElementById('question-text');

    if (feedbackArea) { feedbackArea.innerHTML = ''; feedbackArea.className = ''; }
    if (optionsContainer) optionsContainer.classList.remove('options-disabled');
    if (questionText) questionText.innerHTML = getTranslation('loading_question'); // Mostrar "Cargando..."

    // Detener y resetear timer si existía
    clearInterval(questionTimerInterval);
    const duration = getTimerDurationForCurrentLevel();
    if (duration !== null && duration > 0) {
        ui.showTimerDisplay(true);
        timeLeft = duration;
        ui.updateTimerDisplay(timeLeft);
        const timerDiv = document.getElementById('timer-display');
        if (timerDiv) timerDiv.classList.remove('low-time');
        questionTimerInterval = setInterval(updateTimer, 1000); // Iniciar timer para la nueva pregunta
    } else {
        ui.showTimerDisplay(false); // Asegurarse que esté oculto si no aplica
    }

    try {
        console.log(`[Game] Obteniendo pregunta para nivel: ${currentLevel}`);
        // Esperar a que getNextQuestion (que puede ser async) resuelva
        const formattedQuestionData = await getNextQuestion(currentLevel);

        if (formattedQuestionData)
        {
            currentQuestionData = formattedQuestionData; // Guardar datos formateados para uso en respuesta/feedback
            // Guardar datos originales si existen (principalmente para Essential y refresco de idioma)
            if (currentQuestionData.rawData) {
                originalQuestionData = currentQuestionData.rawData;
                console.log("[Game] Datos originales guardados:", originalQuestionData);
            } else {
                 originalQuestionData = null;
            }

            // Mostrar pregunta usando los datos formateados
            ui.displayQuestion(currentQuestionData, handleAnswerClick); // Pasar el handler para respuestas

        } else {
            console.error("[Game] No se pudo obtener la siguiente pregunta (getNextQuestion devolvió null).");
            throw new Error(getTranslation('error_loading_question_msg', { message: 'No question available' }) || 'Error loading question.');
        }
    } catch (error) {
        console.error("[Game] Error en loadNextQuestion:", error);
        clearInterval(questionTimerInterval); // Detener timer si falla la carga
        if (questionText) questionText.innerHTML = error.message || getTranslation('error_loading_question_msg', { message: 'Unknown error' });
        if (optionsContainer) optionsContainer.innerHTML = '';
        // Considerar ir a endGame o mostrar un mensaje más persistente
        setTimeout(endGame, 2500); // Ir a game over después de un delay
    }
 }

/**
 * Actualiza el temporizador y maneja el tiempo agotado.
 */
 function updateTimer() {
    timeLeft--;
    ui.updateTimerDisplay(timeLeft); // Actualizar la UI del temporizador

    const timerDiv = document.getElementById('timer-display'); // Buscar elemento aquí

    if (timeLeft <= 0) {
        console.log("[Game] Tiempo agotado!");
        clearInterval(questionTimerInterval);

        const optionsContainer = document.getElementById('options-container');
        if (optionsContainer) optionsContainer.classList.add('options-disabled');

        // Marcar como incorrecto si se agota el tiempo
        roundResults.push(false);
        const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');
        ui.updateRoundProgressUI(roundResults, isMasteryStyle);

        isFeedbackActive = true;
        lastAnswerCorrect = false;
        lastMasteryMode = isMasteryStyle;
        lastSelectedOriginalValue = null; // No hubo selección

        // Preparar datos para feedback, asegurando que correctAnswerDisplay exista
        // Usar una copia para no modificar currentQuestionData directamente aquí
        const timeoutFeedbackData = currentQuestionData ? { ...currentQuestionData } : null;
        if (timeoutFeedbackData) {
             timeoutFeedbackData.questionsAnswered = questionsAnswered;
             timeoutFeedbackData.totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
             if (!timeoutFeedbackData.correctAnswerDisplay && timeoutFeedbackData.correctAnswer) {
                  const ca = timeoutFeedbackData.correctAnswer;
                  // Mejor manejo para objetos de respuesta correcta
                  if (typeof ca === 'object' && ca !== null) {
                       timeoutFeedbackData.correctAnswerDisplay = `${getTranslation(ca.classKey || '')} / ${getTranslation(ca.typeKey || ca.portionKey || '')} ${ca.maskValue || ca.portionValue || ''}`.trim();
                  } else {
                       const translated = getTranslation(ca); // Intentar traducir si es una clave
                       timeoutFeedbackData.correctAnswerDisplay = (translated && translated !== ca) ? translated : ca; // Usar traducción o el valor mismo
                  }
             }
        }


        // Mostrar feedback de Timeout
        // Pasar null como último argumento (no hubo selección incorrecta) y isRefresh=false
        ui.displayFeedback(false, isMasteryStyle, timeoutFeedbackData || {}, proceedToNextStep, null, false);

        // Modificar texto para indicar Timeout explícitamente
        const feedbackArea = document.getElementById('feedback-area');
        if (feedbackArea && timeoutFeedbackData) {
            const feedbackContent = feedbackArea.querySelector('#feedback-text-content span:first-child');
            const correctAnswerText = timeoutFeedbackData.correctAnswerDisplay || 'N/A';
            const timeoutMsg = getTranslation('feedback_timeout', { correctAnswer: `<strong>${correctAnswerText}</strong>` });
            if (feedbackContent) {
                feedbackContent.innerHTML = timeoutMsg; // Reemplazar texto de feedback por el de timeout
            } else {
                // Si no se encontró el span (poco probable), añadirlo al principio
                const timeoutSpan = document.createElement('span');
                timeoutSpan.innerHTML = timeoutMsg;
                feedbackArea.prepend(timeoutSpan);
            }
            feedbackArea.className = 'incorrect'; // Asegurar estilo de incorrecto
        } else if (!timeoutFeedbackData) {
             console.error("[Game] No hay currentQuestionData al agotarse el tiempo.");
        }
    } else {
         // Actualizar clase 'low-time' si el tiempo es bajo pero > 0
         if(timerDiv) timerDiv.classList.toggle('low-time', timeLeft <= 5);
    }
}

/**
 * Procede al siguiente paso (pregunta o fin de juego).
 */
 function proceedToNextStep() {
    console.log("[Game] Proceeding to next step...");
    clearInterval(questionTimerInterval); // Asegurar que el timer anterior se detenga
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
    console.log("[Game] handleAnswerClick iniciado");
    clearInterval(questionTimerInterval); // Detener timer al responder
    if (!currentQuestionData || currentQuestionData.correctAnswer === undefined) {
        console.error("[Game] handleAnswerClick llamado sin datos de pregunta válidos (currentQuestionData).");
        return; // Salir si no hay datos
    }

    const selectedButton = event.target;
    // Obtener el valor original (clave i18n para V/F, texto para MC, string JSON u otro identificador para objetos)
    const selectedOriginalValue = selectedButton.getAttribute('data-original-value');
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) optionsContainer.classList.add('options-disabled'); // Deshabilitar opciones

    // --- Comparación ---
    let isCorrect = false;
    // Comparar el valor original del botón clickeado con el valor correcto almacenado
    if (typeof currentQuestionData.correctAnswer === 'object' && currentQuestionData.correctAnswer !== null) {
        // Si la respuesta correcta es un objeto complejo, necesitamos una forma robusta de comparar.
        // Idealmente, 'selectedOriginalValue' debería ser un identificador único o un string JSON
        // que se pueda comparar con el objeto 'correctAnswer'.
        // EJEMPLO: Si 'selectedOriginalValue' es un string JSON:
        try {
            // Parsear el valor del botón y comparar propiedades clave o el objeto entero
            // const selectedObject = JSON.parse(selectedOriginalValue);
            // isCorrect = (selectedObject.classKey === currentQuestionData.correctAnswer.classKey &&
            //              selectedObject.portionValue === currentQuestionData.correctAnswer.portionValue);
            // Por simplicidad ahora, asumimos que la comparación directa de strings podría funcionar
            // para casos donde el objeto se representa consistentemente como string.
            // O si guardamos una clave única: isCorrect = (selectedOriginalValue === currentQuestionData.correctAnswer.id);
            // Vamos a mantener la comparación simple por ahora, REVISAR SI DA PROBLEMAS con objetos
             console.warn("[Game] Comparando respuesta correcta como objeto. La comparación directa puede fallar.");
             isCorrect = (selectedOriginalValue === JSON.stringify(currentQuestionData.correctAnswer)); // Comparación simple, propensa a errores
        } catch (e) {
             console.error("Error comparando respuesta objeto:", e);
             isCorrect = false;
        }
    } else {
        // Comparación normal para strings (claves V/F, texto MC, valores directos)
        isCorrect = (selectedOriginalValue === currentQuestionData.correctAnswer);
    }
    // --- Fin Comparación ---


    roundResults.push(isCorrect);
    const isMasteryStyle = (currentLevel === 'Entry' && currentGameMode === 'mastery');

    // Actualizar estado para posible refresco de UI
    isFeedbackActive = true;
    lastAnswerCorrect = isCorrect;
    lastMasteryMode = isMasteryStyle;
    lastSelectedOriginalValue = isCorrect ? null : selectedOriginalValue; // Guardar selección sólo si fue incorrecta

    console.log(`[Game] Respuesta: ${isCorrect ? 'Correcta' : 'Incorrecta'}. Seleccionado (value): ${selectedOriginalValue}, Correcto (value):`, currentQuestionData.correctAnswer);

    // Preparar datos para feedback (incluye info de progreso)
    const feedbackData = { ...currentQuestionData, questionsAnswered: questionsAnswered, totalQuestions: config.TOTAL_QUESTIONS_PER_GAME };
    // Asegurar correctAnswerDisplay existe para mostrar en feedback si es incorrecto
    if (!feedbackData.correctAnswerDisplay && feedbackData.correctAnswer) {
         if (typeof feedbackData.correctAnswer === 'object' && feedbackData.correctAnswer !== null) {
              // Crear un display string para respuestas correctas complejas (ej. Clase+Tipo)
              // Usar las claves almacenadas en el objeto correcto para buscar traducciones
              const classText = getTranslation(feedbackData.correctAnswer.classKey || '');
              const typeText = getTranslation(feedbackData.correctAnswer.typeKey || feedbackData.correctAnswer.portionKey || '');
              const valueText = feedbackData.correctAnswer.maskValue || feedbackData.correctAnswer.portionValue || '';
              feedbackData.correctAnswerDisplay = `${classText} / ${typeText} ${valueText}`.replace(' /  ', '').trim(); // Construir y limpiar
         } else {
              const ca = feedbackData.correctAnswer;
              const translated = getTranslation(ca); // Intentar traducir clave V/F
              feedbackData.correctAnswerDisplay = (translated && translated !== ca) ? translated : ca; // Usar traducción o texto original
         }
    }


    if (isCorrect) {
        currentScore += config.POINTS_PER_QUESTION;
        ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
        // Mostrar feedback positivo (null como valor seleccionado)
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep, null, false);
        if (selectedButton) selectedButton.classList.add(isMasteryStyle ? 'mastery' : 'correct'); // Resaltar botón correcto
        // Proceder automáticamente después de un delay
        setTimeout(proceedToNextStep, 1200);
    } else {
        // Mostrar feedback negativo, pasando el valor original incorrecto seleccionado
        ui.displayFeedback(isCorrect, isMasteryStyle, feedbackData, proceedToNextStep, lastSelectedOriginalValue, false);
        // ui.displayFeedback ya se encarga de resaltar el botón incorrecto y el correcto.
    }
    // Actualizar estrellas de progreso de la ronda
    ui.updateRoundProgressUI(roundResults, isMasteryStyle);
}


/**
 * Finaliza la ronda, actualiza datos y muestra pantalla Game Over.
 * CORREGIDO: Lógica de desbloqueo y llamada a ui.displayGameOver.
 */
 function endGame() {
    // **Log para verificar nivel al inicio de endGame**
    console.log(`[Game] Finalizando juego. Nivel completado: ${currentLevel}, Score: ${currentScore}`);
    clearInterval(questionTimerInterval); // Detener cualquier timer activo
    isFeedbackActive = false; // Marcar que ya no estamos en feedback
    // Resetear estados relevantes para el feedback/refresco
    lastAnswerCorrect = null;
    lastMasteryMode = false;
    lastSelectedOriginalValue = null;
    originalQuestionData = null; // Limpiar datos de pregunta original
    currentQuestionData = null; // Limpiar datos de pregunta formateada

    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
    const isPerfect = currentScore === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    // Variable local para los datos del usuario en esta función
    let finalUserData;

    try {
        // Cargar datos frescos del usuario ANTES de modificarlos
        finalUserData = storage.getUserData(currentUsername); // Carga { unlockedLevels: [...], ... }

        // Asegurar que unlockedLevels es un array antes de cualquier operación
        if (!Array.isArray(finalUserData.unlockedLevels)) {
            console.error("[Game] CRITICAL: finalUserData.unlockedLevels NO es un array en endGame! Forzando a ['Essential']. Datos:", finalUserData);
            finalUserData.unlockedLevels = ['Essential']; // Reset de seguridad
        }

        console.log(`[Game] Datos cargados en endGame. Niveles desbloqueados actuales:`, JSON.stringify(finalUserData.unlockedLevels));

        // --- Lógica de Rachas y Desbloqueo (CORREGIDA Y VERIFICADA) ---
        let levelJustUnlocked = null; // Para posible mensaje futuro
        if (currentLevel === 'Essential') {
             if (!finalUserData.unlockedLevels.includes('Entry')) {
                 console.log("[Game] Desbloqueando Entry tras completar Essential!");
                 finalUserData.unlockedLevels.push('Entry');
                 levelJustUnlocked = 'Entry';
             }
             finalUserData.entryPerfectStreak = 0;
             finalUserData.associatePerfectStreak = 0;

        } else if (currentLevel === 'Entry') {
             if (isPerfect) {
                 finalUserData.entryPerfectStreak = (finalUserData.entryPerfectStreak || 0) + 1;
                 console.log(`[Game] Racha Entry Perfect: ${finalUserData.entryPerfectStreak}/3`);
                 if (finalUserData.entryPerfectStreak >= 3 && !finalUserData.unlockedLevels.includes('Associate')) {
                     console.log("[Game] Desbloqueando Associate!");
                     finalUserData.unlockedLevels.push('Associate');
                     levelJustUnlocked = 'Associate';
                 }
             } else { finalUserData.entryPerfectStreak = 0; }
             finalUserData.associatePerfectStreak = 0;

        } else if (currentLevel === 'Associate') {
              if (meetsAssociateThreshold) {
                 finalUserData.associatePerfectStreak = (finalUserData.associatePerfectStreak || 0) + 1;
                 console.log(`[Game] Racha Associate 90%+: ${finalUserData.associatePerfectStreak}/3`);
                 if (finalUserData.associatePerfectStreak >= 3 && !finalUserData.unlockedLevels.includes('Professional')) {
                     console.log("[Game] Desbloqueando Professional!");
                     finalUserData.unlockedLevels.push('Professional');
                     levelJustUnlocked = 'Professional';
                 }
              } else { finalUserData.associatePerfectStreak = 0; }
              finalUserData.entryPerfectStreak = 0;

        } else if (currentLevel === 'Professional') {
             // Lógica futura para desbloquear Expert
             finalUserData.entryPerfectStreak = 0;
             finalUserData.associatePerfectStreak = 0;
        }
        // ... lógica para otros niveles ...

        // Guardar TODOS los datos actualizados (niveles, rachas)
        console.log(`[Game] Guardando datos post-juego. Nuevos niveles desbloqueados:`, JSON.stringify(finalUserData.unlockedLevels));
        storage.saveUserData(currentUsername, finalUserData); // Guardar el objeto completo

        // Guardar la puntuación
        const modeToSave = currentGameMode === 'essential' ? 'standard' : currentGameMode;
        storage.saveHighScore(currentUsername, currentScore, currentLevel, modeToSave);

        // Actualizar y mostrar pantalla de Game Over
        const highScores = storage.loadHighScores();
        ui.displayHighScores(highScores);

        // **LA CORRECCIÓN:** Crear un objeto que SÍ incluya el nombre para pasarlo a displayGameOver
        const dataForGameOverDisplay = {
            ...finalUserData, // Copiar propiedades como unlockedLevels, streaks
            name: currentUsername // Añadir explícitamente el nombre
        };

        // Pasar el objeto dataForGameOverDisplay que ahora contiene '.name'
        ui.displayGameOver(currentScore, dataForGameOverDisplay, currentLevel, handlePlayAgain);

        // Limpiar currentUserData global ahora que terminó la ronda, se cargará de nuevo si es necesario
        currentUserData = {};


    } catch (error) {
        console.error("Error en endGame:", error);
        // Mostrar Game Over con datos potencialmente incompletos pero evitando crash
        // Crear fallback que incluya el nombre para que displayGameOver no falle
        const fallbackDataForDisplay = {
             name: currentUsername, // Incluir nombre en fallback
             unlockedLevels: finalUserData?.unlockedLevels || ['Essential'], // Usar niveles si existen, sino default
             error: true
        };
        ui.displayGameOver(currentScore, fallbackDataForDisplay, currentLevel, handlePlayAgain);
    }
}

/**
 * Reinicia la ronda actual.
 */
export function handleRestartRound() {
    console.log("[Game] Reiniciando ronda...");
    // Simplemente llama a startGame que ya resetea todo para el nivel/modo actual
    startGame();
}

/**
 * Sale al menú de selección de nivel.
 */
export function handleExitToMenu() {
     console.log("[Game] Saliendo al menú...");
     clearInterval(questionTimerInterval); // Detener timer
     // Resetear estados relacionados con la ronda activa
     isFeedbackActive = false;
     lastAnswerCorrect = null;
     lastMasteryMode = false;
     lastSelectedOriginalValue = null;
     originalQuestionData = null;
     currentQuestionData = null;
     currentLevel = ''; // Limpiar nivel actual ya que volvemos a selección
     currentGameMode = 'standard'; // Resetear modo
     // Llamar a handlePlayAgain para volver a la pantalla de selección
     handlePlayAgain();
}

/**
 * Vuelve a la pantalla de selección de nivel.
 */
export function handlePlayAgain() {
    console.log("[Game] handlePlayAgain ejecutado (Volver a Selección de Nivel).");
    let userDataForDisplay; // Variable local para datos
    if (currentUsername) {
         userDataForDisplay = storage.getUserData(currentUsername); // Recargar datos frescos
    } else {
         // Si no hay usuario, volver a login
         console.warn("handlePlayAgain llamado sin currentUsername. Volviendo a Login.");
         initializeGame();
         return;
    }
    // Asegurar que los datos cargados son válidos (contienen unlockedLevels como array)
    if (!userDataForDisplay || !Array.isArray(userDataForDisplay.unlockedLevels)) {
         console.error("Datos de usuario inválidos cargados en handlePlayAgain. Reiniciando a defaults.");
         userDataForDisplay = { unlockedLevels: ['Essential'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
         storage.saveUserData(currentUsername, userDataForDisplay); // Guardar datos corregidos
    }

    // **Asignar a la variable global también por si se necesita en otros lados**
    currentUserData = userDataForDisplay;

    // Pasar handler 'selectLevelAndMode' a la UI para que los botones funcionen
    console.log(`[Game] Pasando a displayLevelSelection desde PlayAgain. Handler: ${typeof selectLevelAndMode}`);
    // displayLevelSelection espera el objeto de datos SIN el nombre, y el nombre aparte
    ui.displayLevelSelection(userDataForDisplay.unlockedLevels, userDataForDisplay, currentUsername, selectLevelAndMode);

    // Asegurarse que la lista de high scores está visible y actualizada
    const highScores = storage.loadHighScores();
    ui.displayHighScores(highScores);
    // Buscar la sección de high scores y asegurarse que esté visible
    const highScoresSect = document.getElementById('high-scores-section');
    if(highScoresSect) highScoresSect.style.display = 'block';
}

/**
 * Inicializa el juego al cargar la página.
 */
export function initializeGame() {
    console.log("[Game] Inicializando juego...");
    // Mostrar High Scores iniciales (si la sección existe)
    const highScoresSection = document.getElementById('high-scores-section');
    const scoreList = document.getElementById('score-list');
    if (highScoresSection && scoreList) {
         try {
             const initialHighScores = storage.loadHighScores();
             ui.displayHighScores(initialHighScores);
         } catch (e) {
             console.error("Error inicializando High Scores:", e);
             scoreList.innerHTML = `<li>Error loading scores</li>`;
         }
    }
    // Empezar mostrando la pantalla de login
    ui.showSection(ui.userSetupSection);
}

/**
 * Refresca la UI activa si el idioma cambia.
 * (Se mantiene la lógica anterior, asume que los datos actuales son suficientes
 * para reformatear/redibujar la pregunta o feedback).
 */
export function refreshActiveGameUI() {
    if (!currentUsername) {
        console.log("[Game] refreshActiveGameUI: No hay usuario logueado.");
        return;
    }
    const newLang = getCurrentLanguage();
    console.log(`[Game] Refrescando UI activa para idioma: ${newLang}`);

    // --- Refresco Básico (Info jugador, progreso ronda, timer) ---
    ui.updatePlayerInfo(currentUsername, currentLevel, currentScore);
    ui.updateRoundProgressUI(roundResults, lastMasteryMode);
    if (questionTimerInterval && timeLeft > 0) { // Solo si el timer estaba activo
        ui.showTimerDisplay(true);
        ui.updateTimerDisplay(timeLeft);
        const timerDiv = document.getElementById('timer-display');
        if (timerDiv) timerDiv.classList.toggle('low-time', timeLeft <= 5);
    } else {
        ui.showTimerDisplay(false); // Ocultar si no estaba activo o es 0
    }

    // --- Refresco de Contenido Específico (Pregunta/Feedback) ---
    let dataForRefresh = null;

    // Obtener/Reformatear Datos para el Nuevo Idioma
    if (currentLevel === 'Essential' && originalQuestionData) {
        // Si es Essential y tenemos datos originales, los reformateamos
        console.log(`[Game] Reformateando datos Essential para refresco (Lang: ${newLang})`);
        dataForRefresh = formatEssentialQuestionForUI(originalQuestionData, newLang);
        if (dataForRefresh) dataForRefresh.rawData = originalQuestionData; // Re-adjuntar datos crudos
    } else if (currentQuestionData) {
        // Para otros niveles, intentamos usar los datos actuales
        // Esto puede no traducir texto hardcodeado en generadores no-Essential
        dataForRefresh = currentQuestionData;
        // console.warn(`[Game] Refrescando UI no-Essential (${currentLevel}). Puede que el texto no se traduzca si no usa claves i18n.`);
    } else {
        // Si no hay currentQuestionData (p.ej., justo al inicio de la ronda antes de cargar), no hacer nada más
        console.log("[Game] refreshActiveGameUI: No hay datos de pregunta actual para refrescar.");
        return;
    }


    // Actualizar la UI correcta (Feedback o Pregunta) si tenemos datos
    if (dataForRefresh) {
        if (isFeedbackActive && lastAnswerCorrect !== null) {
            // Si estábamos en feedback...
             console.log("[Game] Llamando a ui.displayFeedback con isRefresh=true");
             // Añadir info necesaria para feedback
             dataForRefresh.questionsAnswered = questionsAnswered;
             dataForRefresh.totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
             // Asegurar correctAnswerDisplay para el feedback incorrecto
             if (!dataForRefresh.correctAnswerDisplay && dataForRefresh.correctAnswer) {
                 if (typeof dataForRefresh.correctAnswer === 'object' && dataForRefresh.correctAnswer !== null) {
                      // Crear display para objetos
                      const classText = getTranslation(dataForRefresh.correctAnswer.classKey || '');
                      const typeText = getTranslation(dataForRefresh.correctAnswer.typeKey || dataForRefresh.correctAnswer.portionKey || '');
                      const valueText = dataForRefresh.correctAnswer.maskValue || dataForRefresh.correctAnswer.portionValue || '';
                      dataForRefresh.correctAnswerDisplay = `${classText} / ${typeText} ${valueText}`.replace(' /  ', '').trim();
                 } else {
                      const ca = dataForRefresh.correctAnswer;
                      const translated = getTranslation(ca);
                      dataForRefresh.correctAnswerDisplay = (translated && translated !== ca) ? translated : ca;
                 }
             }
             // Llamar a ui.displayFeedback con isRefresh=true
             ui.displayFeedback(lastAnswerCorrect, lastMasteryMode, dataForRefresh, proceedToNextStep, lastSelectedOriginalValue, true);

        } else { // Si no estábamos en feedback, redibujar la pregunta
             console.log("[Game] Llamando a ui.displayQuestion para refresco");
             // Llamar a ui.displayQuestion con los datos reformateados/actuales
             ui.displayQuestion(dataForRefresh, handleAnswerClick); // Pasar handler correcto
             const optionsContainer = document.getElementById('options-container');
             if (optionsContainer) optionsContainer.classList.remove('options-disabled'); // Asegurar que opciones estén habilitadas
        }
    } else {
         console.error("[Game] No se pudieron obtener/formatear datos para refrescar contenido.");
    }
    // NOTA: Refresco de LevelSelect/GameOver se maneja en main.js
}

// --- Funciones para obtener estado actual (usadas externamente) ---
export function getCurrentUsername() { return currentUsername; }
export function getCurrentLevel() { return currentLevel; }
