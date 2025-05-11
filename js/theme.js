// ip-sprint-main/js/theme.js
// ==================================================
// Módulo para la gestión del Tema Claro/Oscuro
// Optimizado para coordinar con script anti-FOUC en <head>
// ==================================================

const THEME_STORAGE_KEY = 'ipSprintThemePreference';
const DARK_MODE_CLASS = 'dark-mode';

// Referencia al botón de cambio de tema, se inicializará una vez
let themeToggleButton = null;

/**
 * Actualiza los iconos de luna/sol en el botón de cambio de tema.
 * Se asegura de que solo uno esté visible según el tema actual en <html>.
 */
function updateToggleButtonIcon() {
    if (!themeToggleButton) {
        // Este error no debería ocurrir si initThemeButton se llama correctamente.
        console.error("[Theme] updateToggleButtonIcon: Botón #theme-toggle-button no inicializado.");
        return;
    }

    const moonIcon = themeToggleButton.querySelector('.fa-moon');
    const sunIcon = themeToggleButton.querySelector('.fa-sun');

    if (!moonIcon || !sunIcon) {
        console.error("[Theme] Íconos de luna (.fa-moon) o sol (.fa-sun) no encontrados dentro del botón de tema.");
        return;
    }

    // Verifica el tema directamente desde la clase en <html>
    const isDarkMode = document.documentElement.classList.contains(DARK_MODE_CLASS);

    if (isDarkMode) {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'inline-block';
    } else {
        moonIcon.style.display = 'inline-block';
        sunIcon.style.display = 'none';
    }
    // console.log(`[Theme] Icono del botón actualizado. Modo oscuro: ${isDarkMode}`);
}

/**
 * Alterna entre el tema claro y oscuro cuando se hace clic en el botón.
 * Actualiza la clase en <html>, localStorage y el icono del botón.
 */
export function toggleTheme() {
    // Alternar la clase dark-mode en <html>
    document.documentElement.classList.toggle(DARK_MODE_CLASS);

    // Guardar la nueva preferencia de tema en localStorage
    if (document.documentElement.classList.contains(DARK_MODE_CLASS)) {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        // console.log("[Theme] Tema cambiado a: dark");
    } else {
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
        // console.log("[Theme] Tema cambiado a: light");
    }
    // Actualizar el icono del botón para que refleje el nuevo tema
    updateToggleButtonIcon();
}

/**
 * Inicializa la referencia al botón de tema.
 * Esta función es llamada desde main.js después de que el DOM esté cargado.
 */
export function initThemeButton() {
    themeToggleButton = document.getElementById('theme-toggle-button');
    if (!themeToggleButton) {
        console.error("[Theme] Botón #theme-toggle-button no encontrado durante la inicialización.");
    }
    // console.log("[Theme] Botón de tema inicializado.");
}

/**
 * Actualiza la UI del botón de tema (icono) para que coincida con el
 * tema actual (que ya fue aplicado por el script del <head>).
 * Esta función se llama desde main.js en DOMContentLoaded.
 */
export function updateThemeUI() {
    if (!themeToggleButton) {
        // Si initThemeButton aún no ha sido llamado o falló, intenta obtener el botón.
        // Esto es una salvaguarda, pero initThemeButton debería llamarse primero.
        initThemeButton();
    }
    updateToggleButtonIcon();
    // console.log("[Theme] UI del botón de tema actualizada.");
}
