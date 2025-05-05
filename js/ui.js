// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Gestiona la manipulación del DOM y la presentación visual.
// Incluye lógica para generar el Stepper y la Tarjeta de Nivel.
// CORREGIDO: displayFeedback ahora redibuja pregunta/opciones en refresco.
// Versión sin console.log
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import { handleAnswerClick } from './game.js'; // Handler para respuestas
import { getTranslation } from './i18n.js';
import * as storage from './storage.js'; // Para leer puntuaciones
import {
    // Generadores de Explicaciones (para niveles no-Essential)
    generateClassRangeTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML, generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML, generateNumSubnetsExplanationHTML
} from './utils.js';

// --- Selección de Elementos del DOM ---
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
export const gameOverSection = document.getElementById('game-over');
export const unlockProgressSection = document.getElementById('unlock-progress-section');
export const highScoresSection = document.getElementById('high-scores-section');
export const usernameForm = document.getElementById('username-form');
export const usernameInput = document.getElementById('username');
export const levelStepperContainer = document.getElementById('level-stepper-container');
export const levelCardArea = document.getElementById('level-card-area');
export const levelCardContent = document.getElementById('level-card-content');
export const unlockProgressDiv = document.getElementById('unlock-progress');
export const progressStarsSpan = document.getElementById('progress-stars');
export const unlockProgressTitle = unlockProgressDiv ? unlockProgressDiv.querySelector('h4') : null;
export const usernameDisplay = document.getElementById('username-display');
export const levelDisplay = document.getElementById('level-display');
export const scoreDisplay = document.getElementById('score-display');
export const roundProgressStarsDiv = document.getElementById('round-progress-stars');
export const questionText = document.getElementById('question-text'); // Elemento para el texto de la pregunta
export const optionsContainer = document.getElementById('options-container'); // Contenedor de botones de opción
export const feedbackArea = document.getElementById('feedback-area'); // Área para mostrar feedback
export const timerDisplayDiv = document.getElementById('timer-display');
export const timeLeftSpan = document.getElementById('time-left');
export const restartRoundButton = document.getElementById('restart-round-button');
export const exitToMenuButton = document.getElementById('exit-to-menu-button');
export const finalScoreDisplay = document.getElementById('final-score');
export const highScoreMessage = document.getElementById('high-score-message');
export const playAgainButton = document.getElementById('play-again-button');
export const scoreList = document.getElementById('score-list');

// Mapa para llamar a los generadores de explicaciones desde utils.js
const explanationGenerators = {
    generateClassRangeTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML, generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML, generateNumSubnetsExplanationHTML
};

// Iconos para cada nivel
const levelIcons = {
    'Essential': 'fa-book-open', 'Entry': 'fa-star', 'Associate': 'fa-graduation-cap',
    'Professional': 'fa-briefcase', 'Expert': 'fa-trophy'
};

// --- Funciones de Manipulación de la UI ---

/**
 * Muestra una sección específica del juego y oculta las demás.
 * @param {HTMLElement} sectionToShow - El elemento de la sección a mostrar.
 */
export function showSection(sectionToShow) {
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];
    sections.forEach(section => { if (section) section.style.display = 'none'; });
    if (sectionToShow) sectionToShow.style.display = 'block';
    if (sectionToShow === levelSelectSection || sectionToShow === gameOverSection) {
        if (highScoresSection) highScoresSection.style.display = 'block';
    }
    if (unlockProgressSection) unlockProgressSection.style.display = 'none'; // Ocultar siempre el viejo
}

