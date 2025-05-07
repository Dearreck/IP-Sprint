document.addEventListener('DOMContentLoaded', () => {
    console.log("[circuitos.js] DOMContentLoaded: Intentando cargar SVG estático vía fetch...");

    const circuitBackground = document.getElementById('circuit-background');
    if (!circuitBackground) {
        console.error("[circuitos.js] Error: No se encontró el elemento #circuit-background");
        return;
    }

    // Ruta al archivo SVG
    const svgPath = 'assets/svg/circuitos.svg'; // Asegúrate que esta ruta sea correcta desde index.html

    // Función para cargar e insertar el SVG
    async function loadAndInjectSVG() {
        try {
            const response = await fetch(svgPath);
            if (!response.ok) {
                // Si falla la carga (404, etc.), lanzar un error
                throw new Error(`Error ${response.status} al cargar ${svgPath}: ${response.statusText}`);
            }
            // Obtener el contenido del SVG como texto
            const svgText = await response.text();

            // Insertar el contenido SVG dentro del div
            // Nota: No se limpia el innerHTML antes, por si necesitas añadir algo más aquí después.
            // Si quieres reemplazar completamente, usa: circuitBackground.innerHTML = svgText;
            circuitBackground.insertAdjacentHTML('beforeend', svgText);

            // Puedes añadir clases o IDs específicos a los elementos SVG cargados aquí si es necesario
            const loadedSvg = circuitBackground.querySelector('svg');
            if (loadedSvg) {
                // Ajustes opcionales al SVG cargado
                loadedSvg.style.position = 'absolute';
                loadedSvg.style.top = '0';
                loadedSvg.style.left = '0';
                loadedSvg.style.width = '100%';
                loadedSvg.style.height = '100%';
                loadedSvg.style.zIndex = '-1';
                console.log("[circuitos.js] SVG cargado e insertado correctamente.");
            } else {
                console.warn("[circuitos.js] SVG insertado, pero no se pudo encontrar el elemento <svg> principal dentro de #circuit-background.");
            }

        } catch (error) {
            console.error("[circuitos.js] Error al cargar o insertar el SVG:", error);
            // Opcional: Mostrar un mensaje de error al usuario en el div
            circuitBackground.innerHTML = `<p style="color: red; text-align: center;">Error loading background: ${error.message}</p>`;
        }
    }

    // Llamar a la función para cargar el SVG
    loadAndInjectSVG();

    // --- Lógica para modo Light/Dark (Se mantiene, afectará al SVG vía CSS) ---
    function switchMode(mode) {
        const bodyElement = document.body; // Usar body para aplicar la clase
        if (mode === 'light') {
            bodyElement.classList.remove('dark-mode');
            bodyElement.classList.add('light-mode');
        } else if (mode === 'dark') {
            bodyElement.classList.remove('light-mode');
            bodyElement.classList.add('dark-mode');
        }
        console.log(`[circuitos.js] Modo cambiado a: ${mode}`);
    }

    // Iniciar en modo oscuro por defecto
    // Detectar preferencia del sistema o default a dark
    let currentMode = 'dark'; // Default a dark
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        // Si el sistema prefiere claro, podríamos empezar en light, pero por ahora lo dejamos en dark
        // currentMode = 'light';
    }
    switchMode(currentMode); // Aplicar modo inicial

    // Listener para el botón de idioma/tema (asumiendo que cambia el tema también)
    const languageToggleButton = document.getElementById('language-toggle-button');
    if (languageToggleButton) {
        languageToggleButton.addEventListener('click', () => {
            // Alternar modo basado en la clase actual del body
            const newMode = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            switchMode(newMode);
        });
    }
    // --- Fin lógica Light/Dark ---

    // Ya no necesitamos la función animateCircuits aquí, a menos que planees animaciones complejas vía JS
});
