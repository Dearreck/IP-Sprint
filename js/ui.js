// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// CORREGIDO: Selección de elementos DOM movida dentro de las funciones.
// Versión sin console.log de depuración
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import { handleAnswerClick } from './game.js'; // Handler para respuestas
import { getTranslation } from './i18n.js';
import * as storage from './storage.js'; // Para leer puntuaciones
import {
    // Generadores de Explicaciones
    generateClassRangeTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML, generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML, generateNumSubnetsExplanationHTML
} from './utils.js';

// --- Selección de Elementos del DOM (SOLO los necesarios globalmente o para exportar) ---
// Exportamos las secciones principales para que game.js/main.js puedan mostrarlas/ocultarlas
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
export const gameOverSection = document.getElementById('game-over');
export const highScoresSection = document.getElementById('high-scores-section');
// Exportamos elementos del formulario de login para main.js
export const usernameForm = document.getElementById('username-form');
export const usernameInput = document.getElementById('username');
// NO exportamos elementos internos de las secciones (se buscarán en las funciones)
// export const levelStepperContainer = document.getElementById('level-stepper-container'); // <--- Eliminado
// export const levelCardArea = document.getElementById('level-card-area');             // <--- Eliminado
// export const levelCardContent = document.getElementById('level-card-content');       // <--- Eliminado
// ... (Eliminar otras exportaciones de elementos internos si las hubiera)

// Mapa para generadores (sin cambios)
const explanationGenerators = { /* ... */ };

// Iconos (sin cambios)
const levelIcons = { /* ... */ };

// --- Funciones de Manipulación de la UI ---

/**
 * Muestra una sección específica del juego y oculta las demás relevantes.
 * @param {HTMLElement} sectionToShow - El elemento de la sección a mostrar.
 */