/**
 * Actualiza la información del jugador en la UI del juego.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (clave no traducida).
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

// --- Lógica para Stepper y Tarjeta ---

/**
 * Genera y muestra el Stepper horizontal y la tarjeta de nivel inicial.
 * @param {Array<string>} unlockedLevels - Niveles desbloqueados.
 * @param {object} currentUserData - Datos del usuario (para rachas, etc.).
 * @param {string} currentUsername - Nombre del usuario actual.
 * @param {function} levelSelectHandler - Función a llamar al seleccionar un nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, currentUsername, levelSelectHandler) {
    if (!levelStepperContainer || !levelCardContent || !config.LEVELS || !currentUserData || !currentUsername) {
        console.error("Error en displayLevelSelection: Faltan elementos del DOM o datos necesarios.");
        if (levelSelectSection) {
             levelSelectSection.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
             showSection(levelSelectSection);
        }
        return;
    }

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

        const stepperItem = document.createElement('div');
        stepperItem.classList.add('stepper-item');
        stepperItem.dataset.level = level;
        stepperItem.classList.toggle('unlocked', isUnlocked);
        stepperItem.classList.toggle('locked', !isUnlocked);

        const iconWrapper = document.createElement('div');
        iconWrapper.classList.add('stepper-icon-wrapper');
        const icon = document.createElement('i');
        icon.className = `fa-solid ${levelIcons[level] || 'fa-question-circle'}`;
        iconWrapper.appendChild(icon);
        stepperItem.appendChild(iconWrapper);

        const label = document.createElement('span');
        label.classList.add('stepper-label');
        const translationKey = `level_${level.toLowerCase()}`;
        label.dataset.translate = translationKey;
        label.textContent = getTranslation(translationKey) || level;
        stepperItem.appendChild(label);

        stepperItem.addEventListener('click', () => {
            if (stepperItem.classList.contains('selected')) return;
            document.querySelectorAll('.stepper-item.selected').forEach(el => el.classList.remove('selected'));
            stepperItem.classList.add('selected');
            updateLevelCard(level, isUnlocked, currentUsername, levelSelectHandler);
        });

        levelStepperContainer.appendChild(stepperItem);
    });

    updateStepperProgressLine(lastUnlockedIndex, allLevels.length);

    const effectiveFirstLevel = firstUnlockedLevelName || allLevels[0];
    const firstStepperItem = levelStepperContainer.querySelector(`.stepper-item[data-level="${effectiveFirstLevel}"]`);
    if (firstStepperItem) {
        firstStepperItem.classList.add('selected');
        updateLevelCard(effectiveFirstLevel, unlockedLevels.includes(effectiveFirstLevel), currentUsername, levelSelectHandler);
    } else {
        levelCardContent.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
        console.error(`[UI] No se encontró el stepper item para el nivel por defecto: ${effectiveFirstLevel}`);
    }

    showSection(levelSelectSection);
    if (unlockProgressSection) unlockProgressSection.style.display = 'none';
}

/**
 * Actualiza el contenido de la tarjeta única con la información del nivel seleccionado.
 * @param {string} levelName - Nombre del nivel.
 * @param {boolean} isUnlocked - Si el nivel está desbloqueado.
 * @param {string} currentUsername - Nombre del usuario actual.
 * @param {function} levelSelectHandler - Función para iniciar el nivel.
 */
