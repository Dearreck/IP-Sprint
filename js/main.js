// js/main.js
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as game from './game.js';
// Importar funciones de i18n y la función para obtener datos de la pregunta actual
import { setLanguage, getCurrentLanguage, getTranslation } from './i18n.js';
import { getCurrentUsername, getCurrentQuestionData, handleAnswerClick } from './game.js'; // Importar funciones necesarias de game

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
                // TODO: Añadir clave 'alert_enter_username' a JSONs
                alert(getTranslation('alert_enter_username') || "Por favor, ingresa un nombre de usuario.");
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

                // --- Refrescar elementos dinámicos ---

                // 1. Recargar y volver a mostrar High Scores
                const currentHighScores = storage.loadHighScores();
                ui.displayHighScores(currentHighScores);

                // 2. Volver a mostrar la pantalla de selección de nivel O Game Over (si están activas)
                //    para actualizar botones y progreso traducidos
                const username = getCurrentUsername(); // Obtener username actual
                if (username) { // Solo si ya hay un usuario logueado
                    const currentUserData = storage.getUserData(username);
                    if (ui.levelSelectSection.style.display === 'block' && currentUserData) {
                         ui.displayLevelSelection(currentUserData.unlockedLevels, currentUserData, game.selectLevelAndMode);
                    } else if (ui.gameOverSection.style.display === 'block' && currentUserData) {
                         ui.updateUnlockProgressUI(currentUserData); // Actualizar progreso
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
                }

                // --- NUEVO: Refrescar la pregunta y opciones actuales si el juego está activo ---
                if (ui.gameAreaSection.style.display === 'block') {
                    const currentQuestion = getCurrentQuestionData(); // Obtener datos de la pregunta actual
                    if(currentQuestion) {
                       // Volver a llamar a displayQuestion para que use las nuevas traducciones
                       ui.displayQuestion(currentQuestion, handleAnswerClick);
                       // Opcional: Actualizar info del jugador por si acaso
                       ui.updatePlayerInfo(username, game.getCurrentLevel ? game.getCurrentLevel() : '', game.getCurrentScore ? game.getCurrentScore() : 0); // Necesitaríamos exponer nivel y score actuales desde game.js
                    } else {
                        // Si no hay datos de pregunta (raro en esta pantalla), mostrar carga
                         if(ui.questionText) ui.questionText.innerHTML = getTranslation('loading_question');
                         if(ui.optionsContainer) ui.optionsContainer.innerHTML = '';
                    }
                }
                // --- Fin Nuevo ---
            }
        });
    });

}); // Fin DOMContentLoaded
