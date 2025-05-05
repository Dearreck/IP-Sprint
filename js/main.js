// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// Añadidos logs para depurar paso de handler en cambio de idioma.
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
    console.log("[Main] DOMContentLoaded"); // Log

    // --- Inicialización del Idioma ---
    const initialLang = getCurrentLanguage();
    console.log(`[Main] Idioma inicial detectado: ${initialLang}`); // Log
    try {
        await setLanguage(initialLang);
        console.log("[Main] Idioma inicial cargado y aplicado."); // Log
    } catch (error) {
        console.error("[Main] Error inicializando idioma:", error);
    }


    // --- Inicialización del Juego (Muestra Login) ---
    initializeGame();


    // --- Listeners de Eventos Principales ---

    // Listener para el formulario de nombre de usuario
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log("[Main] Formulario de usuario enviado."); // Log
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    handleUserLogin(enteredUsername);
                } catch (error) {
                    console.error("[Main] Error en handleUserLogin:", error);
                    alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
                }
            } else {
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("[Main] #username-form no encontrado");
    }

    // Listener para botón "Jugar de Nuevo"
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', handlePlayAgain);
    } else {
         console.error("[Main] #play-again-button no encontrado");
    }

    // Listeners botones control juego
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', handleRestartRound);
    } else { console.error("[Main] #restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', handleExitToMenu);
    } else { console.error("[Main] #exit-to-menu-button no encontrado"); }

    // Listeners para botones de idioma
    const langButtons = document.querySelectorAll('#language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const selectedLang = event.target.getAttribute('data-lang');
            console.log(`[Main] Botón de idioma clickeado: ${selectedLang}`); // Log
            if (selectedLang) {
                try {
                    // 1. Cambia idioma y aplica traducciones estáticas
                    await setLanguage(selectedLang);
                    console.log(`[Main] Idioma cambiado a ${selectedLang} y traducciones estáticas aplicadas.`); // Log

                    // --- 2. Refrescar Elementos Dinámicos ---
                    console.log("[Main] Iniciando refresco de UI dinámica..."); // Log

                    // Recargar y mostrar High Scores (si están visibles)
                    if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                        console.log("[Main] Refrescando High Scores..."); // Log
                        const currentHighScores = storage.loadHighScores();
                        ui.displayHighScores(currentHighScores);
                    }

                    const username = getCurrentUsername();
                    if (username) {
                        console.log(`[Main] Refrescando UI para usuario: ${username}`); // Log
                        const currentUserData = storage.getUserData(username);

                        // Si la pantalla de selección de nivel está visible...
                        if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                             // --- Log para verificar handler ANTES de pasar ---
                             console.log(`[Main] Refrescando Level Selection. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`);
                             ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, username, selectLevelAndMode); // Pasar handler
                        }
                        // Si la pantalla de Game Over está visible...
                        else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                             console.log("[Main] Refrescando Game Over..."); // Log
                             const lastScoreText = ui.finalScoreDisplay?.textContent;
                             const lastScore = parseInt(lastScoreText || '0', 10);
                             const lastLevelPlayed = getCurrentLevel();
                             ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed);
                        }
                        // Si el área de juego está activa...
                        else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                            console.log("[Main] Refrescando Game Area..."); // Log
                            refreshActiveGameUI(); // Llama a la función de refresco en game.js
                        } else {
                            console.log("[Main] Ninguna sección principal activa para refrescar."); // Log
                        }
                    } else {
                         console.log("[Main] No hay usuario logueado, no se refresca UI dinámica."); // Log
                    }
                    console.log("[Main] Refresco de UI dinámica completado."); // Log
                    // --- Fin Refresco Elementos Dinámicos ---
                } catch (error) {
                    console.error("[Main] Error al cambiar idioma y refrescar UI:", error);
                }
            }
        });
    });

}); // Fin DOMContentLoaded
