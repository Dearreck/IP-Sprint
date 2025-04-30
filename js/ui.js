// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// ... (Selectores DOM iguales que antes) ...
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import { handleAnswerClick } from './game.js'; // Necesario para refreshActiveGameUI -> displayQuestion
import { getTranslation } from './i18n.js';
// --- NUEVO: Importar generadores de tablas de utils.js ---
import {
    generateClassRangeTableHTML,
    generateClassMaskTableHTML,
    generatePrivateRangeTableHTML,
    generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML
} from './utils.js';
// --- FIN NUEVO ---

// --- Selección de Elementos del DOM ---
// (Igual que antes)
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
export const gameOverSection = document.getElementById('game-over');
export const unlockProgressSection = document.getElementById('unlock-progress-section');
export const highScoresSection = document.getElementById('high-scores-section');
export const usernameForm = document.getElementById('username-form');
export const usernameInput = document.getElementById('username');
export const levelButtonsContainer = document.getElementById('level-buttons-container');
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

// --- NUEVO: Mapa para llamar a los generadores de utils.js ---
const explanationGenerators = {
    generateClassRangeTableHTML,
    generateClassMaskTableHTML,
    generatePrivateRangeTableHTML,
    generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML
};
// --- FIN NUEVO ---


// --- Funciones de Manipulación de la UI ---

// ... (showSection, updatePlayerInfo, displayLevelSelection, updateUnlockProgressUI, updateRoundProgressUI, displayQuestion iguales que antes) ...
/**
 * Muestra una sección específica del juego y oculta las demás.
 * @param {HTMLElement} sectionToShow - El elemento de la sección que se debe mostrar.
 */
export function showSection(sectionToShow) {
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];
    sections.forEach(section => {
        if (section) {
            let shouldDisplay = false;
            if (section === sectionToShow) {
                shouldDisplay = true;
            } else if (section === unlockProgressSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) {
                shouldDisplay = true;
            } else if (section === highScoresSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) {
                shouldDisplay = true;
            }
            section.style.display = shouldDisplay ? 'block' : 'none';
        }
    });
     if(sectionToShow === gameAreaSection) {
         if(unlockProgressSection) unlockProgressSection.style.display = 'none';
         if(highScoresSection) highScoresSection.style.display = 'none';
     }
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI del área de juego.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (ej. 'Entry', 'Associate').
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

