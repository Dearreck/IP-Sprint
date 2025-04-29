// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Contiene selectores de elementos DOM y funciones
// para manipular la apariencia del juego.
// ==================================================

// --- Importaciones de Módulos ---
// Importar constantes de configuración necesarias
// ASEGURARSE DE QUE EL NOMBRE AQUÍ COINCIDA EXACTAMENTE CON EL EXPORT EN config.js
import { TOTAL_QUESTIONS_PER_GAME, MIN_SCORE_PERCENT_FOR_STREAK } from './config.js';
// Importar funciones del juego necesarias para añadir listeners
// Asegúrate de que la ruta a game.js sea correcta si está en otra carpeta
import { handleAnswerClick, handlePlayAgain } from './game.js';

// --- Selección de Elementos del DOM ---
// Se declaran aquí para tener un acceso centralizado y evitar repeticiones.

// Secciones principales
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
export const gameOverSection = document.getElementById('game-over');
export const unlockProgressSection = document.getElementById('unlock-progress-section');
export const highScoresSection = document.getElementById('high-scores-section');

// Elementos del formulario de usuario
export const usernameForm = document.getElementById('username-form');
export const usernameInput = document.getElementById('username');

// Elementos de selección de nivel y progreso
export const levelButtonsContainer = document.getElementById('level-buttons-container');
export const unlockProgressDiv = document.getElementById('unlock-progress');
export const progressStarsSpan = document.getElementById('progress-stars');
export const unlockProgressTitle = unlockProgressDiv ? unlockProgressDiv.querySelector('h4') : null; // Título dinámico
export const unlockInfoTextDiv = document.getElementById('unlock-info-text'); // Texto explicativo clicable

// Elementos del área de juego
export const usernameDisplay = document.getElementById('username-display');
export const levelDisplay = document.getElementById('level-display');
export const scoreDisplay = document.getElementById('score-display');
export const roundProgressStarsDiv = document.getElementById('round-progress-stars'); // Estrellas de progreso de ronda
export const questionText = document.getElementById('question-text'); // Donde se muestra la pregunta
export const optionsContainer = document.getElementById('options-container'); // Contenedor para botones de respuesta
export const feedbackArea = document.getElementById('feedback-area'); // Área para mostrar "Correcto/Incorrecto" y explicaciones
export const timerDisplayDiv = document.getElementById('timer-display'); // Contenedor del timer
export const timeLeftSpan = document.getElementById('time-left'); // Span que muestra los segundos restantes
export const restartRoundButton = document.getElementById('restart-round-button'); // Botón para reiniciar ronda
export const exitToMenuButton = document.getElementById('exit-to-menu-button'); // Botón para salir al menú

// Elementos de la pantalla Game Over
export const finalScoreDisplay = document.getElementById('final-score'); // Puntuación final
export const highScoreMessage = document.getElementById('high-score-message'); // Mensaje (ej. nuevo récord, nivel desbloqueado)
export const playAgainButton = document.getElementById('play-again-button'); // Botón para volver a jugar/menú

// Elementos de la lista de puntuaciones altas
export const scoreList = document.getElementById('score-list'); // La lista <ul> donde van las puntuaciones

// --- Funciones de Manipulación de la UI ---

/**
 * Muestra una sección específica del juego y oculta las demás.
 * También maneja la visibilidad condicional de las secciones de progreso y puntuaciones.
 * @param {HTMLElement} sectionToShow - El elemento de la sección que se debe mostrar.
 */
export function showSection(sectionToShow) {
    // console.log("showSection llamada para:", sectionToShow ? sectionToShow.id : 'null'); // DEBUG
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];

    sections.forEach(section => {
        if (section) { // Verificar que el elemento existe en el DOM
            let shouldDisplay = false;
            if (section === sectionToShow) {
                shouldDisplay = true;
            } else if (section === unlockProgressSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) {
                shouldDisplay = true; // Mostrar progreso en menú y game over
            } else if (section === highScoresSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) {
                shouldDisplay = true; // Mostrar scores en menú y game over
            }

            section.style.display = shouldDisplay ? 'block' : 'none';

        } else {
           // console.warn(`Elemento de sección no encontrado: ${section}`); // DEBUG
        }
    });

     // Caso especial: Ocultar progreso y scores durante el juego activo
     if(sectionToShow === gameAreaSection) {
         if(unlockProgressSection) unlockProgressSection.style.display = 'none';
         if(highScoresSection) highScoresSection.style.display = 'none';
         // console.log("Ocultando progreso y scores durante el juego."); // DEBUG
     }
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI del área de juego.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual.
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (levelDisplay) levelDisplay.textContent = level;
    if (scoreDisplay) scoreDisplay.textContent = score;
    // console.log(`UI Player Info: User=${username}, Level=${level}, Score=${score}`); // DEBUG
}

