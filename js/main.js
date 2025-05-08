// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// Incluye logs para depuración.
// Listeners de botones de juego movidos a game.js/ui.js.
// ==================================================

// --- Importaciones de Módulos ---
import * as storage from './storage.js';
import * as ui from './ui.js'; // Necesario para referencias a elementos del DOM
// Importar funciones específicas necesarias de game.js
import {
    handleUserLogin,
    handlePlayAgain, // Necesario para pasarlo durante el refresco de Game Over
    handleRestartRound, // Necesario para pasarlo a botones en startGame
    handleExitToMenu,   // Necesario para pasarlo a botones en startGame
    selectLevelAndMode, // Handler para selección de nivel
    getCurrentUsername,
    getCurrentLevel,
    refreshActiveGameUI,
    initializeGame
} from './game.js';
// Importar funciones de internacionalización (i18n)
import { setLanguage, getCurrentLanguage, getTranslation } from './i18n.js';
// Importar funciones de Tema
import { initTheme, toggleTheme, applySavedTheme } from './theme.js';

// --- Ejecución Principal al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Main] DOMContentLoaded"); // Log

    // Obtener el botón del tema aquí una vez que el DOM está listo
    const themeToggleButton = document.getElementById('theme-toggle-button');

    // Aplicar tema guardado ANTES de inicializar otras cosas que puedan depender de estilos
    if (themeToggleButton) { // Solo si el botón existe
        applySavedTheme(); // Aplica la clase al body y actualiza el icono
    } else {
        console.error("[Main] #theme-toggle-button no encontrado al aplicar tema guardado.");
    }

    // --- Inicialización del Idioma ---
    const initialLang = getCurrentLanguage();
    console.log(`[Main] Idioma inicial detectado: ${initialLang}`); // Log
    try {
        await setLanguage(initialLang); // Carga idioma y aplica traducciones estáticas
        console.log("[Main] Idioma inicial cargado y aplicado."); // Log
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
            console.log("[Main] Formulario de usuario enviado."); // Log
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    // Llama a la lógica de login en game.js
                    handleUserLogin(enteredUsername);
                } catch (error) {
                    console.error("[Main] Error en handleUserLogin:", error); // Mantener error crítico
                    // Muestra alerta traducida o fallback
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

    // NUEVO: Listener para el botón de cambio de tema
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            toggleTheme();
        });
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
            console.log(`[Main] Botón toggle idioma clickeado. Actual: ${currentLang}, Objetivo: ${targetLang}`); // Log

            try {
                // 2. Cambiar idioma y aplicar traducciones estáticas
                await setLanguage(targetLang);
                console.log(`[Main] Idioma cambiado a ${targetLang} y traducciones estáticas aplicadas.`); // Log

                // --- 3. Refrescar UI dinámica ---
                console.log("[Main] Iniciando refresco de UI dinámica..."); // Log

                // Recargar y mostrar High Scores (si están visibles)
                if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                    console.log("[Main] Refrescando High Scores..."); // Log
                    const currentHighScores = storage.loadHighScores();
                    ui.displayHighScores(currentHighScores);
                }

                const username = getCurrentUsername();
                if (username) { // Solo si hay usuario logueado
                    console.log(`[Main] Refrescando UI para usuario: ${username}`); // Log
                    const currentUserData = storage.getUserData(username); // Recargar datos

                    // Refrescar la sección que esté activa
                    if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                         console.log(`[Main] Refrescando Level Selection. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`); // Log
                         // Pasar el handler 'selectLevelAndMode' correctamente
                         ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, username, selectLevelAndMode);
                    }
                    else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                         console.log("[Main] Refrescando Game Over..."); // Log
                         const lastScoreText = ui.finalScoreDisplay?.textContent; // Optional chaining
                         const lastScore = parseInt(lastScoreText || '0', 10);
                         const lastLevelPlayed = getCurrentLevel();
                         // Pasar el handler 'handlePlayAgain' correctamente
                         ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed, handlePlayAgain);
                    }
                    else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                        console.log("[Main] Refrescando Game Area..."); // Log
                        // Llamar a la función de refresco en game.js
                        refreshActiveGameUI();
                    } else {
                        console.log("[Main] Ninguna sección principal activa para refrescar."); // Log
                    }
                } else {
                     console.log("[Main] No hay usuario logueado, no se refresca UI dinámica."); // Log
                }
                console.log("[Main] Refresco de UI dinámica completado."); // Log
                // --- Fin Refresco ---
            } catch (error) {
                console.error("[Main] Error al cambiar idioma y refrescar UI:", error); // Mantener error crítico
            }
        });
    } else {
        console.error("[Main] #language-toggle-button no encontrado"); // Mantener error crítico
    }

}); // Fin DOMContentLoaded
