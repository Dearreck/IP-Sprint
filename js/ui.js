// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// ==================================================

// --- Importaciones ---
import { TOTAL_QUESTIONS_PER_GAME, MIN_SCORE_PERCENT_FOR_STREAK } from './config.js';
// Importar funciones del juego necesarias para añadir listeners
import { handleAnswerClick, handlePlayAgain } from './game.js';
// --- NUEVO: Importar getTranslation ---
import { getTranslation } from './i18n.js';

// --- Selección de Elementos DOM ---
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
// export const unlockInfoTextDiv = document.getElementById('unlock-info-text'); // Eliminado previamente
export const usernameDisplay = document.getElementById('username-display');
export const levelDisplay = document.getElementById('level-display');
export const scoreDisplay = document.getElementById('score-display');
export const roundProgressStarsDiv = document.getElementById('round-progress-stars');
export const questionText = document.getElementById('question-text');
export const optionsContainer = document.getElementById('options-container');
export const feedbackArea = document.getElementById('feedback-area');
export const finalScoreDisplay = document.getElementById('final-score');
export const highScoreMessage = document.getElementById('high-score-message');
export const playAgainButton = document.getElementById('play-again-button');
export const scoreList = document.getElementById('score-list');
export const timerDisplayDiv = document.getElementById('timer-display');
export const timeLeftSpan = document.getElementById('time-left');
export const restartRoundButton = document.getElementById('restart-round-button');
export const exitToMenuButton = document.getElementById('exit-to-menu-button');

// --- Funciones UI ---

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

export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    // Traducir nombre del nivel si se proporciona
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    if (!levelButtonsContainer || !unlockedLevels) { console.error("Error: Falta levelButtonsContainer o unlockedLevels en displayLevelSelection."); return; }
    levelButtonsContainer.innerHTML = '';
    try {
        if (unlockedLevels.includes('Entry')) {
            const entryBtn = document.createElement('button');
            // Usar getTranslation para el texto del botón
            entryBtn.textContent = getTranslation('level_entry_standard');
            entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
            levelButtonsContainer.appendChild(entryBtn);
        }
        if (unlockedLevels.includes('Associate')) {
            const entryTimerBtn = document.createElement('button');
            // Usar getTranslation para el texto del botón
            entryTimerBtn.textContent = getTranslation('level_entry_mastery');
            entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
            levelButtonsContainer.appendChild(entryTimerBtn);
        }
        unlockedLevels.forEach(level => {
            if (level !== 'Entry') {
                const button = document.createElement('button');
                // Usar getTranslation para el texto del botón (asumiendo claves como level_associate)
                button.textContent = getTranslation(`level_${level.toLowerCase()}`);
                button.addEventListener('click', () => levelSelectHandler(level, 'standard'));
                levelButtonsContainer.appendChild(button);
            }
        });
    } catch (error) { console.error("Error generando botones de nivel:", error); levelButtonsContainer.innerHTML = `<p>${getTranslation('error_loading_levels', { error: error.message })}</p>`; return; } // TODO: Añadir clave error_loading_levels
    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayLevelSelection:", error); }
    showSection(levelSelectSection);
}

