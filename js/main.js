// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// Correcciones post-refactorización UI Stepper+Tarjeta
// ==================================================

// --- Importaciones de Módulos ---
import * as storage from './storage.js';
import * as ui from './ui.js';
// Importar funciones específicas necesarias de game.js
import {
    handleUserLogin,
    handlePlayAgain,
    handleRestartRound,
    handleExitToMenu,
    selectLevelAndMode, // Handler para selección de nivel
    getCurrentUsername,
    getCurrentLevel,
    refreshActiveGameUI,
    initializeGame // Importar initializeGame
} from './game.js';
// Importar funciones de internacionalización (i18n)
import { setLanguage, getCurrentLanguage, getTranslation } from './i18n.js';

// --- Ejecución Principal al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {

    // --- Inicialización del Idioma ---
    const initialLang = getCurrentLanguage();
    try {
        await setLanguage(initialLang); // Carga idioma y aplica traducciones estáticas
    } catch (error) {
        console.error("Error inicializando idioma:", error);
        // Podríamos mostrar un mensaje al usuario aquí si falla la carga inicial
    }


    // --- Inicialización del Juego (Muestra Login) ---
    // Llama a la función de inicialización en game.js
    initializeGame();


    // --- Listeners de Eventos Principales ---

    // Listener para el formulario de nombre de usuario
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    handleUserLogin(enteredUsername); // Llama a la lógica de login en game.js
                } catch (error) {
                    console.error("Error en handleUserLogin:", error);
                    alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
                }
            } else {
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("#username-form no encontrado");
    }

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel" en la pantalla Game Over
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', handlePlayAgain);
    } else {
         console.error("#play-again-button no encontrado");
    }

    // Listener para los botones de control durante el juego (Reiniciar, Salir)
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', handleRestartRound);
    } else { console.error("#restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', handleExitToMenu);
    } else { console.error("#exit-to-menu-button no encontrado"); }

    // Listeners para los botones de selección de idioma (ES / EN)
    const langButtons = document.querySelectorAll('#language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const selectedLang = event.target.getAttribute('data-lang');
            if (selectedLang) {
                try {
                    // 1. Cambia el idioma y aplica traducciones estáticas.
                    await setLanguage(selectedLang);

                    // --- 2. Refrescar Elementos Dinámicos ---
                    // Recargar y volver a mostrar High Scores (si están visibles)
                    if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                        const currentHighScores = storage.loadHighScores();
                        ui.displayHighScores(currentHighScores);
                    }

                    // Refrescar la pantalla activa (Menú de Niveles, Game Over o Juego Activo)
                    const username = getCurrentUsername();
                    if (username) {
                        const currentUserData = storage.getUserData(username); // Recargar datos

                        // Si la pantalla de selección de nivel está visible...
                        if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                             // ...volver a mostrarla para traducir stepper y tarjeta.
                             ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
                        }
                        // Si la pantalla de Game Over está visible...
                        else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                             // ...volver a llamar a displayGameOver para reconstruir el mensaje traducido.
                             const lastScoreText = ui.finalScoreDisplay?.textContent;
                             const lastScore = parseInt(lastScoreText || '0', 10);
                             const lastLevelPlayed = getCurrentLevel();
                             ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed);
                        }
                        // Si el área de juego está activa...
                        else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                            // ...llamar a la función centralizada en game.js para refrescarla.
                            refreshActiveGameUI();
                        }
                    }
                    // --- Fin Refresco Elementos Dinámicos ---
                } catch (error) {
                    console.error("Error al cambiar idioma y refrescar UI:", error);
                    // Podríamos mostrar un mensaje al usuario si el cambio de idioma falla
                }
            }
        });
    });

}); // Fin DOMContentLoaded
```

**2. Correcciones en `ui.js`:**

Vamos a revisar `displayLevelSelection` y `updateLevelCard` para asegurarnos de que manejan correctamente los elementos y datos.


```javascript
// js/ui.js
// ==================================================
// Módulo de Interfaz de Usuario (UI) para IP Sprint
// Correcciones para la lógica del Stepper y la Tarjeta de Nivel.
// ==================================================

