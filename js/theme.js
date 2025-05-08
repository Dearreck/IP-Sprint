// ip-sprint-main/js/theme.js
// ==================================================
// Módulo para la gestión del Tema Claro/Oscuro
// ==================================================

const THEME_STORAGE_KEY = 'ipSprintThemePreference';
const DARK_MODE_CLASS = 'dark-mode';

// Elementos del DOM (se obtienen una vez para evitar búsquedas repetidas)
const body = document.body;
let themeToggleButton = null; // Se inicializará en initTheme

/**
 * Actualiza el icono del botón de cambio de tema.
 */
function updateToggleButtonIcon() {
    if (!themeToggleButton) return;

    const moonIcon = themeToggleButton.querySelector('.fa-moon');
    const sunIcon = themeToggleButton.querySelector('.fa-sun');

    if (body.classList.contains(DARK_MODE_CLASS)) {
        // Modo Oscuro: Mostrar sol, ocultar luna
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'inline-block';
    } else {
        // Modo Claro: Mostrar luna, ocultar sol
        if (moonIcon) moonIcon.style.display = 'inline-block';
        if (sunIcon) sunIcon.style.display = 'none';
    }
}

/**
 * Aplica el tema guardado (claro/oscuro) al cargar la página.
 */
export function applySavedTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') {
        body.classList.add(DARK_MODE_CLASS);
    } else {
        body.classList.remove(DARK_MODE_CLASS); // Asegura el modo claro si no hay preferencia o es 'light'
    }
    updateToggleButtonIcon();
    console.log(`[Theme] Tema aplicado al cargar: ${body.classList.contains(DARK_MODE_CLASS) ? 'dark' : 'light'}`);
}

/**
 * Alterna entre el tema claro y oscuro.
 */
export function toggleTheme() {
    body.classList.toggle(DARK_MODE_CLASS);
    if (body.classList.contains(DARK_MODE_CLASS)) {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        console.log("[Theme] Tema cambiado a: dark");
    } else {
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
        console.log("[Theme] Tema cambiado a: light");
    }
    updateToggleButtonIcon();
}

/**
 * Inicializa el módulo de tema.
 * Busca el botón y configura el estado inicial del icono.
 * Esta función debe llamarse después de que el DOM esté cargado.
 */
export function initTheme() {
    themeToggleButton = document.getElementById('theme-toggle-button');
    if (!themeToggleButton) {
        console.error("[Theme] Botón #theme-toggle-button no encontrado durante la inicialización.");
        return;
    }
    // Aplicar el tema guardado y actualizar el icono al iniciar.
    // Esto es importante porque applySavedTheme se llama antes en main.js,
    // pero el icono necesita que themeToggleButton ya esté asignado.
    // O, mejor aún, applySavedTheme actualiza el icono directamente.
    applySavedTheme(); // Llama para asegurar que el icono esté correcto al cargar.
}
