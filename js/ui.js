// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Gestiona la manipulación del DOM y la presentación visual.
// Incluye lógica para generar el Stepper y la Tarjeta de Nivel.
// CORREGIDO: displayFeedback aplica resaltado correcto/incorrecto consistentemente.
// CORREGIDO: Declaración de extraMessage en displayGameOver para evitar ReferenceError.
// Versión sin console.log de depuración
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

// --- Selección de Elementos del DOM (SOLO los necesarios globalmente o para exportar) ---
// Es más robusto buscar elementos dentro de las funciones que los usan,
// pero mantenemos estos exportados si otros módulos dependen directamente de ellos.
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
export const gameOverSection = document.getElementById('game-over');
export const highScoresSection = document.getElementById('high-scores-section');
export const usernameForm = document.getElementById('username-form');
export const usernameInput = document.getElementById('username');
// Elementos internos que podrían ser útiles exportar si se acceden mucho
export const feedbackArea = document.getElementById('feedback-area');
export const optionsContainer = document.getElementById('options-container');
export const questionText = document.getElementById('question-text');
export const timerDisplayDiv = document.getElementById('timer-display');
export finalScoreDisplay = document.getElementById('final-score');
export highScoreMessageElement = document.getElementById('high-score-message');


// Mapa para llamar a los generadores de explicaciones desde utils.js
const explanationGenerators = {
    generateClassRangeTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML, generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML, generateNumSubnetsExplanationHTML
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
 * @param {HTMLElement} sectionToShow - El elemento de la sección a mostrar.
 */
export function showSection(sectionToShow) {
    // Obtener referencias a las secciones aquí, dentro de la función
    const userSetup = document.getElementById('user-setup');
    const levelSelect = document.getElementById('level-select');
    const gameArea = document.getElementById('game-area');
    const gameOver = document.getElementById('game-over');
    // Referencia al contenedor de progreso de desbloqueo (obsoleto visualmente pero puede existir)
    const unlockProgress = document.getElementById('unlock-progress-section');
    const highScores = document.getElementById('high-scores-section');

    const sections = [userSetup, levelSelect, gameArea, gameOver, unlockProgress, highScores];
    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });

    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }

    // Mostrar High Scores junto con Level Select y Game Over
    if (highScores && (sectionToShow === levelSelect || sectionToShow === gameOver)) {
        highScores.style.display = 'block';
    }
    // Asegurarse que unlockProgressSection (el viejo) esté siempre oculto
    if (unlockProgress) {
        unlockProgress.style.display = 'none';
    }
}

/**
 * Actualiza la información del jugador (nombre, nivel, puntos) en la UI del juego.
 * @param {string} username - Nombre del usuario.
 * @param {string} level - Nivel actual (clave no traducida).
 * @param {number} score - Puntuación actual.
 */
export function updatePlayerInfo(username, level, score) {
    // Buscar elementos dentro de la función para mayor seguridad
    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');

    if (usernameDisplay) usernameDisplay.textContent = username;
    // Traducir la clave del nivel antes de mostrarla
    if (levelDisplay) levelDisplay.textContent = level ? getTranslation(`level_${level.toLowerCase()}`) : '';
    if (scoreDisplay) scoreDisplay.textContent = score;
}

// --- Lógica para Stepper y Tarjeta ---