/**
 * Genera y muestra los botones de selección de nivel basados en los niveles desbloqueados.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (para progreso).
 * @param {function} levelSelectHandler - La función a llamar cuando se hace clic en un botón de nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    if (!levelButtonsContainer || !unlockedLevels) {
        console.error("Error: Falta levelButtonsContainer o unlockedLevels en displayLevelSelection.");
        return;
    }
    levelButtonsContainer.innerHTML = '';
    try {
        if (unlockedLevels.includes('Entry')) {
            const entryBtn = document.createElement('button');
            entryBtn.textContent = getTranslation('level_entry_standard');
            entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
            levelButtonsContainer.appendChild(entryBtn);
        }
        if (unlockedLevels.includes('Associate')) { // Mastery se desbloquea con Associate
            const entryTimerBtn = document.createElement('button');
            entryTimerBtn.textContent = getTranslation('level_entry_mastery');
            entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
            levelButtonsContainer.appendChild(entryTimerBtn);
        }
        unlockedLevels.forEach(level => {
            if (level !== 'Entry') {
                const button = document.createElement('button');
                button.textContent = getTranslation(`level_${level.toLowerCase()}`);
                button.addEventListener('click', () => levelSelectHandler(level, 'standard')); // Asume modo standard para otros niveles
                levelButtonsContainer.appendChild(button);
            }
        });
    } catch (error) {
        console.error("Error generando botones de nivel:", error);
        levelButtonsContainer.innerHTML = `<p>${getTranslation('error_loading_levels', { error: error.message })}</p>`;
        return;
    }
    try {
        updateUnlockProgressUI(currentUserData);
    } catch (error) {
        console.error("Error en updateUnlockProgressUI desde displayLevelSelection:", error);
    }
    showSection(levelSelectSection);
}


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (estrellas y título).
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    try {
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle) {
             if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             return;
        }
        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0;
        const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null; let currentStreak = 0; let progressTitleKey = ""; let showProgress = false;

        if (!unlocked.includes('Associate')) { targetLevel = 'Associate'; currentStreak = entryStreak; progressTitleKey = "progress_title_associate"; showProgress = true; }
        else if (!unlocked.includes('Professional')) { targetLevel = 'Professional'; currentStreak = associateStreak; progressTitleKey = "progress_title_professional"; showProgress = true; }
        else { targetLevel = 'None'; progressTitleKey = "progress_title_all_unlocked"; showProgress = false; }

        unlockProgressTitle.textContent = getTranslation(progressTitleKey);

        if (showProgress) {
            let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; }
            progressStarsSpan.textContent = stars;
            if(progressStarsSpan) progressStarsSpan.style.display = 'inline';
            unlockProgressDiv.style.display = 'block';
            unlockProgressSection.style.display = 'block';
        } else {
            unlockProgressDiv.style.display = 'none';
             if (targetLevel === 'None' && unlockProgressTitle) {
                 unlockProgressTitle.textContent = getTranslation(progressTitleKey);
                 unlockProgressDiv.style.display = 'block';
                 if(progressStarsSpan) progressStarsSpan.style.display = 'none';
                 unlockProgressSection.style.display = 'block';
             } else {
                 if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             }
        }
    } catch(error) {
        console.error("Error en updateUnlockProgressUI:", error);
        if(unlockProgressSection) unlockProgressSection.style.display = 'none';
    }
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
        for (let i = 0; i < config.TOTAL_QUESTIONS_PER_GAME; i++) {
            if (i < roundResults.length) {
                if (roundResults[i] === true) { starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>'; }
                else { starsHTML += '<i class="fas fa-star star-incorrect"></i>'; }
            } else { starsHTML += '<i class="far fa-star star-pending"></i>'; }
        }
        roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción traducidos.
 * @param {object} questionData - Objeto con { question: {key, replacements}, options: [string|object], correctAnswer, explanation }.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) { console.error("Error: Faltan elementos DOM en displayQuestion."); return; }
        // Limpiar feedback al mostrar nueva pregunta
        feedbackArea.innerHTML = '';
        feedbackArea.className = '';
        // Mostrar texto de la pregunta
        questionText.innerHTML = getTranslation(questionData.question.key, questionData.question.replacements);
        // Limpiar opciones anteriores
        optionsContainer.innerHTML = '';
        if (!questionData.options || !Array.isArray(questionData.options)) { throw new Error("optionsArray inválido o no es un array."); }

        // Crear botones de opción
        questionData.options.forEach((optionData) => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            let buttonText = '';
            let originalValue = '';

            // ... (lógica para buttonText y originalValue igual que antes) ...
            if (typeof optionData === 'string') { const translated = getTranslation(optionData); buttonText = (translated && translated !== optionData) ? translated : optionData; originalValue = optionData; }
            else if (typeof optionData === 'object') { if (optionData.classKey && optionData.typeKey) { buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation(optionData.typeKey)}`; originalValue = `${optionData.classKey},${optionData.typeKey}`; } else if (optionData.classKey && optionData.maskValue) { buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation('option_mask', { mask: optionData.maskValue })}`; originalValue = `${optionData.classKey},${optionData.maskValue}`; } else if (optionData.classKey && optionData.portionKey) { buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation(optionData.portionKey, { portion: optionData.portionValue || getTranslation('option_none') })}`; originalValue = `${optionData.classKey},${optionData.portionKey},${optionData.portionValue || 'None'}`; } else { buttonText = JSON.stringify(optionData); originalValue = buttonText; console.warn("Formato de objeto de opción desconocido:", optionData); } }
            else { buttonText = 'Opción Inválida'; originalValue = 'invalid'; console.warn("Tipo de dato de opción inesperado:", optionData); }

            button.textContent = buttonText;
            button.setAttribute('data-original-value', originalValue);

            if (typeof answerClickHandler === 'function') { button.addEventListener('click', answerClickHandler); }
            else { console.error("answerClickHandler no es una función en displayQuestion"); }
            optionsContainer.appendChild(button);
        });

        // Asegurar que las opciones estén habilitadas al mostrar la pregunta
        optionsContainer.classList.remove('options-disabled');
    } catch (error) {
        console.error("Error en displayQuestion:", error);
        if(questionText) questionText.textContent = getTranslation('error_displaying_question');
        if(optionsContainer) optionsContainer.innerHTML = "";
    }
}


/**
 * Muestra el feedback (correcto/incorrecto) después de una respuesta.
 * MODIFICADO: Ahora genera el HTML de la explicación dinámicamente.
 * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo mastery.
 * @param {object} questionData - Objeto con los datos de la pregunta actual.
 * @param {function} nextStepHandler - Función a llamar al hacer clic en "Siguiente".
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined) { console.error("Error: Falta feedbackArea o questionData/correctAnswer en displayFeedback."); return; }

    let feedbackText = ''; // Texto base (Correcto/Incorrecto)
    let explanationHTML = ''; // HTML de la explicación (texto + tabla)
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    // Traducir la respuesta correcta para mostrarla en el mensaje "Incorrecto"
    let translatedCorrectAnswer = '';
    const ca = questionData.correctAnswer;
    // ... (lógica para traducir ca igual que antes) ...
    if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
    else if (typeof ca === 'object') { if (ca.classKey && ca.typeKey) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.typeKey)}`; } else if (ca.classKey && ca.maskValue) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation('option_mask', { mask: ca.maskValue })}`; } else if (ca.classKey && ca.portionKey) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.portionKey, { portion: ca.portionValue || getTranslation('option_none') })}`; } else { translatedCorrectAnswer = JSON.stringify(ca); } }
    else { translatedCorrectAnswer = 'N/A'; }

    if (isCorrect) {
        feedbackText = getTranslation('feedback_correct');
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
    } else {
        feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
        feedbackArea.className = 'incorrect';

        // --- MODIFICADO: Generar explicación dinámicamente ---
        try {
            const expInfo = questionData.explanation;
            let baseExplanationText = '';

            // Obtener texto base si existe
            if (expInfo && expInfo.baseTextKey) {
                baseExplanationText = getTranslation(expInfo.baseTextKey, expInfo.replacements || {});
            }

            // Generar tabla(s) si existe(n) info del generador
            let generatedTableHTML = '';
            if (expInfo && expInfo.generatorName && explanationGenerators[expInfo.generatorName]) {
                // Caso: Un solo generador
                const generatorFunc = explanationGenerators[expInfo.generatorName];
                generatedTableHTML = generatorFunc.apply(null, expInfo.args || []); // Llamar a la función con sus args
            } else if (expInfo && Array.isArray(expInfo.generators)) {
                // Caso: Múltiples generadores
                const separator = expInfo.separator || '<br>'; // Usar separador o <br>
                generatedTableHTML = expInfo.generators.map(genInfo => {
                    if (genInfo.generatorName && explanationGenerators[genInfo.generatorName]) {
                        const generatorFunc = explanationGenerators[genInfo.generatorName];
                        return generatorFunc.apply(null, genInfo.args || []);
                    }
                    return ''; // Retornar string vacío si el generador no es válido
                }).join(separator); // Unir tablas con separador
            }

            // Combinar texto base y tabla(s) generada(s)
            explanationHTML = baseExplanationText ? `<p>${baseExplanationText}</p>${generatedTableHTML}` : generatedTableHTML;

        } catch (genError) {
            console.error("Error generando explicación HTML dinámicamente:", genError, questionData.explanation);
            explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' })}</p>`; // Mensaje de error genérico
        }
        // --- FIN MODIFICADO ---

        // Resaltar botón correcto (lógica igual que antes)
        try {
            if(optionsContainer) {
                let correctOriginalValueStr = '';
                // ... (lógica para construir correctOriginalValueStr igual que antes) ...
                if (typeof ca === 'string') { correctOriginalValueStr = ca; } else if (typeof ca === 'object' && ca.classKey && ca.typeKey) { correctOriginalValueStr = `${ca.classKey},${ca.typeKey}`; } else if (typeof ca === 'object' && ca.classKey && ca.maskValue) { correctOriginalValueStr = `${ca.classKey},${ca.maskValue}`; } else if (typeof ca === 'object' && ca.classKey && ca.portionKey) { correctOriginalValueStr = `${ca.classKey},${ca.portionKey},${ca.portionValue || 'None'}`; } else { correctOriginalValueStr = JSON.stringify(ca); }

                Array.from(optionsContainer.children).forEach(button => { if (button.getAttribute('data-original-value') === correctOriginalValueStr) { button.classList.add(correctButtonClass); } });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }
    }

    // Construir el HTML final del feedback
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) {
        finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`;
    }
    finalFeedbackHTML += `</div>`;

    // Añadir botón "Siguiente" solo si la respuesta fue incorrecta
    if (!isCorrect) {
        const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'final_result_button' : 'next_button';
        finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }

    // Actualizar el DOM
    feedbackArea.innerHTML = finalFeedbackHTML;

    // Añadir listener al botón "Siguiente" si existe
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
            } else {
                console.error("nextStepHandler no es una función en displayFeedback");
            }
        } else {
            // Este error podría ocurrir si el DOM no se actualiza instantáneamente.
            // Considerar un pequeño retraso si esto pasa consistentemente.
            console.error("No se encontró el botón 'next-question-button' inmediatamente después de crearlo.");
        }
    }
}


/**
 * Actualiza la pantalla de Game Over.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} currentUserData - Datos actualizados del usuario.
 * @param {string} playedLevel - El nivel que se acaba de jugar.
 */
