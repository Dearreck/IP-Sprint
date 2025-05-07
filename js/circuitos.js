document.addEventListener('DOMContentLoaded', () => {
    console.log("[circuitos.js] DOMContentLoaded: Inicializando fondo de circuitos...");

    // 1. Obtener el contenedor del fondo
    const circuitBackground = document.getElementById('circuit-background');
    if (!circuitBackground) {
        console.error("[circuitos.js] Error: No se encontró el elemento #circuit-background");
        return; // Detener si no existe el contenedor
    }

    // 2. Crear el elemento SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = 'circuit-svg';
    svg.setAttribute('viewBox', '0 0 800 600'); // Establecer viewBox
    svg.style.position = 'absolute'; // Posicionamiento absoluto
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';  // Asegurar que el SVG ocupe todo el contenedor
    svg.style.height = '100%';
    svg.style.zIndex = '-1'; // Detrás del contenido

    // 3. Crear los elementos del circuito (líneas y nodos)
    const circuitosGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    circuitosGroup.id = 'circuit-group';

    // Función para crear una línea
    function createLine(x1, y1, x2, y2) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.classList.add('circuit-line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        return line;
    }

    // Función para crear un nodo (círculo) con ícono
    function createNodeWithIcon(cx, cy, iconClass) {
        const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nodeGroup.classList.add('circuit-node-group');

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.classList.add('circuit-node');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '10');

        const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        foreignObject.setAttribute('x', cx - 15); // Centrar el ícono
        foreignObject.setAttribute('y', cy - 15);
        foreignObject.setAttribute('width', '30');
        foreignObject.setAttribute('height', '30');

        const div = document.createElement('div');
        div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        div.style.fontSize = '16px';
        div.style.height = '100%';
        div.style.width = '100%';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';

        const icon = document.createElement('i');
        icon.className = iconClass; // Establecer la clase del ícono

        div.appendChild(icon);
        foreignObject.appendChild(div);

        nodeGroup.appendChild(circle);
        nodeGroup.appendChild(foreignObject);

        return nodeGroup;
    }

    // Crear y añadir líneas y nodos al grupo
    const line1 = createLine(100, 100, 300, 200);
    const node1 = createNodeWithIcon(100, 100, 'fas fa-server');
    const node2 = createNodeWithIcon(300, 200, 'fas fa-router');

    const line2 = createLine(300, 200, 500, 150);
    const node3 = createNodeWithIcon(500, 150, 'fas fa-desktop');

    const line3 = createLine(500, 150, 700, 250);
    const node4 = createNodeWithIcon(700, 250, 'fas fa-server');

    const line4 = createLine(700, 250, 750, 400);
    const node5 = createNodeWithIcon(750, 400, 'fas fa-router');


    const line5 = createLine(50, 500, 200, 400);
    const node6 = createNodeWithIcon(50, 500, 'fas fa-desktop');
    const node7 = createNodeWithIcon(200, 400, 'fas fa-server');
    const line6 = createLine(200, 400, 400, 550);
    const node8 = createNodeWithIcon(400, 550, 'fas fa-router');
    const line7 = createLine(150, 300, 650, 300);
    const node9 = createNodeWithIcon(150, 300, 'fas fa-desktop');
    const node10 = createNodeWithIcon(650, 300, 'fas fa-server');


    [line1, node1, node2, line2, node3, line3, node4, line4, node5, line5, node6, node7, line6, node8, line7, node9, node10].forEach(element => {
        circuitosGroup.appendChild(element);
    });

    svg.appendChild(circuitosGroup);


    // 4. Agregar el SVG al contenedor en el DOM
    circuitBackground.appendChild(svg);


    // 5. Función para cambiar entre modos de color (light/dark)
    function switchMode(mode) {
        if (mode === 'light') {
            circuitBackground.classList.remove('dark-mode');
            circuitBackground.classList.add('light-mode');
        } else if (mode === 'dark') {
            circuitBackground.classList.remove('light-mode');
            circuitBackground.classList.add('dark-mode');
        }
    }

    // 6. Iniciar en modo oscuro por defecto y cambiar al hacer clic en el botón de idioma
    switchMode('dark'); // Iniciar en modo oscuro

    const languageToggleButton = document.getElementById('language-toggle-button');  // Correct ID
    if (languageToggleButton) {
        languageToggleButton.addEventListener('click', () => {
            const currentMode = circuitBackground.classList.contains('dark-mode') ? 'light' : 'dark';
            switchMode(currentMode);
        });
    }


    // 7. Iniciar la animación (opcional: animación basada en JS)
    function animateCircuits() {
        const lines = document.querySelectorAll('.circuit-line');
        const nodes = document.querySelectorAll('.circuit-node');

        lines.forEach(line => {
            // Si bien la animación principal está en CSS, podrías manipular propiedades aquí también
            // line.style.strokeDashoffset = ...
        });

        nodes.forEach(node => {
           // node.style.opacity =  // Puedes manipular la opacidad desde JS
        });

        requestAnimationFrame(animateCircuits); // Continuar la animación
    }

    animateCircuits(); // Iniciar el bucle de animación

    console.log("[circuitos.js] Fondo de circuitos inicializado y animando.");
});