/**
 * Genera y muestra el Stepper horizontal y prepara el área de la tarjeta.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos del usuario (para rachas, etc.). NO incluye nombre.
 * @param {string} currentUsername - Nombre del usuario actual.
 * @param {function} levelSelectHandler - Función a llamar al seleccionar un nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, currentUsername, levelSelectHandler) {
    // Buscar elementos del DOM AQUI para asegurar que existen
    const levelStepperContainer = document.getElementById('level-stepper-container');
    const levelCardContent = document.getElementById('level-card-content');
    const currentLevelSelectSection = document.getElementById('level-select'); // Para mostrar/ocultar

    // --- Verificación robusta de entradas ---
    let errorFound = false;
    if (!levelStepperContainer) { console.error("[UI] Error: levelStepperContainer no encontrado."); errorFound = true; }
    if (!levelCardContent) { console.error("[UI] Error: levelCardContent no encontrado."); errorFound = true; }
    if (!config.LEVELS || !Array.isArray(config.LEVELS)) { console.error("[UI] Error: config.LEVELS no es un array válido."); errorFound = true; }
    if (!currentUserData || typeof currentUserData !== 'object') { console.error("[UI] Error: currentUserData no es un objeto válido."); errorFound = true; }
    // Verificar específicamente unlockedLevels DENTRO de currentUserData
    if (!Array.isArray(unlockedLevels)) { console.error("[UI] Error: El parámetro 'unlockedLevels' NO es un array válido."); errorFound = true; }
    if (!currentUsername || typeof currentUsername !== 'string') { console.error("[UI] Error: currentUsername no es un string válido."); errorFound = true; }
    if (typeof levelSelectHandler !== 'function') { console.error("[UI] Error: levelSelectHandler NO es una función."); errorFound = true; }

    if (errorFound) {
        if (currentLevelSelectSection) {
             // Mostrar mensaje de error en la sección de selección de nivel
             currentLevelSelectSection.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
             showSection(currentLevelSelectSection); // Asegurar que se muestre la sección con el error
        }
        return; // Detener ejecución si hay errores críticos
    }
    // --- Fin Verificación ---


    levelStepperContainer.innerHTML = ''; // Limpiar contenedor del stepper
    levelCardContent.innerHTML = `<p>${getTranslation('loading_levels') || 'Loading levels...'}</p>`; // Mensaje inicial tarjeta

    const allLevels = config.LEVELS; // Obtener todos los niveles definidos
    let lastUnlockedIndex = -1; // Índice del último nivel desbloqueado
    let firstUnlockedLevelName = null; // Nombre del primer nivel desbloqueado encontrado

    // Iterar sobre TODOS los niveles definidos en config.js para crear el stepper
    allLevels.forEach((level, index) => {
        const isUnlocked = unlockedLevels.includes(level); // Comprobar si este nivel está en la lista de desbloqueados
        if (isUnlocked) {
            lastUnlockedIndex = index; // Actualizar índice del último desbloqueado
            if (firstUnlockedLevelName === null) firstUnlockedLevelName = level; // Guardar el primero encontrado
        }

        // --- Creación de cada item del Stepper ---
        const stepperItem = document.createElement('div');
        stepperItem.classList.add('stepper-item');
        stepperItem.dataset.level = level; // Guardar nombre del nivel en data attribute
        stepperItem.classList.toggle('unlocked', isUnlocked); // Clase si está desbloqueado
        stepperItem.classList.toggle('locked', !isUnlocked); // Clase si está bloqueado

        // Wrapper para el icono (permite estilos de borde, fondo)
        const iconWrapper = document.createElement('div');
        iconWrapper.classList.add('stepper-icon-wrapper');
        const icon = document.createElement('i');
        // Usar icono del mapa 'levelIcons' o uno por defecto
        icon.className = `fa-solid ${levelIcons[level] || 'fa-question-circle'}`;
        iconWrapper.appendChild(icon);
        stepperItem.appendChild(iconWrapper);

        // Etiqueta de texto debajo del icono
        const label = document.createElement('span');
        label.classList.add('stepper-label');
        const translationKey = `level_${level.toLowerCase()}`; // Clave i18n para el nombre del nivel
        label.dataset.translate = translationKey; // Guardar clave para posibles refrescos de idioma
        label.textContent = getTranslation(translationKey) || level; // Mostrar texto traducido o nombre original
        stepperItem.appendChild(label);
        // --- Fin Creación Item Stepper ---

        // Añadir listener para actualizar la tarjeta al hacer clic en un item
        stepperItem.addEventListener('click', () => {
            // Evitar recálculo si ya está seleccionado
            if (stepperItem.classList.contains('selected')) return;

            // Quitar clase 'selected' de cualquier otro item
            const container = document.getElementById('level-stepper-container'); // Buscar de nuevo por si acaso
            if(container) {
                container.querySelectorAll('.stepper-item.selected').forEach(el => el.classList.remove('selected'));
            }
            // Añadir clase 'selected' al item clickeado
            stepperItem.classList.add('selected');
            // Actualizar el contenido de la tarjeta única
            updateLevelCard(level, isUnlocked, currentUsername, levelSelectHandler);
        });

        levelStepperContainer.appendChild(stepperItem); // Añadir item al contenedor
    });

    // Actualizar la línea de progreso azul basada en el último nivel desbloqueado
    updateStepperProgressLine(lastUnlockedIndex, allLevels.length);

    // Determinar qué nivel seleccionar por defecto (el primero desbloqueado o el primero de la lista)
    const effectiveFirstLevel = firstUnlockedLevelName || allLevels[0];
    // Buscar el elemento del stepper correspondiente
    const firstStepperItem = levelStepperContainer.querySelector(`.stepper-item[data-level="${effectiveFirstLevel}"]`);

    // Si se encontró el item, seleccionarlo y actualizar la tarjeta
    if (firstStepperItem) {
        firstStepperItem.classList.add('selected');
        updateLevelCard(effectiveFirstLevel, unlockedLevels.includes(effectiveFirstLevel), currentUsername, levelSelectHandler);
    } else {
        // Si no se encuentra el item por defecto (error inesperado)
        levelCardContent.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
        console.error(`[UI] No se encontró el stepper item para el nivel por defecto: ${effectiveFirstLevel}`);
    }

    // Mostrar la sección de selección de nivel completa
    showSection(currentLevelSelectSection);
    // Asegurarse que la sección de progreso antigua (si existe) esté oculta
    const unlockProgressSect = document.getElementById('unlock-progress-section');
    if (unlockProgressSect) unlockProgressSect.style.display = 'none';
}


/**
 * Actualiza el contenido de la tarjeta única con la información del nivel seleccionado.
 * @param {string} levelName - Nombre del nivel.
 * @param {boolean} isUnlocked - Si el nivel está desbloqueado.
 * @param {string} currentUsername - Nombre del usuario actual.
 * @param {function} levelSelectHandler - Función para iniciar el nivel.
 */
