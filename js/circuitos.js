/**
 * @fileoverview Script para cargar dinámicamente el SVG del fondo
 * y manejar el cambio de tema (claro/oscuro).
 * El tema claro es el predeterminado.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("[circuitos.js] DOMContentLoaded: Iniciando carga de SVG y configuración de tema...");

    // Elemento contenedor donde se insertará el SVG
    const circuitBackground = document.getElementById('circuit-background');
    if (!circuitBackground) {
        console.error("[circuitos.js] Error crítico: No se encontró el elemento #circuit-background. El fondo no se cargará.");
        return; // Detener si no existe el contenedor
    }

    // Ruta relativa al archivo SVG desde index.html
    const svgPath = 'assets/svg/circuitos.svg';

    /**
     * Carga el archivo SVG usando fetch y lo inserta en el DOM.
     */
    async function loadAndInjectSVG() {
        console.log(`[circuitos.js] Intentando cargar SVG desde: ${svgPath}`);
        try {
            // Realiza la petición para obtener el archivo SVG
            const response = await fetch(svgPath);

            // Verifica si la petición fue exitosa (status 200-299)
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status} al cargar ${svgPath}: ${response.statusText}`);
            }

            // Lee el contenido del SVG como texto
            const svgText = await response.text();
            console.log("[circuitos.js] SVG obtenido correctamente.");

            // Inserta el texto SVG dentro del div contenedor
            // Usamos innerHTML para reemplazar cualquier contenido previo (como mensajes de error)
            circuitBackground.innerHTML = svgText;

            // Opcional: Ajustar estilos directamente al SVG cargado si es necesario
            const loadedSvg = circuitBackground.querySelector('svg');
            if (loadedSvg) {
                // Asegura que el SVG ocupe todo el contenedor y esté detrás del contenido
                loadedSvg.style.position = 'absolute';
                loadedSvg.style.top = '0';
                loadedSvg.style.left = '0';
                loadedSvg.style.width = '100%';
                loadedSvg.style.height = '100%';
                loadedSvg.style.zIndex = '-1'; // Detrás de 'main' (z-index: 1)
                console.log("[circuitos.js] SVG insertado y estilos básicos aplicados.");
            } else {
                console.warn("[circuitos.js] SVG insertado, pero no se pudo encontrar el elemento <svg> principal.");
            }

        } catch (error) {
            console.error("[circuitos.js] Falló la carga o inserción del SVG:", error);
            // Muestra un mensaje de error dentro del div si falla la carga
            circuitBackground.innerHTML = `<p style="color: red; text-align: center; padding-top: 20px;">Error al cargar fondo: ${error.message}</p>`;
        }
    }

    /**
     * Aplica el tema (modo claro u oscuro) al body.
     * @param {string} mode - El modo a aplicar ('light' o 'dark').
     */
    function switchMode(mode) {
        const bodyElement = document.body;
        // Limpia clases de tema anteriores para evitar conflictos
        bodyElement.classList.remove('light-mode', 'dark-mode');

        // Añade la clase del modo solicitado
        if (mode === 'light') {
            bodyElement.classList.add('light-mode');
        } else { // Asume 'dark' para cualquier otro caso
            bodyElement.classList.add('dark-mode');
        }
        console.log(`[circuitos.js] Tema cambiado a: ${mode}`);

        // Opcional: Guardar preferencia en localStorage
        // localStorage.setItem('themePreference', mode);
    }

    // --- Inicialización del Tema ---
    // Establecer el tema claro como predeterminado
    let initialMode = 'light';
    console.log(`[circuitos.js] Estableciendo tema inicial predeterminado: ${initialMode}`);
    // Podrías añadir aquí lógica para leer una preferencia guardada si existe:
    // const savedTheme = localStorage.getItem('themePreference');
    // if (savedTheme === 'dark' || savedTheme === 'light') {
    //    initialMode = savedTheme;
    //    console.log(`[circuitos.js] Preferencia de tema encontrada: ${initialMode}`);
    // }
    switchMode(initialMode); // Aplicar el tema inicial

    // --- Listener para el Botón de Cambio de Tema/Idioma ---
    const languageToggleButton = document.getElementById('language-toggle-button');
    if (languageToggleButton) {
        languageToggleButton.addEventListener('click', () => {
            // Determina el modo actual basado en la clase del body
            const currentMode = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            // Cambia al modo opuesto
            const newMode = currentMode === 'dark' ? 'light' : 'dark';
            console.log("[circuitos.js] Botón de tema clickeado.");
            switchMode(newMode);
        });
        console.log("[circuitos.js] Listener añadido al botón de cambio de tema.");
    } else {
        console.warn("[circuitos.js] No se encontró el botón #language-toggle-button para añadir el listener de tema.");
    }

    // --- Cargar el SVG ---
    // Llamar a la función async para cargar e insertar el SVG
    loadAndInjectSVG();

}); // Fin DOMContentLoaded