export function showSection(sectionToShow) {
    // Obtener referencias a las secciones aquí, dentro de la función
    const userSetup = document.getElementById('user-setup');
    const levelSelect = document.getElementById('level-select');
    const gameArea = document.getElementById('game-area');
    const gameOver = document.getElementById('game-over');
    const unlockProgress = document.getElementById('unlock-progress-section'); // Mantener referencia si se usa
    const highScores = document.getElementById('high-scores-section');

    const sections = [userSetup, levelSelect, gameArea, gameOver, unlockProgress, highScores];
    sections.forEach(section => { if (section) section.style.display = 'none'; });

    if (sectionToShow) sectionToShow.style.display = 'block';

    // Mostrar High Scores con Level Select y Game Over
    if (sectionToShow === levelSelect || sectionToShow === gameOver) {
        if (highScores) highScores.style.display = 'block';
    }
    // Asegurarse que unlockProgressSection (el viejo) esté oculto
    if (unlockProgress) unlockProgress.style.display = 'none';
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI del juego.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (clave no traducida).
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    // Buscar elementos dentro de la función
    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');

    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

// --- Lógica para Stepper y Tarjeta ---

/**
 * Genera y muestra el Stepper horizontal y prepara el área de la tarjeta.
 * @param {Array<string>} unlockedLevels - Niveles desbloqueados.
 * @param {object} currentUserData - Datos del usuario (para rachas, etc.).
 * @param {string} currentUsername - Nombre del usuario actual.
 * @param {function} levelSelectHandler - Función a llamar al seleccionar un nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, currentUsername, levelSelectHandler) {
    // --- Buscar elementos del DOM AQUI ---
    const levelStepperContainer = document.getElementById('level-stepper-container');
    const levelCardContent = document.getElementById('level-card-content');
    const currentLevelSelectSection = document.getElementById('level-select'); // Para mostrar error

    // Chequeo Detallado (usando las variables locales)
    let errorFound = false;
    if (!levelStepperContainer) { console.error("[UI] Error: levelStepperContainer no encontrado."); errorFound = true; }
    if (!levelCardContent) { console.error("[UI] Error: levelCardContent no encontrado."); errorFound = true; }
    if (!config.LEVELS || !Array.isArray(config.LEVELS)) { console.error("[UI] Error: config.LEVELS no es un array válido."); errorFound = true; }
    if (!currentUserData || typeof currentUserData !== 'object') { console.error("[UI] Error: currentUserData no es un objeto válido."); errorFound = true; }
    else if (!Array.isArray(currentUserData.unlockedLevels)) { console.error("[UI] Error: currentUserData.unlockedLevels NO es un array válido."); errorFound = true; }
    if (!currentUsername || typeof currentUsername !== 'string') { console.error("[UI] Error: currentUsername no es un string válido."); errorFound = true; }
    if (typeof levelSelectHandler !== 'function') { console.error("[UI] Error: levelSelectHandler NO es una función."); errorFound = true; }

    if (errorFound) {
        if (currentLevelSelectSection) { // Usar variable local
             currentLevelSelectSection.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
             showSection(currentLevelSelectSection); // Mostrar la sección con el error
        }
        return; // Detener ejecución si hay error
    }
    // --- Fin Chequeo ---


    levelStepperContainer.innerHTML = '';
    levelCardContent.innerHTML = `<p>${getTranslation('loading_levels') || 'Loading levels...'}</p>`;

    const allLevels = config.LEVELS;
    let lastUnlockedIndex = -1;
    let firstUnlockedLevelName = null;

    allLevels.forEach((level, index) => {
        const isUnlocked = unlockedLevels.includes(level);
        if (isUnlocked) {
            lastUnlockedIndex = index;
            if (firstUnlockedLevelName === null) firstUnlockedLevelName = level;
        }
        // ... (creación de stepperItem, iconWrapper, icon, label - sin cambios) ...
        const stepperItem = document.createElement('div'); /* ... */
        const iconWrapper = document.createElement('div'); /* ... */
        const icon = document.createElement('i'); /* ... */
        const label = document.createElement('span'); /* ... */

        stepperItem.addEventListener('click', () => {
            if (stepperItem.classList.contains('selected')) return;
            // Buscar el contenedor de nuevo si es necesario o confiar en closure
            const container = document.getElementById('level-stepper-container');
            if(container) container.querySelectorAll('.stepper-item.selected').forEach(el => el.classList.remove('selected'));
            stepperItem.classList.add('selected');
            // Llamar a updateLevelCard (que también buscará su elemento)
            updateLevelCard(level, isUnlocked, currentUsername, levelSelectHandler);
        });

        levelStepperContainer.appendChild(stepperItem);
    });

    updateStepperProgressLine(lastUnlockedIndex, allLevels.length); // Esta función también buscará el elemento

    const effectiveFirstLevel = firstUnlockedLevelName || allLevels[0];
    const firstStepperItem = levelStepperContainer.querySelector(`.stepper-item[data-level="${effectiveFirstLevel}"]`);

    if (firstStepperItem) {
        firstStepperItem.classList.add('selected');
        updateLevelCard(effectiveFirstLevel, unlockedLevels.includes(effectiveFirstLevel), currentUsername, levelSelectHandler);
    } else {
        levelCardContent.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
        console.error(`[UI] No se encontró el stepper item para el nivel por defecto: ${effectiveFirstLevel}`);
    }

    showSection(currentLevelSelectSection); // Mostrar la sección correcta
    // Ocultar sección de progreso antigua (buscarla aquí si es necesario)
    const unlockProgressSect = document.getElementById('unlock-progress-section');
    if (unlockProgressSect) unlockProgressSect.style.display = 'none';
}


/**
 * Actualiza el contenido de la tarjeta única con la información del nivel seleccionado.
 * @param {string} levelName - Nombre del nivel.
 * @param {boolean} isUnlocked - Si el nivel está desbloqueado.
 * @param {string} currentUsername - Nombre del usuario actual.
 * @param {function} levelSelectHandler - Función para iniciar el nivel.
 */
