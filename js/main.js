// js/main.js
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as game from './game.js';
// --- NUEVO: Importar funciones de i18n ---
import { setLanguage, getCurrentLanguage } from './i18n.js';

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => { // Marcar como async

    // --- NUEVO: Establecer idioma inicial ---
    const initialLang = getCurrentLanguage(); // Obtener idioma guardado o detectado
    await setLanguage(initialLang); // Cargar y aplicar el idioma inicial
    // --- Fin Nuevo ---

    // Configuración Inicial al cargar la página (después de cargar idioma)
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    ui.showSection(ui.userSetupSection); // Mostrar solo el setup inicial

    // Listener para el formulario de username
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                game.handleUserLogin(enteredUsername);
            } else {
                // TODO: Usar getTranslation para mensajes de alerta
                alert("Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("#username-form no encontrado");
    }

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel" en Game Over
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', game.handlePlayAgain);
    } else {
         console.error("#play-again-button no encontrado");
    }

    // Listener para los botones de control durante el juego
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', game.handleRestartRound);
    } else { console.error("#restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', game.handleExitToMenu);
    } else { console.error("#exit-to-menu-button no encontrado"); }

    // --- NUEVO: Listeners para botones de idioma ---
    const langButtons = document.querySelectorAll('#language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const selectedLang = event.target.getAttribute('data-lang'); // Obtener 'es' o 'en' del botón
            if (selectedLang) {
                setLanguage(selectedLang); // Llamar a la función para cambiar idioma
            }
        });
    });
    // --- Fin Nuevo ---

}); // Fin DOMContentLoaded