function updateLevelCard(levelName, isUnlocked, currentUsername, levelSelectHandler) {
    // Buscar elemento de la tarjeta AQUI
    const levelCardContentElement = document.getElementById('level-card-content');
    if (!levelCardContentElement) {
         console.error("[UI] Elemento #level-card-content no encontrado en updateLevelCard.");
         return; // Salir si no se encuentra el contenedor
    }
    levelCardContentElement.innerHTML = ''; // Limpiar contenido anterior

    // --- Título del Nivel ---
    const title = document.createElement('h3');
    const titleKey = `level_${levelName.toLowerCase()}`; // Clave i18n
    title.dataset.translate = titleKey; // Guardar clave
    title.textContent = getTranslation(titleKey) || levelName; // Mostrar texto
    levelCardContentElement.appendChild(title);

    if (isUnlocked) {
        // --- Contenido para Nivel Desbloqueado ---
        // Estado
        const status = document.createElement('div');
        status.classList.add('level-status');
        const statusKey = 'level_status_available'; // Clave i18n para "Disponible"
        status.dataset.translate = statusKey;
        status.textContent = getTranslation(statusKey) || "Available";
        levelCardContentElement.appendChild(status);

        // Puntuación
        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('level-score');
        const allHighScores = storage.loadHighScores(); // Cargar todas las puntuaciones
        // Buscar los datos del usuario actual por nombre
        const userScoreData = allHighScores.find(user => user.name === currentUsername);
        const userScores = userScoreData?.scores || {}; // Obtener sus puntuaciones o {}
        // Clave específica para el nivel (asumiendo modo 'standard' por defecto aquí)
        // TODO: Adaptar si se implementan modos diferentes en la tarjeta
        const levelKey = `${levelName}-standard`;
        const bestScore = userScores[levelKey]; // Obtener la mejor puntuación para este nivel/modo
        const scoreLabelKey = 'your_best_score'; // Clave i18n para "Tu Mejor Puntuación"
        const noScoreLabelKey = 'not_played_yet'; // Clave i18n para "Aún no jugado"
        if (bestScore !== undefined && bestScore !== null) {
            scoreDiv.innerHTML = `${getTranslation(scoreLabelKey) || 'Your Best Score'}: <strong>${bestScore}</strong>`;
        } else {
            scoreDiv.textContent = getTranslation(noScoreLabelKey) || 'Not played yet';
        }
        levelCardContentElement.appendChild(scoreDiv);

        // Botón para Iniciar Nivel
        const startButton = document.createElement('button');
        startButton.classList.add('start-level-button');
        const buttonKey = 'start_level_button'; // Clave i18n para "Iniciar Nivel"
        startButton.dataset.translate = buttonKey;
        startButton.textContent = getTranslation(buttonKey) || 'Start Level';

        // Añadir listener al botón para llamar al handler proporcionado
        if (typeof levelSelectHandler === 'function') {
            startButton.addEventListener('click', () => {
                // Llamar al handler pasando el nombre del nivel y el modo (asumimos 'standard')
                levelSelectHandler(levelName, 'standard');
            });
        } else {
            // Si el handler no es válido, mostrar error y deshabilitar botón
            console.error(`[UI] ERROR: levelSelectHandler NO es una función en updateLevelCard para nivel ${levelName}.`);
            startButton.disabled = true;
            startButton.textContent += ' (Error Handler)';
        }
        levelCardContentElement.appendChild(startButton);

    } else {
        // --- Contenido para Nivel Bloqueado ---
        // Estado (Bloqueado)
        const status = document.createElement('div');
        status.classList.add('level-status', 'locked');
        const lockedStatusKey = 'level_status_locked'; // Clave i18n para "Bloqueado"
        // Añadir icono de candado
        status.innerHTML = `<i class="fas fa-lock"></i> ${getTranslation(lockedStatusKey) || 'Locked'}`;
        levelCardContentElement.appendChild(status);

        // Requisito para desbloquear
        const requirement = document.createElement('div');
        requirement.classList.add('level-requirement');
        let requirementText = '';
        let requirementKey = '';
        const levelsOrder = config.LEVELS; // Obtener orden de niveles
        const currentIndex = levelsOrder.indexOf(levelName); // Encontrar índice del nivel actual

        // Construir el mensaje de requisito basado en el nivel anterior
        if (currentIndex > 0) { // Si no es el primer nivel
            const previousLevel = levelsOrder[currentIndex - 1]; // Obtener nombre del nivel anterior
            const prevLevelKey = `level_${previousLevel.toLowerCase()}`; // Clave i18n para nombre anterior
            // Clave i18n específica para el requisito de este nivel (ej. "requirement_associate")
            requirementKey = `requirement_${levelName.toLowerCase()}`;
            // Obtener texto traducido, pasando el nombre traducido del nivel anterior como reemplazo
            requirementText = getTranslation(requirementKey, { prevLevel: getTranslation(prevLevelKey) || previousLevel });
            // Si no hay traducción específica, usar una por defecto
            if (requirementText === requirementKey) { // Comprobar si getTranslation devolvió la clave
                 const defaultReqKey = 'requirement_default';
                 requirementText = getTranslation(defaultReqKey, { prevLevel: getTranslation(prevLevelKey) || previousLevel }) || `Complete ${previousLevel} first.`;
            }
        } else {
            // Mensaje si es el primer nivel pero está bloqueado (caso raro)
            requirementKey = 'requirement_default_unknown';
            requirementText = getTranslation(requirementKey) || "Unlock previous levels first.";
        }
        // Añadir icono de información y mostrar texto del requisito
        requirement.innerHTML = `<i class="fas fa-info-circle"></i> ${requirementText}`;
        levelCardContentElement.appendChild(requirement);
    }
}

/**
 * Actualiza el ancho de la línea de progreso azul en el stepper.
 * @param {number} lastUnlockedIndex - Índice del último nivel desbloqueado (-1 si ninguno).
 * @param {number} totalLevels - Número total de niveles.
 */
function updateStepperProgressLine(lastUnlockedIndex, totalLevels) {
    // Buscar contenedor del stepper AQUI
    const stepperContainer = document.getElementById('level-stepper-container');
    // Salir si no se encuentra o si solo hay 1 nivel (no hay progreso)
    if (!stepperContainer || totalLevels <= 1) return;

    // Calcular porcentaje de progreso
    // La línea va del 10% al 90% del ancho total (para dejar espacio en los extremos)
    // Si lastUnlockedIndex es -1 (ninguno desbloqueado excepto el primero implícito), progreso es 0 -> 10%
    // Si es el último, progreso es 1 -> (1 * 80) + 10 = 90%
    const progressPercentage = lastUnlockedIndex >= 0
        ? (lastUnlockedIndex / (totalLevels - 1)) * 80 + 10 // Mapear índice a rango 10-90
        : 10; // Mínimo 10% si solo el primero está desbloqueado (o ninguno)
    // Establecer la variable CSS '--progress-width' que controla el ancho del ::after
    stepperContainer.style.setProperty('--progress-width', `${progressPercentage}%`);
}


/**
 * Actualiza la UI de progreso de DESBLOQUEO de nivel (OBSOLETA).
 * Esta función se mantiene por si acaso, pero no debería ser llamada
 * ya que la lógica de desbloqueo se refleja en el estado del stepper.
 */
export function updateUnlockProgressUI(currentUserData) {
    // No hacer nada. La sección está oculta por CSS/JS.
    // console.log("updateUnlockProgressUI llamada (obsoleta)");
}

/**
 * Actualiza las estrellas de progreso DENTRO de la ronda actual.
 * @param {Array<boolean>} roundResults - Array de booleanos (true=correcto, false=incorrecto).
 * @param {boolean} isMasteryMode - Si es modo Mastery (para usar icono de corona).
 */
