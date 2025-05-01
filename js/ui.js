// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// CORREGIDO: Usar argumento 'score' en displayGameOver
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
import { handleAnswerClick } from './game.js';
import { getTranslation } from './i18n.js';
import {
    generateClassRangeTableHTML,
    generateClassMaskTableHTML,
    generatePrivateRangeTableHTML,
    generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML
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

const explanationGenerators = {
    generateClassRangeTableHTML,
    generateClassMaskTableHTML,
    generatePrivateRangeTableHTML,
    generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML
};

// --- Funciones de Manipulación de la UI ---
export function showSection(sectionToShow) {
    const sections = [ userSetupSection, levelSelectSection, gameAreaSection, gameOverSection, unlockProgressSection, highScoresSection ];
    sections.forEach(section => {
        if (section) {
            let shouldDisplay = false;
            if (section === sectionToShow) { shouldDisplay = true; }
            else if (section === unlockProgressSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) { shouldDisplay = true; }
            else if (section === highScoresSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) { shouldDisplay = true; }
            section.style.display = shouldDisplay ? 'block' : 'none';
        }
    });
     if(sectionToShow === gameAreaSection) {
         if(unlockProgressSection) unlockProgressSection.style.display = 'none';
         if(highScoresSection) highScoresSection.style.display = 'none';
     }
}

export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    if (!levelButtonsContainer || !unlockedLevels) { console.error("Error: Falta levelButtonsContainer o unlockedLevels en displayLevelSelection."); return; }
    levelButtonsContainer.innerHTML = '';
    try {
        if (unlockedLevels.includes('Entry')) { const entryBtn = document.createElement('button'); entryBtn.textContent = getTranslation('level_entry_standard'); entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard')); levelButtonsContainer.appendChild(entryBtn); }
        if (unlockedLevels.includes('Associate')) { const entryTimerBtn = document.createElement('button'); entryTimerBtn.textContent = getTranslation('level_entry_mastery'); entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery')); levelButtonsContainer.appendChild(entryTimerBtn); }
        unlockedLevels.forEach(level => { if (level !== 'Entry') { const button = document.createElement('button'); button.textContent = getTranslation(`level_${level.toLowerCase()}`); button.addEventListener('click', () => levelSelectHandler(level, 'standard')); levelButtonsContainer.appendChild(button); } });
    } catch (error) { console.error("Error generando botones de nivel:", error); levelButtonsContainer.innerHTML = `<p>${getTranslation('error_loading_levels', { error: error.message })}</p>`; return; }
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayLevelSelection:", error); }
    showSection(levelSelectSection);
}

export function updateUnlockProgressUI(currentUserData) {
    try {
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle) { if(unlockProgressSection) unlockProgressSection.style.display = 'none'; return; }
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
             } else { if(unlockProgressSection) unlockProgressSection.style.display = 'none'; }
        }
    } catch(error) { console.error("Error en updateUnlockProgressUI:", error); if(unlockProgressSection) unlockProgressSection.style.display = 'none'; }
}

