// js/main.js
// ==================================================
// Punto de Entrada Principal y Manejo de Eventos Globales
// ==================================================

// --- Importaciones de Módulos ---
import * as storage from './storage.js';       // Funciones para localStorage
import * as ui from './ui.js';             // Funciones y selectores de UI
// --- MODIFICADO: Importar funciones específicas necesarias ---
import {
    handleUserLogin,
    handlePlayAgain,
    handleRestartRound,
    handleExitToMenu,
    selectLevelAndMode,
    getCurrentUsername,
    getCurrentLevel,
    refreshActiveGameUI // <-- Importar la nueva función de refresco
} from './game.js';
// Importar funciones de internacionalización (i18n)
import { setLanguage, getCurrentLanguage, getTranslation } from './i18n.js';

// --- Ejecución Principal al Cargar el DOM ---
// Espera a que toda la estructura HTML esté lista antes de ejecutar el código.
document.addEventListener('DOMContentLoaded', async () => { // Se marca como async para poder usar 'await'

    // --- Inicialización del Idioma ---
    // Determina el idioma inicial (guardado o del navegador)
    const initialLang = getCurrentLanguage();
    // Carga el archivo de idioma correspondiente y aplica las traducciones iniciales
    // a los elementos estáticos del HTML. 'await' asegura que esto termine antes de continuar.
    await setLanguage(initialLang);

    // --- Configuración Inicial de la UI ---
    // Carga las puntuaciones altas guardadas.
    const initialHighScores = storage.loadHighScores();
    // Muestra las puntuaciones (ui.js usará las traducciones ya cargadas).
    ui.displayHighScores(initialHighScores);
    // Muestra la primera pantalla: el formulario para ingresar el nombre de usuario.
    ui.showSection(ui.userSetupSection);

    // --- Listeners de Eventos Principales ---

    // Listener para el formulario de nombre de usuario
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita que el formulario recargue la página.
            const enteredUsername = ui.usernameInput.value.trim(); // Obtiene y limpia el nombre ingresado.
            if (enteredUsername) {
                // Si se ingresó un nombre, llama a la función de login en game.js.
                handleUserLogin(enteredUsername); // Usar la función importada
            } else {
                // Si no, muestra una alerta (traducida).
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        // Error si no se encuentra el formulario en el HTML.
        console.error("#username-form no encontrado");
    }

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel" en la pantalla Game Over
    if(ui.playAgainButton) {
        // Llama a la función correspondiente en game.js cuando se hace clic.
        ui.playAgainButton.addEventListener('click', handlePlayAgain); // Usar la función importada
    } else {
         console.error("#play-again-button no encontrado");
    }

    // Listener para los botones de control durante el juego (Reiniciar, Salir)
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', handleRestartRound); // Usar la función importada
    } else { console.error("#restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', handleExitToMenu); // Usar la función importada
    } else { console.error("#exit-to-menu-button no encontrado"); }

    // Listeners para los botones de selección de idioma (ES / EN)
    const langButtons = document.querySelectorAll('#language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', async (event) => { // Listener asíncrono
            const selectedLang = event.target.getAttribute('data-lang'); // Obtiene 'es' o 'en' del botón.
            if (selectedLang) {
                // 1. Cambia el idioma y aplica traducciones a elementos estáticos.
                await setLanguage(selectedLang);

                // --- 2. Refrescar Elementos Dinámicos ---
                // Es necesario volver a generar el contenido dinámico para que use el nuevo idioma.

                // 2.1. Recargar y volver a mostrar High Scores
                const currentHighScores = storage.loadHighScores();
                ui.displayHighScores(currentHighScores); // ui.js usa getTranslation internamente.

                // 2.2. Refrescar la pantalla activa (Menú de Niveles, Game Over o Juego Activo)
                const username = getCurrentUsername(); // Obtener username actual desde game.js
                if (username) { // Solo si ya hay un usuario logueado
                    const currentUserData = storage.getUserData(username); // Recargar datos del usuario

                    // Si la pantalla de selección de nivel está visible...
                    if (ui.levelSelectSection.style.display === 'block' && currentUserData) {
                         // ...volver a mostrarla para traducir botones y progreso.
                         // Pasamos selectLevelAndMode importada de game.js
                         ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, selectLevelAndMode);
                    }
                    // Si la pantalla de Game Over está visible...
                    else if (ui.gameOverSection.style.display === 'block' && currentUserData) {
                         // ...volver a llamar a displayGameOver para reconstruir el mensaje traducido.
                         const lastScoreText = ui.finalScoreDisplay.textContent; // Leer score del DOM
                         const lastScore = parseInt(lastScoreText, 10) || 0;
                         const lastLevelPlayed = getCurrentLevel(); // Obtener el último nivel jugado desde game.js
                         ui.displayGameOver(lastScore, currentUserData, lastLevelPlayed); // ui.js reconstruye el mensaje
                    }
                    // --- MODIFICADO: Si el área de juego está activa... ---
                    else if (ui.gameAreaSection.style.display === 'block') {
                        // ...llamar a la función centralizada en game.js para refrescarla.
                        refreshActiveGameUI();
                    }
                    // --- FIN MODIFICADO ---
                }
                // --- Fin Refresco Elementos Dinámicos ---
            }
        });
    });

}); // Fin DOMContentLoaded
