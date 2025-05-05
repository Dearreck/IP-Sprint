// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Gestiona la manipulación del DOM y la presentación visual.
// Incluye lógica para generar el Stepper y la Tarjeta de Nivel.
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

// Mapa para llamar a los generadores de explicaciones desde utils.js
const explanationGenerators = {
    generateClassRangeTableHTML,
    generatePrivateRangeTableHTML,
    generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML,
    generateWildcardExplanationHTML,
    generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML,
    generateBitsForSubnetsExplanationHTML,
    generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML,
    generateNumSubnetsExplanationHTML
};

// Iconos para cada nivel
const levelIcons = {
    'Essential': 'fa-book-open',
    'Entry': 'fa-star',
    'Associate': 'fa-graduation-cap',
    'Professional': 'fa-briefcase',
    'Expert': 'fa-trophy'
};

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

    if (sectionToShow === levelSelectSection || sectionToShow === gameOverSection) {
        if (highScoresSection) highScoresSection.style.display = 'block';
    }
     if (unlockProgressSection) unlockProgressSection.style.display = 'none';
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


// --- Lógica para Stepper y Tarjeta ---

/**
 * Genera y muestra el Stepper horizontal y prepara el área de la tarjeta.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos del usuario (para rachas, etc.).
 * @param {string} currentUsername - El nombre del usuario actual.
 * @param {function} levelSelectHandler - La función (de game.js) a llamar al hacer clic en un marcador.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, currentUsername, levelSelectHandler) {
    if (!levelStepperContainer || !levelCardContent || !config.LEVELS || !currentUserData || !currentUsername) {
        console.error("Error en displayLevelSelection: Faltan elementos del DOM o datos necesarios."); // Mantener error crítico
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
            if (firstUnlockedLevelName === null) {
                firstUnlockedLevelName = level;
            }
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
        console.error(`[UI] No se encontró el stepper item para el nivel por defecto: ${effectiveFirstLevel}`); // Mantener error crítico
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
            console.error(`[UI] ERROR: levelSelectHandler NO es una función en updateLevelCard para nivel ${levelName}. Tipo: ${typeof levelSelectHandler}`); // Mantener error crítico
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
 * @param {number} lastUnlockedIndex - Índice del último nivel desbloqueado (-1 si ninguno).
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
 * @param {Array<boolean>} roundResults - Array con los resultados (true/false) de la ronda.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo de corona.
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
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); } // Mantener error crítico
}

/**
 * Muestra la pregunta actual y genera los botones de opción.
 * Adaptado para esperar texto directo o claves i18n.
 * @param {object} questionData - Objeto con la información de la pregunta.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) {
             console.error("Error en displayQuestion: Faltan elementos del DOM."); // Mantener error crítico
             return;
        }
        feedbackArea.innerHTML = ''; feedbackArea.className = '';
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('options-disabled');

        let finalQuestionHTML = '';

        if (questionData.theoryKey) {
            const theoryText = getTranslation(questionData.theoryKey);
            if (theoryText && theoryText !== questionData.theoryKey) {
                finalQuestionHTML += `<div class="theory-presentation">${theoryText}</div><hr class="theory-separator">`;
            }
        }

        let questionDisplayHTML = '';
        if (questionData.question?.text) {
            questionDisplayHTML = questionData.question.text;
        } else if (questionData.question?.key) {
            const questionReplacements = questionData.question.replacements || {};
            questionDisplayHTML = getTranslation(questionData.question.key, questionReplacements);
        } else {
            console.error("[UI] Datos de pregunta inválidos:", questionData.question); // Mantener error crítico
            questionDisplayHTML = "Error: Invalid Question.";
        }
        finalQuestionHTML += questionDisplayHTML;

        questionText.innerHTML = finalQuestionHTML;

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
                 console.error("answerClickHandler no es una función en displayQuestion"); // Mantener error crítico
            }
            optionsContainer.appendChild(button);
        });

    } catch (error) {
        console.error("Error en displayQuestion:", error); // Mantener error crítico
        if(questionText) questionText.textContent = getTranslation('error_displaying_question') || 'Error displaying question.';
        if(optionsContainer) optionsContainer.innerHTML = "";
    }
}


/**
 * Muestra el feedback (correcto/incorrecto) después de una respuesta.
 * Adaptado para esperar texto directo o claves i18n.
 * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo mastery.
 * @param {object} questionData - Objeto con los datos de la pregunta actual.
 * @param {function} nextStepHandler - Función a llamar al hacer clic en "Siguiente".
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined || questionData.correctAnswerDisplay === undefined) {
         console.error("Error en displayFeedback: Faltan elementos o datos (incl. correctAnswerDisplay).", {feedbackArea, questionData}); // Mantener error crítico
         return;
    }
    let feedbackText = ''; let explanationHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    const correctAnswerDisplay = questionData.correctAnswerDisplay;
    if (isCorrect) {
        feedbackText = getTranslation('feedback_correct');
    } else {
        feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${correctAnswerDisplay}</strong>` });
    }
    feedbackArea.className = isCorrect ? (isMasteryMode ? 'mastery' : 'correct') : 'incorrect';

    if (!isCorrect && questionData.explanation) {
        try {
            const expInfo = questionData.explanation;
            if (expInfo.text) {
                explanationHTML = `<p>${expInfo.text}</p>`;
            } else {
                let baseExplanationText = '';
                if (expInfo.baseTextKey) { baseExplanationText = getTranslation(expInfo.baseTextKey, expInfo.replacements || {}); }
                let generatedExplanationHTML = '';
                if (expInfo.generatorName && explanationGenerators[expInfo.generatorName]) {
                    const generatorFunc = explanationGenerators[expInfo.generatorName];
                    if (typeof generatorFunc === 'function') { generatedExplanationHTML = generatorFunc.apply(null, expInfo.args || []); }
                    else { throw new Error(`Generator '${expInfo.generatorName}' no es una función.`); }
                } else if (Array.isArray(expInfo.generators)) {
                    const separator = expInfo.separator || '<br>';
                    generatedExplanationHTML = expInfo.generators.map(genInfo => {
                         if (genInfo.generatorName && explanationGenerators[genInfo.generatorName]) {
                             const generatorFunc = explanationGenerators[genInfo.generatorName];
                             if (typeof generatorFunc === 'function') { return generatorFunc.apply(null, genInfo.args || []); }
                             else { throw new Error(`Generator '${genInfo.generatorName}' no es una función.`); }
                         } return '';
                    }).join(separator);
                }
                explanationHTML = baseExplanationText ? `<p>${baseExplanationText}</p>${generatedExplanationHTML}` : generatedExplanationHTML;
                if (!explanationHTML && baseExplanationText) { explanationHTML = `<p>${baseExplanationText}</p>`; }
            }
        } catch (genError) {
            console.error("Error generando explicación HTML:", genError, questionData.explanation); // Mantener error crítico
            explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' }) || 'Error generating explanation.'}</p>`;
        }

        try {
            if(optionsContainer) {
                const correctAnswerValue = questionData.correctAnswer;
                Array.from(optionsContainer.children).forEach(button => {
                    if (button.getAttribute('data-original-value') === correctAnswerValue) {
                        button.classList.add(correctButtonClass);
                    }
                });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); } // Mantener error crítico
    }

    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) { finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`; }
    finalFeedbackHTML += `</div>`;
    if (!isCorrect) {
        const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'final_result_button' : 'next_button';
        finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }
    feedbackArea.innerHTML = finalFeedbackHTML;

    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
            } else { console.error("nextStepHandler no es una función en displayFeedback"); } // Mantener error crítico
        } else { console.error("No se encontró el botón 'next-question-button' inmediatamente después de crearlo."); } // Mantener error crítico
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
         console.error("displayGameOver llamado sin currentUserData o sin nombre de usuario."); // Mantener error crítico
         if (gameOverSection) {
             if(finalScoreDisplay) finalScoreDisplay.textContent = score;
             if(highScoreMessage) highScoreMessage.textContent = getTranslation('error_displaying_results') || "Error displaying results.";
             showSection(gameOverSection);
         }
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

    if (playedLevel === 'Essential') {
         if (isPerfect) extraMessage = getTranslation('game_over_good_round_essential') || "Good start!";
    } else if (playedLevel === 'Entry') {
        if (isPerfect && currentUserData.entryPerfectStreak !== undefined) {
            const wasAssociateLocked = !previousUserData.unlockedLevels.includes('Associate');
            const isAssociateUnlockedNow = currentUserData.unlockedLevels.includes('Associate');
            if (isAssociateUnlockedNow && wasAssociateLocked) {
                extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') });
            } else if (!isAssociateUnlockedNow) {
                extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak });
            } else {
                extraMessage = getTranslation('game_over_good_round_entry');
            }
        }
    } else if (playedLevel === 'Associate') {
         if (meetsAssociateThreshold && currentUserData.associatePerfectStreak !== undefined) {
             const wasProLocked = !previousUserData.unlockedLevels.includes('Professional');
             const isProUnlockedNow = currentUserData.unlockedLevels.includes('Professional');
             if (isProUnlockedNow && wasProLocked) {
                 extraMessage = getTranslation('game_over_level_unlocked_pro');
             } else if (!isProUnlockedNow) {
                 extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak });
             } else {
                 extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK });
             }
         }
    }

    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;

    if (playAgainButton) {
        playAgainButton.textContent = getTranslation('play_again_button') || 'Choose Level';
        const newPlayAgainButton = playAgainButton.cloneNode(true);
        playAgainButton.parentNode.replaceChild(newPlayAgainButton, playAgainButton);

        if (newPlayAgainButton) { // Verificar que el clon existe
            if (typeof playAgainHandler === 'function') {
                // console.log("[UI] Añadiendo listener a #play-again-button clonado.");
                newPlayAgainButton.addEventListener('click', playAgainHandler);
            } else {
                console.error("[UI] playAgainHandler no es una función en displayGameOver."); // Mantener error crítico
                newPlayAgainButton.disabled = true;
            }
        } else {
             console.error("[UI] No se encontró #play-again-button después de clonarlo."); // Mantener error crítico
        }
    } else {
        console.error("[UI] La referencia al elemento #play-again-button es nula."); // Mantener error crítico
    }

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
         scoresData.sort((a, b) => {
             const maxA = Math.max(0, ...Object.values(a.scores || {}));
             const maxB = Math.max(0, ...Object.values(b.scores || {}));
             return maxB - maxA;
         });
         const topScores = scoresData.slice(0, config.MAX_HIGH_SCORES);

         topScores.forEach(userData => {
             const userEntry = document.createElement('li'); userEntry.classList.add('score-entry');
             const userNameElement = document.createElement('div'); userNameElement.classList.add('score-username'); userNameElement.textContent = userData.name; userEntry.appendChild(userNameElement);
             const levelScoresContainer = document.createElement('div'); levelScoresContainer.classList.add('level-scores');
             const displayOrder = config.LEVELS.map(level => ({
                 key: `${level}-standard`,
                 labelKey: `level_${level.toLowerCase()}`
             }));

             let hasScores = false;
             displayOrder.forEach(levelInfo => {
                 if (userData.scores && userData.scores.hasOwnProperty(levelInfo.key)) {
                     const levelScoreElement = document.createElement('span');
                     levelScoreElement.classList.add('level-score-item');
                     const label = getTranslation(levelInfo.labelKey) || levelInfo.key.split('-')[0];
                     levelScoreElement.innerHTML = `${label}: <strong>${userData.scores[levelInfo.key]}</strong>`;
                     levelScoresContainer.appendChild(levelScoreElement);
                     hasScores = true;
                 }
             });
             if(hasScores) { userEntry.appendChild(levelScoresContainer); }
             else { const noScoreMsg = document.createElement('div'); noScoreMsg.textContent = `(${getTranslation('no_scores_recorded') || 'No scores recorded'})`; noScoreMsg.style.fontSize = "0.8em"; noScoreMsg.style.color = "#888"; userEntry.appendChild(noScoreMsg); }
             scoreList.appendChild(userEntry);
         });
     } catch (error) { console.error("Error generando la lista de high scores:", error); scoreList.innerHTML = `<li>${getTranslation('error_displaying_scores') || 'Error displaying scores.'}</li>`; } // Mantener error crítico
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
