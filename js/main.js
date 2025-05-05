// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// CORREGIDO: Soluciona SyntaxError al refrescar UI tras cambio de idioma.
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
    // Esta función ahora es responsable de mostrar la pantalla de login inicial
    initializeGame();


    // --- Listeners de Eventos Principales ---

    // Listener para el formulario de nombre de usuario
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita recarga de página
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    // Llama a la lógica de login en game.js, que a su vez llama a ui.displayLevelSelection
                    handleUserLogin(enteredUsername);
                } catch (error) {
                    console.error("Error en handleUserLogin:", error);
                    // Muestra alerta traducida o fallback
                    alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
                }
            } else {
                // Alerta si no se ingresa nombre
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("#username-form no encontrado");
    }

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel" en Game Over
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', handlePlayAgain);
    } else {
         console.error("#play-again-button no encontrado");
    }

    // Listeners para botones de control durante el juego
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', handleRestartRound);
    } else { console.error("#restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', handleExitToMenu);
    } else { console.error("#exit-to-menu-button no encontrado"); }

    // Listeners para los botones de selección de idioma
    const langButtons = document.querySelectorAll('#language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const selectedLang = event.target.getAttribute('data-lang');
            if (selectedLang) {
                try {
                    // 1. Cambia idioma y aplica traducciones estáticas
                    await setLanguage(selectedLang);

                    // --- 2. Refrescar Elementos Dinámicos ---
                    // Recargar y mostrar High Scores (si están visibles)
                    // Añadimos chequeo de existencia del elemento antes de acceder a style
                    if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                        const currentHighScores = storage.loadHighScores();
                        ui.displayHighScores(currentHighScores); // ui.js usa getTranslation
                    }

                    // Refrescar la pantalla activa (Menú, Game Over, Juego)
                    const username = getCurrentUsername();
                    if (username) { // Solo si hay usuario logueado
                        const currentUserData = storage.getUserData(username); // Recargar datos

                        // Añadimos chequeos de existencia de las secciones antes de acceder a style
                        // Si la pantalla de selección de nivel está visible...
                        if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                             ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
                        }
                        // Si la pantalla de Game Over está visible...
                        else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                             const lastScoreText = ui.finalScoreDisplay?.textContent; // Optional chaining
                             const lastScore = parseInt(lastScoreText || '0', 10);
                             const lastLevelPlayed = getCurrentLevel();
                             ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed);
                        }
                        // Si el área de juego está activa...
                        else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                            refreshActiveGameUI(); // Llama a la función de refresco en game.js
                        }
                    }
                    // --- Fin Refresco Elementos Dinámicos ---
                } catch (error) {
                    console.error("Error al cambiar idioma y refrescar UI:", error);
                    // Podríamos mostrar un mensaje al usuario aquí
                }
            }
        });
    });

}); // Fin DOMContentLoaded
