// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Gestiona la manipulación del DOM y la presentación visual.
// AHORA incluye lógica para generar el Stepper y la Tarjeta de Nivel.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import { handleAnswerClick, selectLevelAndMode } from './game.js'; // Importar selectLevelAndMode
import { getTranslation } from './i18n.js';
import * as storage from './storage.js'; // Necesitamos acceso a las puntuaciones
import {
    // Generadores de Explicaciones (sin cambios)
    generateClassRangeTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML, generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML, generateNumSubnetsExplanationHTML, generatePortionExplanationHTML
} from './utils.js';

// --- Selección de Elementos del DOM ---
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
export const gameOverSection = document.getElementById('game-over');
export const unlockProgressSection = document.getElementById('unlock-progress-section'); // Mantener por ahora, aunque podríamos eliminarlo
export const highScoresSection = document.getElementById('high-scores-section');
export const usernameForm = document.getElementById('username-form');
export const usernameInput = document.getElementById('username');
// NUEVOS Selectores para Stepper y Tarjeta
export const levelStepperContainer = document.getElementById('level-stepper-container');
export const levelCardArea = document.getElementById('level-card-area');
export const levelCardContent = document.getElementById('level-card-content');
// Selectores existentes
export const unlockProgressDiv = document.getElementById('unlock-progress');
export const progressStarsSpan = document.getElementById('progress-stars');
export const unlockProgressTitle = unlockProgressDiv ? unlockProgressDiv.querySelector('h4') : null;
export const usernameDisplay = document.getElementById('username-display');
export const levelDisplay = document.getElementById('level-display');
export const scoreDisplay = document.getElementById('score-display');
export const roundProgressStarsDiv = document.getElementById('round-progress-stars');
export const questionText = document.getElementById('question-text');
export const optionsContainer = document.getElementById('options-container');
export const feedbackArea = document.getElementById('feedback-area');
export const timerDisplayDiv = document.getElementById('timer-display');
export const timeLeftSpan = document.getElementById('time-left');
export const restartRoundButton = document.getElementById('restart-round-button');
export const exitToMenuButton = document.getElementById('exit-to-menu-button');
export const finalScoreDisplay = document.getElementById('final-score');
export const highScoreMessage = document.getElementById('high-score-message');
export const playAgainButton = document.getElementById('play-again-button');
export const scoreList = document.getElementById('score-list');

// Mapa para llamar a los generadores de explicaciones desde utils.js (sin cambios)
const explanationGenerators = { /* ... (sin cambios) */ };

// --- Funciones de Manipulación de la UI ---

/**
 * Muestra una sección específica del juego y oculta las demás relevantes.
 * @param {HTMLElement} sectionToShow - El elemento de la sección que se debe mostrar.
 */
export function showSection(sectionToShow) {
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];
    sections.forEach(section => { if (section) section.style.display = 'none'; });

    if (sectionToShow) sectionToShow.style.display = 'block';

    // Mostrar secciones auxiliares según la principal
    // Decidimos si mostrar High Scores y Unlock Progress siempre o solo en ciertas pantallas
    // Por ahora, las mostramos con levelSelect y gameOver
    if (sectionToShow === levelSelectSection || sectionToShow === gameOverSection) {
        // Podríamos decidir ocultar unlockProgressSection si la info ya está en la tarjeta
        // if (unlockProgressSection) unlockProgressSection.style.display = 'block';
        if (highScoresSection) highScoresSection.style.display = 'block'; // Mantener high scores por ahora
    }
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI del juego.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (clave no traducida).
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}


// --- NUEVA Lógica para Stepper y Tarjeta ---

// Iconos para cada nivel (Asegúrate que Font Awesome esté cargado)
const levelIcons = {
    'Essential': 'fa-solid fa-book-open', // Icono de libro abierto/fundamentos
    'Entry': 'fa-solid fa-star',          // Estrella (como antes)
    'Associate': 'fa-solid fa-graduation-cap', // Gorro de graduación
    'Professional': 'fa-solid fa-briefcase', // Maletín
    'Expert': 'fa-solid fa-trophy'         // Trofeo
};