export function updateRoundProgressUI(roundResults, isMasteryMode) {
    // Buscar contenedor de estrellas AQUI
    const roundProgressStarsDivElement = document.getElementById('round-progress-stars');
    try {
        if (!roundProgressStarsDivElement) return; // Salir si no existe
        let starsHTML = ''; // String para construir el HTML de las estrellas
        const totalQuestions = config.TOTAL_QUESTIONS_PER_GAME; // Número total de preguntas/estrellas

        // Generar un icono por cada pregunta de la ronda
        for (let i = 0; i < totalQuestions; i++) {
            let starClass = 'far fa-star star-pending'; // Clase por defecto (estrella vacía gris)
            if (i < roundResults.length) { // Si ya se respondió esta pregunta
                if (roundResults[i] === true) { // Si fue correcta
                    // Usar corona si es Mastery, estrella llena verde si no
                    starClass = isMasteryMode ? 'fas fa-crown star-mastery' : 'fas fa-star star-correct';
                } else { // Si fue incorrecta
                    starClass = 'fas fa-star star-incorrect'; // Estrella llena roja
                }
            }
            // Añadir el tag <i> con la clase calculada al HTML
            starsHTML += `<i class="${starClass}"></i>`;
        }
        // Actualizar el contenido del div con las estrellas generadas
        roundProgressStarsDivElement.innerHTML = starsHTML;
    } catch(error) {
        console.error("Error en updateRoundProgressUI:", error);
    }
}

/**
 * Muestra la pregunta actual y genera los botones de opción.
 * @param {object} questionData - Datos de la pregunta formateados para la UI.
 * @param {function} answerClickHandler - Handler para el clic en opciones.
 */
export function displayQuestion(questionData, answerClickHandler) {
    // Buscar elementos necesarios AQUI
    const questionTextElement = document.getElementById('question-text');
    const optionsContainerElement = document.getElementById('options-container');
    const feedbackAreaElement = document.getElementById('feedback-area');

    try {
        // Verificar que los elementos esenciales existen
        if(!questionTextElement || !optionsContainerElement || !feedbackAreaElement) {
             console.error("Error en displayQuestion: Faltan elementos del DOM (question-text, options-container, feedback-area).");
             // Podríamos intentar mostrar un error en la UI aquí
             if(questionTextElement) questionTextElement.innerHTML = getTranslation('error_displaying_question') || 'Error displaying question.';
             return;
        }

        // Limpiar feedback anterior y habilitar opciones
        feedbackAreaElement.innerHTML = '';
        feedbackAreaElement.className = ''; // Resetear clases (correct/incorrect)
        optionsContainerElement.innerHTML = ''; // Limpiar opciones anteriores
        optionsContainerElement.classList.remove('options-disabled'); // Habilitar contenedor

        // --- Construir HTML de la Pregunta (Teoría + Texto) ---
        let finalQuestionHTML = '';
        // Añadir sección de teoría si existe la clave y la traducción
        if (questionData.theoryKey) {
            const theoryText = getTranslation(questionData.theoryKey);
            // Añadir solo si la traducción existe y no es la clave misma
            if (theoryText && theoryText !== questionData.theoryKey) {
                finalQuestionHTML += `<div class="theory-presentation">${theoryText}</div><hr class="theory-separator">`;
            }
        }
        // Añadir texto principal de la pregunta
        let questionDisplayHTML = '';
        if (questionData.question?.text) { // Si el texto viene directo
            questionDisplayHTML = questionData.question.text;
        } else if (questionData.question?.key) { // Si viene una clave para traducir
            const questionReplacements = questionData.question.replacements || {};
            questionDisplayHTML = getTranslation(questionData.question.key, questionReplacements);
        } else {
            // Si no hay texto ni clave, mostrar error
            console.error("[UI] Datos de pregunta inválidos (sin texto ni clave):", questionData.question);
            questionDisplayHTML = getTranslation('error_displaying_question') || "Error: Invalid Question Data.";
        }
        finalQuestionHTML += questionDisplayHTML; // Añadir texto de pregunta
        questionTextElement.innerHTML = finalQuestionHTML; // Actualizar UI
        // --- Fin Construir HTML Pregunta ---


        // --- Crear Botones de Opción ---
        if (!questionData.options || !Array.isArray(questionData.options)) {
             throw new Error("questionData.options inválido o no es un array.");
        }

        const trueText = getTranslation('option_true'); // Obtener texto para Verdadero
        const falseText = getTranslation('option_false'); // Obtener texto para Falso

        questionData.options.forEach((optionData) => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            let buttonText = ''; // Texto a mostrar en el botón
            let originalValue = ''; // Valor original para guardar en data attribute (comparación)

            // Determinar texto y valor original según el tipo de 'optionData'
            if (typeof optionData === 'string') {
                // Si es un string simple (puede ser clave i18n o texto directo)
                const translated = getTranslation(optionData); // Intentar traducir
                buttonText = (translated && translated !== optionData) ? translated : optionData; // Usar traducción o el string original
                originalValue = optionData; // Guardar el string original como valor

                // Caso especial: si el texto coincide con V/F traducido, guardar la clave i18n como valor original
                if (buttonText === trueText) originalValue = 'option_true';
                else if (buttonText === falseText) originalValue = 'option_false';

            } else if (typeof optionData === 'object' && optionData !== null) {
                // Si es un objeto (preguntas complejas de Associate/Professional)
                // Asumimos que el objeto tiene claves para texto y valor
                // Ejemplo: { classKey: 'option_class_a', typeKey: 'option_public', maskValue: '255.0.0.0' }
                // Construir el texto a mostrar combinando las partes traducidas
                const classText = getTranslation(optionData.classKey || '');
                const typeText = getTranslation(optionData.typeKey || optionData.portionKey || ''); // Usar typeKey o portionKey
                const valueText = optionData.maskValue || optionData.portionValue || ''; // Usar maskValue o portionValue
                // Combinar textos, limpiando espacios extra si alguna parte falta
                buttonText = `${classText} / ${typeText} ${valueText}`.replace(' /  ', ' ').replace('/ ', '').replace(' /', '').trim();
                // Guardar el objeto original como string JSON en data-original-value
                // ¡Asegúrate que handleAnswerClick pueda comparar esto!
                try {
                     originalValue = JSON.stringify(optionData);
                } catch (e) {
                     console.error("Error stringifying option object:", optionData, e);
                     originalValue = "error_parsing_option"; // Valor de fallback
                     buttonText = "Error Option";
                }

            } else {
                // Si no es string ni objeto, marcar como inválido
                buttonText = 'Invalid Option';
                originalValue = 'invalid';
            }

            button.textContent = buttonText; // Establecer texto del botón
            button.setAttribute('data-original-value', originalValue); // Guardar valor original

            // Añadir listener para manejar clic en la opción
            if (typeof answerClickHandler === 'function') {
                button.addEventListener('click', answerClickHandler);
            } else {
                 console.error("answerClickHandler no es una función en displayQuestion");
                 button.disabled = true; // Deshabilitar si no hay handler
            }
            optionsContainerElement.appendChild(button); // Añadir botón al contenedor
        });
        // --- Fin Crear Botones ---

    } catch (error) {
        console.error("Error en displayQuestion:", error);
        if(questionTextElement) questionTextElement.textContent = getTranslation('error_displaying_question') || 'Error displaying question.';
        if(optionsContainerElement) optionsContainerElement.innerHTML = ""; // Limpiar opciones en caso de error
    }
}


