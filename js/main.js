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

}); // Fin DOMContentLoaded