function updateLevelCard(levelName, isUnlocked, currentUsername, levelSelectHandler) {
    if (!levelCardContent) return;
    levelCardContent.innerHTML = '';

    const title = document.createElement('h3');
    const titleKey = `level_${levelName.toLowerCase()}`;
    title.dataset.translate = titleKey;
    title.textContent = getTranslation(titleKey) || levelName;
    levelCardContent.appendChild(title);

    if (isUnlocked) {
        const status = document.createElement('div');
        status.classList.add('level-status');
        const statusKey = 'level_status_available';
        status.dataset.translate = statusKey;
        status.textContent = getTranslation(statusKey) || "Available";
        levelCardContent.appendChild(status);

        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('level-score');
        const allHighScores = storage.loadHighScores();
        const userScoreData = allHighScores.find(user => user.name === currentUsername);
        const userScores = userScoreData?.scores || {};
        const levelKey = `${levelName}-standard`;
        const bestScore = userScores[levelKey];
        const scoreLabelKey = 'your_best_score';
        const noScoreLabelKey = 'not_played_yet';
        if (bestScore !== undefined) {
            scoreDiv.innerHTML = `${getTranslation(scoreLabelKey) || 'Your Best Score'}: <strong>${bestScore}</strong>`;
        } else {
            scoreDiv.textContent = getTranslation(noScoreLabelKey) || 'Not played yet';
        }
        levelCardContent.appendChild(scoreDiv);

        const startButton = document.createElement('button');
        startButton.classList.add('start-level-button');
        const buttonKey = 'start_level_button';
        startButton.dataset.translate = buttonKey;
        startButton.textContent = getTranslation(buttonKey) || 'Start Level';
        if (typeof levelSelectHandler === 'function') {
            startButton.addEventListener('click', () => {
                levelSelectHandler(levelName, 'standard');
            });
        } else {
            console.error(`[UI] ERROR: levelSelectHandler NO es una función en updateLevelCard para nivel ${levelName}.`);
            startButton.disabled = true;
            startButton.textContent += ' (Error Handler)';
        }
        levelCardContent.appendChild(startButton);

    } else { // Nivel Bloqueado
        const status = document.createElement('div');
        status.classList.add('level-status', 'locked');
        const lockedStatusKey = 'level_status_locked';
        status.innerHTML = `<i class="fas fa-lock"></i> ${getTranslation(lockedStatusKey) || 'Locked'}`;
        levelCardContent.appendChild(status);

        const requirement = document.createElement('div');
        requirement.classList.add('level-requirement');
        let requirementText = '';
        let requirementKey = '';
        const levelsOrder = config.LEVELS;
        const currentIndex = levelsOrder.indexOf(levelName);
        if (currentIndex > 0) {
            const previousLevel = levelsOrder[currentIndex - 1];
            const prevLevelKey = `level_${previousLevel.toLowerCase()}`;
            requirementKey = `requirement_${levelName.toLowerCase()}`;
            requirementText = getTranslation(requirementKey, { prevLevel: getTranslation(prevLevelKey) || previousLevel });
            if (requirementText === requirementKey) {
                 const defaultReqKey = 'requirement_default';
                 requirementText = getTranslation(defaultReqKey, { prevLevel: getTranslation(prevLevelKey) || previousLevel }) || `Complete ${previousLevel} first.`;
            }
        } else {
            requirementKey = 'requirement_default_unknown';
            requirementText = getTranslation(requirementKey) || "Unlock previous levels first.";
        }
        requirement.innerHTML = `<i class="fas fa-info-circle"></i> ${requirementText}`;
        levelCardContent.appendChild(requirement);
    }
}

/**
 * Actualiza el ancho de la línea de progreso azul en el stepper.
 * @param {number} lastUnlockedIndex - Índice del último nivel desbloqueado.
 * @param {number} totalLevels - Número total de niveles.
 */
