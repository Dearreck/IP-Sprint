// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Contiene selectores de elementos DOM y funciones
// para manipular la apariencia del juego.
// ==================================================

// --- Importaciones de Módulos ---
// Importar constantes de configuración necesarias
import { TOTAL_QUESTIONS_PER_GAME, MIN_SCORE_PERCENT_FOR_STREAK } from './config.js';
// Importar funciones del juego necesarias para añadir listeners
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
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];

    sections.forEach(section => {
        if (section) { // Verificar que el elemento existe en el DOM
            // Lógica para mostrar la sección deseada Y las secciones de progreso/scores
            // cuando se está en la selección de nivel o en game over.
            if (section === sectionToShow ||
               (section === unlockProgressSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) ||
               (section === highScoresSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection))
               ) {
                section.style.display = 'block'; // Mostrar la sección
            } else {
                section.style.display = 'none'; // Ocultar las demás secciones
            }
        }
    });

     // Caso especial: Ocultar progreso y scores durante el juego activo
     if(sectionToShow === gameAreaSection) {
         if(unlockProgressSection) unlockProgressSection.style.display = 'none';
         if(highScoresSection) highScoresSection.style.display = 'none';
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
}

/**
 * Genera y muestra los botones de selección de nivel basados en los niveles desbloqueados.
 * Asigna el manejador de eventos a cada botón.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (para progreso).
 * @param {function} levelSelectHandler - La función a llamar cuando se hace clic en un botón de nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    // Verificar que los elementos necesarios existen
    if (!levelButtonsContainer || !unlockedLevels) return;

    levelButtonsContainer.innerHTML = ''; // Limpiar botones anteriores

    // Botón Entry (Standard ★) - Siempre disponible si está desbloqueado
    if (unlockedLevels.includes('Entry')) {
        const entryBtn = document.createElement('button');
        entryBtn.textContent = `Entry ★`; // Texto para modo standard
        entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
        levelButtonsContainer.appendChild(entryBtn);
    }

    // Botón Entry (Mastery 👑) - Solo si Associate está desbloqueado
    // Aunque el timer ahora es diferente, mantenemos el icono para diferenciar visualmente
    if (unlockedLevels.includes('Associate')) {
        const entryTimerBtn = document.createElement('button');
        entryTimerBtn.textContent = `Entry 👑`; // Texto para modo mastery/con timer
        entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
        levelButtonsContainer.appendChild(entryTimerBtn);
    }

    // Botones para otros niveles desbloqueados (Associate, Professional)
    unlockedLevels.forEach(level => {
        if (level !== 'Entry') { // Entry ya se manejó arriba
            const button = document.createElement('button');
            button.textContent = `${level}`; // Solo el nombre del nivel
            // Asumimos modo 'standard' para estos niveles por ahora, aunque tendrán timer
            button.addEventListener('click', () => levelSelectHandler(level, 'standard'));
            levelButtonsContainer.appendChild(button);
        }
    });

    updateUnlockProgressUI(currentUserData); // Actualizar estrellas/info de desbloqueo
    showSection(levelSelectSection); // Mostrar esta sección
}


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (estrellas e información).
 * Muestra el progreso hacia el siguiente nivel no desbloqueado.
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    try {
        // Verificar existencia de todos los elementos necesarios
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle || !unlockInfoTextDiv) {
             // Ocultar la sección si falta algún elemento esencial
             if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             return;
        }

        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0; // Racha para desbloquear Associate (requiere 100%)
        const associateStreak = currentUserData.associatePerfectStreak || 0; // Racha para desbloquear Pro (requiere 90%)
        let targetLevel = null; // El nivel que se intenta desbloquear
        let currentStreak = 0; // La racha actual relevante
        let progressTitleText = ""; // Texto para el título h4
        let unlockExplanationText = ""; // Texto para el div explicativo
        let showProgress = false; // Flag para mostrar o no las estrellas

        // Determinar qué nivel se está intentando desbloquear y qué racha aplica
        if (!unlocked.includes('Associate')) {
            targetLevel = 'Associate';
            currentStreak = entryStreak;
            progressTitleText = "Progreso para Nivel Associate:";
            // Texto para desbloquear Associate (requiere 100%)
            unlockExplanationText = `Completa 3 rondas <strong>perfectas (100%)</strong> seguidas en <strong>Entry</strong> para desbloquear Associate. ¡La racha se reinicia si fallas una ronda!`;
            showProgress = true;
        } else if (!unlocked.includes('Professional')) {
            targetLevel = 'Professional';
            currentStreak = associateStreak;
            progressTitleText = "Progreso para Nivel Professional:";
            // Texto para desbloquear Professional (requiere 90%)
            unlockExplanationText = `Completa 3 rondas seguidas con un <strong>puntaje mínimo de ${config.MIN_SCORE_PERCENT_FOR_STREAK}%</strong> cada una en <strong>Associate</strong> para desbloquear Professional. ¡La racha se reinicia si no alcanzas el ${config.MIN_SCORE_PERCENT_FOR_STREAK}% en una ronda!`;
            showProgress = true;
        } else {
            // Todos los niveles desbloqueados
            targetLevel = 'None';
            progressTitleText = "¡Todos los niveles desbloqueados!";
            unlockExplanationText = "¡Has alcanzado el máximo nivel!";
            showProgress = false; // No mostrar estrellas
        }

        // Actualizar el título y el texto explicativo en la UI
        unlockProgressTitle.textContent = progressTitleText;
        unlockInfoTextDiv.innerHTML = unlockExplanationText; // Usar innerHTML por si tiene <strong>

        // Mostrar u ocultar la sección de progreso y actualizar estrellas
        if (showProgress) {
            let stars = '';
            // Generar las estrellas (llenas o vacías) según la racha
            for (let i = 0; i < 3; i++) {
                stars += (i < currentStreak) ? '★' : '☆';
            }
            progressStarsSpan.textContent = stars; // Mostrar las estrellas
            unlockProgressDiv.style.display = 'block'; // Mostrar contenedor interno (título, estrellas, icono)
            unlockProgressSection.style.display = 'block'; // Asegurar que la sección completa sea visible
        } else {
            // Si no hay progreso que mostrar (todos desbloqueados), ocultar estrellas/título
            unlockProgressDiv.style.display = 'none';
            // Opcional: podrías mostrar un mensaje diferente en lugar de ocultar todo
            // if (targetLevel === 'None') { ... }
        }
    } catch(error) {
        console.error("Error en updateUnlockProgressUI:", error);
        // Ocultar la sección en caso de error inesperado
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
        if (!roundProgressStarsDiv) return; // Salir si el elemento no existe

        let starsHTML = ''; // String para construir el HTML de las estrellas
        // Iterar hasta el número total de preguntas por juego
        for (let i = 0; i < TOTAL_QUESTIONS_PER_GAME; i++) {
            if (i < roundResults.length) { // Si ya se respondió esta pregunta
                if (roundResults[i] === true) { // Respuesta Correcta
                    // Usar corona si es modo mastery, estrella verde si no
                    starsHTML += isMasteryMode ? '<i class="fas fa-crown star-mastery"></i>' : '<i class="fas fa-star star-correct"></i>';
                } else { // Respuesta Incorrecta
                    starsHTML += '<i class="fas fa-star star-incorrect"></i>'; // Estrella roja
                }
            } else { // Pregunta Pendiente
                starsHTML += '<i class="far fa-star star-pending"></i>'; // Estrella vacía gris
            }
        }
        roundProgressStarsDiv.innerHTML = starsHTML; // Actualizar el contenido del div
    } catch(error) {
        console.error("Error en updateRoundProgressUI:", error);
    }
}

/**
 * Muestra la pregunta actual y genera los botones de opción.
 * @param {string} questionHTML - El texto HTML de la pregunta.
 * @param {Array<string>} optionsArray - Array con los textos de las opciones.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionHTML, optionsArray, answerClickHandler) {
    try {
         // Verificar elementos
         if(!questionText || !optionsContainer || !feedbackArea) return;

         // Actualizar texto de la pregunta y limpiar opciones/feedback anteriores
         questionText.innerHTML = questionHTML;
         optionsContainer.innerHTML = '';
         feedbackArea.innerHTML = '';
         feedbackArea.className = ''; // Resetear clases de feedback (correct/incorrect)

         // Validar opciones
         if (!optionsArray || !Array.isArray(optionsArray)) {
             throw new Error("optionsArray inválido o no es un array.");
         }

         // Crear y añadir botones de opción
         optionsArray.forEach(optionText => {
             const button = document.createElement('button');
             button.textContent = optionText;
             button.classList.add('option-button'); // Clase base para estilo
             // Asignar el manejador de eventos pasado como argumento
             button.addEventListener('click', answerClickHandler);
             optionsContainer.appendChild(button);
         });

         // Habilitar contenedor de opciones (quitar clase si estaba deshabilitado)
         optionsContainer.classList.remove('options-disabled');

     } catch (error) {
         console.error("Error en displayQuestion:", error);
         // Mostrar error en la UI si falla la carga
         if(questionText) questionText.textContent = "Error al mostrar la pregunta.";
         if(optionsContainer) optionsContainer.innerHTML = ""; // Limpiar opciones
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
    // Verificar elementos y datos
    if (!feedbackArea || !questionData) return;

    let feedbackHTML = ''; // String para construir el HTML del feedback
    // Determinar clase CSS para el botón correcto (verde o púrpura)
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct';

    if (isCorrect) {
        // --- Feedback para Respuesta Correcta ---
        feedbackHTML = `<div id="feedback-text-content">¡Correcto! ✔️</div>`;
        // Aplicar clase CSS al área de feedback (verde o púrpura)
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
        // Nota: El avance automático se maneja en game.js con setTimeout

    } else {
        // --- Feedback para Respuesta Incorrecta ---
        // Construir HTML con mensaje, respuesta correcta y explicación
        feedbackHTML = `
            <div id="feedback-text-content">
                <span>Incorrecto. La respuesta correcta era: <strong>${questionData.correctAnswer}</strong> ❌</span>
                <span class="explanation">${questionData.explanation || ''}</span>
            </div>
        `;
        // Aplicar clase CSS 'incorrect' (rojo)
        feedbackArea.className = 'incorrect';

        // Resaltar el botón de la opción correcta en el contenedor de opciones
        if(optionsContainer) {
            Array.from(optionsContainer.children).forEach(button => {
                if (button.textContent === questionData.correctAnswer) {
                    button.classList.add(correctButtonClass); // Añadir clase 'correct' o 'mastery'
                }
            });
        }

        // Determinar texto del botón "Siguiente" (si es la última pregunta o no)
        const buttonText = (questionData.questionsAnswered + 1 >= questionData.totalQuestions)
                           ? 'Ver Resultado Final &gt;&gt;'
                           : 'Siguiente &gt;&gt;';
        // Añadir el botón al HTML del feedback
        feedbackHTML += `<button id="next-question-button">${buttonText}</button>`;
    }

    // Actualizar el contenido del área de feedback
    feedbackArea.innerHTML = feedbackHTML;

    // --- Añadir Listener al botón "Siguiente" (SOLO si se creó, caso incorrecto) ---
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) {
            // Asegurarse que el handler pasado es una función válida
            if (typeof nextStepHandler === 'function') {
                newNextButton.addEventListener('click', nextStepHandler);
            } else {
                // Log de error si el handler no es válido (ayuda a depurar)
                console.error("nextStepHandler no es una función en displayFeedback");
            }
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
    // Mostrar puntuación numérica
    if(finalScoreDisplay) finalScoreDisplay.textContent = score;
    // Mostrar mensaje de resultado/desbloqueo
    if(highScoreMessage) highScoreMessage.textContent = message;

    // Ajustar texto del botón "Jugar de Nuevo" según los niveles desbloqueados
    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) {
            // Si solo tiene Entry, el botón reinicia Entry
            playAgainButton.textContent = `Jugar de Nuevo (${currentUserData.unlockedLevels[0] || 'Entry'})`;
        } else {
            // Si tiene más niveles, el botón lleva al menú
            playAgainButton.textContent = 'Elegir Nivel';
        }
    }

    updateUnlockProgressUI(currentUserData); // Asegurar que estrellas/info de desbloqueo estén actualizadas
    showSection(gameOverSection); // Mostrar la sección de Game Over
}

/**
 * Actualiza la lista de High Scores en la UI con el formato agrupado por usuario.
 * @param {Array<object>} scoresData - Array de objetos [{ name: string, scores: { levelMode: score, ... } }, ...]
 */