/**
 * Muestra el feedback (correcto/incorrecto/timeout) y la explicación.
 * Redibuja pregunta/opciones si es un refresco de idioma.
 * @param {boolean} isCorrect - Si la respuesta fue correcta.
 * @param {boolean} isMasteryMode - Si se usa estilo mastery (corona/púrpura).
 * @param {object} questionData - Datos formateados de la pregunta actual (debe incluir correctAnswerDisplay).
 * @param {function} nextStepHandler - Función para el botón "Siguiente".
 * @param {string|null} selectedValueOriginal - El valor original de la opción incorrecta seleccionada (o null).
 * @param {boolean} [isRefresh=false] - Indica si esta llamada es para refrescar la UI (ej. cambio idioma).
 */
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler, selectedValueOriginal = null, isRefresh = false) {
    // Buscar elementos necesarios AQUI
    const feedbackAreaElement = document.getElementById('feedback-area');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainerElement = document.getElementById('options-container');

    // Verificar datos esenciales
    if (!feedbackAreaElement || !questionData || questionData.correctAnswer === undefined || questionData.correctAnswerDisplay === undefined) {
         console.error("Error en displayFeedback: Faltan elementos del DOM o datos esenciales (incl. correctAnswerDisplay). Datos recibidos:", questionData);
         // Podríamos intentar mostrar un mensaje de error genérico en el área de feedback
         if(feedbackAreaElement) feedbackAreaElement.innerHTML = `<p>${getTranslation('error_displaying_results') || 'Error displaying results.'}</p>`;
         return;
    }

    // --- Redibujar Pregunta y Opciones si es un Refresco de UI ---
    if (isRefresh) {
        console.log("[UI] Refrescando pregunta y opciones durante feedback...");
        // 1. Redibujar Texto de Pregunta (Incluyendo Teoría)
        if (questionTextElement) {
            let finalQuestionHTML = '';
            // Añadir teoría si existe la clave y traducción
            if (questionData.theoryKey) {
                const theoryText = getTranslation(questionData.theoryKey);
                if (theoryText && theoryText !== questionData.theoryKey) {
                    finalQuestionHTML += `<div class="theory-presentation">${theoryText}</div><hr class="theory-separator">`;
                }
            }
            // Añadir texto de la pregunta (directo o traducido)
            let questionDisplayHTML = '';
            if (questionData.question?.text) { questionDisplayHTML = questionData.question.text; }
            else if (questionData.question?.key) { questionDisplayHTML = getTranslation(questionData.question.key, questionData.question.replacements || {}); }
            else { questionDisplayHTML = "Error: Invalid Question."; }
            finalQuestionHTML += questionDisplayHTML;
            questionTextElement.innerHTML = finalQuestionHTML; // Actualizar UI
        } else { console.error("Elemento #question-text no encontrado durante refresco de feedback."); }

        // 2. Redibujar Opciones (deshabilitadas y sin resaltar aún)
        if (optionsContainerElement) {
            optionsContainerElement.innerHTML = ''; // Limpiar opciones anteriores
            optionsContainerElement.classList.add('options-disabled'); // Asegurar que estén deshabilitadas

            if (!questionData.options || !Array.isArray(questionData.options)) {
                 console.error("optionsArray inválido durante refresco de feedback.");
            } else {
                // Recrear botones basados en los datos formateados actuales (que ya deberían estar en el idioma correcto)
                const trueText = getTranslation('option_true');
                const falseText = getTranslation('option_false');

                questionData.options.forEach((optionData) => { // Iterar sobre los datos de opción actuales
                    const button = document.createElement('button');
                    button.classList.add('option-button');
                    button.disabled = true; // Deshabilitar siempre en refresco de feedback

                    let buttonText = '';
                    let originalValue = '';

                    // Reconstruir texto y valor original (lógica similar a displayQuestion)
                    if (typeof optionData === 'string') {
                        buttonText = optionData; // Usar texto directamente (ya debería estar traducido)
                        originalValue = optionData; // Asumir valor original es el texto
                        // Ajustar valor original si es V/F
                        if (buttonText === trueText) originalValue = 'option_true';
                        else if (buttonText === falseText) originalValue = 'option_false';
                    } else if (typeof optionData === 'object' && optionData !== null) {
                        // Reconstruir texto desde objeto (ya debería estar traducido)
                        const classText = getTranslation(optionData.classKey || '');
                        const typeText = getTranslation(optionData.typeKey || optionData.portionKey || '');
                        const valueText = optionData.maskValue || optionData.portionValue || '';
                        buttonText = `${classText} / ${typeText} ${valueText}`.replace(' /  ', ' ').replace('/ ', '').replace(' /', '').trim();
                        try { originalValue = JSON.stringify(optionData); } catch (e) { originalValue = "error"; buttonText="Error"; }
                    } else {
                         buttonText = 'Invalid Option'; originalValue = 'invalid';
                    }

                    button.textContent = buttonText;
                    button.setAttribute('data-original-value', originalValue);
                    optionsContainerElement.appendChild(button); // Añadir botón ANTES de aplicar resaltado
                });
            }
        } else { console.error("Elemento #options-container no encontrado durante refresco de feedback."); }
    }
    // --- Fin Redibujar en Refresco ---


    // --- Mostrar Área de Feedback (Lógica Principal) ---
    let feedbackText = ''; // Texto principal del feedback
    let explanationHTML = ''; // HTML para la explicación detallada
    const correctAnswerDisplay = questionData.correctAnswerDisplay; // Texto legible de la respuesta correcta

    // Determinar texto base del feedback (Correcto o Incorrecto)
    if (isCorrect) {
        feedbackText = getTranslation('feedback_correct'); // "¡Correcto!"
    } else {
        // "Incorrecto. La respuesta correcta era: {correctAnswer}"
        feedbackText = getTranslation('feedback_incorrect', { correctAnswer: `<strong>${correctAnswerDisplay}</strong>` });
    }
    // Establecer clase CSS para el área de feedback (verde, rojo o púrpura)
    feedbackAreaElement.className = isCorrect ? (isMasteryMode ? 'mastery' : 'correct') : 'incorrect';

    // Generar HTML de la explicación si la respuesta fue incorrecta y hay datos de explicación
    if (!isCorrect && questionData.explanation) {
        try {
            const expInfo = questionData.explanation;
            if (expInfo.text) { // Si la explicación es texto simple
                explanationHTML = `<p>${expInfo.text}</p>`;
            } else if (expInfo.generatorName && explanationGenerators[expInfo.generatorName]) { // Si usa un generador de utils.js
                const generatorFunc = explanationGenerators[expInfo.generatorName];
                const args = expInfo.args || [];
                explanationHTML = generatorFunc(...args); // Llamar al generador con sus argumentos
            } else if (expInfo.baseTextKey) { // Si usa clave i18n + generador opcional
                 explanationHTML = `<p>${getTranslation(expInfo.baseTextKey, expInfo.replacements || {})}</p>`;
                 if (expInfo.generatorName && explanationGenerators[expInfo.generatorName]) {
                     const generatorFunc = explanationGenerators[expInfo.generatorName];
                     const args = expInfo.args || [];
                     explanationHTML += generatorFunc(...args);
                 }
            } else if (expInfo.generators && Array.isArray(expInfo.generators)) { // Si usa múltiples generadores
                 explanationHTML = expInfo.generators.map(genConfig => {
                     if (genConfig.generatorName && explanationGenerators[genConfig.generatorName]) {
                         const generatorFunc = explanationGenerators[genConfig.generatorName];
                         const args = genConfig.args || [];
                         return generatorFunc(...args);
                     }
                     return ''; // Devolver string vacío si el generador no es válido
                 }).join(expInfo.separator || ''); // Unir HTMLs con separador o nada
            }
        } catch (genError) {
            console.error("Error generando explicación HTML:", genError);
            explanationHTML = `<p>${getTranslation('explanation_portion_calc_error', { ip: 'N/A', mask: 'N/A' }) || 'Error generating explanation.'}</p>`;
        }
    }

    // Construir HTML final del área de feedback
    let finalFeedbackHTML = `<div id="feedback-text-content"><span>${feedbackText}</span>`;
    // Añadir explicación si se generó
    if (explanationHTML) {
        finalFeedbackHTML += `<span class="explanation">${explanationHTML}</span>`;
    }
    finalFeedbackHTML += `</div>`; // Cerrar div de contenido de texto

    // Añadir botón "Siguiente" o "Ver Resultado" SOLO si la respuesta fue incorrecta
    if (!isCorrect) {
        // Determinar texto del botón basado en si es la última pregunta
        const buttonTextKey = (questionData.questionsAnswered + 1 >= config.TOTAL_QUESTIONS_PER_GAME)
                              ? 'final_result_button'
                              : 'next_button';
        finalFeedbackHTML += `<button id="next-question-button">${getTranslation(buttonTextKey)}</button>`;
    }
    // Actualizar el contenido del área de feedback en la UI
    feedbackAreaElement.innerHTML = finalFeedbackHTML;

    // --- Aplicar Resaltado a Botones (SIEMPRE después de mostrar feedback si es incorrecto) ---
    // Esto asegura que los botones existan en el DOM antes de intentar resaltarlos
    if (!isCorrect || isRefresh) { // Aplicar resaltado si fue incorrecto O si es un refresco
        try {
            if(optionsContainerElement) { // Usar la variable local
                const correctButtonClass = isMasteryMode ? 'mastery' : 'correct'; // Clase para botón correcto
                const correctAnswerValue = questionData.correctAnswer; // Valor/clave/objeto correcto

                // Iterar sobre los botones de opción recién creados o existentes
                Array.from(optionsContainerElement.children).forEach(button => {
                    const originalValue = button.getAttribute('data-original-value'); // Obtener valor guardado

                    // Lógica de comparación robusta (similar a handleAnswerClick)
                    let isThisButtonCorrect = false;
                    if (typeof correctAnswerValue === 'object' && correctAnswerValue !== null) {
                         try {
                              // Intentar comparación de objetos (puede necesitar ajuste)
                              isThisButtonCorrect = (originalValue === JSON.stringify(correctAnswerValue));
                         } catch (e) { isThisButtonCorrect = false; }
                    } else {
                         isThisButtonCorrect = (originalValue === correctAnswerValue);
                    }

                    // Aplicar clase correcta si coincide
                    if (isThisButtonCorrect) {
                        button.classList.add(correctButtonClass);
                    }

                    // Aplicar clase incorrecta a la selección del usuario (si aplica)
                    if (!isCorrect && originalValue === selectedValueOriginal) {
                        button.classList.add('incorrect');
                    }
                });
                 // Asegurarse que las opciones estén deshabilitadas (importante en refresco)
                optionsContainerElement.classList.add('options-disabled');
            }
        } catch (highlightError) {
            console.error("Error resaltando botones en displayFeedback:", highlightError);
        }
    }
    // --- FIN Aplicar Resaltado ---


    // Añadir listener al botón "Siguiente" si se creó (solo si fue incorrecto)
    if (!isCorrect) {
        const newNextButton = feedbackAreaElement.querySelector('#next-question-button'); // Buscar botón dentro del área
        if (newNextButton) {
            if (typeof nextStepHandler === 'function') {
                // Limpiar listeners anteriores por si acaso (aunque no debería haber en este punto)
                const freshButton = newNextButton.cloneNode(true);
                newNextButton.parentNode.replaceChild(freshButton, newNextButton);
                // Añadir listener al botón fresco
                freshButton.addEventListener('click', nextStepHandler);
            } else {
                console.error("nextStepHandler no es una función en displayFeedback");
                newNextButton.disabled = true; // Deshabilitar si no hay handler
            }
        } else {
            // Esto no debería pasar si el botón se añadió correctamente al HTML
            console.error("No se encontró el botón '#next-question-button' después de crearlo.");
        }
    }
}