export function displayGameOver(score, currentUserData, playedLevel) {
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;

    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPerfect = score === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    let baseMessage = getTranslation('game_over_base_message', { score: score, maxScore: maxScore, percentage: scorePercentage.toFixed(0) });
    let extraMessage = '';

    // ... (lógica para construir extraMessage igual que antes) ...
    if (playedLevel === 'Entry') { if (isPerfect) { if (currentUserData.unlockedLevels.includes('Associate') && currentUserData.entryPerfectStreak === 0) { extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') }); } else if (!currentUserData.unlockedLevels.includes('Associate')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak }); } else { extraMessage = getTranslation('game_over_good_round_entry'); } } else { if (storage.getUserData(currentUserData.username || '')?.entryPerfectStreak > 0) { extraMessage = getTranslation('game_over_streak_reset_100'); } } }
    else if (playedLevel === 'Associate') { if (meetsAssociateThreshold) { if (currentUserData.unlockedLevels.includes('Professional') && currentUserData.associatePerfectStreak === 0) { extraMessage = getTranslation('game_over_level_unlocked_pro'); } else if (!currentUserData.unlockedLevels.includes('Professional')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak }); } else { extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK }); } } else { if (storage.getUserData(currentUserData.username || '')?.associatePerfectStreak > 0) { extraMessage = getTranslation('game_over_streak_reset_90'); } } }

    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;

    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) {
            const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`);
            playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName });
        } else {
            playAgainButton.textContent = getTranslation('play_again_button');
        }
    }
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayGameOver:", error); }
    showSection(gameOverSection);
}

/**
 * Actualiza la lista de High Scores en la UI.
 * @param {Array<object>} scoresData - Array de objetos [{ name: string, scores: { levelMode: score, ... } }, ...]
 */
export function displayHighScores(scoresData) {
     if(!scoreList) { console.error("Elemento scoreList no encontrado."); return; }
     scoreList.innerHTML = '';
     if (!scoresData || scoresData.length === 0) { scoreList.innerHTML = `<li>${getTranslation('no_scores')}</li>`; return; }
     try {
         scoresData.forEach(userData => {
             const userEntry = document.createElement('li'); userEntry.classList.add('score-entry');
             const userNameElement = document.createElement('div'); userNameElement.classList.add('score-username'); userNameElement.textContent = userData.name; userEntry.appendChild(userNameElement);
             const levelScoresContainer = document.createElement('div'); levelScoresContainer.classList.add('level-scores');
             const displayOrder = [ { key: 'Entry-standard', labelKey: 'level_entry_standard' }, { key: 'Entry-mastery', labelKey: 'level_entry_mastery' }, { key: 'Associate-standard', labelKey: 'level_associate' }, { key: 'Professional-standard', labelKey: 'level_professional' } ];
             let hasScores = false;
             displayOrder.forEach(levelInfo => { if (userData.scores && userData.scores[levelInfo.key] !== undefined) { const levelScoreElement = document.createElement('span'); levelScoreElement.classList.add('level-score-item'); const label = getTranslation(levelInfo.labelKey); levelScoreElement.innerHTML = `${label}: <strong>${userData.scores[levelInfo.key]}</strong>`; levelScoresContainer.appendChild(levelScoreElement); hasScores = true; } });
             if(hasScores) { userEntry.appendChild(levelScoresContainer); } else { const noScoreMsg = document.createElement('div'); noScoreMsg.textContent = `(${getTranslation('no_scores_recorded')})`; noScoreMsg.style.fontSize = "0.8em"; noScoreMsg.style.color = "#888"; userEntry.appendChild(noScoreMsg); }
             scoreList.appendChild(userEntry);
         });
     } catch (error) { console.error("Error generando la lista de high scores:", error); scoreList.innerHTML = `<li>${getTranslation('error_displaying_scores')}</li>`; }
}

/**
 * Actualiza el display del temporizador.
 * @param {number} timeLeftValue - Segundos restantes.
 */
export function updateTimerDisplay(timeLeftValue) {
    if (!timerDisplayDiv || !timeLeftSpan) return;
    timeLeftSpan.textContent = timeLeftValue;
    if (timeLeftValue <= 5) { timerDisplayDiv.classList.add('low-time'); }
    else { timerDisplayDiv.classList.remove('low-time'); }
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
