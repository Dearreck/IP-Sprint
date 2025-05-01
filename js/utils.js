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
    } while (oct1 === 127 || oct1 === 169); // Evitar Loopback y comienzo de APIPA
    let oct2 = getRandomInt(0, 255);
    // Si es 169.x, asegurar que x no sea 254 (APIPA)
    if (oct1 === 169 && oct2 === 254) {
        oct2 = getRandomInt(0, 253);
    }
    const oct3 = getRandomInt(0, 255);
    const oct4 = getRandomInt(1, 254); // Evitar .0 y .255 para simplificar
    return `${oct1}.${oct2}.${oct3}.${oct4}`;
}

/**
 * Genera una IP privada aleatoria de los rangos RFC 1918.
 * @returns {string} Una IP privada aleatoria.
 */
export function generateRandomPrivateIp() {
    const type = getRandomInt(1, 3); // Elegir uno de los 3 bloques privados
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
 * MODIFICADO: Devuelve también typeKey ('public', 'private', 'loopback', etc.)
 * @param {string} ipString - La IP en formato string "x.x.x.x".
 * @returns {object} Objeto con { class, type (traducido), typeKey (no traducido), defaultMask }.
 */
export function getIpInfo(ipString) {
    const defaultResult = { class: 'N/A', type: 'N/A', typeKey: 'unknown', defaultMask: 'N/A' };
    try {
        if (!ipString || typeof ipString !== 'string') { return defaultResult; }
        const octets = ipString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) {
            return defaultResult;
        }

        const firstOctet = octets[0];
        let ipClass = 'N/A';
        let ipTypeKey = 'unknown'; // Clave no traducida
        let defaultMask = 'N/A';

        // Determinar Clase y Máscara Default
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet === 127) { ipClass = 'A'; defaultMask = '255.0.0.0'; ipTypeKey = 'loopback'; } // Loopback
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; defaultMask = 'N/A'; ipTypeKey = 'multicast'; } // Multicast
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; defaultMask = 'N/A'; ipTypeKey = 'experimental'; } // Experimental

        // Determinar Tipo (si no se determinó ya)
        if (ipTypeKey === 'unknown') {
            if (firstOctet === 10 ||
               (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
               (firstOctet === 192 && octets[1] === 168)) {
                ipTypeKey = 'private'; // Privada RFC 1918
            } else if (firstOctet === 169 && octets[1] === 254) {
                ipTypeKey = 'apipa'; // APIPA
                // APIPA es técnicamente Clase B pero no tiene máscara default estándar en este contexto
                ipClass = 'B';
                defaultMask = 'N/A'; // O podríamos poner 255.255.0.0 si se prefiere
            } else {
                ipTypeKey = 'public'; // Pública (si no es ninguna de las anteriores)
            }
        }

        // Caso especial: Broadcast Limitado
        if (ipString === '255.255.255.255') {
            ipTypeKey = 'limited_broadcast';
            ipClass = 'N/A';
            defaultMask = 'N/A';
        }

        // Obtener el tipo traducido usando la typeKey
        const ipTypeTranslated = getTranslation(`option_${ipTypeKey}`) || ipTypeKey; // Fallback a la clave si no hay traducción

        return {
            class: ipClass,
            type: ipTypeTranslated, // Valor traducido para mostrar
            typeKey: ipTypeKey,     // Clave no traducida para lógica interna
            defaultMask: defaultMask
        };

    } catch (error) {
        console.error("Error en getIpInfo:", error, "IP:", ipString);
        return defaultResult;
    }
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
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);
        // Validar formato y que la máscara sea de clase (solo 0 o 255)
        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) ||
            maskOctets.some(o => o !== 0 && o !== 255)) { // Asegurar máscara de clase
            console.warn("getIpPortions llamada con IP/Máscara inválida o no de clase:", ipString, maskString);
            return null;
        }

        let networkParts = [];
        let hostParts = [];
        let isHostPart = false; // Flag para saber si ya entramos en la parte de host

        for (let i = 0; i < 4; i++) {
            if (maskOctets[i] === 255 && !isHostPart) {
                // Si el octeto de máscara es 255 y aún no hemos encontrado un 0, es parte de la red
                networkParts.push(ipOctets[i].toString());
            } else {
                // Si el octeto de máscara es 0, o si ya encontramos un 0 antes, es parte del host
                isHostPart = true;
                hostParts.push(ipOctets[i].toString());
            }
        }
        const networkPortion = networkParts.join('.');
        const hostPortion = hostParts.join('.');
        return { networkPortion, hostPortion };
    } catch (error) {
        console.error("Error en getIpPortions:", error);
        return null;
    }
}