/**
 * Actualiza la pantalla de Game Over.
 * @param {number} score - Puntuación final de la ronda.
 * @param {object} userDataForDisplay - Datos del usuario INCLUYENDO la propiedad 'name'.
 * @param {string} playedLevel - El nivel que se acaba de jugar (clave no traducida).
 * @param {function} playAgainHandler - La función de game.js a ejecutar al hacer clic en Play Again.
 */
export function displayGameOver(score, userDataForDisplay, playedLevel, playAgainHandler) {
    // Buscar elementos AQUI
    const finalScoreDisplayElement = document.getElementById('final-score');
    const highScoreMessageElement = document.getElementById('high-score-message');
    const playAgainButtonElement = document.getElementById('play-again-button');
    const currentGameOverSection = document.getElementById('game-over'); // Para showSection

    // **Verificación robusta de datos de entrada**
    if (!userDataForDisplay || !userDataForDisplay.name) {
         console.error("displayGameOver llamado sin userDataForDisplay válido o sin nombre de usuario.");
         if (currentGameOverSection) {
             // Mostrar error básico en la sección de Game Over
             currentGameOverSection.innerHTML = `<p>${getTranslation('error_displaying_results') || 'Error displaying results.'}</p>`;
             showSection(currentGameOverSection); // Asegurar que se muestre
         }
         return; // Salir si faltan datos críticos
    }

    // Mostrar puntuación final
    if(finalScoreDisplayElement) {
        finalScoreDisplayElement.textContent = score;
    } else {
         console.error("[UI] Elemento #final-score no encontrado.");
    }

    // --- Construir Mensaje Adicional (Rachas, Desbloqueos) ---
    // **CORRECCIÓN: Declarar extraMessage aquí**
    let extraMessage = '';
    const maxScore = config.PERFECT_SCORE;
    const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const isPerfect = score === maxScore;
    const meetsAssociateThreshold = scorePercentage >= config.MIN_SCORE_PERCENT_FOR_STREAK;

    // Comprobar si se acaba de desbloquear un nivel (basado en los datos MÁS RECIENTES del usuario)
    let justUnlockedLevel = null;
    const levelsOrder = config.LEVELS;
    const playedIndex = levelsOrder.indexOf(playedLevel);
    if (playedIndex !== -1 && playedIndex + 1 < levelsOrder.length) {
        const nextLevel = levelsOrder[playedIndex + 1];
        // Comprobar si el siguiente nivel ESTÁ en la lista de desbloqueados AHORA
        if (userDataForDisplay.unlockedLevels && userDataForDisplay.unlockedLevels.includes(nextLevel)) {
            // Asumir que si está ahora, se acaba de desbloquear (puede no ser 100% preciso si ya estaba)
            // Una mejor lógica requeriría comparar estado antes/después
            justUnlockedLevel = nextLevel;
        }
    }

    // Priorizar mensaje de desbloqueo
    if (justUnlockedLevel) {
        const unlockedLevelName = getTranslation(`level_${justUnlockedLevel.toLowerCase()}`) || justUnlockedLevel;
        extraMessage = getTranslation('game_over_level_unlocked', { levelName: unlockedLevelName });
    } else {
        // Si no se desbloqueó, mostrar mensaje de racha si aplica
        if (playedLevel === 'Entry') {
            if (isPerfect) {
                extraMessage = getTranslation('game_over_good_round_entry');
                if (userDataForDisplay.entryPerfectStreak > 0 && userDataForDisplay.entryPerfectStreak < 3) {
                    extraMessage += ` ${getTranslation('game_over_streak_progress', { level: 'Entry', streak: userDataForDisplay.entryPerfectStreak })}`;
                }
            } else if (userDataForDisplay.entryPerfectStreak > 0) {
                // Si no fue perfecta pero había racha, indicar que se reinició
                // extraMessage = getTranslation('game_over_streak_reset_100');
            }
        } else if (playedLevel === 'Associate') {
            if (meetsAssociateThreshold) {
                 extraMessage = getTranslation('game_over_good_round_associate', { threshold: config.MIN_SCORE_PERCENT_FOR_STREAK });
                 if (userDataForDisplay.associatePerfectStreak > 0 && userDataForDisplay.associatePerfectStreak < 3) {
                     extraMessage += ` ${getTranslation('game_over_streak_progress', { level: 'Associate', streak: userDataForDisplay.associatePerfectStreak })}`;
                 }
            } else if (userDataForDisplay.associatePerfectStreak > 0) {
                 // extraMessage = getTranslation('game_over_streak_reset_90');
            }
        } else if (playedLevel === 'Essential' && isPerfect) {
             extraMessage = getTranslation('game_over_good_round_essential');
        }
        // Añadir lógica para Professional/Expert si es necesario
    }

    // Combinar mensaje base con el extra si existe
    const baseMessage = getTranslation('game_over_base_message', { score: score, maxScore: maxScore, percentage: scorePercentage });
    const finalMessage = extraMessage ? `${baseMessage} ${extraMessage}` : baseMessage;

    // Mostrar mensaje final
    if(highScoreMessageElement) {
        highScoreMessageElement.textContent = finalMessage;
    } else {
         console.error("[UI] Elemento #high-score-message no encontrado.");
    }
    // --- Fin Construir Mensaje ---


    // --- Añadir listener al botón Play Again ---
    if (playAgainButtonElement) {
        // Traducir texto del botón
        playAgainButtonElement.textContent = getTranslation('play_again_button') || 'Choose Level';
        // Clonar para limpiar listeners anteriores y añadir el nuevo
        const newPlayAgainButton = playAgainButtonElement.cloneNode(true);
        if (playAgainButtonElement.parentNode) {
            playAgainButtonElement.parentNode.replaceChild(newPlayAgainButton, playAgainButtonElement);
        } else {
             console.error("[UI] El botón Play Again no tiene padre al intentar reemplazarlo.");
             // No mostrar la sección si el botón es esencial y no se puede añadir
             return;
        }

        // Añadir listener al botón clonado
        if (newPlayAgainButton) {
            if (typeof playAgainHandler === 'function') {
                newPlayAgainButton.addEventListener('click', playAgainHandler);
            } else {
                console.error("[UI] playAgainHandler no es una función en displayGameOver.");
                newPlayAgainButton.disabled = true; // Deshabilitar si no hay handler
            }
        }
    } else {
        console.error("[UI] El elemento #play-again-button es nulo en displayGameOver.");
    }

    // Mostrar la sección de Game Over
    showSection(currentGameOverSection);
}