/**
 * Genera y muestra el Stepper horizontal y prepara el área de la tarjeta.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (para progreso y puntuaciones).
 * @param {function} levelSelectHandler - La función a llamar cuando se hace clic en un marcador de nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    if (!levelStepperContainer || !levelCardContent || !config.LEVELS) return;

    levelStepperContainer.innerHTML = ''; // Limpiar stepper anterior
    levelCardContent.innerHTML = `<p>${getTranslation('loading_levels')}</p>`; // Mensaje inicial tarjeta

    const allLevels = config.LEVELS; // ['Essential', 'Entry', ...]
    let lastUnlockedIndex = -1;

    allLevels.forEach((level, index) => {
        const isUnlocked = unlockedLevels.includes(level);
        if (isUnlocked) {
            lastUnlockedIndex = index; // Guarda el índice del último nivel desbloqueado
        }

        // Crear el marcador del stepper
        const stepperItem = document.createElement('div');
        stepperItem.classList.add('stepper-item');
        stepperItem.dataset.level = level; // Guardar el nombre del nivel

        // Añadir clase de estado inicial (se actualizará al seleccionar)
        if (isUnlocked) {
            stepperItem.classList.add('unlocked');
            // TODO: Añadir lógica para 'completed' si guardamos ese estado
        } else {
            stepperItem.classList.add('locked');
        }

        // Icono
        const iconWrapper = document.createElement('div');
        iconWrapper.classList.add('stepper-icon-wrapper');
        const icon = document.createElement('i');
        icon.className = levelIcons[level] || 'fa-solid fa-question-circle'; // Icono por defecto
        iconWrapper.appendChild(icon);
        stepperItem.appendChild(iconWrapper);

        // Etiqueta (Nombre del nivel)
        const label = document.createElement('span');
        label.classList.add('stepper-label');
        label.dataset.translate = `level_${level.toLowerCase()}`; // Para traducción
        label.textContent = getTranslation(`level_${level.toLowerCase()}`) || level; // Texto inicial
        stepperItem.appendChild(label);

        // Añadir listener para actualizar tarjeta al hacer clic
        stepperItem.addEventListener('click', () => {
            // Marcar este item como seleccionado
            document.querySelectorAll('.stepper-item.selected').forEach(el => el.classList.remove('selected'));
            stepperItem.classList.add('selected');
            // Actualizar la tarjeta
            updateLevelCard(level, isUnlocked, currentUserData, levelSelectHandler);
        });

        levelStepperContainer.appendChild(stepperItem);

        // Añadir conector (excepto después del último) - Podría hacerse con CSS puro también
        // if (index < allLevels.length - 1) {
        //     const connector = document.createElement('div');
        //     connector.classList.add('stepper-connector');
        //     levelStepperContainer.appendChild(connector);
        // }
    });

    // Actualizar la línea de progreso azul
    updateStepperProgressLine(lastUnlockedIndex, allLevels.length);

    // Seleccionar y mostrar la tarjeta del primer nivel desbloqueado por defecto
    const firstUnlockedLevel = unlockedLevels[0] || 'Essential'; // Asume Essential siempre está
    const firstStepperItem = levelStepperContainer.querySelector(`.stepper-item[data-level="${firstUnlockedLevel}"]`);
    if (firstStepperItem) {
        firstStepperItem.classList.add('selected');
        updateLevelCard(firstUnlockedLevel, true, currentUserData, levelSelectHandler);
    } else {
        // Fallback si algo va mal
        levelCardContent.innerHTML = `<p>${getTranslation('error_loading_levels')}</p>`;
    }

    // Mostrar la sección de selección de nivel
    showSection(levelSelectSection);
    // Ocultar la sección de progreso de desbloqueo separada (ya no necesaria)
    if (unlockProgressSection) unlockProgressSection.style.display = 'none';
}

/**
 * Actualiza el contenido de la tarjeta única con la información del nivel seleccionado.
 * @param {string} levelName - Nombre del nivel seleccionado (e.g., 'Associate').
 * @param {boolean} isUnlocked - Si el nivel está desbloqueado.
 * @param {object} currentUserData - Datos del usuario.
 * @param {function} levelSelectHandler - Función para iniciar el nivel.
 */
