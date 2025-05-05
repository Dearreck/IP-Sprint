// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// CORREGIDO: Listeners para botones de juego movidos a game.js/ui.js.
// Maneja toggle de idioma y refresco de UI.
// Versión sin console.log de depuración.
// ==================================================

// --- Importaciones de Módulos ---
import * as storage from './storage.js';
import * as ui from './ui.js'; // Necesario para referencias a elementos del DOM
// Importar funciones específicas necesarias de game.js
import {
    handleUserLogin,
    // handlePlayAgain, // Ya no se necesita aquí
    // handleRestartRound, // Ya no se necesita aquí
    // handleExitToMenu, // Ya no se necesita aquí
    selectLevelAndMode, // Handler para selección de nivel
    getCurrentUsername,
    getCurrentLevel,
    refreshActiveGameUI,
    initializeGame,
    handlePlayAgain // Necesario para pasarlo durante el refresco de Game Over
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
        console.error("[Main] Error inicializando idioma:", error); // Mantener error crítico
    }

    // --- Inicialización del Juego (Muestra Login) ---
    initializeGame(); // Llama a la función de inicialización en game.js

    // --- Listeners de Eventos Principales ---

    // Listener para el formulario de nombre de usuario
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita recarga de página
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    // Llama a la lógica de login en game.js
                    handleUserLogin(enteredUsername);
                } catch (error) {
                    console.error("[Main] Error en handleUserLogin:", error); // Mantener error crítico
                    alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
                }
            } else {
                // Alerta si no se ingresa nombre
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("[Main] #username-form no encontrado"); // Mantener error crítico
    }

    // --- Listeners para botones de juego (Movidos a game.js y ui.js) ---
    // Ya no se añaden aquí los listeners para:
    // - #play-again-button (se añade en ui.js -> displayGameOver)
    // - #restart-round-button (se añade en game.js -> startGame)
    // - #exit-to-menu-button (se añade en game.js -> startGame)

    // Listener para el botón toggle de idioma
    const langToggleButton = document.getElementById('language-toggle-button');
    if (langToggleButton) {
        langToggleButton.addEventListener('click', async () => {
            // 1. Determinar idioma objetivo
            const currentLang = getCurrentLanguage();
            const targetLang = currentLang === 'es' ? 'en' : 'es';

            try {
                // 2. Cambiar idioma y aplicar traducciones estáticas
                await setLanguage(targetLang);

                // --- 3. Refrescar UI dinámica ---
                // Recargar y mostrar High Scores (si están visibles)
                if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                    const currentHighScores = storage.loadHighScores();
                    ui.displayHighScores(currentHighScores);
                }

                const username = getCurrentUsername();
                if (username) { // Solo si hay usuario logueado
                    const currentUserData = storage.getUserData(username); // Recargar datos

                    // Refrescar la sección que esté activa
                    if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                         // Pasar el handler 'selectLevelAndMode' correctamente
                         ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, username, selectLevelAndMode);
                    }
                    else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                         const lastScoreText = ui.finalScoreDisplay?.textContent;
                         const lastScore = parseInt(lastScoreText || '0', 10);
                         const lastLevelPlayed = getCurrentLevel();
                         // Pasar el handler 'handlePlayAgain' correctamente
                         ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed, handlePlayAgain);
                    }
                    else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                        // Llamar a la función de refresco en game.js
                        refreshActiveGameUI();
                    }
                }
                // --- Fin Refresco ---
            } catch (error) {
                console.error("[Main] Error al cambiar idioma y refrescar UI:", error); // Mantener error crítico
            }
        });
    } else {
        console.error("[Main] #language-toggle-button no encontrado"); // Mantener error crítico
    }

}); // Fin DOMContentLoaded