export function updateRoundProgressUI(roundResults, isMasteryMode) {
    try {
        if (!roundProgressStarsDiv) return;
        let starsHTML = '';
        for (let i = 0; i < config.TOTAL_QUESTIONS_PER_GAME; i++) {
            if (i < roundResults.length) { if (roundResults[i] === true) { starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>'; } else { starsHTML += '<i class="fas fa-star star-incorrect"></i>'; } }
            else { starsHTML += '<i class="far fa-star star-pending"></i>'; }
        }
        roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) { console.error("Error: Faltan elementos DOM en displayQuestion."); return; }
        feedbackArea.innerHTML = ''; feedbackArea.className = '';
        questionText.innerHTML = getTranslation(questionData.question.key, questionData.question.replacements);
        optionsContainer.innerHTML = '';
        if (!questionData.options || !Array.isArray(questionData.options)) { throw new Error("optionsArray inválido o no es un array."); }
        questionData.options.forEach((optionData) => {
            const button = document.createElement('button'); button.classList.add('option-button');
            let buttonText = ''; let originalValue = '';
            if (typeof optionData === 'string') { const translated = getTranslation(optionData); buttonText = (translated && translated !== optionData) ? translated : optionData; originalValue = optionData; }
            else if (typeof optionData === 'object') {
                let textParts = []; let originalValueParts = [];
                if (optionData.classKey) { const translatedClass = getTranslation(optionData.classKey); textParts.push(translatedClass); originalValueParts.push(optionData.classKey); }
                if (optionData.typeKey) { const translatedType = getTranslation(optionData.typeKey); textParts.push(translatedType); originalValueParts.push(optionData.typeKey); }
                if (optionData.maskValue) { textParts.push(getTranslation('option_mask', { mask: optionData.maskValue })); originalValueParts.push(optionData.maskValue); }
                if (optionData.portionKey) { const portionVal = optionData.portionValue || getTranslation('option_none'); textParts.push(getTranslation(optionData.portionKey, { portion: portionVal })); originalValueParts.push(optionData.portionKey); originalValueParts.push(optionData.portionValue || 'None'); }
                buttonText = textParts.join(', '); originalValue = originalValueParts.join(',');
                if (textParts.length === 0) { buttonText = JSON.stringify(optionData); originalValue = buttonText; console.warn("Objeto de opción vacío o con claves desconocidas:", optionData); }
            } else { buttonText = 'Opción Inválida'; originalValue = 'invalid'; console.warn("Tipo de dato de opción inesperado:", optionData); }
            button.textContent = buttonText; button.setAttribute('data-original-value', originalValue);
            if (typeof answerClickHandler === 'function') { button.addEventListener('click', answerClickHandler); } else { console.error("answerClickHandler no es una función en displayQuestion"); }
            optionsContainer.appendChild(button);
        });
        optionsContainer.classList.remove('options-disabled');
    } catch (error) { console.error("Error en displayQuestion:", error); if(questionText) questionText.textContent = getTranslation('error_displaying_question'); if(optionsContainer) optionsContainer.innerHTML = ""; }
}

export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined) { console.error("Error: Falta feedbackArea o questionData/correctAnswer en displayFeedback."); return; }
    let feedbackText = ''; let explanationHTML = ''; const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';
    let translatedCorrectAnswer = ''; const ca = questionData.correctAnswer;
    if (typeof ca === 'string') { const translated = getTranslation(ca); translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca; }
    else if (typeof ca === 'object') {
        let textParts = [];
        if (ca.classKey) textParts.push(getTranslation(ca.classKey));
        if (ca.typeKey) textParts.push(getTranslation(ca.typeKey));
        if (ca.maskValue) textParts.push(getTranslation('option_mask', { mask: ca.maskValue }));
        if (ca.portionKey) { const portionVal = ca.portionValue || getTranslation('option_none'); textParts.push(getTranslation(ca.portionKey, { portion: portionVal })); }
        if (textParts.length > 0) { translatedCorrectAnswer = textParts.join(', '); } else { translatedCorrectAnswer = JSON.stringify(ca); console.warn("Objeto de respuesta correcta vacío o con claves desconocidas:", ca); }
    } else { translatedCorrectAnswer = 'N/A'; }
    if (isCorrect) { feedbackText = getTranslation('feedback_correct'); feedbackArea.className = isMasteryMode ? 'mastery' : 'correct'; }
    else {
        feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` }); feedbackArea.className = 'incorrect';
        try {
            const expInfo = questionData.explanation; let baseExplanationText = '';
            if (expInfo && expInfo.baseTextKey) { baseExplanationText = getTranslation(expInfo.baseTextKey, expInfo.replacements || {}); }
            let generatedTableHTML = '';
            if (expInfo && expInfo.generatorName && explanationGenerators[expInfo.generatorName]) { const generatorFunc = explanationGenerators[expInfo.generatorName]; generatedTableHTML = generatorFunc.apply(null, expInfo.args || []); }
            else if (expInfo && Array.isArray(expInfo.generators)) { const separator = expInfo.separator || '<br>'; generatedTableHTML = expInfo.generators.map(genInfo => { if (genInfo.generatorName && explanationGenerators[genInfo.generatorName]) { const generatorFunc = explanationGenerators[genInfo.generatorName]; return generatorFunc.apply(null, genInfo.args || []); } return ''; }).join(separator); }
            explanationHTML = baseExplanationText ? `<p>${baseExplanationText}</p>${generatedTableHTML}` : generatedTableHTML;
        } catch (genError) { console.error("Error generando explicación HTML dinámicamente:", genError, questionData.explanation); explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' })}</p>`; }
        try {
            if(optionsContainer) {
                let correctOriginalValueStr = ''; let originalValueParts = [];
                if (typeof ca === 'string') { correctOriginalValueStr = ca; }
                else if (typeof ca === 'object') { if (ca.classKey) originalValueParts.push(ca.classKey); if (ca.typeKey) originalValueParts.push(ca.typeKey); if (ca.maskValue) originalValueParts.push(ca.maskValue); if (ca.portionKey) { originalValueParts.push(ca.portionKey); originalValueParts.push(ca.portionValue || 'None'); } correctOriginalValueStr = originalValueParts.join(','); }
                else { correctOriginalValueStr = 'N/A'; }
                Array.from(optionsContainer.children).forEach(button => { if (button.getAttribute('data-original-value') === correctOriginalValueStr) { button.classList.add(correctButtonClass); } });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }
    }
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    if (explanationHTML) { finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`; }
    finalFeedbackHTML += `</div>`;
    if (!isCorrect) { const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME) ? 'final_result_button' : 'next_button'; finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`; }
    feedbackArea.innerHTML = finalFeedbackHTML;
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) { if (typeof nextStepHandler === 'function') { newNextButton.addEventListener('click', nextStepHandler); } else { console.error("nextStepHandler no es una función en displayFeedback"); } }
        else { console.error("No se encontró el botón 'next-question-button' inmediatamente después de crearlo."); }
    }
}

