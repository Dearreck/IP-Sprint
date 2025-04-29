// js/main.js
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as game from './game.js'; // Importar lógica del juego

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {

    // Configuración Inicial al cargar la página
    const initialHighScores = storage.loadHighScores();
    ui.displayHighScores(initialHighScores);
    ui.showSection(ui.userSetupSection); // Mostrar solo el setup inicial

    // Listener para el formulario de username
    if (ui.usernameForm) {
        ui.usernameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const enteredUsername = ui.usernameInput.value.trim();
            if (enteredUsername) {
                game.handleUserLogin(enteredUsername); // Llama a la lógica del juego
            } else {
                alert("Por favor, ingresa un nombre de usuario.");
            }
        });
    } else {
        console.error("#username-form no encontrado");
    }

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel" en Game Over
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', game.handlePlayAgain); // Llama a la lógica del juego
    } else {
         console.error("#play-again-button no encontrado");
    }
    // Fin del listener

    // Listener para el botón "Reiniciar / Salir" en juego activo
    if (ui.restartRoundButton) {
        ui.restartRoundButton.addEventListener('click', game.handleRestartRound);
    } else { console.error("#restart-round-button no encontrado"); }

    if (ui.exitToMenuButton) {
        ui.exitToMenuButton.addEventListener('click', game.handleExitToMenu);
    } else { console.error("#exit-to-menu-button no encontrado"); }
    // Fin del listener

    // Listener para el icono de información de desbloqueo ---
    const infoIcon = document.querySelector('#unlock-progress .info-icon');
    const unlockInfoText = document.getElementById('unlock-info-text');

    if (infoIcon && unlockInfoText) {
        infoIcon.addEventListener('click', () => {
            // Cambia la visibilidad del texto explicativo
            const isVisible = unlockInfoText.style.display === 'block';
            unlockInfoText.style.display = isVisible ? 'none' : 'block';
        });
    } else {
        // No es un error crítico si no se encuentran, podría no mostrarse esa sección aún
        // console.warn("No se encontró el icono de info o el texto explicativo (puede ser normal si la sección está oculta).");
    }
    // Fin del listener

}); // Fin DOMContentLoaded
