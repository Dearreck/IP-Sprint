// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// ==================================================

import { getTranslation } from './i18n.js'; // Necesario para las explicaciones

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
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Utilidades de Direccionamiento IP ---

/**
 * Genera una dirección IPv4 aleatoria como string.
 * Evita rangos especiales para simplificar generación de preguntas.
 * @returns {string} Una IP aleatoria (generalmente Clase A, B o C).
 */
export function generateRandomIp() {
    let oct1;
    do {
        oct1 = getRandomInt(1, 223);
    } while (oct1 === 127 || oct1 === 169);
    let oct2 = getRandomInt(0, 255);
    if (oct1 === 169 && oct2 === 254) {
        oct2 = getRandomInt(0, 253);
    }
    const oct3 = getRandomInt(0, 255);
    const oct4 = getRandomInt(1, 254);
    return `${oct1}.${oct2}.${oct3}.${oct4}`;
}

/**
 * Genera una IP privada aleatoria de los rangos RFC 1918.
 * @returns {string} Una IP privada aleatoria.
 */
export function generateRandomPrivateIp() {
    const type = getRandomInt(1, 3);
    let ip = '';
    if (type === 1) { ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; }
    else if (type === 2) { ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; }
    else { ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; }
    return ip;
}

/**
 * Obtiene información clave (Clase, Tipo, Máscara Default) sobre una IP.
 * @param {string} ipString - La IP en formato string "x.x.x.x".
 * @returns {object} Objeto con { class, type, defaultMask }.
 */
export function getIpInfo(ipString) {
    try {
        if (!ipString || typeof ipString !== 'string') { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; }
        const octets = ipString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; }
        const firstOctet = octets[0];
        let ipClass = 'N/A'; let ipType = 'Pública'; let defaultMask = 'N/A';
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; }
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'Multicast'; defaultMask = 'N/A'; }
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'Experimental'; defaultMask = 'N/A'; }
        if (ipType === 'Pública') { if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { ipType = 'Privada'; } else if (firstOctet === 169 && octets[1] === 254) { ipType = 'APIPA'; ipClass = 'B'; defaultMask = 'N/A'; } }
        if (ipString === '255.255.255.255') { ipType = 'Broadcast Limitado'; ipClass = 'N/A'; defaultMask = 'N/A'; }
        return { class: ipClass, type: ipType, defaultMask: defaultMask };
    } catch (error) { console.error("Error en getIpInfo:", error, "IP:", ipString); return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; }
}

/**
 * Obtiene las porciones de red y host de una IP dada una máscara de clase estándar.
 * @param {string} ipString - La IP en formato "x.x.x.x".
 * @param {string} maskString - La máscara de subred (solo 0s y 255s).
 * @returns {object|null} Objeto con { networkPortion, hostPortion } o null.
 */
export function getIpPortions(ipString, maskString) {
    try {
        if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada");
        const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number);
        if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o !== 0 && o !== 255)) { return null; }
        let networkParts = []; let hostParts = []; let isHostPart = false;
        for (let i = 0; i < 4; i++) { if (maskOctets[i] === 255 && !isHostPart) { networkParts.push(ipOctets[i].toString()); } else { isHostPart = true; hostParts.push(ipOctets[i].toString()); } }
        const networkPortion = networkParts.join('.'); const hostPortion = hostParts.join('.');
        return { networkPortion, hostPortion };
    } catch (error) { console.error("Error en getIpPortions:", error); return null; }
}

/**
 * Calcula la dirección de red para una IP y máscara dadas (IP AND Mask).
 * @param {string} ipString - La dirección IP.
 * @param {string} maskString - La máscara de subred.
 * @returns {string|null} La dirección de red o null si hay error.
 */
export function calculateNetworkAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number);
        if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato IP o máscara inválido"); }
        const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]);
        return networkOctets.join('.');
    } catch (error) { console.error("Error calculando dirección de red:", error); return null; }
}