export function displayHighScores(scoresData) {
     if(!scoreList) return; // Salir si no existe el elemento <ul>

     scoreList.innerHTML = ''; // Limpiar lista anterior

     // Mensaje si no hay puntuaciones
     if (!scoresData || scoresData.length === 0) {
         scoreList.innerHTML = '<li>Aún no hay puntuaciones. ¡Sé el primero!</li>';
         return;
     }

     // --- Generar la nueva estructura de tabla ---
     scoresData.forEach(userData => {
         // 1. Crear el elemento <li> para este usuario
         const userEntry = document.createElement('li');
         userEntry.classList.add('score-entry'); // Clase para estilo CSS

         // 2. Crear y añadir el nombre del usuario
         const userNameElement = document.createElement('div');
         userNameElement.classList.add('score-username');
         userNameElement.textContent = userData.name;
         userEntry.appendChild(userNameElement);

         // 3. Crear el contenedor para las puntuaciones de nivel/modo
         const levelScoresContainer = document.createElement('div');
         levelScoresContainer.classList.add('level-scores');

         // 4. Definir el orden y etiquetas para mostrar las puntuaciones
         const displayOrder = [
             { key: 'Entry-standard', label: 'Entry ★' },
             { key: 'Entry-mastery', label: 'Entry 👑' },
             { key: 'Associate-standard', label: 'Associate' },
             { key: 'Professional-standard', label: 'Professional' }
             // Añadir más niveles/modos aquí si se implementan
         ];

         // 5. Iterar en el orden definido y añadir cada puntuación existente
         let hasScores = false; // Flag para saber si el usuario tiene alguna puntuación
         displayOrder.forEach(levelInfo => {
             // Verificar si existe puntuación para esta clave (ej. 'Entry-standard')
             if (userData.scores && userData.scores[levelInfo.key] !== undefined) {
                 const levelScoreElement = document.createElement('span');
                 levelScoreElement.classList.add('level-score-item');
                 // Formato: "Entry ★: <strong>100</strong>"
                 levelScoreElement.innerHTML = `${levelInfo.label}: <strong>${userData.scores[levelInfo.key]}</strong>`;
                 levelScoresContainer.appendChild(levelScoreElement);
                 hasScores = true;
             }
         });

         // 6. Añadir el contenedor de puntuaciones (si tiene alguna) al <li> del usuario
         if(hasScores) {
            userEntry.appendChild(levelScoresContainer);
         } else {
             // Opcional: Mostrar un mensaje si el usuario está pero no tiene scores (raro con la lógica actual)
             const noScoreMsg = document.createElement('div');
             noScoreMsg.textContent = "(Sin puntuaciones registradas)";
             noScoreMsg.style.fontSize = "0.8em";
             noScoreMsg.style.color = "#888";
             userEntry.appendChild(noScoreMsg);
         }


         // 7. Añadir la entrada completa del usuario (<li>) a la lista <ul>
         scoreList.appendChild(userEntry);
     });
}


/**
 * Actualiza el display del temporizador.
 * @param {number} timeLeftValue - Segundos restantes.
 */
export function updateTimerDisplay(timeLeftValue) {
    if (!timerDisplayDiv || !timeLeftSpan) return;
    timeLeftSpan.textContent = timeLeftValue; // Mostrar segundos
    // Añadir/quitar clase para estilo de "poco tiempo"
    if (timeLeftValue <= 5) {
        timerDisplayDiv.classList.add('low-time');
    } else {
        timerDisplayDiv.classList.remove('low-time');
    }
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