// --- Importaciones de Módulos ---
import * as config from './config.js';
// --- MODIFICADO: No necesitamos importar handleAnswerClick ni selectLevelAndMode aquí ---
// import { handleAnswerClick, selectLevelAndMode } from './game.js';
// --- Necesitamos importar funciones de game.js para pasarlas como handlers ---
import { handleAnswerClick } from './game.js'; // Para displayQuestion
import { getTranslation } from './i18n.js';
import * as storage from './storage.js';
import {
    // Generadores de Explicaciones (sin cambios)
    generateClassRangeTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML, generateWildcardExplanationHTML, generateSubnettingExplanationHTML,
    generateIpTypeExplanationHTML, generateBitsForSubnetsExplanationHTML, generateBitsForHostsExplanationHTML,
    generateMaskForHostsExplanationHTML, generateNumSubnetsExplanationHTML, generatePortionExplanationHTML
} from './utils.js';

// --- Selección de Elementos del DOM (sin cambios) ---
export const userSetupSection = document.getElementById('user-setup');
export const levelSelectSection = document.getElementById('level-select');
export const gameAreaSection = document.getElementById('game-area');
// ... (resto de selectores sin cambios) ...
export const levelStepperContainer = document.getElementById('level-stepper-container');
export const levelCardArea = document.getElementById('level-card-area');
export const levelCardContent = document.getElementById('level-card-content');
// ...

// Mapa para generadores de explicaciones (sin cambios)
const explanationGenerators = { /* ... */ };

// --- Funciones de Manipulación de la UI ---

// showSection (sin cambios)
export function showSection(sectionToShow) { /* ... (sin cambios) ... */ }

// updatePlayerInfo (sin cambios)
export function updatePlayerInfo(username, level, score) { /* ... (sin cambios) ... */ }


// --- Lógica para Stepper y Tarjeta (Revisada) ---

const levelIcons = { /* ... (sin cambios) ... */ };

/**
 * Genera y muestra el Stepper horizontal y prepara el área de la tarjeta.
 * @param {Array<string>} unlockedLevels - Array con los nombres de los niveles desbloqueados.
 * @param {object} currentUserData - Datos completos del usuario (nombre necesario para puntuaciones).
 * @param {function} levelSelectHandler - La función (de game.js) a llamar cuando se hace clic en un marcador de nivel.
 */