/**
 * Genera y muestra los botones de selección de nivel basados en los niveles desbloqueados.
 * Asigna el manejador de eventos a cada botón.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (para progreso).
 * @param {function} levelSelectHandler - La función a llamar cuando se hace clic en un botón de nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    // console.log("displayLevelSelection iniciado. Niveles desbloqueados:", unlockedLevels); // DEBUG
    if (!levelButtonsContainer || !unlockedLevels) {
        console.error("Error: Falta levelButtonsContainer o unlockedLevels en displayLevelSelection.");
        return;
    }

    levelButtonsContainer.innerHTML = '';

    try {
        if (unlockedLevels.includes('Entry')) {
            const entryBtn = document.createElement('button');
            entryBtn.textContent = `Entry ★`;
            entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
            levelButtonsContainer.appendChild(entryBtn);
            // console.log("Botón Entry ★ añadido."); // DEBUG
        }

        if (unlockedLevels.includes('Associate')) {
            const entryTimerBtn = document.createElement('button');
            entryTimerBtn.textContent = `Entry 👑`;
            entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
            levelButtonsContainer.appendChild(entryTimerBtn);
            // console.log("Botón Entry 👑 añadido."); // DEBUG
        }

        unlockedLevels.forEach(level => {
            if (level !== 'Entry') {
                const button = document.createElement('button');
                button.textContent = `${level}`;
                button.addEventListener('click', () => levelSelectHandler(level, 'standard'));
                levelButtonsContainer.appendChild(button);
                // console.log(`Botón ${level} añadido.`); // DEBUG
            }
        });
    } catch (error) {
        console.error("Error generando botones de nivel:", error);
        levelButtonsContainer.innerHTML = '<p>Error al mostrar niveles.</p>';
        return;
    }

    try {
        // console.log("Actualizando UI de progreso de desbloqueo..."); // DEBUG
        updateUnlockProgressUI(currentUserData);
    } catch (error) {
        console.error("Error en updateUnlockProgressUI desde displayLevelSelection:", error);
    }

    // console.log("Mostrando sección level-select..."); // DEBUG
    showSection(levelSelectSection);
    // console.log("displayLevelSelection completado."); // DEBUG
}


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (estrellas e información).
 * Muestra el progreso hacia el siguiente nivel no desbloqueado.
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    // console.log("updateUnlockProgressUI iniciado con datos:", currentUserData); // DEBUG
    try {
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle || !unlockInfoTextDiv) {
             // console.warn("Faltan elementos para updateUnlockProgressUI, ocultando sección."); // DEBUG
             if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             return;
        }

        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0;
        const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null;
        let currentStreak = 0;
        let progressTitleText = "";
        let unlockExplanationText = "";
        let showProgress = false;

        if (!unlocked.includes('Associate')) {
            targetLevel = 'Associate'; currentStreak = entryStreak; progressTitleText = "Progreso para Nivel Associate:";
            unlockExplanationText = `Completa 3 rondas <strong>perfectas (100%)</strong> seguidas en <strong>Entry</strong> para desbloquear Associate. ¡La racha se reinicia si fallas una ronda!`;
            showProgress = true;
        } else if (!unlocked.includes('Professional')) {
            targetLevel = 'Professional'; currentStreak = associateStreak; progressTitleText = "Progreso para Nivel Professional:";
            unlockExplanationText = `Completa 3 rondas seguidas con un <strong>puntaje mínimo de ${config.MIN_SCORE_PERCENT_FOR_STREAK}%</strong> cada una en <strong>Associate</strong> para desbloquear Professional. ¡La racha se reinicia si no alcanzas el ${config.MIN_SCORE_PERCENT_FOR_STREAK}% en una ronda!`;
            showProgress = true;
        } else {
            targetLevel = 'None'; progressTitleText = "¡Todos los niveles desbloqueados!"; unlockExplanationText = "¡Has alcanzado el máximo nivel!"; showProgress = false;
        }
        // console.log(`Progreso: Target=${targetLevel}, Streak=${currentStreak}, Show=${showProgress}`); // DEBUG

        unlockProgressTitle.textContent = progressTitleText;
        unlockInfoTextDiv.innerHTML = unlockExplanationText;

        if (showProgress) {
            let stars = ''; for (let i = 0; i < 3; i++) { stars += (i < currentStreak) ? '★' : '☆'; }
            progressStarsSpan.textContent = stars;
            unlockProgressDiv.style.display = 'block';
            unlockProgressSection.style.display = 'block';
        } else {
            unlockProgressDiv.style.display = 'none';
             if (targetLevel === 'None' && unlockProgressTitle) {
                 unlockProgressTitle.textContent = progressTitleText;
                 unlockProgressDiv.style.display = 'block';
                 if(progressStarsSpan) progressStarsSpan.style.display = 'none';
                 const infoIcon = unlockProgressDiv.querySelector('.info-icon');
                 if(infoIcon) infoIcon.style.display = 'none';
                 if(unlockInfoTextDiv) unlockInfoTextDiv.style.display = 'none';
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
 * Muestra el resultado (correcto/incorrecto/pendiente) de cada pregunta.
 * @param {Array<boolean>} roundResults - Array con los resultados (true/false) de la ronda.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo de corona (para Entry 👑).
 */
