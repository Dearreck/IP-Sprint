// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Contiene selectores de elementos DOM y funciones
// para manipular la apariencia del juego y aplicar traducciones.
// ==================================================

// --- Importaciones de Módulos ---
import { TOTAL_QUESTIONS_PER_GAME, MIN_SCORE_PERCENT_FOR_STREAK } from './config.js';
import { handleAnswerClick } from './game.js';
import { getTranslation } from './i18n.js';

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

// --- Funciones de Manipulación de la UI ---

/**
 * Muestra una sección específica del juego y oculta las demás.
 * @param {HTMLElement} sectionToShow - El elemento de la sección que se debe mostrar.
 */
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
     if(sectionToShow === gameAreaSection) { if(unlockProgressSection) unlockProgressSection.style.display = 'none'; if(highScoresSection) highScoresSection.style.display = 'none'; }
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual.
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

/**
 * Genera y muestra los botones de selección de nivel.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario.
 * @param {function} levelSelectHandler - Función a llamar al hacer clic en un botón de nivel.
 */
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

/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel.
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    try {
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle) { if(unlockProgressSection) unlockProgressSection.style.display = 'none'; return; }
        const unlocked = currentUserData.unlockedLevels || ['Entry']; const entryStreak = currentUserData.entryPerfectStreak || 0; const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null; let currentStreak = 0; let progressTitleKey = ""; let showProgress = false;
        if (!unlocked.includes('Associate')) { targetLevel = 'Associate'; currentStreak = entryStreak; progressTitleKey = "progress_title_associate"; showProgress = true; }
        else if (!unlocked.includes('Professional')) { targetLevel = 'Professional'; currentStreak = associateStreak; progressTitleKey = "progress_title_professional"; showProgress = true; }
        else { targetLevel = 'None'; progressTitleKey = "progress_title_all_unlocked"; showProgress = false; }
        unlockProgressTitle.textContent = getTranslation(progressTitleKey);
        if (showProgress) { let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; } progressStarsSpan.textContent = stars; if(progressStarsSpan) progressStarsSpan.style.display = 'inline'; unlockProgressDiv.style.display = 'block'; unlockProgressSection.style.display = 'block'; }
        else { unlockProgressDiv.style.display = 'none'; if (targetLevel === 'None' && unlockProgressTitle) { unlockProgressTitle.textContent = getTranslation(progressTitleKey); unlockProgressDiv.style.display = 'block'; if(progressStarsSpan) progressStarsSpan.style.display = 'none'; unlockProgressSection.style.display = 'block'; } else { if(unlockProgressSection) unlockProgressSection.style.display = 'none'; } }
    } catch(error) { console.error("Error en updateUnlockProgressUI:", error); if(unlockProgressSection) unlockProgressSection.style.display = 'none'; }
}

/**
 * Actualiza las estrellas de progreso DENTRO de la ronda actual.
 * @param {Array<boolean>} roundResults - Array con los resultados (true/false) de la ronda.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo de corona.
 */
