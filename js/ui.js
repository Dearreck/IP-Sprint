// js/ui.js
import { TOTAL_QUESTIONS_PER_GAME } from './config.js';
// Necesitamos importar el handler del juego para añadirlo a los botones
import { handleAnswerClick, handlePlayAgain } from './game.js';

// Selección de Elementos del DOM (centralizada aquí)
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

/** Muestra/Oculta secciones según el estado del juego */
export function showSection(sectionToShow) {
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];
    sections.forEach(section => {
        if (section) { // Verificar que el elemento existe
            if (section === sectionToShow ||
               // Mostrar siempre progreso/scores post-login (en Level Select y Game Over)
               (section === unlockProgressSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) ||
               (section === highScoresSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection))
               ) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
    });
     // Ocultar progreso y scores durante el juego activo
     if(sectionToShow === gameAreaSection) {
         if(unlockProgressSection) unlockProgressSection.style.display = 'none';
         if(highScoresSection) highScoresSection.style.display = 'none';
     }
}

/** Actualiza la información del jugador en la UI */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level;
    if (scoreDisplay) scoreDisplay.textContent = score;
}

/** Muestra la pantalla de selección de nivel con botones de texto corto */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    if (!levelButtonsContainer || !unlockedLevels) return;

    levelButtonsContainer.innerHTML = ''; // Limpiar botones anteriores

    // Botón Entry (Normal) - Siempre disponible si está desbloqueado
    if (unlockedLevels.includes('Entry')) {
        const entryBtn = document.createElement('button');
        entryBtn.textContent = `Entry ★`; // <-- TEXTO CORTO
        entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
        levelButtonsContainer.appendChild(entryBtn);
    }

    // Botón Entry (Timer) - Solo si Associate está desbloqueado
    if (unlockedLevels.includes('Associate')) {
        const entryTimerBtn = document.createElement('button');
        entryTimerBtn.textContent = `Entry 👑`; // <-- TEXTO CORTO
        entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
        levelButtonsContainer.appendChild(entryTimerBtn);
    }

    // Botones para otros niveles desbloqueados (Associate, Professional)
    unlockedLevels.forEach(level => {
        if (level !== 'Entry') { // Ya manejamos Entry arriba
            const button = document.createElement('button');
            button.textContent = `${level}`; // <-- TEXTO CORTO (Solo nombre)
            button.addEventListener('click', () => levelSelectHandler(level, 'standard')); // Asumir standard
            levelButtonsContainer.appendChild(button);
        }
    });

    updateUnlockProgressUI(currentUserData); // Actualizar estrellas de desbloqueo
    showSection(levelSelectSection); // Mostrar esta sección correcta
}


/** Actualiza la UI de progreso de DESBLOQUEO de nivel (3 estrellas) */
export function updateUnlockProgressUI(currentUserData) {
    try {
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan) return;
        unlockProgressSection.style.display = 'block';
        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0;
        const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null; let currentStreak = 0; let progressTitle = ""; let showProgress = false;

        if (!unlocked.includes('Associate')) { targetLevel = 'Associate'; currentStreak = entryStreak; progressTitle = "Progreso para Nivel Associate:"; showProgress = true; }
        else if (!unlocked.includes('Professional')) { targetLevel = 'Professional'; currentStreak = associateStreak; progressTitle = "Progreso para Nivel Professional:"; showProgress = true; }
        else { targetLevel = 'None'; progressTitle = "¡Todos los niveles desbloqueados!"; showProgress = false; }

        const titleElement = unlockProgressDiv.querySelector('h4');
        if (titleElement) titleElement.textContent = progressTitle;

        if (showProgress) { let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; } progressStarsSpan.textContent = stars; unlockProgressDiv.style.display = 'block'; }
        else { unlockProgressDiv.style.display = 'none'; }
    } catch(error) { console.error("Error en updateUnlockProgressUI:", error); }
}

