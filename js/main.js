// js/main.js
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as game from './game.js';

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {

    // Configuración Inicial
    game.initializeGame(); // Carga high scores iniciales, muestra pantalla setup

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

    // Listener para el botón "Jugar de Nuevo / Elegir Nivel"
    if(ui.playAgainButton) {
        ui.playAgainButton.addEventListener('click', game.handlePlayAgain); // Llama a la lógica del juego
    } else {
         console.error("#play-again-button no encontrado");
    }

});