export function updateRoundProgressUI(roundResults, isMasteryMode) {
    try { if (!roundProgressStarsDiv) return; let starsHTML = ''; for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) { if (i < roundResults.length) { if (roundResults[i] === true) { starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>'; } else { starsHTML += '<i class="fas fa-star star-incorrect"></i>'; } } else { starsHTML += '<i class="far fa-star star-pending"></i>'; } } roundProgressStarsDiv.innerHTML = starsHTML; } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción traducidos.
 * Almacena el valor original (sin traducir) en `data-original-value`.
 * @param {object} questionData - Objeto con { question: {key, replacements}, options: [string|object], correctAnswer, explanation }.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        if(!questionText || !optionsContainer || !feedbackArea) { console.error("Error: Faltan elementos DOM en displayQuestion."); return; }
        questionText.innerHTML = getTranslation(questionData.question.key, questionData.question.replacements);
        optionsContainer.innerHTML = ''; feedbackArea.innerHTML = ''; feedbackArea.className = '';
        if (!questionData.options || !Array.isArray(questionData.options)) { throw new Error("optionsArray inválido o no es un array."); }

        questionData.options.forEach((optionData) => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            let buttonText = '';
            let originalValue = ''; // Valor sin traducir para comparación

            // --- Lógica REVISADA v4 para determinar texto y valor original ---
            if (typeof optionData === 'string') {
                // Es un valor técnico (IP, máscara, porción) o una clave i18n simple
                const translated = getTranslation(optionData);
                buttonText = (translated !== optionData && translated !== '') ? translated : optionData; // Usa traducción si existe y no es vacía
                originalValue = optionData;
            } else if (typeof optionData === 'object') {
                // Es un objeto combinado
                if (optionData.classKey && optionData.typeKey) {
                    buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation(optionData.typeKey)}`;
                    originalValue = `${optionData.classKey},${optionData.typeKey}`;
                } else if (optionData.classKey && optionData.maskValue) {
                    buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation('option_mask', { mask: optionData.maskValue })}`;
                    originalValue = `${optionData.classKey},${optionData.maskValue}`;
                } else if (optionData.classKey && optionData.portionKey) {
                     buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation(optionData.portionKey, { portion: optionData.portionValue || getTranslation('option_none') })}`;
                     originalValue = `${optionData.classKey},${optionData.portionKey},${optionData.portionValue || 'None'}`;
                }
                 else {
                    // Fallback si la estructura del objeto no es reconocida
                    buttonText = JSON.stringify(optionData);
                    originalValue = buttonText;
                    console.warn("Formato de objeto de opción desconocido:", optionData);
                }
            } else {
                 // Fallback para tipos inesperados
                 buttonText = 'Opción Inválida';
                 originalValue = 'invalid';
                 console.warn("Tipo de dato de opción inesperado:", optionData);
            }
            // --- FIN Lógica REVISADA v4 ---

            button.textContent = buttonText;
            button.setAttribute('data-original-value', originalValue);

            if (typeof answerClickHandler === 'function') { button.addEventListener('click', answerClickHandler); }
            else { console.error("answerClickHandler no es una función en displayQuestion"); }
            optionsContainer.appendChild(button);
        });

        optionsContainer.classList.remove('options-disabled');
    } catch (error) {
        console.error("Error en displayQuestion:", error);
        if(questionText) questionText.textContent = getTranslation('error_displaying_question');
        if(optionsContainer) optionsContainer.innerHTML = "";
    }
}

/**
 * Muestra el feedback (correcto/incorrecto) después de una respuesta.
 * Traduce la respuesta correcta antes de mostrarla y usa el valor original para resaltar.
 * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo mastery.
 * @param {object} questionData - Objeto con los datos de la pregunta actual.
 * @param {function} nextStepHandler - Función a llamar al hacer clic en "Siguiente".
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined) { console.error("Error: Falta feedbackArea o questionData/correctAnswer en displayFeedback."); return; }
    let feedbackHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    // --- Traducir la respuesta correcta para mostrarla al usuario ---
    let translatedCorrectAnswer = '';
    const ca = questionData.correctAnswer;
    // --- Lógica REVISADA v4 para traducir respuesta correcta ---
    if (typeof ca === 'string') {
        const translated = getTranslation(ca);
        translatedCorrectAnswer = (translated !== ca && translated !== '') ? translated : ca;
    } else if (typeof ca === 'object') {
        if (ca.classKey && ca.typeKey) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.typeKey)}`; }
        else if (ca.classKey && ca.maskValue) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation('option_mask', { mask: ca.maskValue })}`; }
        else if (ca.classKey && ca.portionKey) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.portionKey, { portion: ca.portionValue || getTranslation('option_none') })}`; }
        else { translatedCorrectAnswer = JSON.stringify(ca); } // Fallback
    } else { translatedCorrectAnswer = 'N/A'; }
    // --- FIN Lógica REVISADA v4 ---

    if (isCorrect) {
        feedbackHTML = `<div id="feedback-text-content">${getTranslation('feedback_correct')}</div>`;
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
    } else {
        const incorrectMsg = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
        let explanationHTML = '';
        if (typeof questionData.explanation === 'string') { explanationHTML = questionData.explanation; }
        else if (typeof questionData.explanation === 'object' && questionData.explanation.key) { explanationHTML = getTranslation(questionData.explanation.key, questionData.explanation.replacements || {}); if (questionData.explanation.table) { explanationHTML += `<br>${questionData.explanation.table}`; } }
        else if (typeof questionData.explanation === 'object' && questionData.explanation.table) { explanationHTML = questionData.explanation.table; }

        feedbackHTML = `<div id="feedback-text-content"><span>${incorrectMsg}</span><span class="explanation">${explanationHTML || ''}</span></div>`;
        feedbackArea.className = 'incorrect';

        // Resaltar botón correcto (comparando valor original)
        try {
            if(optionsContainer) {
                let correctOriginalValueStr = '';
                if (typeof ca === 'string') { correctOriginalValueStr = ca; }
                else if (typeof ca === 'object' && ca.classKey && ca.typeKey) { correctOriginalValueStr = `${ca.classKey},${ca.typeKey}`; }
                else if (typeof ca === 'object' && ca.classKey && ca.maskValue) { correctOriginalValueStr = `${ca.classKey},${ca.maskValue}`; }
                else if (typeof ca === 'object' && ca.classKey && ca.portionKey) { correctOriginalValueStr = `${ca.classKey},${ca.portionKey},${ca.portionValue || 'None'}`; }
                else { correctOriginalValueStr = JSON.stringify(ca); }

                Array.from(optionsContainer.children).forEach(button => { if (button.getAttribute('data-original-value') === correctOriginalValueStr) { button.classList.add(correctButtonClass); } });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }

        const buttonTextKey = (questionData.questionsAnswered + 1 >= questionData.totalQuestions) ? 'final_result_button' : 'next_button';
        feedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }

    feedbackArea.innerHTML = feedbackHTML;

    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) { if (typeof nextStepHandler === 'function') { newNextButton.addEventListener('click', nextStepHandler); } else { console.error("nextStepHandler no es una función en displayFeedback"); } }
        else { console.error("No se encontró el botón 'next-question-button' después de crearlo."); }
    }
}


/**
 * Actualiza la pantalla de Game Over con la puntuación final y mensajes traducidos.
 * @param {number} score - Puntuación final de la ronda.
 * @param {string} message - Mensaje de resultado (ya traducido por game.js).
 * @param {object} currentUserData - Datos actualizados del usuario.
 */
export function displayGameOver(score, message, currentUserData) {
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    if(highScoreMessage) highScoreMessage.textContent = message;
    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) { if (currentUserData.unlockedLevels.length <= 1) { const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`); playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName }); } else { playAgainButton.textContent = getTranslation('play_again_button'); } }
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayGameOver:", error); }
    showSection(gameOverSection);
}

/**
 * Actualiza la lista de High Scores en la UI con el formato agrupado por usuario y traducido.
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