function updateLevelCard(levelName, isUnlocked, currentUserData, levelSelectHandler) {
    if (!levelCardContent) return;

    levelCardContent.innerHTML = ''; // Limpiar contenido anterior

    // Título del Nivel
    const title = document.createElement('h3');
    title.dataset.translate = `level_${levelName.toLowerCase()}`;
    title.textContent = getTranslation(`level_${levelName.toLowerCase()}`) || levelName;
    levelCardContent.appendChild(title);

    // Icono Grande (Opcional)
    // const icon = document.createElement('i');
    // icon.className = `level-icon ${levelIcons[levelName] || 'fa-solid fa-question-circle'}`;
    // levelCardContent.appendChild(icon);

    if (isUnlocked) {
        // Estado: Disponible
        const status = document.createElement('div');
        status.classList.add('level-status');
        // status.dataset.translate = 'level_status_available'; // Necesitaríamos esta clave i18n
        status.textContent = "Disponible"; // Placeholder
        levelCardContent.appendChild(status);

        // Mejor Puntuación Personal
        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('level-score');
        const userScores = storage.loadHighScores().find(user => user.name === currentUserData.name)?.scores || {};
        const levelKey = `${levelName}-standard`; // Asumimos modo standard por ahora
        const bestScore = userScores[levelKey];

        if (bestScore !== undefined) {
            scoreDiv.innerHTML = `${getTranslation('your_best_score') || 'Tu Mejor Puntuación'}: <strong>${bestScore}</strong>`;
        } else {
            scoreDiv.textContent = getTranslation('not_played_yet') || 'Aún no jugado';
        }
        levelCardContent.appendChild(scoreDiv);

        // Botón Iniciar Nivel
        const startButton = document.createElement('button');
        startButton.classList.add('start-level-button');
        startButton.dataset.translate = 'start_level_button'; // Clave i18n
        startButton.textContent = getTranslation('start_level_button') || 'Iniciar Nivel';
        startButton.addEventListener('click', () => {
            // Llama al handler pasado desde game.js (que es selectLevelAndMode)
            levelSelectHandler(levelName, 'standard'); // Asumimos modo standard
        });
        levelCardContent.appendChild(startButton);

    } else {
        // Estado: Bloqueado
        const status = document.createElement('div');
        status.classList.add('level-status', 'locked');
        status.innerHTML = `<i class="fas fa-lock"></i> ${getTranslation('level_status_locked') || 'Bloqueado'}`;
        levelCardContent.appendChild(status);

        // Requisito para Desbloquear
        const requirement = document.createElement('div');
        requirement.classList.add('level-requirement');
        let requirementText = '';
        // Determinar el requisito basado en el nivel bloqueado
        if (levelName === 'Entry') requirementText = getTranslation('requirement_entry'); // No debería pasar si Essential es base
        else if (levelName === 'Associate') requirementText = getTranslation('requirement_associate'); // "Completa Nivel Entry..."
        else if (levelName === 'Professional') requirementText = getTranslation('requirement_professional'); // "Completa Nivel Associate..."
        else requirementText = getTranslation('requirement_default'); // Texto genérico

        requirement.innerHTML = `<i class="fas fa-info-circle"></i> ${requirementText}`;
        levelCardContent.appendChild(requirement);

        // Botón (Desactivado o no presente)
        // const startButton = document.createElement('button');
        // startButton.classList.add('start-level-button');
        // startButton.disabled = true;
        // startButton.textContent = getTranslation('start_level_button') || 'Iniciar Nivel';
        // levelCardContent.appendChild(startButton);
    }
}

/**
 * Actualiza el ancho de la línea de progreso azul en el stepper.
 * @param {number} lastUnlockedIndex - Índice del último nivel desbloqueado (-1 si ninguno).
 * @param {number} totalLevels - Número total de niveles.
 */
