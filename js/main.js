// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// ELIMINADO: Listener para #play-again-button (se moverá a ui.js)
// ==================================================

// --- Importaciones de Módulos ---
import * as storage from './storage.js';
import * as ui from './ui.js';
// Importar funciones específicas necesarias de game.js
import {
    handleUserLogin,
    // handlePlayAgain, // Ya no necesitamos importar el handler aquí directamente
    handleRestartRound,
    handleExitToMenu,
    selectLevelAndMode,
    getCurrentUsername,
    getCurrentLevel,
    refreshActiveGameUI,
    initializeGame
} from './game.js';
// Importar funciones de internacionalización (i18n)
import { setLanguage, getCurrentLanguage, getTranslation } from './i18n.js';

// --- Ejecución Principal al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Main] DOMContentLoaded");

    // --- Inicialización del Idioma ---
    const initialLang = getCurrentLanguage();
    console.log(`[Main] Idioma inicial detectado: ${initialLang}`);
    try {
        await setLanguage(initialLang);
        console.log("[Main] Idioma inicial cargado y aplicado.");
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
            console.log("[Main] Formulario de usuario enviado.");
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

    // --- ELIMINADO: Listener para el botón "Jugar de Nuevo" ---
    // const playAgainButtonElement = document.getElementById('play-again-button');
    // if (playAgainButtonElement) {
    //     playAgainButtonElement.addEventListener('click', handlePlayAgain); // <--- ELIMINADO
    //     console.log("[Main] Listener añadido a #play-again-button.");
    // } else {
    //     console.error("[Main] #play-again-button no encontrado al añadir listener.");
    // }
    // --- FIN ELIMINADO ---

    // Listeners para botones de control durante el juego
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', handleRestartRound);
    } else { console.error("[Main] #restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', handleExitToMenu);
    } else { console.error("[Main] #exit-to-menu-button no encontrado"); }

    // Listener para el botón toggle de idioma
    const langToggleButton = document.getElementById('language-toggle-button');
    if (langToggleButton) {
        langToggleButton.addEventListener('click', async () => {
            const currentLang = getCurrentLanguage();
            const targetLang = currentLang === 'es' ? 'en' : 'es';
            console.log(`[Main] Botón toggle idioma clickeado. Actual: ${currentLang}, Objetivo: ${targetLang}`);
            try {
                await setLanguage(targetLang);
                console.log(`[Main] Idioma cambiado a ${targetLang} y traducciones estáticas aplicadas.`);
                // --- Refrescar UI dinámica ---
                console.log("[Main] Iniciando refresco de UI dinámica...");
                if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                    console.log("[Main] Refrescando High Scores...");
                    const currentHighScores = storage.loadHighScores();
                    ui.displayHighScores(currentHighScores);
                }
                const username = getCurrentUsername();
                if (username) {
                    console.log(`[Main] Refrescando UI para usuario: ${username}`);
                    const currentUserData = storage.getUserData(username);
                    if (ui.levelSelectSection && ui.levelSelectSection.style.display !== 'none' && currentUserData) {
                         console.log(`[Main] Refrescando Level Selection. typeof selectLevelAndMode: ${typeof selectLevelAndMode}`);
                         ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, username, selectLevelAndMode);
                    }
                    else if (ui.gameOverSection && ui.gameOverSection.style.display !== 'none' && currentUserData) {
                         console.log("[Main] Refrescando Game Over...");
                         const lastScoreText = ui.finalScoreDisplay?.textContent;
                         const lastScore = parseInt(lastScoreText || '0', 10);
                         const lastLevelPlayed = getCurrentLevel();
                         // --- MODIFICADO: Pasar handlePlayAgain a displayGameOver ---
                         // Necesitaremos ajustar ui.displayGameOver para aceptar este handler
                         ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed, handlePlayAgain);
                    }
                    else if (ui.gameAreaSection && ui.gameAreaSection.style.display !== 'none') {
                        console.log("[Main] Refrescando Game Area...");
                        refreshActiveGameUI();
                    } else {
                        console.log("[Main] Ninguna sección principal activa para refrescar.");
                    }
                } else {
                     console.log("[Main] No hay usuario logueado, no se refresca UI dinámica.");
                }
                console.log("[Main] Refresco de UI dinámica completado.");
            } catch (error) {
                console.error("[Main] Error al cambiar idioma y refrescar UI:", error);
            }
        });
    } else {
        console.error("[Main] #language-toggle-button no encontrado");
    }

}); // Fin DOMContentLoaded
