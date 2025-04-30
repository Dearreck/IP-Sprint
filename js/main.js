// js/main.js
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as game from './game.js';
// Importar funciones de i18n
import { setLanguage, getCurrentLanguage } from './i18n.js';

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => { // Marcar como async

    // Establecer idioma inicial
    const initialLang = getCurrentLanguage();
    await setLanguage(initialLang); // Cargar y aplicar el idioma inicial

    // Configuración Inicial al cargar la página (después de cargar idioma)
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores); // Mostrar scores iniciales (ya traducidos)
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
                alert(getTranslation('alert_enter_username')); // Necesitas añadir 'alert_enter_username' a los JSON
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

    // Listeners para botones de idioma
    const langButtons = document.querySelectorAll('#language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', async (event) => { // Marcar como async
            const selectedLang = event.target.getAttribute('data-lang');
            if (selectedLang) {
                await setLanguage(selectedLang); // Cambiar idioma y aplicar a elementos estáticos

                // --- NUEVO: Refrescar elementos dinámicos ---
                // Recargar y volver a mostrar High Scores para aplicar traducción
                const currentHighScores = storage.loadHighScores();
                ui.displayHighScores(currentHighScores);

                // --- NUEVO: Volver a mostrar la pantalla de selección de nivel si está activa ---
                // Esto actualizará los botones de nivel y el progreso de desbloqueo
                // Necesitamos obtener los datos del usuario actual (podríamos necesitar exponerlos desde game.js
                // o recargarlos aquí si es necesario)
                // Asumiendo que game.js tiene una forma de exponer currentUserData o username
                const currentUserData = storage.getUserData(game.getCurrentUsername()); // Necesitamos una función getCurrentUsername en game.js
                if (ui.levelSelectSection.style.display === 'block' && currentUserData) {
                     ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, game.selectLevelAndMode);
                }
                // Si estamos en Game Over, también actualizamos el progreso
                else if (ui.gameOverSection.style.display === 'block' && currentUserData) {
                     ui.updateUnlockProgressUI(currentUserData); // Solo actualizar progreso en Game Over
                     // Actualizar texto botón "Jugar de Nuevo"
                     if (ui.playAgainButton && currentUserData.unlockedLevels) {
                         if (currentUserData.unlockedLevels.length <= 1) {
                             const levelName = getTranslation(`level_${(currentUserData.unlockedLevels[0] || 'entry').toLowerCase()}`);
                             ui.playAgainButton.textContent = getTranslation('play_again_level_button', { levelName: levelName });
                         } else {
                             ui.playAgainButton.textContent = getTranslation('play_again_button');
                         }
                     }
                }
                // --- Fin Nuevo ---
            }
        });
    });

}); // Fin DOMContentLoaded