/** Actualiza las estrellas de progreso DENTRO de la ronda actual */
export function updateRoundProgressUI(roundResults, isMasteryMode) {
    try {
        if (!roundProgressStarsDiv) return; let starsHTML = '';
        for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) {
            if (i < roundResults.length) {
                if (roundResults[i] === true) { // Correcta
                    starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>';
                } else { // Incorrecta
                    starsHTML += '<i class="fas fa-star star-incorrect"></i>';
                }
            } else { // Pendiente
                starsHTML += '<i class="far fa-star star-pending"></i>';
            }
        } roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/** Muestra pregunta y opciones */
export function displayQuestion(questionHTML, optionsArray, answerClickHandler) {
    try {
         if(!questionText || !optionsContainer || !feedbackArea) return;
         questionText.innerHTML = questionHTML; optionsContainer.innerHTML = ''; feedbackArea.innerHTML = ''; feedbackArea.className = '';
         if (!optionsArray || !Array.isArray(optionsArray)) throw new Error("optionsArray inválido");
         optionsArray.forEach(optionText => {
             const button = document.createElement('button'); button.textContent = optionText; button.classList.add('option-button');
             button.addEventListener('click', answerClickHandler); // Usa el handler pasado
             optionsContainer.appendChild(button);
         });
         optionsContainer.classList.remove('options-disabled');
     } catch (error) { console.error("Error en displayQuestion:", error); }
}

/** Muestra el feedback y opcionalmente el botón Siguiente */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    if (!feedbackArea || !questionData) return;

    let feedbackHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    if (isCorrect) {
        feedbackHTML = `<div id="feedback-text-content">¡Correcto! ✔️</div>`;
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
        // El avance automático se maneja en game.js
    } else {
        feedbackHTML = `
            <div id="feedback-text-content">
                <span>Incorrecto. La respuesta correcta era: <strong>${questionData.correctAnswer}</strong> ❌</span>
                <span class="explanation">${questionData.explanation || ''}</span>
            </div>
        `;
        feedbackArea.className = 'incorrect';

        // Resaltar correcta (con estilo mastery si aplica)
        if(optionsContainer) { Array.from(optionsContainer.children).forEach(button => { if (button.textContent === questionData.correctAnswer) button.classList.add(correctButtonClass); }); }

        // Crear botón siguiente HTML
        const buttonText = (questionData.questionsAnswered + 1 >= questionData.totalQuestions) ? 'Ver Resultado Final &gt;&gt;' : 'Siguiente &gt;&gt;';
        feedbackHTML += `<button id="next-question-button">${buttonText}</button>`;
    }

    feedbackArea.innerHTML = feedbackHTML;

    // Añadir listener si se creó el botón (caso incorrecto)
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
             // Asegurarse que el handler existe antes de añadir listener
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
            } else {
                console.error("nextStepHandler no es una función en displayFeedback");
            }
        }
    }
}


/** Actualiza la pantalla de Game Over */
export function displayGameOver(score, message, currentUserData) { // playAgainHandler se añade en main.js
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    if(highScoreMessage) highScoreMessage.textContent = message;

    // Ajustar texto botón
    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) { playAgainButton.textContent = `Jugar de Nuevo (${currentUserData.unlockedLevels[0] || 'Entry'})`; }
        else { playAgainButton.textContent = 'Elegir Nivel'; }
    }

    updateUnlockProgressUI(currentUserData); // Asegurar que estrellas de desbloqueo estén actualizadas
    showSection(gameOverSection);
}

/** Actualiza la lista de High Scores en la UI */
export function displayHighScores(scores) {
     if(!scoreList) return;
     scoreList.innerHTML = ''; // Limpiar
     if (!scores || scores.length === 0) { scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>'; return; }
     scores.forEach(scoreItem => { const li = document.createElement('li'); li.textContent = `${scoreItem.name}: `; const strong = document.createElement('strong'); strong.textContent = scoreItem.score; li.appendChild(strong); scoreList.appendChild(li); });
}

/** Actualiza el display del timer */
export function updateTimerDisplay(timeLeftValue) {
    if (!timerDisplayDiv || !timeLeftSpan) return;
    timeLeftSpan.textContent = timeLeftValue;
    if (timeLeftValue <= 5) { timerDisplayDiv.classList.add('low-time'); }
    else { timerDisplayDiv.classList.remove('low-time'); }
}

/** Muestra u oculta el display del timer */
export function showTimerDisplay(show) {
     if (timerDisplayDiv) { timerDisplayDiv.style.display = show ? 'block' : 'none'; }
}