function updateLevelCard(levelName, isUnlocked, currentUsername, levelSelectHandler) {
    // --- Buscar elemento AQUI ---
    const levelCardContentElement = document.getElementById('level-card-content');
    if (!levelCardContentElement) {
         console.error("[UI] Elemento #level-card-content no encontrado en updateLevelCard.");
         return;
    }
    levelCardContentElement.innerHTML = ''; // Limpiar

    const title = document.createElement('h3');
    const titleKey = `level_${levelName.toLowerCase()}`;
    title.dataset.translate = titleKey;
    title.textContent = getTranslation(titleKey) || levelName;
    levelCardContentElement.appendChild(title);

    if (isUnlocked) {
        // ... (crear status, scoreDiv, startButton - sin cambios en la lógica interna) ...
        const status = document.createElement('div'); /* ... */
        const scoreDiv = document.createElement('div'); /* ... */
        const startButton = document.createElement('button'); /* ... */

        // Añadir listener al botón
        if (typeof levelSelectHandler === 'function') {
            startButton.addEventListener('click', () => {
                levelSelectHandler(levelName, 'standard');
            });
        } else {
            console.error(`[UI] ERROR: levelSelectHandler NO es una función en updateLevelCard para nivel ${levelName}.`);
            startButton.disabled = true;
            startButton.textContent += ' (Error Handler)';
        }
        levelCardContentElement.appendChild(startButton);

    } else { // Nivel Bloqueado
        // ... (crear status, requirement - sin cambios en la lógica interna) ...
        const status = document.createElement('div'); /* ... */
        const requirement = document.createElement('div'); /* ... */
    }
}

/**
 * Actualiza el ancho de la línea de progreso azul en el stepper.
 * @param {number} lastUnlockedIndex - Índice del último nivel desbloqueado.
 * @param {number} totalLevels - Número total de niveles.
 */
function updateStepperProgressLine(lastUnlockedIndex, totalLevels) {
    // --- Buscar elemento AQUI ---
    const stepperContainer = document.getElementById('level-stepper-container');
    if (!stepperContainer || totalLevels <= 1) return;
    const progressPercentage = lastUnlockedIndex >= 0
        ? (lastUnlockedIndex / (totalLevels - 1)) * 80 + 10
        : 10;
    stepperContainer.style.setProperty('--progress-width', `${progressPercentage}%`);
}


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (OBSOLETA).
 */
export function updateUnlockProgressUI(currentUserData) {
    // No hacer nada.
}

/**
 * Actualiza las estrellas de progreso DENTRO de la ronda actual.
 * @param {Array<boolean>} roundResults - Resultados de la ronda.
 * @param {boolean} isMasteryMode - Si es modo Mastery.
 */