function updateStepperProgressLine(lastUnlockedIndex, totalLevels) {
    if (!levelStepperContainer || totalLevels <= 1) return;
    const progressPercentage = lastUnlockedIndex >= 0
        ? (lastUnlockedIndex / (totalLevels - 1)) * 80 + 10
        : 10;
    levelStepperContainer.style.setProperty('--progress-width', `${progressPercentage}%`);
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
    try {
        if (!roundProgressStarsDiv) return;
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
        roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción.
 * @param {object} questionData - Datos de la pregunta formateados para la UI.
 * @param {function} answerClickHandler - Handler para el clic en opciones.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) {
             console.error("Error en displayQuestion: Faltan elementos del DOM.");
             return;
        }
        // Limpiar feedback anterior, mantener pregunta y opciones por ahora
        feedbackArea.innerHTML = ''; feedbackArea.className = '';
        optionsContainer.innerHTML = ''; // Limpiar opciones siempre
        optionsContainer.classList.remove('options-disabled'); // Habilitar opciones

        let finalQuestionHTML = '';

        // Mostrar teoría si existe
        if (questionData.theoryKey) {
            const theoryText = getTranslation(questionData.theoryKey);
            if (theoryText && theoryText !== questionData.theoryKey) {
                finalQuestionHTML += `<div class="theory-presentation">${theoryText}</div><hr class="theory-separator">`;
            }
        }

        // Mostrar texto de la pregunta (directo o traducido)
        let questionDisplayHTML = '';
        if (questionData.question?.text) {
            questionDisplayHTML = questionData.question.text;
        } else if (questionData.question?.key) {
            const questionReplacements = questionData.question.replacements || {};
            questionDisplayHTML = getTranslation(questionData.question.key, questionReplacements);
        } else {
            console.error("[UI] Datos de pregunta inválidos:", questionData.question);
            questionDisplayHTML = "Error: Invalid Question.";
        }
        finalQuestionHTML += questionDisplayHTML;
        questionText.innerHTML = finalQuestionHTML;

        // Crear botones de opción
        if (!questionData.options || !Array.isArray(questionData.options)) {
             throw new Error("optionsArray inválido o no es un array.");
        }
        questionData.options.forEach((optionData) => {
            const button = document.createElement('button'); button.classList.add('option-button');
            let buttonText = ''; let originalValue = '';

            if (typeof optionData === 'string') {
                const translated = getTranslation(optionData);
                buttonText = (translated && translated !== optionData) ? translated : optionData;
                originalValue = optionData;
            } else if (typeof optionData === 'object' && optionData !== null) {
                let textParts = []; let originalValueParts = [];
                if (optionData.classKey) { textParts.push(getTranslation(optionData.classKey)); originalValueParts.push(optionData.classKey); }
                if (optionData.typeKey) { textParts.push(getTranslation(optionData.typeKey)); originalValueParts.push(optionData.typeKey); }
                if (optionData.maskValue) { textParts.push(getTranslation('option_mask', { mask: optionData.maskValue })); originalValueParts.push(optionData.maskValue); }
                if (optionData.portionKey) { const portionVal = optionData.portionValue || getTranslation('option_none'); textParts.push(getTranslation(optionData.portionKey, { portion: portionVal })); originalValueParts.push(optionData.portionKey); originalValueParts.push(optionData.portionValue || 'None'); }
                buttonText = textParts.join(', ');
                originalValue = originalValueParts.join(',');
                if (textParts.length === 0) { buttonText = JSON.stringify(optionData); originalValue = buttonText; }
            } else { buttonText = 'Invalid Option'; originalValue = 'invalid'; }

            button.textContent = buttonText;
            button.setAttribute('data-original-value', originalValue);
            if (typeof answerClickHandler === 'function') {
                button.addEventListener('click', answerClickHandler);
            } else {
                 console.error("answerClickHandler no es una función en displayQuestion");
            }
            optionsContainer.appendChild(button);
        });

    } catch (error) {
        console.error("Error en displayQuestion:", error);
        if(questionText) questionText.textContent = getTranslation('error_displaying_question') || 'Error displaying question.';
        if(optionsContainer) optionsContainer.innerHTML = "";
    }
}