/**
 * Calcula la máscara wildcard a partir de una máscara de subred (255 - octeto).
 * @param {string} maskString - La máscara de subred.
 * @returns {string|null} La máscara wildcard o null si hay error.
 */
export function calculateWildcardMask(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) { throw new Error("Formato de máscara inválido"); }
        const wildcardOctets = maskOctets.map(octet => 255 - octet);
        return wildcardOctets.join('.');
    } catch (error) { console.error("Error calculando wildcard mask:", error); return null; }
}


/**
 * Calcula la dirección de broadcast (NetworkAddr OR Wildcard).
 * @param {string} networkAddrString - La dirección de RED.
 * @param {string} wildcardString - La máscara wildcard.
 * @returns {string|null} La dirección de broadcast o null si hay error.
 */
export function calculateBroadcastAddress(networkAddrString, wildcardString) {
    try {
        const networkOctets = networkAddrString.split('.').map(Number); const wildcardOctets = wildcardString.split('.').map(Number);
        if (networkOctets.length !== 4 || wildcardOctets.length !== 4 || networkOctets.some(isNaN) || wildcardOctets.some(isNaN) || networkOctets.some(o => o < 0 || o > 255) || wildcardOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato Dir. Red o Wildcard inválido"); }
        const broadcastOctets = networkOctets.map((octet, i) => octet | wildcardOctets[i]);
        return broadcastOctets.join('.');
    } catch (error) { console.error("Error calculando dirección de broadcast:", error); return null; }
}


// --- Generadores de Tablas HTML para Explicaciones (Usan i18n) ---

/** Genera tabla HTML de rangos de clases IP. */
export function generateClassRangeTableHTML(highlightClass = null) {
    const ranges = [ { class: 'A', range: '1 - 126' }, { class: 'B', range: '128 - 191' }, { class: 'C', range: '192 - 223' }, { class: 'D', range: '224 - 239', note: '(Multicast)' }, { class: 'E', range: '240 - 255', note: '(Experimental)' } ];
    let tableHTML = `<p>${getTranslation('explanation_class_range_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_range')}</th><th>${getTranslation('table_header_note')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    ranges.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`; });
    tableHTML += '</tbody></table>'; if (highlightClass === 'A') { tableHTML += `<p style="font-size:0.8em; text-align:center; margin-top:5px;">${getTranslation('explanation_class_range_note_a')}</p>`; }
    return tableHTML;
}

/** Genera tabla HTML Clase/Máscara Default. */
export function generateClassMaskTableHTML(highlightClass = null) {
    const data = [ { class: 'A', range: '1 - 126', mask: '255.0.0.0' }, { class: 'B', range: '128 - 191', mask: '255.255.0.0' }, { class: 'C', range: '192 - 223', mask: '255.255.255.0' } ];
    let tableHTML = `<p>${getTranslation('explanation_class_mask_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_first_octet_range')}</th><th>${getTranslation('table_header_default_mask')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    data.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`; });
    tableHTML += '</tbody></table>';
    return tableHTML;
}

/** Genera tabla HTML de Rangos Privados RFC 1918. */
export function generatePrivateRangeTableHTML(highlightIp = null) {
    const ranges = [ { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' }, { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' }, { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' } ];
    const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
    let highlightCIDR = null; let ipType = 'N/A';
    if (highlightIp) { const info = getIpInfo(highlightIp); ipType = info.type; if (info.type === 'Privada') { const octets = highlightIp.split('.').map(Number); if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; } else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; } else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; } } }
    let tableHTML = `<p>${getTranslation('explanation_private_range_intro', { rfcLink: rfcLink })}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_block_cidr')}</th><th>${getTranslation('table_header_address_range')}</th></tr></thead>`;
    tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; }); tableHTML += '</tbody></table>';
    if (highlightIp) { if (ipType === 'Privada' && highlightCIDR) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_private_range_note_private', { ip: highlightIp })}</p>`; } else if (ipType === 'Pública') { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_private_range_note_public', { ip: highlightIp })}</p>`; } else if (ipType !== 'N/A'){ tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_private_range_note_other', { ip: highlightIp, ipType: ipType })}</p>`; } }
    return tableHTML;
}