export function updateRoundProgressUI(roundResults, isMasteryMode) {
    try {
        if (!roundProgressStarsDiv) return; let starsHTML = '';
        for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) {
            if (i < roundResults.length) {
                if (roundResults[i] === true) {
                    starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>';
                } else { starsHTML += '<i class="fas fa-star star-incorrect"></i>'; }
            } else { starsHTML += '<i class="far fa-star star-pending"></i>'; }
        } roundProgressStarsDiv.innerHTML = starsHTML;
    } catch(error) { console.error("Error en updateRoundProgressUI:", error); }
}

/**
 * Muestra la pregunta actual y genera los botones de opción.
 * @param {string} questionHTML - El texto HTML de la pregunta.
 * @param {Array<string>} optionsArray - Array con los textos de las opciones.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionHTML, optionsArray, answerClickHandler) {
    // console.log("displayQuestion llamada."); // DEBUG
    try {
         if(!questionText || !optionsContainer || !feedbackArea) {
             console.error("Error: Faltan elementos DOM en displayQuestion (questionText, optionsContainer o feedbackArea).");
             return;
         }
         questionText.innerHTML = questionHTML; optionsContainer.innerHTML = ''; feedbackArea.innerHTML = ''; feedbackArea.className = '';
         if (!optionsArray || !Array.isArray(optionsArray)) { throw new Error("optionsArray inválido o no es un array."); }

         try {
             optionsArray.forEach(optionText => {
                 const button = document.createElement('button'); button.textContent = optionText; button.classList.add('option-button');
                 if (typeof answerClickHandler === 'function') {
                    button.addEventListener('click', answerClickHandler);
                 } else {
                     console.error("answerClickHandler no es una función en displayQuestion");
                 }
                 optionsContainer.appendChild(button);
             });
         } catch (buttonError) {
             console.error("Error creando botones de opción:", buttonError);
             optionsContainer.innerHTML = "<p>Error al crear opciones.</p>";
             return;
         }

         optionsContainer.classList.remove('options-disabled');
     } catch (error) {
         console.error("Error en displayQuestion:", error);
         if(questionText) questionText.textContent = "Error al mostrar la pregunta.";
         if(optionsContainer) optionsContainer.innerHTML = "";
     }
}

/**
 * Muestra el feedback (correcto/incorrecto) después de una respuesta.
 * Incluye la explicación y el botón "Siguiente" si la respuesta fue incorrecta.
 * @param {boolean} isCorrect - Indica si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Indica si se debe usar el estilo mastery (para Entry 👑).
 * @param {object} questionData - Objeto con los datos de la pregunta actual (incluye correctAnswer y explanation).
 * @param {function} nextStepHandler - Función a llamar al hacer clic en "Siguiente".
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) {
    // console.log(`displayFeedback llamada. Correcta: ${isCorrect}`); // DEBUG
    if (!feedbackArea || !questionData) {
        console.error("Error: Falta feedbackArea o questionData en displayFeedback.");
        return;
    }

    let feedbackHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    if (isCorrect) {
        feedbackHTML = `<div id="feedback-text-content">¡Correcto! ✔️</div>`;
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
    } else {
        feedbackHTML = `
            <div id="feedback-text-content">
                <span>Incorrecto. La respuesta correcta era: <strong>${questionData.correctAnswer}</strong> ❌</span>
                <span class="explanation">${questionData.explanation || ''}</span>
            </div>
        `;
        feedbackArea.className = 'incorrect';

        try {
            if(optionsContainer) {
                Array.from(optionsContainer.children).forEach(button => {
                    if (button.textContent === questionData.correctAnswer) {
                        button.classList.add(correctButtonClass);
                    }
                });
            }
        } catch (highlightError) {
            console.error("Error resaltando botón correcto:", highlightError);
        }

        const buttonText = (questionData.questionsAnswered + 1 >= questionData.totalQuestions)
                           ? 'Ver Resultado Final &gt;&gt;'
                           : 'Siguiente &gt;&gt;';
        feedbackHTML += `<button id="next-question-button">${buttonText}</button>`;
    }

    feedbackArea.innerHTML = feedbackHTML;

    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
                // console.log("Listener añadido a botón 'Siguiente'."); // DEBUG
            } else {
                console.error("nextStepHandler no es una función en displayFeedback");
            }
        } else {
            console.error("No se encontró el botón 'next-question-button' después de crearlo.");
        }
    }
}


/**
 * Actualiza la pantalla de Game Over con la puntuación final y mensajes.
 * @param {number} score - Puntuación final de la ronda.
 * @param {string} message - Mensaje de resultado (ej. nivel desbloqueado, racha).
 * @param {object} currentUserData - Datos actualizados del usuario (para texto del botón y progreso).
 */