/**
 * Calcula la dirección de red para una IP y máscara dadas (IP AND Mask).
 * Funciona con cualquier máscara válida.
 * @param {string} ipString - La dirección IP.
 * @param {string} maskString - La máscara de subred.
 * @returns {string|null} La dirección de red o null si hay error.
 */
export function calculateNetworkAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);
        // Validar formato básico
        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) ||
            maskOctets.some(o => o < 0 || o > 255) ) { // No valida la máscara en sí, solo formato
            throw new Error("Formato IP o máscara inválido");
        }
        // Operación AND bit a bit
        const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]);
        return networkOctets.join('.');
    } catch (error) {
        console.error("Error calculando dirección de red:", error);
        return null;
    }
}

/**
 * Calcula la máscara wildcard a partir de una máscara de subred (255 - octeto).
 * @param {string} maskString - La máscara de subred.
 * @returns {string|null} La máscara wildcard o null si hay error.
 */
export function calculateWildcardMask(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) {
            throw new Error("Formato de máscara inválido");
        }
        // Restar cada octeto de 255
        const wildcardOctets = maskOctets.map(octet => 255 - octet);
        return wildcardOctets.join('.');
    } catch (error) {
        console.error("Error calculando wildcard mask:", error);
        return null;
    }
}


/**
 * Calcula la dirección de broadcast (NetworkAddr OR Wildcard).
 * @param {string} networkAddrString - La dirección de RED.
 * @param {string} wildcardString - La máscara wildcard.
 * @returns {string|null} La dirección de broadcast o null si hay error.
 */
export function calculateBroadcastAddress(networkAddrString, wildcardString) {
    try {
        const networkOctets = networkAddrString.split('.').map(Number);
        const wildcardOctets = wildcardString.split('.').map(Number);
        // Validar formato básico
        if (networkOctets.length !== 4 || wildcardOctets.length !== 4 ||
            networkOctets.some(isNaN) || wildcardOctets.some(isNaN) ||
            networkOctets.some(o => o < 0 || o > 255) ||
            wildcardOctets.some(o => o < 0 || o > 255) ) {
            throw new Error("Formato Dir. Red o Wildcard inválido");
        }
        // Operación OR bit a bit
        const broadcastOctets = networkOctets.map((octet, i) => octet | wildcardOctets[i]);
        return broadcastOctets.join('.');
    } catch (error) {
        console.error("Error calculando dirección de broadcast:", error);
        return null;
    }
}


// --- Generadores de Tablas HTML para Explicaciones (Usan i18n) ---

