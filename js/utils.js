// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// Contiene funciones de ayuda generales, funciones
// específicas para manipulación de IPs y funciones
// para generar tablas HTML usadas en las explicaciones.
// ==================================================

// --- Utilidades Generales ---

/**
 * Genera un entero aleatorio entre min (incluido) y max (incluido).
 * Útil para seleccionar elementos aleatorios de arrays o generar números.
 * @param {number} min - El límite inferior del rango.
 * @param {number} max - El límite superior del rango.
 * @returns {number} Un número entero aleatorio dentro del rango especificado.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);   // Asegura que min sea un entero (redondea hacia arriba).
    max = Math.floor(max); // Asegura que max sea un entero (redondea hacia abajo).
    // Genera un número aleatorio entre 0 (incluido) y 1 (excluido),
    // lo escala al tamaño del rango (max - min + 1),
    // lo redondea hacia abajo para obtener un índice entero,
    // y finalmente suma min para ajustar al rango deseado.
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Baraja (reordena aleatoriamente) los elementos de un array existente.
 * Modifica el array original directamente (no devuelve uno nuevo).
 * Utiliza el algoritmo Fisher-Yates (también conocido como Knuth Shuffle).
 * @param {Array<any>} array - El array que se desea barajar.
 */
export function shuffleArray(array) {
    // Recorre el array desde el último elemento hacia el primero.
    for (let i = array.length - 1; i > 0; i--) {
        // Elige un índice aleatorio 'j' entre 0 y el índice actual 'i' (inclusive).
        const j = Math.floor(Math.random() * (i + 1));
        // Intercambia el elemento en la posición actual 'i' con el elemento en la posición aleatoria 'j'.
        [array[i], array[j]] = [array[j], array[i]]; // Sintaxis de desestructuración para intercambio.
    }
    // No se devuelve nada porque el array original fue modificado.
}

// --- Utilidades de Direccionamiento IP ---

/**
 * Genera una dirección IPv4 aleatoria como string (ej. "192.168.1.10").
 * Intenta generar IPs que sean válidas para la mayoría de las preguntas,
 * evitando rangos especiales como Loopback, APIPA, Multicast, etc.
 * @returns {string} Una dirección IP aleatoria (generalmente Clase A, B o C, pública o privada).
 */
export function generateRandomIp() {
    let oct1;
    // Genera el primer octeto asegurándose de que no sea 0, 127 (Loopback),
    // 169 (inicio de APIPA) o mayor o igual a 224 (Multicast/Experimental).
    do {
        oct1 = getRandomInt(1, 223);
    } while (oct1 === 127 || oct1 === 169);

    let oct2 = getRandomInt(0, 255); // Segundo octeto puede ser cualquiera.
    // Caso especial: si el primero fue 169, el segundo no puede ser 254 (APIPA).
    if (oct1 === 169 && oct2 === 254) {
        oct2 = getRandomInt(0, 253); // Elige otro valor para el segundo octeto.
    }

    const oct3 = getRandomInt(0, 255); // Tercer octeto puede ser cualquiera.
    // Último octeto: evita .0 (dirección de red) y .255 (broadcast)
    // para obtener generalmente direcciones de host válidas.
    const oct4 = getRandomInt(1, 254);

    // Une los octetos con puntos para formar la IP string.
    return `${oct1}.${oct2}.${oct3}.${oct4}`;
}


/**
 * Genera una dirección IP privada aleatoria, seleccionando uno de los
 * tres rangos definidos en RFC 1918 (10.x.x.x, 172.16-31.x.x, 192.168.x.x).
 * @returns {string} Una dirección IP privada aleatoria.
 */
export function generateRandomPrivateIp() {
    // Elige aleatoriamente uno de los 3 tipos de rangos privados.
    const type = getRandomInt(1, 3);
    let ip = '';
    if (type === 1) { // Rango 10.0.0.0/8
        ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    } else if (type === 2) { // Rango 172.16.0.0/12
        // El segundo octeto debe estar entre 16 y 31.
        ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    } else { // Rango 192.168.0.0/16
        ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    }
    // Evita .0 y .255 en el último octeto como en generateRandomIp.
    return ip;
}

/**
 * Obtiene información clave sobre una dirección IP dada.
 * Determina su Clase (A, B, C, D, E), Tipo (Pública, Privada, Loopback, APIPA, etc.)
 * y su Máscara de Subred por Defecto (si aplica).
 * @param {string} ipString - La dirección IP en formato string "x.x.x.x".
 * @returns {object} Un objeto con las propiedades { class, type, defaultMask }.
 * Devuelve 'N/A' para propiedades si la IP es inválida o no aplica.
 */