function updateStepperProgressLine(lastUnlockedIndex, totalLevels) {
    if (!levelStepperContainer || totalLevels <= 1) return;

    const progressPercentage = lastUnlockedIndex >= 0
        ? (lastUnlockedIndex / (totalLevels - 1)) * 100 // Porcentaje basado en el espacio entre marcadores
        : 0;

    // Ajustar el ancho de la línea ::after
    levelStepperContainer.style.setProperty('--progress-width', `${progressPercentage}%`);

    // Necesitamos añadir la variable al CSS para que funcione:
    /*
    #level-stepper-container::after {
        ...
        width: var(--progress-width, 0%); // Usa la variable con fallback 0%
        ...
    }
    */
   // ¡Hecho! Ya está añadido en la versión anterior del CSS.
}


// --- FIN NUEVA Lógica ---


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (AHORA OBSOLETA O REDUNDANTE).
 * Mantenida por si se decide reutilizar en otro lugar.
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    // Esta función probablemente ya no sea necesaria en la pantalla de selección,
    // ya que la información de bloqueo/requisito está en la tarjeta.
    // Se podría eliminar o adaptar para mostrarse en otro lugar si es útil.
    if (unlockProgressSection) unlockProgressSection.style.display = 'none'; // Ocultarla por defecto
}

/**
 * Actualiza las estrellas de progreso DENTRO de la ronda actual. (Sin cambios)
 * @param {Array<boolean>} roundResults - Array con los resultados (true/false) de la ronda.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo de corona.
 */
export function updateRoundProgressUI(roundResults, isMasteryMode) {
    try {
        if (!roundProgressStarsDiv) return;
        let starsHTML = '';
        const totalQuestions = config.TOTAL_QUESTIONS_PER_GAME;
        for (let i = 0; i < totalQuestions; i++) {
            let starClass = 'far fa-star star-pending'; // Pendiente por defecto
            if (i < roundResults.length) { // Pregunta respondida
                if (roundResults[i] === true) {
                    starClass = isMasteryMode ? 'fas fa-crown star-mastery' : 'fas fa-star star-correct';
                } else {
                    starClass = 'fas fa-star star-incorrect';
                }
            }
            starsHTML += `<i class="${starClass}"></i>`;
        }
        roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción traducidos.
 * Incluye la presentación teórica si existe (para Nivel Essential).
 * @param {object} questionData - Objeto con la información de la pregunta.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) return;
        feedbackArea.innerHTML = ''; feedbackArea.className = ''; // Limpiar feedback
        optionsContainer.innerHTML = ''; // Limpiar opciones anteriores
        optionsContainer.classList.remove('options-disabled'); // Habilitar opciones

        let finalQuestionHTML = '';

        // --- Añadir texto teórico si existe ---
        if (questionData.theoryKey) {
            const theoryText = getTranslation(questionData.theoryKey);
            if (theoryText && theoryText !== questionData.theoryKey) {
                finalQuestionHTML += `<div class="theory-presentation">${theoryText}</div><hr class="theory-separator">`;
            }
        }
        // --- FIN Añadir teoría ---

        // Añadir el texto de la pregunta principal
        const questionReplacements = questionData.question.replacements || {};
        finalQuestionHTML += getTranslation(questionData.question.key, questionReplacements);
        questionText.innerHTML = finalQuestionHTML; // Establecer HTML combinado

        // Crear botones de opción
        if (!questionData.options || !Array.isArray(questionData.options)) throw new Error("optionsArray inválido.");
        questionData.options.forEach((optionData) => {
            const button = document.createElement('button'); button.classList.add('option-button');
            let buttonText = ''; let originalValue = '';

            // Manejar opciones simples (string: clave i18n o valor directo) y complejas (objeto)
            if (typeof optionData === 'string') {
                const translated = getTranslation(optionData);
                buttonText = (translated && translated !== optionData) ? translated : optionData;
                originalValue = optionData;
            } else if (typeof optionData === 'object' && optionData !== null) { // Opción compleja (Clase/Tipo/Máscara/Porción)
                let textParts = []; let originalValueParts = [];
                if (optionData.classKey) { textParts.push(getTranslation(optionData.classKey)); originalValueParts.push(optionData.classKey); }
                if (optionData.typeKey) { textParts.push(getTranslation(optionData.typeKey)); originalValueParts.push(optionData.typeKey); }
                if (optionData.maskValue) { textParts.push(getTranslation('option_mask', { mask: optionData.maskValue })); originalValueParts.push(optionData.maskValue); }
                if (optionData.portionKey) { const portionVal = optionData.portionValue || getTranslation('option_none'); textParts.push(getTranslation(optionData.portionKey, { portion: portionVal })); originalValueParts.push(optionData.portionKey); originalValueParts.push(optionData.portionValue || 'None'); }
                buttonText = textParts.join(', ');
                originalValue = originalValueParts.join(',');
                if (textParts.length === 0) { buttonText = JSON.stringify(optionData); originalValue = buttonText; }
            } else { buttonText = 'Opción Inválida'; originalValue = 'invalid'; }

            button.textContent = buttonText;
            button.setAttribute('data-original-value', originalValue);
            if (typeof answerClickHandler === 'function') { button.addEventListener('click', answerClickHandler); }
            optionsContainer.appendChild(button);
        });

    } catch (error) {
        console.error("Error en displayQuestion:", error);
        if(questionText) questionText.textContent = getTranslation('error_displaying_question');
        if(optionsContainer) optionsContainer.innerHTML = "";
    }
}