export function displayLevelSelection(unlockedLevels, currentUserData, levelSelectHandler) {
    // --- Añadir chequeos de existencia de elementos ---
    if (!levelStepperContainer || !levelCardContent || !config.LEVELS || !currentUserData) {
        console.error("Error en displayLevelSelection: Faltan elementos del DOM o datos necesarios.", {
            levelStepperContainer, levelCardContent, config LEVELS: config.LEVELS, currentUserData
        });
        // Mostrar un mensaje de error en la UI si es posible
        if (levelSelectSection) {
             levelSelectSection.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
             showSection(levelSelectSection);
        }
        return; // Detener ejecución si faltan elementos clave
    }

    levelStepperContainer.innerHTML = ''; // Limpiar stepper anterior
    levelCardContent.innerHTML = `<p>${getTranslation('loading_levels') || 'Loading levels...'}</p>`; // Mensaje inicial

    const allLevels = config.LEVELS;
    let lastUnlockedIndex = -1;
    let firstUnlockedLevelName = null; // Para seleccionar por defecto

    allLevels.forEach((level, index) => {
        const isUnlocked = unlockedLevels.includes(level);
        if (isUnlocked) {
            lastUnlockedIndex = index;
            if (firstUnlockedLevelName === null) {
                firstUnlockedLevelName = level; // Guarda el primer nivel desbloqueado
            }
        }

        const stepperItem = document.createElement('div');
        stepperItem.classList.add('stepper-item');
        stepperItem.dataset.level = level;

        // Aplicar clase de estado inicial
        stepperItem.classList.toggle('unlocked', isUnlocked);
        stepperItem.classList.toggle('locked', !isUnlocked);
        // TODO: Añadir clase 'completed' si se implementa ese estado

        // Icono
        const iconWrapper = document.createElement('div');
        iconWrapper.classList.add('stepper-icon-wrapper');
        const icon = document.createElement('i');
        // --- Corregido: Asegurar clases de Font Awesome ---
        icon.className = `fa-solid ${levelIcons[level] || 'fa-question-circle'}`;
        iconWrapper.appendChild(icon);
        stepperItem.appendChild(iconWrapper);

        // Etiqueta
        const label = document.createElement('span');
        label.classList.add('stepper-label');
        const translationKey = `level_${level.toLowerCase()}`;
        label.dataset.translate = translationKey;
        label.textContent = getTranslation(translationKey) || level;
        stepperItem.appendChild(label);

        // Añadir listener
        stepperItem.addEventListener('click', () => {
            // --- Añadir chequeo: Solo actualizar si no está ya seleccionado ---
            if (stepperItem.classList.contains('selected')) return;

            document.querySelectorAll('.stepper-item.selected').forEach(el => el.classList.remove('selected'));
            stepperItem.classList.add('selected');
            // --- Pasar el nombre de usuario actual a updateLevelCard ---
            updateLevelCard(level, isUnlocked, currentUserData.name, levelSelectHandler);
        });

        levelStepperContainer.appendChild(stepperItem);
    });

    // Actualizar línea de progreso
    updateStepperProgressLine(lastUnlockedIndex, allLevels.length);

    // Seleccionar y mostrar la tarjeta del primer nivel desbloqueado por defecto
    const effectiveFirstLevel = firstUnlockedLevelName || allLevels[0]; // Usa el primero si ninguno está desbloqueado (Essential)
    const firstStepperItem = levelStepperContainer.querySelector(`.stepper-item[data-level="${effectiveFirstLevel}"]`);
    if (firstStepperItem) {
        firstStepperItem.classList.add('selected');
        // --- Pasar nombre de usuario ---
        updateLevelCard(effectiveFirstLevel, unlockedLevels.includes(effectiveFirstLevel), currentUserData.name, levelSelectHandler);
    } else {
        levelCardContent.innerHTML = `<p>${getTranslation('error_loading_levels') || 'Error loading levels.'}</p>`;
        console.error(`No se encontró el stepper item para el nivel por defecto: ${effectiveFirstLevel}`);
    }

    showSection(levelSelectSection);
    if (unlockProgressSection) unlockProgressSection.style.display = 'none';
}

/**
 * Actualiza el contenido de la tarjeta única.
 * @param {string} levelName - Nombre del nivel.
 * @param {boolean} isUnlocked - Si está desbloqueado.
 * @param {string} currentUsername - Nombre del usuario actual (para buscar puntuación).
 * @param {function} levelSelectHandler - Función para iniciar el nivel.
 */
