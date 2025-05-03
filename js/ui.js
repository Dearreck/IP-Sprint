// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Gestiona la manipulación del DOM y la presentación visual.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import { handleAnswerClick } from './game.js'; // Necesario para refreshActiveGameUI -> displayQuestion
import { getTranslation } from './i18n.js';
import {
    // Generadores de Explicaciones
    generateClassRangeTableHTML,
    generatePrivateRangeTableHTML,
    generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML,
    generateWildcardExplanationHTML,
    generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML,
    generateBitsForSubnetsExplanationHTML,
    generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML
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
    generateMaskForHostsExplanationHTML
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
    // Ocultar todas primero
    sections.forEach(section => { if (section) section.style.display = 'none'; });

    // Mostrar la sección deseada
    if (sectionToShow) sectionToShow.style.display = 'block';

    // Mostrar secciones auxiliares según la principal
    if (sectionToShow === levelSelectSection || sectionToShow === gameOverSection) {
        if (unlockProgressSection) unlockProgressSection.style.display = 'block';
        if (highScoresSection) highScoresSection.style.display = 'block';
    }
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (clave no traducida).
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    // Traduce la clave del nivel antes de mostrarla
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

/**
 * Genera y muestra los botones de selección de nivel.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (para progreso).
 * @param {function} levelSelectHandler - La función a llamar cuando se hace clic en un botón de nivel/modo.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    if (!levelButtonsContainer || !unlockedLevels) return;
    levelButtonsContainer.innerHTML = '';
    try {
        // Entry Standard siempre disponible
        if (unlockedLevels.includes('Entry')) {
            const entryBtn = document.createElement('button');
            entryBtn.textContent = getTranslation('level_entry_standard');
            entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
            levelButtonsContainer.appendChild(entryBtn);
        }
        // Entry Mastery se desbloquea con Associate
        if (unlockedLevels.includes('Associate')) {
            const entryTimerBtn = document.createElement('button');
            entryTimerBtn.textContent = getTranslation('level_entry_mastery');
            entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
            levelButtonsContainer.appendChild(entryTimerBtn);
        }
        // Botones para otros niveles desbloqueados
        unlockedLevels.forEach(level => {
            if (level !== 'Entry') { // Evitar duplicar Entry
                const button = document.createElement('button');
                button.textContent = getTranslation(`level_${level.toLowerCase()}`); // Asume modo standard
                button.addEventListener('click', () => levelSelectHandler(level, 'standard'));
                levelButtonsContainer.appendChild(button);
            }
        });
    } catch (error) {
        console.error("Error generando botones de nivel:", error);
        levelButtonsContainer.innerHTML = `<p>${getTranslation('error_loading_levels', { error: error.message })}</p>`;
        return;
    }
    // Actualizar UI de progreso de desbloqueo
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayLevelSelection:", error); }
    // Mostrar la sección de selección
    showSection(levelSelectSection);
}

/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel.
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    try {
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle) {
             if(unlockProgressSection) unlockProgressSection.style.display = 'none'; return;
        }
        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0;
        const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null; let currentStreak = 0; let progressTitleKey = ""; let showProgress = false;

        // Determinar qué progreso mostrar
        if (!unlocked.includes('Associate')) { targetLevel = 'Associate'; currentStreak = entryStreak; progressTitleKey = "progress_title_associate"; showProgress = true; }
        else if (!unlocked.includes('Professional')) { targetLevel = 'Professional'; currentStreak = associateStreak; progressTitleKey = "progress_title_professional"; showProgress = true; }
        else { targetLevel = 'None'; progressTitleKey = "progress_title_all_unlocked"; showProgress = false; } // Todos desbloqueados

        // Actualizar título
        unlockProgressTitle.textContent = getTranslation(progressTitleKey);

        // Mostrar/ocultar estrellas y sección
        if (showProgress) {
            let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; }
            progressStarsSpan.textContent = stars;
            if(progressStarsSpan) progressStarsSpan.style.display = 'inline';
            unlockProgressDiv.style.display = 'block';
            unlockProgressSection.style.display = 'block';
        } else {
            unlockProgressDiv.style.display = 'none';
            if (targetLevel === 'None' && unlockProgressTitle) { // Mostrar mensaje "Todos desbloqueados"
                 unlockProgressDiv.style.display = 'block';
                 if(progressStarsSpan) progressStarsSpan.style.display = 'none';
                 unlockProgressSection.style.display = 'block';
             } else { // Ocultar toda la sección si no hay progreso ni mensaje final
                 if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             }
        }
    } catch(error) { console.error("Error en updateUnlockProgressUI:", error); if(unlockProgressSection) unlockProgressSection.style.display = 'none'; }
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
            if (i < roundResults.length) { // Pregunta respondida
                if (roundResults[i] === true) { starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>'; }
                else { starsHTML += '<i class="fas fa-star star-incorrect"></i>'; }
            } else { // Pregunta pendiente
                starsHTML += '<i class="far fa-star star-pending"></i>';
            }
        }
        roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción traducidos.
 * @param {object} questionData - Objeto con la información de la pregunta.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) return;
        feedbackArea.innerHTML = ''; feedbackArea.className = ''; // Limpiar feedback
        questionText.innerHTML = getTranslation(questionData.question.key, questionData.question.replacements);
        optionsContainer.innerHTML = ''; // Limpiar opciones anteriores
        if (!questionData.options || !Array.isArray(questionData.options)) throw new Error("optionsArray inválido.");

        // Crear botones de opción
        questionData.options.forEach((optionData) => {
            const button = document.createElement('button'); button.classList.add('option-button');
            let buttonText = ''; let originalValue = '';

            if (typeof optionData === 'string') { // Opción simple (IP, máscara, #bits, clave i18n)
                const translated = getTranslation(optionData);
                buttonText = (translated && translated !== optionData) ? translated : optionData;
                originalValue = optionData;
            } else if (typeof optionData === 'object') { // Opción compleja (Clase/Tipo/Máscara/Porción)
                let textParts = []; let originalValueParts = [];
                if (optionData.classKey) { textParts.push(getTranslation(optionData.classKey)); originalValueParts.push(optionData.classKey); }
                if (optionData.typeKey) { textParts.push(getTranslation(optionData.typeKey)); originalValueParts.push(optionData.typeKey); }
                if (optionData.maskValue) { textParts.push(getTranslation('option_mask', { mask: optionData.maskValue })); originalValueParts.push(optionData.maskValue); }
                if (optionData.portionKey) { const portionVal = optionData.portionValue || getTranslation('option_none'); textParts.push(getTranslation(optionData.portionKey, { portion: portionVal })); originalValueParts.push(optionData.portionKey); originalValueParts.push(optionData.portionValue || 'None'); }
                buttonText = textParts.join(', ');
                originalValue = originalValueParts.join(','); // Usar coma como separador estándar para valor original
                if (textParts.length === 0) { buttonText = JSON.stringify(optionData); originalValue = buttonText; }
            } else { buttonText = 'Opción Inválida'; originalValue = 'invalid'; }

            button.textContent = buttonText;
            button.setAttribute('data-original-value', originalValue);
            if (typeof answerClickHandler === 'function') { button.addEventListener('click', answerClickHandler); }
            optionsContainer.appendChild(button);
        });
        optionsContainer.classList.remove('options-disabled'); // Asegurar que estén habilitadas
    } catch (error) { console.error("Error en displayQuestion:", error); if(questionText) questionText.textContent = getTranslation('error_displaying_question'); if(optionsContainer) optionsContainer.innerHTML = ""; }
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
    let feedbackText = ''; let explanationHTML = ''; const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    // Traducir la respuesta correcta para el mensaje de feedback
    let translatedCorrectAnswer = ''; const ca = questionData.correctAnswer;
    if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
    else if (typeof ca === 'object') { let textParts = []; if (ca.classKey) textParts.push(getTranslation(ca.classKey)); if (ca.typeKey) textParts.push(getTranslation(ca.typeKey)); if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue })); if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); } if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); } else { translatedCorrectAnswer = JSON.stringify(ca); } }
    else { translatedCorrectAnswer = ca.toString(); } // Convertir números a string

    // Texto base del feedback
    if (isCorrect) { feedbackText = getTranslation('feedback_correct'); feedbackArea.className = isMasteryMode ? 'mastery' : 'correct'; }
    else { feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` }); feedbackArea.className = 'incorrect'; }

    // Generar HTML de la explicación si la respuesta es incorrecta
    if (!isCorrect) {
        try {
            const expInfo = questionData.explanation; let baseExplanationText = '';
            if (expInfo && expInfo.baseTextKey) { baseExplanationText = getTranslation(expInfo.baseTextKey, expInfo.replacements || {}); }
            let generatedExplanationHTML = ''; // Renombrado para evitar confusión con la variable externa
            if (expInfo && expInfo.generatorName && explanationGenerators[expInfo.generatorName]) {
                const generatorFunc = explanationGenerators[expInfo.generatorName];
                if (typeof generatorFunc === 'function') { generatedExplanationHTML = generatorFunc.apply(null, expInfo.args || []); }
                else { console.error(`Generator '${expInfo.generatorName}' not found or not a function.`); generatedExplanationHTML = `<p>Error: Generator not found.</p>`; }
            } else if (expInfo && Array.isArray(expInfo.generators)) {
                const separator = expInfo.separator || '<br>';
                generatedExplanationHTML = expInfo.generators.map(genInfo => {
                    if (genInfo.generatorName && explanationGenerators[genInfo.generatorName]) {
                        const generatorFunc = explanationGenerators[genInfo.generatorName];
                        if (typeof generatorFunc === 'function') { return generatorFunc.apply(null, genInfo.args || []); }
                        else { console.error(`Generator '${genInfo.generatorName}' not found or not a function.`); return `<p>Error: Generator not found.</p>`; }
                    } return ''; }).join(separator);
            }
            explanationHTML = baseExplanationText ? `<p>${baseExplanationText}</p>${generatedExplanationHTML}` : generatedExplanationHTML;
        } catch (genError) { console.error("Error generando explicación HTML:", genError, questionData.explanation); explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' })}</p>`; }

        // Resaltar botón correcto
        try {
            if(optionsContainer) {
                let correctOriginalValueStr = ''; let originalValueParts = [];
                if (typeof ca === 'string') { correctOriginalValueStr = ca; } // Incluye números ya convertidos a string
                else if (typeof ca === 'object') { if (ca.classKey) originalValueParts.push(ca.classKey); if (ca.typeKey) originalValueParts.push(ca.typeKey); if (ca.maskValue) originalValueParts.push(ca.maskValue); if (ca.portionKey) { originalValueParts.push(ca.portionKey); originalValueParts.push(ca.portionValue || 'None'); } correctOriginalValueStr = originalValueParts.join(','); }
                else { correctOriginalValueStr = ca.toString(); } // Convertir otros tipos (números) a string
                Array.from(optionsContainer.children).forEach(button => { if (button.getAttribute('data-original-value') === correctOriginalValueStr) { button.classList.add(correctButtonClass); } });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }
    }

    // Construir HTML final y mostrarlo
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) { finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`; }
    finalFeedbackHTML += `</div>`;
    if (!isCorrect) { const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'final_result_button' : 'next_button'; finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`; }
    feedbackArea.innerHTML = finalFeedbackHTML;

    // Añadir listener al botón "Siguiente"
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) { if (typeof nextStepHandler === 'function') { newNextButton.addEventListener('click', nextStepHandler); } else { console.error("nextStepHandler no es una función en displayFeedback"); } }
        else { console.error("No se encontró el botón 'next-question-button' inmediatamente después de crearlo."); }
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
    const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPerfect = score === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    let baseMessage = getTranslation('game_over_base_message', { score: score, maxScore: maxScore, percentage: scorePercentage.toFixed(0) });
    let extraMessage = '';
    if (playedLevel === 'Entry') { if (isPerfect) { const justUnlockedAssociate = currentUserData.unlockedLevels.includes('Associate') && (currentUserData.entryPerfectStreak === 0 || currentUserData.entryPerfectStreak >= 3); if (justUnlockedAssociate) { extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') }); } else if (!currentUserData.unlockedLevels.includes('Associate')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak }); } else { extraMessage = getTranslation('game_over_good_round_entry'); } } }
    else if (playedLevel === 'Associate') { if (meetsAssociateThreshold) { const justUnlockedPro = currentUserData.unlockedLevels.includes('Professional') && (currentUserData.associatePerfectStreak === 0 || currentUserData.associatePerfectStreak >= 3); if (justUnlockedPro) { extraMessage = getTranslation('game_over_level_unlocked_pro'); } else if (!currentUserData.unlockedLevels.includes('Professional')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak }); } else { extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK }); } } }
    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;
    if (playAgainButton && currentUserData.unlockedLevels) { if (currentUserData.unlockedLevels.length <= 1) { const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`); playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName }); } else { playAgainButton.textContent = getTranslation('play_again_button'); } }
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayGameOver:", error); }
    showSection(gameOverSection);
}

/**
 * Actualiza la lista de High Scores en la UI.
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