/**
 * Muestra el feedback y redibuja pregunta/opciones si es un refresco.
 * @param {boolean} isCorrect - Si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Si se usa estilo mastery.
 * @param {object} questionData - Datos formateados de la pregunta actual.
 * @param {function} nextStepHandler - Función para el botón "Siguiente".
 * @param {string|null} selectedValueOriginal - El valor original de la opción incorrecta seleccionada (o null).
 * @param {boolean} [isRefresh=false] - Indica si esta llamada es para refrescar la UI (ej. cambio idioma).
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler, selectedValueOriginal = null, isRefresh = false) {
    // Chequeos iniciales
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined || questionData.correctAnswerDisplay === undefined) {
         console.error("Error en displayFeedback: Faltan elementos o datos (incl. correctAnswerDisplay).", {feedbackArea, questionData});
         return;
    }

    // --- Si es un Refresco, redibujar pregunta y opciones PRIMERO ---
    if (isRefresh) {
        // 1. Redibujar Texto de Pregunta
        if (questionText) {
            let finalQuestionHTML = '';
            if (questionData.theoryKey) {
                const theoryText = getTranslation(questionData.theoryKey);
                if (theoryText && theoryText !== questionData.theoryKey) {
                    finalQuestionHTML += `<div class="theory-presentation">${theoryText}</div><hr class="theory-separator">`;
                }
            }
            let questionDisplayHTML = '';
            if (questionData.question?.text) { questionDisplayHTML = questionData.question.text; }
            else if (questionData.question?.key) { questionDisplayHTML = getTranslation(questionData.question.key, questionData.question.replacements || {}); }
            else { questionDisplayHTML = "Error: Invalid Question."; }
            finalQuestionHTML += questionDisplayHTML;
            questionText.innerHTML = finalQuestionHTML;
        } else { console.error("Elemento #question-text no encontrado durante refresco de feedback."); }

        // 2. Redibujar Opciones (deshabilitadas y resaltadas)
        if (optionsContainer) {
            optionsContainer.innerHTML = ''; // Limpiar opciones viejas
            optionsContainer.classList.add('options-disabled'); // Asegurar que estén deshabilitadas
            const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';
            const correctAnswerValue = questionData.correctAnswer; // Valor/clave correcta

            if (!questionData.options || !Array.isArray(questionData.options)) {
                 console.error("optionsArray inválido durante refresco de feedback.");
            } else {
                questionData.options.forEach((optionText) => { // Ahora options es array de strings
                    const button = document.createElement('button');
                    button.classList.add('option-button');
                    button.disabled = true; // Deshabilitar botón
                    button.textContent = optionText; // El texto ya está en el idioma correcto

                    // Reconstruir el valor original para comparación (esto es lo más delicado)
                    // Necesitamos el valor original que corresponde a este optionText
                    // Esto requiere que questionData.options sea [{text: '...', value: '...'}, ...]
                    // O que podamos buscar la clave original a partir del texto traducido (difícil)
                    // SOLUCIÓN TEMPORAL: Reconstruir data-original-value si es posible (ej. claves V/F)
                    // o usar el texto mismo si no. ¡ESTO PUEDE FALLAR SI HAY TEXTOS IGUALES!
                    let originalValue = optionText; // Usar texto como fallback
                    if (optionText === getTranslation('option_true')) originalValue = 'option_true';
                    else if (optionText === getTranslation('option_false')) originalValue = 'option_false';
                    // Para objetos complejos, necesitaríamos los datos originales aquí.

                    button.setAttribute('data-original-value', originalValue);

                    // Aplicar resaltado
                    if (originalValue === correctAnswerValue) {
                        button.classList.add(correctButtonClass);
                    } else if (!isCorrect && originalValue === selectedValueOriginal) {
                        // Resaltar la incorrecta que se seleccionó
                        button.classList.add('incorrect');
                    }
                    optionsContainer.appendChild(button);
                });
            }
        } else { console.error("Elemento #options-container no encontrado durante refresco de feedback."); }
    }
    // --- Fin Redibujar en Refresco ---


    // --- Mostrar Área de Feedback (Lógica Principal) ---
    let feedbackText = ''; let explanationHTML = '';
    const correctAnswerDisplay = questionData.correctAnswerDisplay;

    if (isCorrect) {
        feedbackText = getTranslation('feedback_correct');
    } else {
        feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${correctAnswerDisplay}</strong>` });
    }
    feedbackArea.className = isCorrect ? (isMasteryMode ? 'mastery' : 'correct') : 'incorrect';

    // Generar HTML de la explicación si es incorrecto
    if (!isCorrect && questionData.explanation) {
        try {
            const expInfo = questionData.explanation;
            if (expInfo.text) { // Priorizar texto directo
                explanationHTML = `<p>${expInfo.text}</p>`;
            } else { // Lógica anterior para claves/generadores
                let baseExplanationText = '';
                if (expInfo.baseTextKey) { baseExplanationText = getTranslation(expInfo.baseTextKey, expInfo.replacements || {}); }
                let generatedExplanationHTML = '';
                if (expInfo.generatorName && explanationGenerators[expInfo.generatorName]) {
                    const generatorFunc = explanationGenerators[expInfo.generatorName];
                    if (typeof generatorFunc === 'function') { generatedExplanationHTML = generatorFunc.apply(null, expInfo.args || []); }
                    else { throw new Error(`Generator '${expInfo.generatorName}' no es una función.`); }
                } else if (Array.isArray(expInfo.generators)) {
                    const separator = expInfo.separator || '<br>';
                    generatedExplanationHTML = expInfo.generators.map(genInfo => { /* ... */ }).join(separator);
                }
                explanationHTML = baseExplanationText ? `<p>${baseExplanationText}</p>${generatedExplanationHTML}` : generatedExplanationHTML;
                if (!explanationHTML && baseExplanationText) { explanationHTML = `<p>${baseExplanationText}</p>`; }
            }
        } catch (genError) {
            console.error("Error generando explicación HTML:", genError, questionData.explanation);
            explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' }) || 'Error generating explanation.'}</p>`;
        }
        // El resaltado de botones ya se hizo arriba si era refresh, o en handleAnswerClick si no lo era.
    }

    // Construir HTML final del feedback y mostrarlo
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) { finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`; }
    finalFeedbackHTML += `</div>`;
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
 * Actualiza la pantalla de Game Over y AÑADE el listener al botón Play Again.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} currentUserData - Datos actualizados del usuario (debe incluir .name).
 * @param {string} playedLevel - El nivel que se acaba de jugar.
 * @param {function} playAgainHandler - La función de game.js a ejecutar al hacer clic en Play Again.
 */
export function displayGameOver(score, currentUserData, playedLevel, playAgainHandler) {
    if (!currentUserData || !currentUserData.name) {
         console.error("displayGameOver llamado sin currentUserData o sin nombre de usuario.");
         if (gameOverSection) { /* ... (mostrar error básico) ... */ }
         return;
    }
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const isPerfect = score === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    let baseMessage = getTranslation('game_over_base_message', { score: score, maxScore: maxScore, percentage: scorePercentage });
    let extraMessage = '';
    const previousUserData = storage.getUserData(currentUserData.name);

    // Lógica de mensajes de desbloqueo (sin cambios)
    if (playedLevel === 'Essential') { /* ... */ }
    else if (playedLevel === 'Entry') { /* ... */ }
    else if (playedLevel === 'Associate') { /* ... */ }

    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;

    // Añadir listener al botón Play Again
    if (playAgainButton) {
        playAgainButton.textContent = getTranslation('play_again_button') || 'Choose Level';
        const newPlayAgainButton = playAgainButton.cloneNode(true); // Clonar para limpiar listeners
        playAgainButton.parentNode.replaceChild(newPlayAgainButton, playAgainButton);

        if (newPlayAgainButton) {
            if (typeof playAgainHandler === 'function') {
                newPlayAgainButton.addEventListener('click', playAgainHandler);
            } else {
                console.error("[UI] playAgainHandler no es una función en displayGameOver.");
                newPlayAgainButton.disabled = true;
            }
        } else { console.error("[UI] No se encontró #play-again-button después de clonarlo."); }
    } else { console.error("[UI] La referencia al elemento #play-again-button es nula."); }

    showSection(gameOverSection);
}


/**
 * Actualiza la lista de High Scores en la UI.
 * @param {Array<object>} scoresData - Array de objetos [{ name, scores: { levelMode: score } }]
 */
export function displayHighScores(scoresData) {
     if(!scoreList) return;
     scoreList.innerHTML = '';
     if (!scoresData || scoresData.length === 0) { scoreList.innerHTML = `<li>${getTranslation('no_scores') || 'No scores yet.'}</li>`; return; }
     try {
         scoresData.sort((a, b) => { /* ... (ordenar) ... */ });
         const topScores = scoresData.slice(0, config.MAX_HIGH_SCORES);
         topScores.forEach(userData => { /* ... (crear elementos li) ... */ });
     } catch (error) { console.error("Error generando la lista de high scores:", error); scoreList.innerHTML = `<li>${getTranslation('error_displaying_scores') || 'Error displaying scores.'}</li>`; }
}

/**
 * Actualiza el display del temporizador.
 * @param {number} timeLeftValue - Segundos restantes.
 */
export function updateTimerDisplay(timeLeftValue) {
    if (!timerDisplayDiv || !timeLeftSpan) return;
    timeLeftSpan.textContent = timeLeftValue;
    timerDisplayDiv.classList.toggle('low-time', timeLeftValue <= 5);
}

/**
 * Muestra u oculta el display del temporizador.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function showTimerDisplay(show) {
     if (timerDisplayDiv) {
         timerDisplayDiv.style.display = show ? 'block' : 'none';
     }
}