// --- MODIFICADO: Recibe username en lugar de todos los datos ---
function updateLevelCard(levelName, isUnlocked, currentUsername, levelSelectHandler) {
    if (!levelCardContent) return;
    levelCardContent.innerHTML = ''; // Limpiar

    // Título
    const title = document.createElement('h3');
    const titleKey = `level_${levelName.toLowerCase()}`;
    title.dataset.translate = titleKey;
    title.textContent = getTranslation(titleKey) || levelName;
    levelCardContent.appendChild(title);

    // Icono Grande Opcional
    // ...

    if (isUnlocked) {
        // Estado
        const status = document.createElement('div');
        status.classList.add('level-status');
        status.dataset.translate = 'level_status_available';
        status.textContent = getTranslation('level_status_available') || "Available";
        levelCardContent.appendChild(status);

        // Puntuación
        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('level-score');
        // --- MODIFICADO: Cargar puntuaciones aquí y buscar por username ---
        const allHighScores = storage.loadHighScores();
        const userScoreData = allHighScores.find(user => user.name === currentUsername);
        const userScores = userScoreData?.scores || {};
        const levelKey = `${levelName}-standard`; // Asumimos modo standard
        const bestScore = userScores[levelKey];

        if (bestScore !== undefined) {
            scoreDiv.innerHTML = `${getTranslation('your_best_score') || 'Your Best Score'}: <strong>${bestScore}</strong>`;
        } else {
            scoreDiv.textContent = getTranslation('not_played_yet') || 'Not played yet';
        }
        levelCardContent.appendChild(scoreDiv);

        // Botón Iniciar
        const startButton = document.createElement('button');
        startButton.classList.add('start-level-button');
        const buttonKey = 'start_level_button';
        startButton.dataset.translate = buttonKey;
        startButton.textContent = getTranslation(buttonKey) || 'Start Level';
        // --- Añadir chequeo si levelSelectHandler es una función ---
        if (typeof levelSelectHandler === 'function') {
            startButton.addEventListener('click', () => {
                levelSelectHandler(levelName, 'standard'); // Asumimos modo standard
            });
        } else {
            console.error("levelSelectHandler no es una función en updateLevelCard");
            startButton.disabled = true; // Deshabilitar si no hay handler
        }
        levelCardContent.appendChild(startButton);

    } else { // Nivel Bloqueado
        // Estado
        const status = document.createElement('div');
        status.classList.add('level-status', 'locked');
        status.innerHTML = `<i class="fas fa-lock"></i> ${getTranslation('level_status_locked') || 'Locked'}`;
        levelCardContent.appendChild(status);

        // Requisito
        const requirement = document.createElement('div');
        requirement.classList.add('level-requirement');
        let requirementText = '';
        let requirementKey = '';
        // --- Lógica de Requisitos ---
        const levelsOrder = config.LEVELS;
        const currentIndex = levelsOrder.indexOf(levelName);
        if (currentIndex > 0) {
            const previousLevel = levelsOrder[currentIndex - 1];
            requirementKey = `requirement_${levelName.toLowerCase()}`;
            requirementText = getTranslation(requirementKey, { prevLevel: getTranslation(`level_${previousLevel.toLowerCase()}`) }) || `Complete ${previousLevel} first.`;
        } else {
            requirementKey = 'requirement_default'; // Fallback
            requirementText = getTranslation(requirementKey) || "Unlock previous levels first.";
        }

        requirement.innerHTML = `<i class="fas fa-info-circle"></i> ${requirementText}`;
        levelCardContent.appendChild(requirement);
    }
}

/**
 * Actualiza la línea de progreso del stepper.
 * @param {number} lastUnlockedIndex - Índice del último nivel desbloqueado.
 * @param {number} totalLevels - Número total de niveles.
 */
function updateStepperProgressLine(lastUnlockedIndex, totalLevels) {
    if (!levelStepperContainer || totalLevels <= 1) return;

    // Calcula el porcentaje de progreso basado en los *espacios* entre marcadores
    const progressPercentage = lastUnlockedIndex >= 0
        ? (lastUnlockedIndex / (totalLevels - 1)) * 80 + 10 // Escala a 80% del ancho (dejando 10% márgenes)
        : 10; // Mínimo 10% para el inicio de la línea

    // --- MODIFICADO: Usar setProperty para la variable CSS ---
    // Asegúrate que la variable --progress-width se use en el ::after en CSS
    // #level-stepper-container::after { width: var(--progress-width, 10%); }
    levelStepperContainer.style.setProperty('--progress-width', `${progressPercentage}%`);
}


// --- Funciones existentes (revisar si necesitan ajustes menores) ---

// updateUnlockProgressUI (marcada como obsoleta, sin cambios)
export function updateUnlockProgressUI(currentUserData) { /* ... */ }

// updateRoundProgressUI (sin cambios)
export function updateRoundProgressUI(roundResults, isMasteryMode) { /* ... */ }

// displayQuestion (revisada, OK)
export function displayQuestion(questionData, answerClickHandler) { /* ... (versión anterior ya corregida) ... */ }

// displayFeedback (revisada, OK)
export function displayFeedback(isCorrect, isMasteryMode, questionData, nextStepHandler) { /* ... (versión anterior ya corregida) ... */ }

// displayGameOver (revisada, OK)
export function displayGameOver(score, currentUserData, playedLevel) { /* ... (versión anterior ya corregida) ... */ }

// displayHighScores (revisada, OK)
export function displayHighScores(scoresData) { /* ... (versión anterior ya corregida) ... */ }

// updateTimerDisplay (sin cambios)
export function updateTimerDisplay(timeLeftValue) { /* ... */ }

// showTimerDisplay (sin cambios)
export function showTimerDisplay(show) { /* ... */ }
