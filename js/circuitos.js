// circuitos.js
// ==================================================
// Lógica para la animación del fondo de circuitos con SVG
// ==================================================

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

    // Función para crear un nodo (círculo)
    function createNode(cx, cy) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.classList.add('circuit-node');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '8'); // Radio del nodo
        return circle;
    }

    // Crear y añadir líneas y nodos al grupo
    const line1 = createLine(100, 100, 300, 200);
    const node1 = createNode(100, 100);
    const node2 = createNode(300, 200);

    const line2 = createLine(300, 200, 500, 150);
    const node3 = createNode(500, 150);

    const line3 = createLine(500, 150, 700, 250);
    const node4 = createNode(700, 250);

    const line4 = createLine(700, 250, 750, 400);
    const node5 = createNode(750, 400);


    const line5 = createLine(50, 500, 200, 400);
    const node6 = createNode(50, 500);
    const node7 = createNode(200, 400);
    const line6 = createLine(200, 400, 400, 550);
    const node8 = createNode(400, 550);

    const line7 = createLine(150, 300, 650, 300);
    const node9 = createNode(150, 300);
    const node10 = createNode(650, 300);


    [line1, node1, node2, line2, node3, line3, node4, line4, node5, line5, node6, node7, line6, node8, line7, node9, node10].forEach(element => {
        circuitosGroup.appendChild(element);
    });

    svg.appendChild(circuitosGroup);


    // 4. Agregar el SVG al contenedor en el DOM
    circuitBackground.appendChild(svg);

    // 5. Iniciar la animación (opcional: animación basada en JS)
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