/**
 * Actualiza la lista de High Scores en la UI.
 * @param {Array<object>} scoresData - Array de objetos [{ name, scores: { levelMode: score } }]
 */
export function displayHighScores(scoresData) {
     // Buscar elemento de la lista AQUI
     const scoreListElement = document.getElementById('score-list');
     if(!scoreListElement) {
         console.error("[UI] Elemento #score-list no encontrado.");
         return;
     }
     scoreListElement.innerHTML = ''; // Limpiar lista anterior

     // Mostrar mensaje si no hay datos
     if (!scoresData || scoresData.length === 0) {
         scoreListElement.innerHTML = `<li>${getTranslation('no_scores') || 'No scores yet.'}</li>`;
         return;
     }

     try {
         // La ordenación ahora se hace en storage.js, scoresData ya viene ordenado.
         // Limitar al número máximo de puntuaciones a mostrar (ya hecho en storage.js)
         // const topScores = scoresData.slice(0, config.MAX_HIGH_SCORES);

         scoresData.forEach(userData => {
             const li = document.createElement('li');
             li.classList.add('score-entry');

             // Nombre de usuario
             const usernameDiv = document.createElement('div');
             usernameDiv.classList.add('score-username');
             usernameDiv.textContent = userData.name || 'Anonymous'; // Usar 'Anonymous' si falta el nombre
             li.appendChild(usernameDiv);

             // Puntuaciones por nivel/modo
             const scoresDiv = document.createElement('div');
             scoresDiv.classList.add('level-scores');
             if (userData.scores && typeof userData.scores === 'object') {
                 // Ordenar las claves de nivel (Essential, Entry, Associate...)
                 const levelOrder = config.LEVELS;
                 const sortedLevelKeys = Object.keys(userData.scores).sort((a, b) => {
                     const levelA = a.split('-')[0]; // Extraer nombre del nivel (ej. 'Entry' de 'Entry-standard')
                     const levelB = b.split('-')[0];
                     return levelOrder.indexOf(levelA) - levelOrder.indexOf(levelB);
                 });

                 // Crear span para cada puntuación guardada
                 sortedLevelKeys.forEach(levelModeKey => {
                     const score = userData.scores[levelModeKey];
                     const [levelName, mode] = levelModeKey.split('-'); // Separar nivel y modo
                     const levelDisplayName = getTranslation(`level_${levelName.toLowerCase()}`) || levelName; // Traducir nombre nivel
                     // Podríamos añadir un icono para el modo si quisiéramos diferenciar 'mastery'
                     const scoreItem = document.createElement('span');
                     scoreItem.classList.add('level-score-item');
                     scoreItem.innerHTML = `${levelDisplayName}: <strong>${score}</strong>`;
                     scoresDiv.appendChild(scoreItem);
                 });
             } else {
                 scoresDiv.textContent = getTranslation('no_scores_recorded') || 'No scores recorded';
             }
             li.appendChild(scoresDiv);

             scoreListElement.appendChild(li); // Añadir entrada a la lista
         });
     } catch (error) {
         console.error("Error generando la lista de high scores:", error);
         scoreListElement.innerHTML = `<li>${getTranslation('error_displaying_scores') || 'Error displaying scores.'}</li>`;
     }
}

/**
 * Actualiza el display del temporizador.
 * @param {number} timeLeftValue - Segundos restantes.
 */
export function updateTimerDisplay(timeLeftValue) {
    // Buscar elementos del timer AQUI
    const timerDisplayDivElement = document.getElementById('timer-display');
    const timeLeftSpanElement = document.getElementById('time-left');

    if (!timerDisplayDivElement || !timeLeftSpanElement) {
        // console.warn("[UI] Elementos del timer no encontrados."); // Puede ser normal si timer está oculto
        return;
    }
    // Actualizar el número de segundos restantes
    timeLeftSpanElement.textContent = timeLeftValue;
    // Añadir/quitar clase 'low-time' si quedan 5 segundos o menos
    timerDisplayDivElement.classList.toggle('low-time', timeLeftValue <= 5);
}

/**
 * Muestra u oculta el display del temporizador.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function showTimerDisplay(show) {
     // Buscar elemento del timer AQUI
     const timerDisplayDivElement = document.getElementById('timer-display');
     if (timerDisplayDivElement) {
         timerDisplayDivElement.style.display = show ? 'block' : 'none';
     }
}