/**
 * Muestra el feedback (correcto/incorrecto) después de una respuesta.
 * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo mastery.
 * @param {object} questionData - Objeto con los datos de la pregunta actual.
 * @param {function} nextStepHandler - Función a llamar al hacer clic en "Siguiente".
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined) return;
    let feedbackText = ''; let explanationHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    // Traducir la respuesta correcta para el mensaje de feedback
    let translatedCorrectAnswer = ''; const ca = questionData.correctAnswer;
    if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
    else if (typeof ca === 'object' && ca !== null) {
        let textParts = [];
        if (ca.classKey) textParts.push(getTranslation(ca.classKey));
        if (ca.typeKey) textParts.push(getTranslation(ca.typeKey));
        if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue }));
        if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); }
        if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); }
        else { translatedCorrectAnswer = JSON.stringify(ca); }
    } else { translatedCorrectAnswer = ca?.toString() ?? 'N/A'; } // Convertir números, etc. a string

    // Texto base del feedback
    if (isCorrect) {
        feedbackText = getTranslation('feedback_correct');
    } else {
        feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
    }
    feedbackArea.className = isCorrect ? (isMasteryMode ? 'mastery' : 'correct') : 'incorrect';

    // Generar HTML de la explicación si la respuesta es incorrecta
    if (!isCorrect && questionData.explanation) {
        try {
            const expInfo = questionData.explanation;
            let baseExplanationText = '';
            if (expInfo.baseTextKey) {
                baseExplanationText = getTranslation(expInfo.baseTextKey, expInfo.replacements || {});
            }

            let generatedExplanationHTML = '';
            if (expInfo.generatorName && explanationGenerators[expInfo.generatorName]) {
                const generatorFunc = explanationGenerators[expInfo.generatorName];
                if (typeof generatorFunc === 'function') {
                    generatedExplanationHTML = generatorFunc.apply(null, expInfo.args || []);
                } else { console.error(`Generator '${expInfo.generatorName}' not found or not a function.`); generatedExplanationHTML = `<p>Error: Generator not found.</p>`; }
            } else if (Array.isArray(expInfo.generators)) {
                const separator = expInfo.separator || '<br>';
                generatedExplanationHTML = expInfo.generators.map(genInfo => {
                    if (genInfo.generatorName && explanationGenerators[genInfo.generatorName]) {
                        const generatorFunc = explanationGenerators[genInfo.generatorName];
                        if (typeof generatorFunc === 'function') { return generatorFunc.apply(null, genInfo.args || []); }
                        else { console.error(`Generator '${genInfo.generatorName}' not found or not a function.`); return `<p>Error: Generator not found.</p>`; }
                    } return '';
                }).join(separator);
            } else if (expInfo.baseTextKey && !expInfo.generatorName && !expInfo.generators) {
                // Caso de explicación simple (solo baseTextKey) - ya está en baseExplanationText
                 generatedExplanationHTML = ''; // No hay HTML generado adicional
            }

            explanationHTML = baseExplanationText ? `<p>${baseExplanationText}</p>${generatedExplanationHTML}` : generatedExplanationHTML;

        } catch (genError) { console.error("Error generando explicación HTML:", genError, questionData.explanation); explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' })}</p>`; }

        // Resaltar botón correcto
        try {
            if(optionsContainer) {
                let correctOriginalValueStr = '';
                if (typeof ca === 'string') { correctOriginalValueStr = ca; }
                else if (typeof ca === 'object' && ca !== null) {
                    let originalValueParts = [];
                    if (ca.classKey) originalValueParts.push(ca.classKey);
                    if (ca.typeKey) originalValueParts.push(ca.typeKey);
                    if (ca.maskValue) originalValueParts.push(ca.maskValue);
                    if (ca.portionKey) { originalValueParts.push(ca.portionKey); originalValueParts.push(ca.portionValue || 'None'); }
                    correctOriginalValueStr = originalValueParts.join(',');
                } else { correctOriginalValueStr = ca?.toString() ?? 'N/A'; }

                Array.from(optionsContainer.children).forEach(button => {
                    if (button.getAttribute('data-original-value') === correctOriginalValueStr) {
                        button.classList.add(correctButtonClass);
                    }
                });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }
    }

    // Construir HTML final y mostrarlo
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) { finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`; }
    finalFeedbackHTML += `</div>`;
    // Añadir botón "Siguiente" solo si la respuesta fue incorrecta
    if (!isCorrect) {
        const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'final_result_button' : 'next_button';
        finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }
    feedbackArea.innerHTML = finalFeedbackHTML;

    // Añadir listener al botón "Siguiente" si se creó
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
            } else { console.error("nextStepHandler no es una función en displayFeedback"); }
        } else { console.error("No se encontró el botón 'next-question-button' inmediatamente después de crearlo."); }
    }
}


/**
 * Actualiza la pantalla de Game Over.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} currentUserData - Datos actualizados del usuario.
 * @param {string} playedLevel - El nivel que se acaba de jugar.
 */
