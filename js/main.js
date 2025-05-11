// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// Optimizado para coordinar con script anti-FOUC en <head>
// ==================================================

// --- Importaciones de Módulos ---
import * as storage from './storage.js';
import * as ui from './ui.js';
import {
    handleUserLogin,
    handlePlayAgain,
    handleRestartRound,
    handleExitToMenu,
    selectLevelAndMode,
    getCurrentUsername,
    getCurrentLevel,
    refreshActiveGameUI,
    initializeGame
} from './game.js';
// Importar funciones de internacionalización (i18n)
import { setLanguage, getCurrentLanguage, getTranslation, applyStaticTranslations } from './i18n.js'; // Asumiendo que applyStaticTranslations existe o se crea
// Importar funciones de Tema
import { toggleTheme, initThemeButton, updateThemeUI } from './theme.js'; // Cambiado applySavedTheme por updateThemeUI

// --- Ejecución Principal al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Main] DOMContentLoaded: Iniciando configuración principal.");

    // --- Inicialización de Controles de Tema e Idioma ---
    // El script en <head> ya aplicó el tema y lang iniciales al <html>.
    // Ahora, los módulos de tema e i18n deben sincronizar la UI de sus botones
    // y cargar cualquier dato necesario (como las traducciones).

    // 1. Tema: Inicializa el botón y actualiza su UI (ej. icono sol/luna)
    // basándose en la clase que el script del <head> ya puso en <html>.
    initThemeButton(); // theme.js obtiene referencia a su botón
    updateThemeUI();   // theme.js actualiza el icono del botón según el tema actual en <html>

    // 2. Idioma: Obtiene el idioma (ya establecido en <html> por el script del <head>),
    // carga el archivo JSON de ese idioma y aplica traducciones estáticas.
    const initialLang = getCurrentLanguage(); // i18n.js lee de localStorage o usa default
    console.log(`[Main] Idioma inicial (post-head script): ${initialLang}`);
    try {
        // setLanguage ahora debería enfocarse en cargar JSON y aplicar traducciones,
        // y actualizar el botón de idioma. No necesita volver a setear document.documentElement.lang
        // si initialLang ya es el correcto (lo cual debería ser).
        await setLanguage(initialLang, true); // true indica que es la carga inicial
        console.log("[Main] Archivo de idioma cargado y traducciones estáticas aplicadas.");
    } catch (error) {
        console.error("[Main] Error inicializando idioma:", error);
    }

    // --- Inicialización del Juego (Muestra Login) ---
    initializeGame(); // game.js muestra high scores y la sección de login

    // --- Listeners de Eventos Principales ---

    // Listener para el formulario de nombre de usuario
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                try {
                    handleUserLogin(enteredUsername); // game.js maneja el login
                } catch (error) {
                    console.error("[Main] Error en handleUserLogin:", error);
                    alert(getTranslation('error_loading_user_data', { message: error.message }) || `Error loading user data: ${error.message}`);
                }
            } else {
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("[Main] #username-form no encontrado.");
    }

    // Listener para el botón de cambio de tema
    const themeToggleButtonInMain = document.getElementById('theme-toggle-button');
    if (themeToggleButtonInMain) {
        themeToggleButtonInMain.addEventListener('click', () => {
            toggleTheme(); // theme.js cambia el tema y actualiza localStorage y el icono
        });
    } else {
        console.error("[Main] #theme-toggle-button no encontrado para el listener.");
    }

    // Listener para el botón toggle de idioma
    const langToggleButton = document.getElementById('language-toggle-button');
    if (langToggleButton) {
        langToggleButton.addEventListener('click', async () => {
            const currentLang = getCurrentLanguage();
            const targetLang = currentLang === 'es' ? 'en' : 'es';
            console.log(`[Main] Cambio de idioma solicitado. Actual: ${currentLang}, Objetivo: ${targetLang}`);
            try {
                // setLanguage ahora sí debe cambiar el atributo lang en <html>,
                // guardar en localStorage, cargar nuevo JSON y reaplicar traducciones.
                await setLanguage(targetLang, false); // false indica que NO es la carga inicial
                console.log(`[Main] Idioma cambiado a ${targetLang}.`);

                // Refrescar UI dinámica si es necesario
                console.log("[Main] Iniciando refresco de UI dinámica por cambio de idioma...");
                if (getCurrentUsername()) { // Solo si hay un usuario logueado
                    refreshActiveGameUI(); // game.js se encarga de refrescar la vista actual
                }
                // Siempre refrescar high scores si están visibles
                if (ui.highScoresSection && ui.highScoresSection.style.display !== 'none') {
                    const currentHighScores = storage.loadHighScores();
                    ui.displayHighScores(currentHighScores);
                }
                console.log("[Main] Refresco de UI dinámica completado.");
            } catch (error) {
                console.error("[Main] Error al cambiar idioma y refrescar UI:", error);
            }
        });
    } else {
        console.error("[Main] #language-toggle-button no encontrado.");
    }

    // Indicar que la página está lista para ser mostrada (si usas la técnica de opacidad en CSS)
    // El script del <head> ya añade 'initial-prefs-applied'.
    // Si necesitas una segunda clase para indicar que el JS principal ha terminado, podrías añadirla aquí.
    // document.body.classList.add('main-scripts-loaded');

    console.log("[Main] Configuración principal de DOMContentLoaded completada.");
}); // Fin DOMContentLoaded