/**
 * Actualiza la pantalla de Game Over.
 * CORREGIDO: Usa el argumento 'score' en lugar de 'currentScore'.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} currentUserData - Datos actualizados del usuario (YA contiene las rachas).
 * @param {string} playedLevel - El nivel que se acaba de jugar.
 */
export function displayGameOver(score, currentUserData, playedLevel) {
    if (!currentUserData) {
        console.error("displayGameOver llamado sin currentUserData");
        if(finalScoreDisplay) finalScoreDisplay.textContent = score;
        if(highScoreMessage) highScoreMessage.textContent = getTranslation('error_end_game', { message: 'Missing user data' });
        showSection(gameOverSection);
        return;
    }

    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    const maxScore = config.PERFECT_SCORE;
    // --- CORREGIDO: Usar 'score' (el argumento) en lugar de 'currentScore' ---
    const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPerfect = score === maxScore; // Comparar con el argumento 'score'
    // --- FIN CORRECCIÓN ---
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;
    let baseMessage = getTranslation('game_over_base_message', { score: score, maxScore: maxScore, percentage: scorePercentage.toFixed(0) });
    let extraMessage = '';

    if (playedLevel === 'Entry') {
        if (isPerfect) {
            const justUnlockedAssociate = currentUserData.unlockedLevels.includes('Associate') && (currentUserData.entryPerfectStreak === 0 || currentUserData.entryPerfectStreak >= 3);
            if (justUnlockedAssociate) { extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') }); }
            else if (!currentUserData.unlockedLevels.includes('Associate')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak }); }
            else { extraMessage = getTranslation('game_over_good_round_entry'); }
        }
    } else if (playedLevel === 'Associate') {
        if (meetsAssociateThreshold) {
            const justUnlockedPro = currentUserData.unlockedLevels.includes('Professional') && (currentUserData.associatePerfectStreak === 0 || currentUserData.associatePerfectStreak >= 3);
            if (justUnlockedPro) { extraMessage = getTranslation('game_over_level_unlocked_pro'); }
            else if (!currentUserData.unlockedLevels.includes('Professional')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak }); }
            else { extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK }); }
        }
    }

    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;

    if (playAgainButton && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) { const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`); playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName }); }
        else { playAgainButton.textContent = getTranslation('play_again_button'); }
    }
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayGameOver:", error); }
    showSection(gameOverSection);
}


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

export function updateTimerDisplay(timeLeftValue) {
    if (!timerDisplayDiv || !timeLeftSpan) return;
    timeLeftSpan.textContent = timeLeftValue;
    if (timeLeftValue <= 5) { timerDisplayDiv.classList.add('low-time'); }
    else { timerDisplayDiv.classList.remove('low-time'); }
}

export function showTimerDisplay(show) {
     if (timerDisplayDiv) {
         timerDisplayDiv.style.display = show ? 'block' : 'none';
     }
}