export function displayGameOver(score, currentUserData, playedLevel) {
    if (!currentUserData) { console.error("displayGameOver llamado sin currentUserData"); return; }
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const isPerfect = score === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    let baseMessage = getTranslation('game_over_base_message', { score: score, maxScore: maxScore, percentage: scorePercentage });
    let extraMessage = '';

    // Lógica de desbloqueo y mensajes (simplificada asumiendo Essential es base)
    if (playedLevel === 'Essential') {
        // Essential no desbloquea nada, quizás un mensaje de ánimo
        if (isPerfect) extraMessage = "¡Buen comienzo!";
    } else if (playedLevel === 'Entry') {
        if (isPerfect) {
            const justUnlockedAssociate = currentUserData.unlockedLevels.includes('Associate') && (currentUserData.entryPerfectStreak === 1); // Se desbloquea a la primera racha perfecta >= 3
            if (justUnlockedAssociate) {
                extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') });
            } else if (!currentUserData.unlockedLevels.includes('Associate')) {
                extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak });
            } else {
                extraMessage = getTranslation('game_over_good_round_entry');
            }
        }
    } else if (playedLevel === 'Associate') {
         if (meetsAssociateThreshold) {
             const justUnlockedPro = currentUserData.unlockedLevels.includes('Professional') && (currentUserData.associatePerfectStreak === 1); // Se desbloquea a la primera racha >= 3
             if (justUnlockedPro) {
                 extraMessage = getTranslation('game_over_level_unlocked_pro');
             } else if (!currentUserData.unlockedLevels.includes('Professional')) {
                 extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak });
             } else {
                 extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK });
             }
         }
    } // Añadir lógica para Professional -> Expert si es necesario

    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;

    // Actualizar texto del botón "Jugar de Nuevo"
    if (playAgainButton) {
        playAgainButton.textContent = getTranslation('play_again_button'); // Siempre "Elegir Nivel" ahora
    }

    // Ya no necesitamos llamar a updateUnlockProgressUI aquí
    showSection(gameOverSection);
}


