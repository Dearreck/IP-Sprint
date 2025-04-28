// js/utils.js

/** Funciones de utilidad generales y específicas de IP, y generadores de tablas HTML */

// --- Utilidades Generales ---

/**
 * Genera un entero aleatorio entre min (incluido) y max (incluido).
 * @param {number} min - Límite inferior.
 * @param {number} max - Límite superior.
 * @returns {number} Un entero aleatorio.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Baraja los elementos de un array en su lugar (Algoritmo Fisher-Yates).
 * @param {Array<any>} array - El array a barajar.
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Intercambio de elementos
    }
}

// --- Utilidades de Direccionamiento IP ---

/**
 * Genera una dirección IPv4 aleatoria como string (puede ser pública o privada).
 * @returns {string} Una IP aleatoria.
 */
export function generateRandomIp() {
    const oct1 = getRandomInt(1, 254);
    const oct2 = getRandomInt(0, 255);
    const oct3 = getRandomInt(0, 255);
    const oct4 = getRandomInt(1, 254);
    return `${oct1}.${oct2}.${oct3}.${oct4}`;
}

/**
 * Genera una IP privada aleatoria de cualquiera de los 3 rangos RFC 1918.
 * @returns {string} Una IP privada aleatoria.
 */
export function generateRandomPrivateIp() {
    const type = getRandomInt(1, 3); // Elegir rango 1, 2 o 3
    let ip = '';
    if (type === 1) { // 10.0.0.0/8
        ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    } else if (type === 2) { // 172.16.0.0/12
        ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    } else { // 192.168.0.0/16
        ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    }
    return ip;
}

/**
 * Obtiene información clave (Clase, Tipo, Máscara Default) sobre una IP.
 * @param {string} ipString - La IP en formato string "x.x.x.x".
 * @returns {object} Objeto con { class, type, defaultMask } o valores 'N/A' en error.
 */
export function getIpInfo(ipString) {
    try {
        if (!ipString) throw new Error("IP string vacía");
        const octets = ipString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(isNaN)) throw new Error("Formato IP inválido");

        const firstOctet = octets[0];
        let ipClass = '';
        let ipType = 'Pública';
        let defaultMask = 'N/A';

        // Determinar Clase y Máscara Default
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'N/A'; } // Multicast
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'N/A'; } // Experimental
        else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; } // Loopback

        // Determinar Tipo (Privada?)
        if (firstOctet === 10 ||
           (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
           (firstOctet === 192 && octets[1] === 168)) {
            if (ipType !== 'Loopback') ipType = 'Privada';
        }

        return { class: ipClass, type: ipType, defaultMask: defaultMask };
    } catch (error) {
        // console.error("Error en getIpInfo:", error); // Podrías quitar este log en producción
        return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' };
    }
}

// --- Generadores de Tablas HTML para Explicaciones ---

/**
 * Genera HTML para la tabla de rangos de clases IP.
 * @param {string | null} highlightClass - La clase a resaltar (ej. 'A', 'B') o null.
 * @returns {string} El string HTML de la tabla.
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
    tableHTML += '<table class="explanation-table">';
    tableHTML += '<thead><tr><th>Clase</th><th>Rango</th><th>Nota</th></tr></thead>';
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    // Añadir nota específica para Loopback si se resalta Clase A
    if (highlightClass === 'A') {
         tableHTML += '<p style="font-size:0.8em; text-align:center; margin-top:5px;">(Nota: El rango 127.x.x.x es para Loopback)</p>';
    }
    return tableHTML;
}

/**
 * Genera HTML para tabla Clase / Rango / Máscara Default.
 * @param {string | null} highlightClass - La clase a resaltar o null.
 * @returns {string} El string HTML de la tabla.
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
 * Genera HTML para tabla de Rangos Privados RFC 1918.
 * @param {string | null} highlightIp - La IP a comprobar para resaltar su rango, o null.
 * @returns {string} El string HTML de la tabla.
 */
export function generatePrivateRangeTableHTML(highlightIp = null) {
    const ranges = [
        { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' },
        { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' },
        { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' }
    ];
    let highlightCIDR = null;
    if (highlightIp) {
        const info = getIpInfo(highlightIp);
        if (info.type === 'Privada') {
            const octets = highlightIp.split('.').map(Number);
            if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; }
            else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; }
            else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; }
        }
    }
    let tableHTML = '<p>Los rangos de IP privadas (RFC 1918) son:</p>';
    tableHTML += '<table class="explanation-table">';
    tableHTML += '<thead><tr><th>Bloque (CIDR)</th><th>Rango de Direcciones</th></tr></thead>';
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    if (highlightCIDR) {
        tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} pertenece al rango resaltado).</p>`;
    } else if (highlightIp) {
        tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es pública).</p>`;
    }
    return tableHTML;
}