/**
 * Genera tabla HTML de cálculo Red/Broadcast/Wildcard.
 * @param {string} ipString - La IP original.
 * @param {string} maskString - La máscara de subred usada.
 * @param {string} wildcardString - La máscara wildcard calculada.
 * @param {string} networkAddr - La dirección de red calculada.
 * @param {string} broadcastAddr - La dirección de broadcast calculada.
 * @returns {string} El string HTML de la explicación.
 */
export function generatePortionExplanationHTML(ipString, maskString, wildcardString, networkAddr, broadcastAddr) {
    try {
        if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) { throw new Error("Faltan datos para generar explicación de cálculo."); }
        let html = `<p>${getTranslation('explanation_portion_intro', { ip: `<strong>${ipString}</strong>`, mask: `<strong>${maskString}</strong>` })}</p>`;
        html += '<table class="explanation-table">';
        html += `<thead><tr><th>${getTranslation('table_header_concept')}</th><th>${getTranslation('table_header_value')}</th><th>${getTranslation('table_header_calculation_note')}</th></tr></thead>`;
        html += '<tbody>';
        html += `<tr><td>${getTranslation('explanation_portion_table_ip')}</td><td><code>${ipString}</code></td><td>-</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_mask')}</td><td><code>${maskString}</code></td><td>${getTranslation('explanation_portion_table_calc_mask')}</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_wildcard')}</td><td><code>${wildcardString}</code></td><td>${getTranslation('explanation_portion_table_calc_wildcard')}</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_netaddr')}</td><td><code>${networkAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_netaddr')}</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_broadaddr')}</td><td><code>${broadcastAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_broadaddr')}</td></tr>`;
        html += '</tbody></table>';
        return html;
    } catch (error) { console.error("Error generando explicación de cálculo:", error); return `<p>${getTranslation('explanation_portion_calc_error', { ip: ipString, mask: maskString })}</p>`; }
}

/**
 * Genera explicación HTML para direcciones especiales.
 * @param {string} addressType - El tipo ('Loopback', 'APIPA', 'Broadcast Limitado').
 * @returns {string} El string HTML de la explicación.
 */
export function generateSpecialAddressExplanationHTML(addressType) {
    let explanationKey = ''; let rfcLink = ''; let rfcText = '';
    switch (addressType) {
        case 'Loopback': explanationKey = 'explanation_special_loopback'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3'; rfcText = 'RFC 1122 (Sec 3.2.1.3)'; break;
        case 'APIPA': explanationKey = 'explanation_special_apipa'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1'; rfcText = 'RFC 3927 (Sec 2.1)'; break;
        case 'Broadcast Limitado': explanationKey = 'explanation_special_limited_broadcast'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7'; rfcText = 'RFC 919 (Sec 7)'; break;
        default: explanationKey = 'explanation_special_default'; break;
    }
    let explanation = getTranslation(explanationKey);
    if (rfcLink && rfcText) { explanation += ` ${getTranslation('explanation_special_defined_in', { rfcLink: rfcLink, rfcText: rfcText })}`; }
    return `<p>${explanation}</p>`;
}

// --- Función Auxiliar Interna (No exportada) ---
/**
 * Obtiene el rango del primer octeto de una clase.
 * @param {string} ipClass - La clase ('A', 'B', 'C').
 * @returns {string} El rango como string (ej. "1-126") o "N/A".
 */
function getClassRange(ipClass) {
    switch (ipClass) {
        case 'A': return '1-126';
        case 'B': return '128-191';
        case 'C': return '192-223';
        default: return 'N/A';
    }
}