export function getIpInfo(ipString) {
    try {
        // Validación robusta de la entrada
        if (!ipString || typeof ipString !== 'string') {
             // console.warn(`getIpInfo: IP string inválida o no proporcionada: ${ipString}`);
             return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' };
        }
        // Divide la IP en octetos y los convierte a números.
        const octets = ipString.split('.').map(Number);
        // Verifica si son 4 octetos numéricos válidos entre 0 y 255.
        if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) {
             // console.warn(`getIpInfo: Formato IP inválido detectado: ${ipString}`);
             return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' };
        }

        const firstOctet = octets[0];
        let ipClass = 'N/A';        // Valor por defecto si no coincide con ninguna clase.
        let ipType = 'Pública';     // Asume pública por defecto, se corregirá si es especial/privada.
        let defaultMask = 'N/A';    // Máscara por defecto N/A a menos que sea A, B o C.

        // --- Determinar Clase y Máscara Default basado en el primer octeto ---
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; } // Caso especial: Loopback
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'Multicast'; defaultMask = 'N/A'; } // Clase D (Multicast)
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'Experimental'; defaultMask = 'N/A'; } // Clase E (Experimental)
        // else if (firstOctet === 0) { // Podríamos añadir lógica para 0.x.x.x si fuera relevante }

        // --- Determinar Tipo (Privada, APIPA?) ---
        // Solo si no se clasificó previamente como Loopback, Multicast o Experimental.
        if (ipType === 'Pública') {
            // Comprueba si la IP cae dentro de alguno de los rangos privados RFC 1918.
            if (firstOctet === 10 ||
               (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
               (firstOctet === 192 && octets[1] === 168)) {
                ipType = 'Privada';
            // Comprueba si es una dirección APIPA (169.254.x.x).
            } else if (firstOctet === 169 && octets[1] === 254) {
                ipType = 'APIPA';
                // APIPA técnicamente cae en el rango de Clase B, pero su uso y máscara son específicos.
                // Asignamos Clase B pero mantenemos la máscara como N/A para evitar confusión.
                ipClass = 'B';
                defaultMask = 'N/A'; // Opcionalmente: '255.255.0.0'
            }
        }

        // Devuelve el objeto con la información determinada.
        return { class: ipClass, type: ipType, defaultMask: defaultMask };
    } catch (error) {
        // Captura cualquier error inesperado durante el proceso.
        console.error("Error en getIpInfo:", error, "IP:", ipString);
        // Devuelve N/A en todas las propiedades en caso de error.
        return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' };
    }
}

/**
 * Obtiene las porciones de red y host de una IP dada una máscara de subred.
 * Esta versión asume máscaras de clase estándar (solo octetos 255 o 0).
 * @param {string} ipString - La dirección IP en formato "x.x.x.x".
 * @param {string} maskString - La máscara de subred en formato "x.x.x.x".
 * @returns {object|null} Un objeto con { networkPortion: string, hostPortion: string }
 * o null si la IP/máscara es inválida o la máscara no es estándar (A, B, C).
 */
export function getIpPortions(ipString, maskString) {
    try {
        // Validaciones iniciales de las entradas.
        if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada");
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);

        // Verifica formato válido de IP y máscara, y que la máscara sea estándar (solo 0s y 255s).
        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) ||
            maskOctets.some(o => o !== 0 && o !== 255)) { // Clave: solo permite 0 o 255 en la máscara
            // console.warn(`getIpPortions: Formato IP o Máscara inválido/no estándar: IP=${ipString}, Mask=${maskString}`);
            return null; // Retorna null si no cumple las condiciones.
        }

        let networkParts = []; // Array para guardar los octetos de la porción de red.
        let hostParts = [];    // Array para guardar los octetos de la porción de host.
        let isHostPart = false; // Indicador para saber si ya hemos pasado a la porción de host.

        // Recorre los 4 octetos.
        for (let i = 0; i < 4; i++) {
            // Si el octeto de la máscara es 255 Y aún no hemos entrado en la parte de host...
            if (maskOctets[i] === 255 && !isHostPart) {
                // ...este octeto de la IP pertenece a la red.
                networkParts.push(ipOctets[i].toString());
            } else {
                // Si el octeto de la máscara es 0, o si ya habíamos encontrado un 0 antes...
                isHostPart = true; // Marca que ya estamos (o seguimos) en la porción de host.
                // ...este octeto de la IP pertenece al host.
                hostParts.push(ipOctets[i].toString());
            }
        }

        // Une los octetos de cada parte con puntos.
        const networkPortion = networkParts.join('.');
        const hostPortion = hostParts.join('.');

        // Devuelve el objeto con ambas porciones.
        return { networkPortion, hostPortion };

    } catch (error) {
        console.error("Error en getIpPortions:", error);
        return null; // Devuelve null si ocurre algún error.
    }
}