/**
 * Actualiza la lista de High Scores en la UI. (Sin cambios significativos)
 * @param {Array<object>} scoresData - Array de objetos [{ name, scores: { levelMode: score } }]
 */
export function displayHighScores(scoresData) {
     if(!scoreList) return;
     scoreList.innerHTML = '';
     if (!scoresData || scoresData.length === 0) { scoreList.innerHTML = `<li>${getTranslation('no_scores')}</li>`; return; }
     try {
         scoresData.forEach(userData => {
             const userEntry = document.createElement('li'); userEntry.classList.add('score-entry');
             const userNameElement = document.createElement('div'); userNameElement.classList.add('score-username'); userNameElement.textContent = userData.name; userEntry.appendChild(userNameElement);
             const levelScoresContainer = document.createElement('div'); levelScoresContainer.classList.add('level-scores');
             // Orden de visualización de puntuaciones (ajustar si añadimos Expert)
             const displayOrder = [
                 { key: 'Essential-standard', labelKey: 'level_essential' },
                 { key: 'Entry-standard', labelKey: 'level_entry' }, // No mostramos modo aquí
                 // { key: 'Entry-mastery', labelKey: 'level_entry_mastery' }, // Oculto por simplicidad
                 { key: 'Associate-standard', labelKey: 'level_associate' },
                 { key: 'Professional-standard', labelKey: 'level_professional' },
                 { key: 'Expert-standard', labelKey: 'level_expert' } // Futuro
             ];
             let hasScores = false;
             displayOrder.forEach(levelInfo => {
                 if (userData.scores && userData.scores[levelInfo.key] !== undefined) {
                     const levelScoreElement = document.createElement('span');
                     levelScoreElement.classList.add('level-score-item');
                     const label = getTranslation(levelInfo.labelKey);
                     levelScoreElement.innerHTML = `${label}: <strong>${userData.scores[levelInfo.key]}</strong>`;
                     levelScoresContainer.appendChild(levelScoreElement);
                     hasScores = true;
                 }
             });
             if(hasScores) { userEntry.appendChild(levelScoresContainer); }
             else { const noScoreMsg = document.createElement('div'); noScoreMsg.textContent = `(${getTranslation('no_scores_recorded')})`; noScoreMsg.style.fontSize = "0.8em"; noScoreMsg.style.color = "#888"; userEntry.appendChild(noScoreMsg); }
             scoreList.appendChild(userEntry);
         });
     } catch (error) { console.error("Error generando la lista de high scores:", error); scoreList.innerHTML = `<li>${getTranslation('error_displaying_scores')}</li>`; }
}

/**
 * Actualiza el display del temporizador. (Sin cambios)
 * @param {number} timeLeftValue - Segundos restantes.
 */
export function updateTimerDisplay(timeLeftValue) {
    if (!timerDisplayDiv || !timeLeftSpan) return;
    timeLeftSpan.textContent = timeLeftValue;
    if (timeLeftValue <= 5) { timerDisplayDiv.classList.add('low-time'); }
    else { timerDisplayDiv.classList.remove('low-time'); }
}

/**
 * Muestra u oculta el display del temporizador. (Sin cambios)
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function showTimerDisplay(show) {
     if (timerDisplayDiv) {
         timerDisplayDiv.style.display = show ? 'block' : 'none';
     }
}
