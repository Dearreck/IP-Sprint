// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// MODIFICADO: Listener para el botón toggle de idioma.
// Incluye logs para depuración.
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
        await setLanguage(initialLang); // Carga idioma y aplica traducciones estáticas
        console.log("[Main] Idioma inicial cargado y aplicado."); // Log
    } catch (error) {
        console.error("[Main] Error inicializando idioma:", error);
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
            console.log("[Main] Formulario de usuario enviado."); // Log
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    // Llama a la lógica de login en game.js, que a su vez llama a ui.displayLevelSelection
                    handleUserLogin(enteredUsername);
                } catch (error) {
                    console.error("[Main] Error en handleUserLogin:", error);
                    // Muestra alerta traducida o fallback
                    alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
                }
            } else {
                // Alerta si no se ingresa nombre
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("[Main] #username-form no encontrado");
    }

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel" en Game Over
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', handlePlayAgain);
    } else {
         console.error("[Main] #play-again-button no encontrado");
    }

    // Listeners para botones de control durante el juego
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', handleRestartRound);
    } else { console.error("[Main] #restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', handleExitToMenu);
    } else { console.error("[Main] #exit-to-menu-button no encontrado"); }

    // --- Listener para el botón toggle de idioma ---
    const langToggleButton = document.getElementById('language-toggle-button');
    if (langToggleButton) {
        langToggleButton.addEventListener('click', async () => {
            // 1. Determinar el idioma *actual*
            const currentLang = getCurrentLanguage();
            // 2. Determinar el idioma *objetivo* (el otro)
            const targetLang = currentLang === 'es' ? 'en' : 'es';
            console.log(`[Main] Botón toggle idioma clickeado. Actual: ${currentLang}, Objetivo: ${targetLang}`);

            try {
                // 3. Llamar a setLanguage con el idioma objetivo
                await setLanguage(targetLang);
                console.log(`[Main] Idioma cambiado a ${targetLang} y traducciones estáticas aplicadas.`);

                // --- 4. Refrescar UI dinámica ---
                console.log("[Main] Iniciando refresco de UI dinámica...");

                // Recargar y mostrar High Scores (si están visibles)
                // Añadimos chequeo de existencia del elemento antes de acceder a style
                if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                    console.log("[Main] Refrescando High Scores...");
                    const currentHighScores = storage.loadHighScores();
                    ui.displayHighScores(currentHighScores); // ui.js usa getTranslation
                }

                const username = getCurrentUsername();
                if (username) { // Solo si hay usuario logueado
                    console.log(`[Main] Refrescando UI para usuario: ${username}`);
                    const currentUserData = storage.getUserData(username); // Recargar datos

                    // Añadimos chequeos de existencia de las secciones antes de acceder a style
                    // Si la pantalla de selección de nivel está visible...
                    if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                         // --- Log para verificar handler ANTES de pasar ---
                         console.log(`[Main] Refrescando Level Selection. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`);
                         // Pasar el handler 'selectLevelAndMode' correctamente
                         ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, username, selectLevelAndMode);
                    }
                    // Si la pantalla de Game Over está visible...
                    else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                         console.log("[Main] Refrescando Game Over...");
                         const lastScoreText = ui.finalScoreDisplay?.textContent; // Optional chaining
                         const lastScore = parseInt(lastScoreText || '0', 10);
                         const lastLevelPlayed = getCurrentLevel();
                         // Pasar los datos necesarios, incluyendo el nombre de usuario implícito en currentUserData
                         ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed);
                    }
                    // Si el área de juego está activa...
                    else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                        console.log("[Main] Refrescando Game Area...");
                        refreshActiveGameUI(); // Llama a la función de refresco en game.js
                    } else {
                        console.log("[Main] Ninguna sección principal activa para refrescar.");
                    }
                } else {
                     console.log("[Main] No hay usuario logueado, no se refresca UI dinámica.");
                }
                console.log("[Main] Refresco de UI dinámica completado.");
                // --- Fin Refresco ---
            } catch (error) {
                console.error("[Main] Error al cambiar idioma y refrescar UI:", error);
                // Podríamos mostrar un mensaje al usuario aquí si el cambio falla
            }
        });
    } else {
        console.error("[Main] #language-toggle-button no encontrado");
    }
    // --- FIN Listener Toggle Idioma ---

}); // Fin DOMContentLoaded
