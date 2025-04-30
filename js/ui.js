// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Contiene selectores de elementos DOM y funciones
// para manipular la apariencia del juego y aplicar traducciones.
// ==================================================

// --- Importaciones de Módulos ---
// Importar constantes de configuración necesarias
import { TOTAL_QUESTIONS_PER_GAME, MIN_SCORE_PERCENT_FOR_STREAK } from './config.js';
// Importar funciones del juego necesarias para añadir listeners
// NOTA: handlePlayAgain no parece usarse directamente aquí, se llama desde game.js
import { handleAnswerClick /*, handlePlayAgain */ } from './game.js';
// Importar la función de traducción
import { getTranslation } from './i18n.js';

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
    // Array con todas las secciones principales del juego
    const sections = [
        userSetupSection, levelSelectSection, gameAreaSection,
        gameOverSection, unlockProgressSection, highScoresSection
    ];

    sections.forEach(section => {
        if (section) { // Verificar que el elemento existe en el DOM
            let shouldDisplay = false;
            // Mostrar la sección solicitada directamente
            if (section === sectionToShow) {
                shouldDisplay = true;
            // Mostrar progreso y scores cuando se está en el menú de niveles o en game over.
            } else if (section === unlockProgressSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) {
                shouldDisplay = true;
            } else if (section === highScoresSection && (sectionToShow === levelSelectSection || sectionToShow === gameOverSection)) {
                shouldDisplay = true;
            }
            // Aplicar el estilo display correspondiente
            section.style.display = shouldDisplay ? 'block' : 'none';
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
 * Traduce el nombre del nivel antes de mostrarlo.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (ej. 'Entry', 'Associate').
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    if (usernameDisplay) usernameDisplay.textContent = username;
    // Traducir nombre del nivel si se proporciona, usando claves como 'level_entry'
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

/**
 * Genera y muestra los botones de selección de nivel basados en los niveles desbloqueados.
 * Asigna el manejador de eventos y traduce el texto de los botones.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (para progreso).
 * @param {function} levelSelectHandler - La función a llamar cuando se hace clic en un botón de nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    // Verificar que los elementos necesarios existen
    if (!levelButtonsContainer || !unlockedLevels) {
        console.error("Error: Falta levelButtonsContainer o unlockedLevels en displayLevelSelection.");
        return;
    }

    levelButtonsContainer.innerHTML = ''; // Limpiar botones anteriores

    try {
        // Botón Entry (Standard ★)
        if (unlockedLevels.includes('Entry')) {
            const entryBtn = document.createElement('button');
            // Usar getTranslation para el texto del botón
            entryBtn.textContent = getTranslation('level_entry_standard');
            entryBtn.addEventListener('click', () => levelSelectHandler('Entry', 'standard'));
            levelButtonsContainer.appendChild(entryBtn);
        }
        // Botón Entry (Mastery 👑) - Solo si Associate está desbloqueado
        if (unlockedLevels.includes('Associate')) {
            const entryTimerBtn = document.createElement('button');
            // Usar getTranslation para el texto del botón
            entryTimerBtn.textContent = getTranslation('level_entry_mastery');
            entryTimerBtn.addEventListener('click', () => levelSelectHandler('Entry', 'mastery'));
            levelButtonsContainer.appendChild(entryTimerBtn);
        }
        // Botones para otros niveles desbloqueados (Associate, Professional)
        unlockedLevels.forEach(level => {
            if (level !== 'Entry') { // Entry ya se manejó arriba
                const button = document.createElement('button');
                // Usar getTranslation para el texto (asumiendo claves como level_associate)
                button.textContent = getTranslation(`level_${level.toLowerCase()}`);
                button.addEventListener('click', () => levelSelectHandler(level, 'standard'));
                levelButtonsContainer.appendChild(button);
            }
        });
    } catch (error) {
        console.error("Error generando botones de nivel:", error);
        // TODO: Añadir clave 'error_loading_levels' a JSONs
        levelButtonsContainer.innerHTML = `<p>${getTranslation('error_loading_levels', { error: error.message })}</p>`;
        return; // No continuar si falló la generación de botones
    }

    try {
        // Actualizar estrellas/info de desbloqueo
        updateUnlockProgressUI(currentUserData);
    } catch (error) {
        console.error("Error en updateUnlockProgressUI desde displayLevelSelection:", error);
        // No es crítico si esto falla, continuar para mostrar la sección
    }

    // Mostrar esta sección
    showSection(levelSelectSection);
}


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (estrellas y título).
 * Muestra el progreso hacia el siguiente nivel no desbloqueado usando textos traducidos.
 * @param {object} currentUserData - Datos del usuario con niveles y rachas.
 */
export function updateUnlockProgressUI(currentUserData) {
    try {
        // Verificar existencia de elementos necesarios
        if (!currentUserData || !unlockProgressSection || !unlockProgressDiv || !progressStarsSpan || !unlockProgressTitle) {
             if(unlockProgressSection) unlockProgressSection.style.display = 'none';
             return;
        }

        const unlocked = currentUserData.unlockedLevels || ['Entry'];
        const entryStreak = currentUserData.entryPerfectStreak || 0;
        const associateStreak = currentUserData.associatePerfectStreak || 0;
        let targetLevel = null;
        let currentStreak = 0;
        let progressTitleKey = ""; // Clave para el título traducido
        let showProgress = false; // Flag para mostrar estrellas

        // Determinar qué nivel se está intentando desbloquear
        if (!unlocked.includes('Associate')) {
            targetLevel = 'Associate';
            currentStreak = entryStreak;
            progressTitleKey = "progress_title_associate"; // Clave para "Progreso para Nivel Associate:"
            showProgress = true;
        } else if (!unlocked.includes('Professional')) {
            targetLevel = 'Professional';
            currentStreak = associateStreak;
            progressTitleKey = "progress_title_professional"; // Clave para "Progreso para Nivel Professional:"
            showProgress = true;
        } else {
            // Todos los niveles desbloqueados
            targetLevel = 'None';
            progressTitleKey = "progress_title_all_unlocked"; // Clave para "¡Todos los niveles desbloqueados!"
            showProgress = false; // No mostrar estrellas
        }

        // Traducir y establecer el título
        unlockProgressTitle.textContent = getTranslation(progressTitleKey);

        // Mostrar u ocultar la sección de progreso y actualizar estrellas
        if (showProgress) {
            let stars = '';
            // Generar las estrellas (llenas o vacías) según la racha
            for (let i = 0; i < 3; i++) {
                stars += (i < currentStreak) ? '★' : '☆';
            }
            progressStarsSpan.textContent = stars; // Mostrar las estrellas
            // Asegurarse que los elementos que sí existen se muestren
            if(progressStarsSpan) progressStarsSpan.style.display = 'inline';
            unlockProgressDiv.style.display = 'block'; // Mostrar contenedor interno (título, estrellas)
            unlockProgressSection.style.display = 'block'; // Asegurar que la sección completa sea visible
        } else {
            // Si no hay progreso que mostrar (todos desbloqueados), ocultar estrellas
            unlockProgressDiv.style.display = 'none';
            // Mostrar solo el título si todos están desbloqueados
             if (targetLevel === 'None' && unlockProgressTitle) {
                 unlockProgressTitle.textContent = getTranslation(progressTitleKey); // Traducir también aquí
                 unlockProgressDiv.style.display = 'block'; // Mostrar el div padre
                 if(progressStarsSpan) progressStarsSpan.style.display = 'none'; // Ocultar estrellas específicamente
                 unlockProgressSection.style.display = 'block'; // Asegurar sección visible
             } else {
                 // Ocultar toda la sección si no hay progreso Y no es el caso de "todos desbloqueados"
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
 * Muestra la pregunta actual y genera los botones de opción traducidos.
 * Almacena el valor original (sin traducir) en `data-original-value`.
 * @param {object} questionData - Objeto con { question: {key, replacements}, options: [string|object], correctAnswer, explanation }.
 * @param {function} answerClickHandler - La función que manejará el clic en una opción.
 */
export function displayQuestion(questionData, answerClickHandler) {
    try {
        // Verificar elementos DOM esenciales
        if(!questionText || !optionsContainer || !feedbackArea) {
            console.error("Error: Faltan elementos DOM en displayQuestion.");
            return;
        }
        // Traducir y mostrar la pregunta
        questionText.innerHTML = getTranslation(questionData.question.key, questionData.question.replacements);

        // Limpiar áreas
        optionsContainer.innerHTML = '';
        feedbackArea.innerHTML = '';
        feedbackArea.className = '';

        // Validar opciones
        if (!questionData.options || !Array.isArray(questionData.options)) {
            throw new Error("optionsArray inválido o no es un array.");
        }

        // Crear botones de opción
        questionData.options.forEach((optionData) => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            let buttonText = '';
            let originalValue = ''; // Valor sin traducir para comparación

            // --- Lógica REVISADA v4 para determinar texto y valor original ---
            if (typeof optionData === 'string') {
                // Es un valor técnico (IP, máscara, porción) o una clave i18n simple
                const translated = getTranslation(optionData);
                // Si la traducción es diferente de la clave Y no es vacía, usa la traducción.
                // Si no, usa el valor original (que puede ser una IP, máscara, etc.).
                buttonText = (translated && translated !== optionData) ? translated : optionData;
                originalValue = optionData; // Siempre guarda el valor original (clave o valor técnico)
            } else if (typeof optionData === 'object') {
                // Es un objeto combinado, construir texto y valor original
                if (optionData.classKey && optionData.typeKey) {
                    buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation(optionData.typeKey)}`;
                    originalValue = `${optionData.classKey},${optionData.typeKey}`;
                } else if (optionData.classKey && optionData.maskValue) {
                    // La máscara en sí no se traduce, pero la etiqueta sí
                    buttonText = `${getTranslation(optionData.classKey)}, ${getTranslation('option_mask', { mask: optionData.maskValue })}`;
                    originalValue = `${optionData.classKey},${optionData.maskValue}`;
                } else if (optionData.classKey && optionData.portionKey) {
                     // La porción en sí no se traduce, pero la etiqueta sí
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
            // Guardar el valor original (clave o valor técnico) en el botón
            button.setAttribute('data-original-value', originalValue);

            // Añadir listener
            if (typeof answerClickHandler === 'function') {
                button.addEventListener('click', answerClickHandler);
            } else {
                console.error("answerClickHandler no es una función en displayQuestion");
            }
            optionsContainer.appendChild(button);
        });

        optionsContainer.classList.remove('options-disabled'); // Habilitar clics
    } catch (error) {
        console.error("Error en displayQuestion:", error);
        // TODO: Añadir clave 'error_displaying_question'
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
    // Verificar elementos y datos
    if (!feedbackArea || !questionData || questionData.correctAnswer === undefined) {
        console.error("Error: Falta feedbackArea o questionData/correctAnswer en displayFeedback.");
        return;
    }

    let feedbackHTML = '';
    const correctButtonClass = isMasteryMode ? 'mastery' : 'correct'; // Clase CSS para botón correcto

    // --- Traducir la respuesta correcta para mostrarla al usuario ---
    let translatedCorrectAnswer = '';
    const ca = questionData.correctAnswer; // Alias para la respuesta correcta (string u objeto)

    // --- Lógica REVISADA v4 para traducir respuesta correcta ---
    if (typeof ca === 'string') {
        const translated = getTranslation(ca);
        translatedCorrectAnswer = (translated && translated !== ca) ? translated : ca;
    } else if (typeof ca === 'object') {
        if (ca.classKey && ca.typeKey) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.typeKey)}`; }
        else if (ca.classKey && ca.maskValue) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation('option_mask', { mask: ca.maskValue })}`; }
        else if (ca.classKey && ca.portionKey) { translatedCorrectAnswer = `${getTranslation(ca.classKey)}, ${getTranslation(ca.portionKey, { portion: ca.portionValue || getTranslation('option_none') })}`; }
        else { translatedCorrectAnswer = JSON.stringify(ca); } // Fallback
    } else { translatedCorrectAnswer = 'N/A'; }
    // --- FIN Lógica REVISADA v4 ---


    if (isCorrect) {
        // Mensaje de Correcto
        feedbackHTML = `<div id="feedback-text-content">${getTranslation('feedback_correct')}</div>`;
        feedbackArea.className = isMasteryMode ? 'mastery' : 'correct';
    } else {
        // Mensaje de Incorrecto (usando la respuesta correcta traducida)
        const incorrectMsg = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${translatedCorrectAnswer}</strong>` });
        // Obtener explicación (puede ser string HTML o objeto i18n)
        let explanationHTML = '';
        if (typeof questionData.explanation === 'string') {
            explanationHTML = questionData.explanation; // Ya es HTML (generado por utils)
        } else if (typeof questionData.explanation === 'object' && questionData.explanation.key) {
            // Es objeto i18n, traducir texto y añadir tabla si existe
            explanationHTML = getTranslation(questionData.explanation.key, questionData.explanation.replacements || {});
            if (questionData.explanation.table) {
                explanationHTML += `<br>${questionData.explanation.table}`;
            }
        } else if (typeof questionData.explanation === 'object' && questionData.explanation.table) {
             // Si solo tiene tabla (caso de generatePortionExplanationHTML)
             explanationHTML = questionData.explanation.table;
        }


        // Construir HTML del feedback incorrecto
        feedbackHTML = `
            <div id="feedback-text-content">
                <span>${incorrectMsg}</span>
                <span class="explanation">${explanationHTML || ''}</span>
            </div>
        `;
        feedbackArea.className = 'incorrect';

        // Resaltar el botón correcto comparando el valor original
        try {
            if(optionsContainer) {
                // Reconstruir el valor original esperado de la respuesta correcta
                let correctOriginalValueStr = '';
                if (typeof ca === 'string') { correctOriginalValueStr = ca; }
                else if (typeof ca === 'object' && ca.classKey && ca.typeKey) { correctOriginalValueStr = `${ca.classKey},${ca.typeKey}`; }
                else if (typeof ca === 'object' && ca.classKey && ca.maskValue) { correctOriginalValueStr = `${ca.classKey},${ca.maskValue}`; }
                else if (typeof ca === 'object' && ca.classKey && ca.portionKey) { correctOriginalValueStr = `${ca.classKey},${ca.portionKey},${ca.portionValue || 'None'}`; }
                else { correctOriginalValueStr = JSON.stringify(ca); }

                // Iterar botones y comparar su 'data-original-value'
                Array.from(optionsContainer.children).forEach(button => {
                    if (button.getAttribute('data-original-value') === correctOriginalValueStr) {
                        button.classList.add(correctButtonClass); // Resaltar el correcto
                    }
                });
            }
        } catch (highlightError) { console.error("Error resaltando botón correcto:", highlightError); }

        // Añadir botón "Siguiente" / "Ver Resultado" traducido
        const buttonTextKey = (questionData.questionsAnswered + 1 >= questionData.totalQuestions) ? 'final_result_button' : 'next_button';
        feedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }

    feedbackArea.innerHTML = feedbackHTML; // Mostrar feedback

    // Añadir listener al botón "Siguiente" si se creó (caso incorrecto)
    if (!isCorrect) {
        const newNextButton = document.getElementById('next-question-button');
        if (newNextButton) { if (typeof nextStepHandler === 'function') { newNextButton.addEventListener('click', nextStepHandler); } else { console.error("nextStepHandler no es una función en displayFeedback"); } }
        else { console.error("No se encontró el botón 'next-question-button' después de crearlo."); }
    }
}


/**
 * Actualiza la pantalla de Game Over con la puntuación final y mensajes traducidos.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} currentUserData - Datos actualizados del usuario (con rachas y niveles).
 * @param {string} playedLevel - El nivel que se acaba de jugar ('Entry', 'Associate').
 */
export function displayGameOver(score, currentUserData, playedLevel) {
    if(finalScoreDisplay) finalScoreDisplay.textContent = score; // Score numérico

    // --- Construir Mensaje Final Traducido ---
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPerfect = score === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    let baseMessage = getTranslation('game_over_base_message', {
        score: score,
        maxScore: maxScore,
        percentage: scorePercentage.toFixed(0)
    });
    let extraMessage = '';

    // Determinar mensaje extra basado en el nivel jugado y las rachas/desbloqueos
    if (playedLevel === 'Entry') {
        if (isPerfect) {
            if (currentUserData.unlockedLevels.includes('Associate') && currentUserData.entryPerfectStreak === 0) { extraMessage = getTranslation('game_over_level_unlocked', { levelName: getTranslation('level_associate') }); }
            else if (!currentUserData.unlockedLevels.includes('Associate')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_entry'), streak: currentUserData.entryPerfectStreak }); }
            else { extraMessage = getTranslation('game_over_good_round_entry'); }
        } else { if (currentUserData.entryPerfectStreak === 0 && storage.getUserData(currentUserData.username || '')?.entryPerfectStreak > 0) { extraMessage = getTranslation('game_over_streak_reset_100'); } }
    } else if (playedLevel === 'Associate') {
        if (meetsAssociateThreshold) {
            if (currentUserData.unlockedLevels.includes('Professional') && currentUserData.associatePerfectStreak === 0) { extraMessage = getTranslation('game_over_level_unlocked_pro'); }
            else if (!currentUserData.unlockedLevels.includes('Professional')) { extraMessage = getTranslation('game_over_streak_progress', { level: getTranslation('level_associate'), streak: currentUserData.associatePerfectStreak }); }
            else { extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK }); }
        } else { if (currentUserData.associatePerfectStreak === 0 && storage.getUserData(currentUserData.username || '')?.associatePerfectStreak > 0) { extraMessage = getTranslation('game_over_streak_reset_90'); } }
    }

    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;
    if(highScoreMessage) highScoreMessage.textContent = finalMessage;
    // --- Fin Construcción Mensaje ---


    // Ajustar texto del botón "Jugar de Nuevo"
    if (playAgainButton && currentUserData && currentUserData.unlockedLevels) {
        if (currentUserData.unlockedLevels.length <= 1) {
            const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`);
            playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName });
        } else {
            playAgainButton.textContent = getTranslation('play_again_button');
        }
    }

    try { updateUnlockProgressUI(currentUserData); } catch (error) { console.error("Error en updateUnlockProgressUI desde displayGameOver:", error); }
    showSection(gameOverSection); // Mostrar la sección
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