// --- Generadores de Tablas HTML para Explicaciones ---
// Estas funciones crean el código HTML para las tablas que se muestran
// en el área de feedback cuando el usuario responde incorrectamente.

/**
 * Genera el código HTML para una tabla que muestra los rangos de las clases IP.
 * Puede resaltar una fila específica.
 * @param {string | null} highlightClass - La clase a resaltar (ej. 'A', 'B') o null para no resaltar ninguna.
 * @returns {string} El string HTML completo de la tabla.
 */
export function generateClassRangeTableHTML(highlightClass = null) {
    const ranges = [
        { class: 'A', range: '1 - 126' },
        { class: 'B', range: '128 - 191' },
        { class: 'C', range: '192 - 223' },
        { class: 'D', range: '224 - 239', note: '(Multicast)' },
        { class: 'E', range: '240 - 255', note: '(Experimental)' }
    ];
    let tableHTML = '<p>La clase se determina por el <strong>primer octeto</strong>:</p>';
    tableHTML += '<table class="explanation-table">'; // Usa clase CSS para estilo
    tableHTML += '<thead><tr><th>Clase</th><th>Rango</th><th>Nota</th></tr></thead>';
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        // Añade la clase 'highlight-row' a la fila <tr> si coincide con highlightClass
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    // Añade nota especial para Loopback si se resaltó la Clase A
    if (highlightClass === 'A') {
         tableHTML += '<p style="font-size:0.8em; text-align:center; margin-top:5px;">(Nota: El rango 127.x.x.x es para Loopback)</p>';
    }
    return tableHTML;
}

/**
 * Genera el código HTML para una tabla que muestra la relación Clase-Máscara por Defecto.
 * Puede resaltar una fila específica.
 * @param {string | null} highlightClass - La clase a resaltar (A, B, C) o null.
 * @returns {string} El string HTML completo de la tabla.
 */
export function generateClassMaskTableHTML(highlightClass = null) {
    const data = [
        { class: 'A', range: '1 - 126', mask: '255.0.0.0' },
        { class: 'B', range: '128 - 191', mask: '255.255.0.0' },
        { class: 'C', range: '192 - 223', mask: '255.255.255.0' }
    ];
    let tableHTML = '<p>La máscara por defecto está determinada por la clase (basada en el 1er octeto):</p>';
    tableHTML += '<table class="explanation-table">';
    tableHTML += '<thead><tr><th>Clase</th><th>Rango 1er Octeto</th><th>Máscara por Defecto</th></tr></thead>';
    tableHTML += '<tbody>';
    data.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    return tableHTML;
}

/**
 * Genera el código HTML para una tabla que muestra los rangos privados RFC 1918.
 * Puede resaltar la fila correspondiente a una IP dada si esta es privada.
 * También indica si la IP dada es Pública o de otro tipo especial.
 * @param {string | null} highlightIp - La IP a comprobar para resaltar su rango, o null.
 * @returns {string} El string HTML completo de la tabla y la nota adicional.
 */
export function generatePrivateRangeTableHTML(highlightIp = null) {
    const ranges = [
        { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' },
        { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' },
        { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' }
    ];
    let highlightCIDR = null; // CIDR del rango a resaltar
    let ipType = 'N/A';       // Tipo de la IP para la nota final

    if (highlightIp) {
        const info = getIpInfo(highlightIp); // Obtiene información de la IP
        ipType = info.type; // Guarda el tipo determinado
        // Si es privada, determina a qué bloque CIDR pertenece para resaltarlo
        if (info.type === 'Privada') {
            const octets = highlightIp.split('.').map(Number);
            if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; }
            else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; }
            else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; }
        }
    }

    // Construye el HTML de la tabla
    let tableHTML = '<p>Los rangos de IP privadas (RFC 1918) son:</p>';
    tableHTML += '<table class="explanation-table">';
    tableHTML += '<thead><tr><th>Bloque (CIDR)</th><th>Rango de Direcciones</th></tr></thead>';
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`;
    });
    tableHTML += '</tbody></table>';

    // Añade una nota final indicando el tipo de la IP que se pasó como argumento
    if (highlightIp) {
        if (ipType === 'Privada' && highlightCIDR) {
            tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Privada</strong> y pertenece al rango resaltado).</p>`;
        } else if (ipType === 'Pública') {
             tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Pública</strong>).</p>`;
        } else if (ipType !== 'N/A'){ // Muestra otros tipos (Loopback, APIPA, Multicast, Experimental)
             tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es de tipo <strong>${ipType}</strong>).</p>`;
        }
        // Si ipType es 'N/A' (porque la IP era inválida), no se añade nota adicional.
    }
    return tableHTML;
}