export function updateRoundProgressUI(roundResults, isMasteryMode) {
    // --- Buscar elemento AQUI ---
    const roundProgressStarsDivElement = document.getElementById('round-progress-stars');
    try {
        if (!roundProgressStarsDivElement) return;
        let starsHTML = '';
        const totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
        for (let i = 0; i < totalQuestions; i++) {
            let starClass = 'far fa-star star-pending';
            if (i < roundResults.length) {
                if (roundResults[i] === true) {
                    starClass = isMasteryMode ? 'fas fa-crown star-mastery' : 'fas fa-star star-correct';
                } else {
                    starClass = 'fas fa-star star-incorrect';
                }
            }
            starsHTML += `<i class="${starClass}"></i>`;
        }
        roundProgressStarsDivElement.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción.
 * @param {object} questionData - Datos de la pregunta formateados para la UI.
 * @param {function} answerClickHandler - Handler para el clic en opciones.
 */
export function displayQuestion(questionData, answerClickHandler) {
    // --- Buscar elementos AQUI ---
    const questionTextElement = document.getElementById('question-text');
    const optionsContainerElement = document.getElementById('options-container');
    const feedbackAreaElement = document.getElementById('feedback-area');

    try {
        if(!questionTextElement || !optionsContainerElement || !feedbackAreaElement) {
             console.error("Error en displayQuestion: Faltan elementos del DOM.");
             return;
        }
        feedbackAreaElement.innerHTML = ''; feedbackAreaElement.className = '';
        optionsContainerElement.innerHTML = '';
        optionsContainerElement.classList.remove('options-disabled');

        let finalQuestionHTML = '';
        // ... (lógica para añadir teoría y texto de pregunta - sin cambios) ...

        questionTextElement.innerHTML = finalQuestionHTML;

        if (!questionData.options || !Array.isArray(questionData.options)) {
             throw new Error("optionsArray inválido o no es un array.");
        }

        const trueText = getTranslation('option_true');
        const falseText = getTranslation('option_false');

        questionData.options.forEach((optionData) => {
            // ... (lógica para crear botones, determinar texto y valor original - sin cambios) ...
            const button = document.createElement('button'); /* ... */
            let buttonText = ''; let originalValue = ''; /* ... */

            button.textContent = buttonText;
            button.setAttribute('data-original-value', originalValue);
            if (typeof answerClickHandler === 'function') {
                button.addEventListener('click', answerClickHandler);
            } else {
                 console.error("answerClickHandler no es una función en displayQuestion");
            }
            optionsContainerElement.appendChild(button); // Usar variable local
        });

    } catch (error) {
        console.error("Error en displayQuestion:", error);
        if(questionTextElement) questionTextElement.textContent = getTranslation('error_displaying_question') || 'Error displaying question.';
        if(optionsContainerElement) optionsContainerElement.innerHTML = "";
    }
}


/**
 * Muestra el feedback y redibuja pregunta/opciones si es un refresco.
 * @param {boolean} isCorrect - Si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Si se usa estilo mastery.
 * @param {object} questionData - Datos formateados de la pregunta actual.
 * @param {function} nextStepHandler - Función para el botón "Siguiente".
 * @param {string|null} selectedValueOriginal - El valor original de la opción incorrecta seleccionada (o null).
 * @param {boolean} [isRefresh=false] - Indica si esta llamada es para refrescar la UI.
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler, selectedValueOriginal = null, isRefresh = false) {
    // --- Buscar elementos AQUI ---
    const feedbackAreaElement = document.getElementById('feedback-area');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainerElement = document.getElementById('options-container');

    if (!feedbackAreaElement || !questionData || questionData.correctAnswer === undefined || questionData.correctAnswerDisplay === undefined) {
         console.error("Error en displayFeedback: Faltan elementos o datos (incl. correctAnswerDisplay).");
         return;
    }

    // --- Redibujar Pregunta y Opciones si es un Refresco ---
    if (isRefresh) {
        // 1. Redibujar Texto de Pregunta
        if (questionTextElement) {
            // ... (lógica para construir finalQuestionHTML - sin cambios) ...
            questionTextElement.innerHTML = finalQuestionHTML;
        } else { console.error("Elemento #question-text no encontrado durante refresco de feedback."); }

        // 2. Redibujar Opciones (deshabilitadas y resaltadas)
        if (optionsContainerElement) {
            optionsContainerElement.innerHTML = '';
            optionsContainerElement.classList.add('options-disabled');
            // ... (lógica para crear botones, reconstruir valor original y resaltar - sin cambios) ...
        } else { console.error("Elemento #options-container no encontrado durante refresco de feedback."); }
    }
    // --- Fin Redibujar en Refresco ---


    // --- Mostrar Área de Feedback (Lógica Principal) ---
    let feedbackText = ''; let explanationHTML = '';
    // ... (lógica para determinar feedbackText y explanationHTML - sin cambios) ...

    // Construir HTML final del feedback y mostrarlo
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) { finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`; }
    finalFeedbackHTML += `</div>`;
    if (!isCorrect) {
        const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'final_result_button' : 'next_button';
        finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }
    feedbackAreaElement.innerHTML = finalFeedbackHTML; // Usar variable local

    // Añadir listener al botón "Siguiente" si se creó
    if (!isCorrect) {
        // Buscar el botón DENTRO del feedbackArea recién actualizado
        const newNextButton = feedbackAreaElement.querySelector('#next-question-button');
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
            } else { console.error("nextStepHandler no es una función en displayFeedback"); }
        } else { console.error("No se encontró el botón 'next-question-button' inmediatamente después de crearlo."); }
    }
}


/**
 * Actualiza la pantalla de Game Over y AÑADE el listener al botón Play Again.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} currentUserData - Datos actualizados del usuario (debe incluir .name).
 * @param {string} playedLevel - El nivel que se acaba de jugar.
 * @param {function} playAgainHandler - La función de game.js a ejecutar al hacer clic en Play Again.
 */
export function displayGameOver(score, currentUserData, playedLevel, playAgainHandler) {
    // --- Buscar elementos AQUI ---
    const finalScoreDisplayElement = document.getElementById('final-score');
    const highScoreMessageElement = document.getElementById('high-score-message');
    const playAgainButtonElement = document.getElementById('play-again-button'); // Buscar aquí
    const currentGameOverSection = document.getElementById('game-over'); // Para showSection

    if (!currentUserData || !currentUserData.name) {
         console.error("displayGameOver llamado sin currentUserData o sin nombre de usuario.");
         if (currentGameOverSection) {
             if(finalScoreDisplayElement) finalScoreDisplayElement.textContent = score;
             if(highScoreMessageElement) highScoreMessageElement.textContent = getTranslation('error_displaying_results') || "Error displaying results.";
             showSection(currentGameOverSection);
         }
         return;
    }
    if(finalScoreDisplayElement) finalScoreDisplayElement.textContent = score;

    // ... (lógica para calcular mensajes - sin cambios) ...
    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessageElement) highScoreMessageElement.textContent = finalMessage;

    // Añadir listener al botón Play Again
    if (playAgainButtonElement) { // Usar la variable local
        playAgainButtonElement.textContent = getTranslation('play_again_button') || 'Choose Level';
        const newPlayAgainButton = playAgainButtonElement.cloneNode(true);
        if (playAgainButtonElement.parentNode) {
            playAgainButtonElement.parentNode.replaceChild(newPlayAgainButton, playAgainButtonElement);
        } else {
             console.error("[UI] El botón Play Again no tiene padre al intentar reemplazarlo.");
             return;
        }

        if (newPlayAgainButton) {
            if (typeof playAgainHandler === 'function') {
                newPlayAgainButton.addEventListener('click', playAgainHandler);
            } else {
                console.error("[UI] playAgainHandler no es una función en displayGameOver.");
                newPlayAgainButton.disabled = true;
            }
        }
    } else {
        console.error("[UI] El elemento #play-again-button es nulo en displayGameOver."); // Error más específico
    }

    showSection(currentGameOverSection); // Mostrar la sección correcta
}


/**
 * Actualiza la lista de High Scores en la UI.
 * @param {Array<object>} scoresData - Array de objetos [{ name, scores: { levelMode: score } }]
 */
export function displayHighScores(scoresData) {
     // --- Buscar elemento AQUI ---
     const scoreListElement = document.getElementById('score-list');
     if(!scoreListElement) return;
     scoreListElement.innerHTML = '';
     if (!scoresData || scoresData.length === 0) { scoreListElement.innerHTML = `<li>${getTranslation('no_scores') || 'No scores yet.'}</li>`; return; }
     try {
         scoresData.sort((a, b) => { /* ... (ordenar) ... */ });
         const topScores = scoresData.slice(0, config.MAX_HIGH_SCORES);
         topScores.forEach(userData => { /* ... (crear elementos li) ... */ });
     } catch (error) { console.error("Error generando la lista de high scores:", error); scoreListElement.innerHTML = `<li>${getTranslation('error_displaying_scores') || 'Error displaying scores.'}</li>`; }
}

/**
 * Actualiza el display del temporizador.
 * @param {number} timeLeftValue - Segundos restantes.
 */
export function updateTimerDisplay(timeLeftValue) {
    // --- Buscar elementos AQUI ---
    const timerDisplayDivElement = document.getElementById('timer-display');
    const timeLeftSpanElement = document.getElementById('time-left');
    if (!timerDisplayDivElement || !timeLeftSpanElement) return;
    timeLeftSpanElement.textContent = timeLeftValue;
    timerDisplayDivElement.classList.toggle('low-time', timeLeftValue <= 5);
}

/**
 * Muestra u oculta el display del temporizador.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function showTimerDisplay(show) {
     // --- Buscar elemento AQUI ---
     const timerDisplayDivElement = document.getElementById('timer-display');
     if (timerDisplayDivElement) {
         timerDisplayDivElement.style.display = show ? 'block' : 'none';
     }
}