export function updateUnlockProgressUI(currentUserData) {
    try {
        // Modificado: Ya no necesita unlockInfoTextDiv
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle) {
             if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             return;
        }
        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0;
        const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null; let currentStreak = 0; let progressTitleKey = "";
        let showProgress = false;

        if (!unlocked.includes('Associate')) {
            targetLevel = 'Associate'; currentStreak = entryStreak;
            // Usar clave de traducción para el título
            progressTitleKey = "progress_title_associate";
            showProgress = true;
        } else if (!unlocked.includes('Professional')) {
            targetLevel = 'Professional'; currentStreak = associateStreak;
            // Usar clave de traducción para el título
            progressTitleKey = "progress_title_professional";
            showProgress = true;
        } else {
            targetLevel = 'None';
            // Usar clave de traducción para el título
            progressTitleKey = "progress_title_all_unlocked";
            showProgress = false;
        }

        // Traducir y establecer el título
        unlockProgressTitle.textContent = getTranslation(progressTitleKey);
        // unlockInfoTextDiv.innerHTML = unlockExplanationText; // ELIMINADO

        if (showProgress) {
            let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; }
            progressStarsSpan.textContent = stars;
            if(progressStarsSpan) progressStarsSpan.style.display = 'inline';
            unlockProgressDiv.style.display = 'block';
            unlockProgressSection.style.display = 'block';
        } else {
            unlockProgressDiv.style.display = 'none';
             if (targetLevel === 'None' && unlockProgressTitle) {
                 unlockProgressTitle.textContent = getTranslation(progressTitleKey); // Traducir también aquí
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

export function updateRoundProgressUI(roundResults, isMasteryMode) {
    try { if (!roundProgressStarsDiv) return; let starsHTML = ''; for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) { if (i < roundResults.length) { if (roundResults[i] === true) { starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>'; } else { starsHTML += '<i class="fas fa-star star-incorrect"></i>'; } } else { starsHTML += '<i class="far fa-star star-pending"></i>'; } } roundProgressStarsDiv.innerHTML = starsHTML; } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

export function displayQuestion(questionHTML, optionsArray, answerClickHandler) {
    try { if(!questionText || !optionsContainer || !feedbackArea) { console.error("Error: Faltan elementos DOM en displayQuestion."); return; }
        // La pregunta HTML ya viene (potencialmente) traducida desde questions.js
        questionText.innerHTML = questionHTML;
        optionsContainer.innerHTML = ''; feedbackArea.innerHTML = ''; feedbackArea.className = '';
        if (!optionsArray || !Array.isArray(optionsArray)) { throw new Error("optionsArray inválido o no es un array."); }
        try {
            optionsArray.forEach(optionText => {
                const button = document.createElement('button');
                // Las opciones pueden ser texto simple o claves de traducción
                // Intentamos traducir, si no existe la clave, usamos el texto como está
                button.textContent = getTranslation(optionText) || optionText;
                button.classList.add('option-button');
                if (typeof answerClickHandler === 'function') { button.addEventListener('click', answerClickHandler); }
                else { console.error("answerClickHandler no es una función en displayQuestion"); }
                optionsContainer.appendChild(button);
            });
        } catch (buttonError) { console.error("Error creando botones de opción:", buttonError); optionsContainer.innerHTML = `<p>${getTranslation('error_creating_options')}</p>`; return; } // TODO: Añadir clave error_creating_options
        optionsContainer.classList.remove('options-disabled');
    } catch (error) { console.error("Error en displayQuestion:", error); if(questionText) questionText.textContent = getTranslation('error_displaying_question'); if(optionsContainer) optionsContainer.innerHTML = ""; } // TODO: Añadir clave error_displaying_question
}

export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData) { console.error("Error: Falta feedbackArea o questionData en displayFeedback."); return; }
    let feedbackHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    if (isCorrect) {
        // Usar getTranslation para el mensaje de correcto
        feedbackHTML = `<div id="feedback-text-content">${getTranslation('feedback_correct')}</div>`;
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
    } else {
        // Usar getTranslation para el mensaje de incorrecto, pasando la respuesta correcta como reemplazo
        const incorrectMsg = getTranslation('feedback_incorrect', { correctAnswer: questionData.correctAnswer });
        // La explicación ya viene (potencialmente) traducida desde questions.js
        feedbackHTML = `
            <div id="feedback-text-content">
                <span>${incorrectMsg}</span>
                <span class="explanation">${questionData.explanation || ''}</span>
            </div>
        `;
        feedbackArea.className = 'incorrect';

        try { if(optionsContainer) { Array.from(optionsContainer.children).forEach(button => { if (button.textContent === (getTranslation(questionData.correctAnswer) || questionData.correctAnswer)) { button.classList.add(correctButtonClass); } }); } } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }

        // Usar getTranslation para el texto del botón
        const buttonTextKey = (questionData.questionsAnswered + 1 >= questionData.totalQuestions) ? 'final_result_button' : 'next_button';
        feedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }

    feedbackArea.innerHTML = feedbackHTML;

    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') { newNextButton.addEventListener('click', nextStepHandler); }
            else { console.error("nextStepHandler no es una función en displayFeedback"); }
        } else { console.error("No se encontró el botón 'next-question-button' después de crearlo."); }
    }
}

export function displayGameOver(score, message, currentUserData) {
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    // El mensaje ya viene (potencialmente) traducido desde game.js
    if(highScoreMessage) highScoreMessage.textContent = message;

    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) {
            // Traducir el nombre del nivel para el botón
            const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`);
            playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName });
        } else {
            // Usa la traducción del HTML (data-translate="play_again_button")
            playAgainButton.textContent = getTranslation('play_again_button');
        }
    }

    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayGameOver:", error); }
    showSection(gameOverSection);
}

export function displayHighScores(scoresData) {
     if(!scoreList) { console.error("Elemento scoreList no encontrado."); return; }
     scoreList.innerHTML = '';

     if (!scoresData || scoresData.length === 0) {
         // Usar getTranslation para el mensaje "sin puntuaciones"
         scoreList.innerHTML = `<li>${getTranslation('no_scores')}</li>`;
         return;
     }

     try {
         scoresData.forEach(userData => {
             const userEntry = document.createElement('li');
             userEntry.classList.add('score-entry');
             const userNameElement = document.createElement('div');
             userNameElement.classList.add('score-username');
             userNameElement.textContent = userData.name;
             userEntry.appendChild(userNameElement);
             const levelScoresContainer = document.createElement('div');
             levelScoresContainer.classList.add('level-scores');
             const displayOrder = [
                 { key: 'Entry-standard', labelKey: 'level_entry_standard' }, // Usar clave de traducción
                 { key: 'Entry-mastery', labelKey: 'level_entry_mastery' },   // Usar clave de traducción
                 { key: 'Associate-standard', labelKey: 'level_associate' }, // Usar clave de traducción
                 { key: 'Professional-standard', labelKey: 'level_professional' } // Usar clave de traducción
             ];
             let hasScores = false;
             displayOrder.forEach(levelInfo => {
                 if (userData.scores && userData.scores[levelInfo.key] !== undefined) {
                     const levelScoreElement = document.createElement('span');
                     levelScoreElement.classList.add('level-score-item');
                     // Traducir la etiqueta del nivel/modo
                     const label = getTranslation(levelInfo.labelKey);
                     levelScoreElement.innerHTML = `${label}: <strong>${userData.scores[levelInfo.key]}</strong>`;
                     levelScoresContainer.appendChild(levelScoreElement);
                     hasScores = true;
                 }
             });
             if(hasScores) { userEntry.appendChild(levelScoresContainer); }
             else { const noScoreMsg = document.createElement('div'); noScoreMsg.textContent = `(${getTranslation('no_scores_recorded')})`; noScoreMsg.style.fontSize = "0.8em"; noScoreMsg.style.color = "#888"; userEntry.appendChild(noScoreMsg); } // TODO: Añadir clave no_scores_recorded
             scoreList.appendChild(userEntry);
         });
     } catch (error) { console.error("Error generando la lista de high scores:", error); scoreList.innerHTML = `<li>${getTranslation('error_displaying_scores')}</li>`; } // TODO: Añadir clave error_displaying_scores
}

export function updateTimerDisplay(timeLeftValue) { if (!timerDisplayDiv || !timeLeftSpan) return; timeLeftSpan.textContent = timeLeftValue; if (timeLeftValue <= 5) { timerDisplayDiv.classList.add('low-time'); } else { timerDisplayDiv.classList.remove('low-time'); } }
export function showTimerDisplay(show) { if (timerDisplayDiv) { timerDisplayDiv.style.display = show ? 'block' : 'none'; } }