export function displayGameOver(score, message, currentUserData) {
    // console.log("displayGameOver llamada."); // DEBUG
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    if(highScoreMessage) highScoreMessage.textContent = message;

    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) {
            playAgainButton.textContent = `Jugar de Nuevo (${currentUserData.unlockedLevels[0] || 'Entry'})`;
        } else { playAgainButton.textContent = 'Elegir Nivel'; }
    }

    try {
        updateUnlockProgressUI(currentUserData);
    } catch (error) {
        console.error("Error en updateUnlockProgressUI desde displayGameOver:", error);
    }

    showSection(gameOverSection);
}

/**
 * Actualiza la lista de High Scores en la UI con el formato agrupado por usuario.
 * @param {Array<object>} scoresData - Array de objetos [{ name: string, scores: { levelMode: score, ... } }, ...]
 */
export function displayHighScores(scoresData) {
    // console.log("displayHighScores llamada con datos:", scoresData); // DEBUG
     if(!scoreList) {
         console.error("Elemento scoreList no encontrado.");
         return;
     }
     scoreList.innerHTML = '';

     if (!scoresData || scoresData.length === 0) {
         scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>';
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
                 { key: 'Entry-standard', label: 'Entry ★' },
                 { key: 'Entry-mastery', label: 'Entry 👑' },
                 { key: 'Associate-standard', label: 'Associate' },
                 { key: 'Professional-standard', label: 'Professional' }
             ];

             let hasScores = false;
             displayOrder.forEach(levelInfo => {
                 if (userData.scores && userData.scores[levelInfo.key] !== undefined) {
                     const levelScoreElement = document.createElement('span');
                     levelScoreElement.classList.add('level-score-item');
                     levelScoreElement.innerHTML = `${levelInfo.label}: <strong>${userData.scores[levelInfo.key]}</strong>`;
                     levelScoresContainer.appendChild(levelScoreElement);
                     hasScores = true;
                 }
             });

             if(hasScores) {
                userEntry.appendChild(levelScoresContainer);
             } else {
                 const noScoreMsg = document.createElement('div');
                 noScoreMsg.textContent = "(Sin puntuaciones registradas)";
                 noScoreMsg.style.fontSize = "0.8em"; noScoreMsg.style.color = "#888";
                 userEntry.appendChild(noScoreMsg);
             }

             scoreList.appendChild(userEntry);
         });
     } catch (error) {
         console.error("Error generando la lista de high scores:", error);
         scoreList.innerHTML = '<li>Error al mostrar puntuaciones.</li>';
     }
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