/**
 * Genera el código HTML para la explicación visual de porciones de Red/Host.
 * Muestra la IP con 'X' reemplazando la porción de host para la red, y viceversa.
 * @param {string} ipString - La IP original.
 * @param {string} maskString - La máscara de subred default usada.
 * @param {string} ipClass - La clase determinada de la IP.
 * @param {string} networkPortion - La porción de red calculada (ej. "192.168.1").
 * @param {string} hostPortion - La porción de host calculada (ej. "100").
 * @returns {string} El string HTML de la explicación con la tabla.
 */
export function generatePortionExplanationHTML(ipString, maskString, ipClass, networkPortion, hostPortion) {
    try {
        // Validar entradas mínimas
        if (!ipString || !maskString || !ipClass) {
            throw new Error("Faltan datos para generar explicación de porciones.");
        }

        const ipOctets = ipString.split('.');
        const maskOctets = maskString.split('.');
        // Validar formato básico
        if (ipOctets.length !== 4 || maskOctets.length !== 4) {
             throw new Error("Formato IP o Máscara inválido en explicación.");
        }

        let networkRepresentation = []; // Array para la representación Red.X.X.X
        let hostRepresentation = [];    // Array para la representación X.X.X.Host

        // Construir las representaciones con 'X'
        for (let i = 0; i < 4; i++) {
            if (maskOctets[i] === '255') { // Si la máscara indica que es parte de la red
                networkRepresentation.push(ipOctets[i]); // Mantiene el octeto de la IP
                hostRepresentation.push('X');          // Pone 'X' en la representación de host
            } else { // Si la máscara indica que es parte del host (octeto 0)
                networkRepresentation.push('X');          // Pone 'X' en la representación de red
                hostRepresentation.push(ipOctets[i]); // Mantiene el octeto de la IP
            }
        }

        // Unir los arrays para formar los strings
        const networkRepString = networkRepresentation.join('.');
        const hostRepString = hostRepresentation.join('.');

        // Construir el HTML final de la explicación
        let html = `<p>La IP <strong>${ipString}</strong> es de <strong>Clase ${ipClass}</strong> (primer octeto ${ipOctets[0]} cae en el rango ${getClassRange(ipClass)}).`;
        html += ` Usando su máscara por defecto (<strong>${maskString}</strong>), las porciones son:</p>`;
        // Añadir la tabla visual
        html += '<table class="explanation-table">';
        html += '<thead><tr><th>Porción</th><th>Representación Visual</th></tr></thead>';
        html += '<tbody>';
        // Fila para la Porción de Red
        html += `<tr><td>Red</td><td><code>${networkRepString}</code></td></tr>`;
        // Fila para la Porción de Host
        html += `<tr><td>Host</td><td><code>${hostRepString}</code></td></tr>`;
        html += '</tbody></table>';
        // Añadir las porciones extraídas como texto (opcional pero útil para confirmar)
        html += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(Porción de Red: <strong>${networkPortion || 'Ninguna'}</strong> / Porción de Host: <strong>${hostPortion || 'Ninguna'}</strong>)</p>`;

        return html; // Devuelve el HTML generado

    } catch (error) {
        console.error("Error generando explicación de porciones:", error);
        // Devuelve una explicación básica en caso de error para no romper el feedback
        return `<p>La IP ${ipString} es Clase ${ipClass}. Su máscara por defecto es ${maskString}. No se pudo generar la tabla de porciones.</p>`;
    }
}

/**
 * Función auxiliar interna para obtener el rango del primer octeto de una clase.
 * Usada por generatePortionExplanationHTML.
 * @param {string} ipClass - La clase ('A', 'B', 'C').
 * @returns {string} El rango como string (ej. "1-126") o "N/A".
 */
function getClassRange(ipClass) {
    switch (ipClass) {
        case 'A': return '1-126';
        case 'B': return '128-191';
        case 'C': return '192-223';
        default: return 'N/A'; // Para clases D, E o inválidas
    }
}