/** Genera tabla HTML de rangos de clases IP. */
export function generateClassRangeTableHTML(highlightClass = null) {
    const ranges = [
        { class: 'A', range: '1 - 126' },
        { class: 'B', range: '128 - 191' },
        { class: 'C', range: '192 - 223' },
        { class: 'D', range: '224 - 239', note: getTranslation('class_note_multicast') || '(Multicast)' },
        { class: 'E', range: '240 - 255', note: getTranslation('class_note_experimental') || '(Experimental)' }
    ];
    let tableHTML = `<p>${getTranslation('explanation_class_range_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_range')}</th><th>${getTranslation('table_header_note')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    if (highlightClass === 'A') { // Añadir nota específica para Clase A sobre Loopback
        tableHTML += `<p style="font-size:0.8em; text-align:center; margin-top:5px;">${getTranslation('explanation_class_range_note_a')}</p>`;
    }
    return tableHTML;
}

/** Genera tabla HTML Clase/Máscara Default. */
export function generateClassMaskTableHTML(highlightClass = null) {
    const data = [
        { class: 'A', range: '1 - 126', mask: '255.0.0.0' },
        { class: 'B', range: '128 - 191', mask: '255.255.0.0' },
        { class: 'C', range: '192 - 223', mask: '255.255.255.0' }
    ];
    let tableHTML = `<p>${getTranslation('explanation_class_mask_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_first_octet_range')}</th><th>${getTranslation('table_header_default_mask')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    data.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    return tableHTML;
}

/** Genera tabla HTML de Rangos Privados RFC 1918. */
export function generatePrivateRangeTableHTML(highlightIp = null) {
    const ranges = [
        { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' },
        { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' },
        { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' }
    ];
    const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
    let highlightCIDR = null;
    let ipTypeKey = 'unknown'; // Usar typeKey para la lógica
    let ipTypeTranslated = ''; // Usar tipo traducido para el mensaje

    // Determinar qué rango resaltar y el tipo de la IP proporcionada
    if (highlightIp) {
        const info = getIpInfo(highlightIp);
        ipTypeKey = info.typeKey;
        ipTypeTranslated = info.type; // Usar el tipo ya traducido por getIpInfo
        if (ipTypeKey === 'private') {
            const octets = highlightIp.split('.').map(Number);
            if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; }
            else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; }
            else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; }
        }
    }

    // Construir tabla
    let tableHTML = `<p>${getTranslation('explanation_private_range_intro', { rfcLink: rfcLink })}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_block_cidr')}</th><th>${getTranslation('table_header_address_range')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`;
    });
    tableHTML += '</tbody></table>';

    // Añadir nota contextual sobre la IP proporcionada
    if (highlightIp) {
        let noteKey = '';
        if (ipTypeKey === 'private' && highlightCIDR) {
            noteKey = 'explanation_private_range_note_private';
        } else if (ipTypeKey === 'public') {
            noteKey = 'explanation_private_range_note_public';
        } else if (ipTypeKey !== 'unknown') { // Otros tipos (Loopback, APIPA, etc.)
            noteKey = 'explanation_private_range_note_other';
        }
        if (noteKey) {
            tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation(noteKey, { ip: highlightIp, ipType: ipTypeTranslated })}</p>`;
        }
    }
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
        if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) {
            throw new Error("Faltan datos para generar explicación de cálculo.");
        }
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
    } catch (error) {
        console.error("Error generando explicación de cálculo:", error);
        return `<p>${getTranslation('explanation_portion_calc_error', { ip: ipString, mask: maskString })}</p>`;
    }
}

/**
 * Genera explicación HTML para direcciones especiales.
 * @param {string} addressTypeKey - La clave del tipo ('loopback', 'apipa', 'limited_broadcast').
 * @returns {string} El string HTML de la explicación.
 */
export function generateSpecialAddressExplanationHTML(addressTypeKey) {
    let explanationKey = '';
    let rfcLink = '';
    let rfcText = '';

    switch (addressTypeKey) {
        case 'loopback':
            explanationKey = 'explanation_special_loopback';
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3';
            rfcText = 'RFC 1122 (Sec 3.2.1.3)';
            break;
        case 'apipa':
            explanationKey = 'explanation_special_apipa';
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1';
            rfcText = 'RFC 3927 (Sec 2.1)';
            break;
        case 'limited_broadcast':
            explanationKey = 'explanation_special_limited_broadcast';
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7';
            rfcText = 'RFC 919 (Sec 7)';
            break;
        default:
            // Si se pasa un tipo no especial (public, private), no debería generar esta tabla.
            // Podríamos devolver un string vacío o un mensaje genérico.
            console.warn("generateSpecialAddressExplanationHTML llamada con tipo no especial:", addressTypeKey);
            explanationKey = 'explanation_special_default'; // Usar un texto genérico si existe
            break;
    }

    let explanation = getTranslation(explanationKey); // Obtener texto base
    // Añadir enlace a RFC si aplica
    if (rfcLink && rfcText) {
        explanation += ` ${getTranslation('explanation_special_defined_in', { rfcLink: rfcLink, rfcText: rfcText })}`;
    }
    return `<p>${explanation}</p>`;
}
