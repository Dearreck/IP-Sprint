// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// ==================================================

// --- Importaciones ---
import { getTranslation } from './i18n.js'; // Importar función de traducción

// --- Utilidades Generales ---
export function getRandomInt(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }
export function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

// --- Utilidades de Direccionamiento IP ---
export function generateRandomIp() { let oct1; do { oct1 = getRandomInt(1, 223); } while (oct1 === 127 || oct1 === 169); let oct2 = getRandomInt(0, 255); if (oct1 === 169 && oct2 === 254) { oct2 = getRandomInt(0, 253); } const oct3 = getRandomInt(0, 255); const oct4 = getRandomInt(1, 254); return `${oct1}.${oct2}.${oct3}.${oct4}`; }
export function generateRandomPrivateIp() { const type = getRandomInt(1, 3); let ip = ''; if (type === 1) { ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } else if (type === 2) { ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } else { ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } return ip; }
export function getIpInfo(ipString) { try { if (!ipString || typeof ipString !== 'string') { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } const octets = ipString.split('.').map(Number); if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } const firstOctet = octets[0]; let ipClass = 'N/A'; let ipType = 'Pública'; let defaultMask = 'N/A'; if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; } else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; } else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; } else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; } else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'Multicast'; defaultMask = 'N/A'; } else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'Experimental'; defaultMask = 'N/A'; } if (ipType === 'Pública') { if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { ipType = 'Privada'; } else if (firstOctet === 169 && octets[1] === 254) { ipType = 'APIPA'; ipClass = 'B'; defaultMask = 'N/A'; } } if (ipString === '255.255.255.255') { ipType = 'Broadcast Limitado'; ipClass = 'N/A'; defaultMask = 'N/A'; } return { class: ipClass, type: ipType, defaultMask: defaultMask }; } catch (error) { console.error("Error en getIpInfo:", error, "IP:", ipString); return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } }
export function getIpPortions(ipString, maskString) { try { if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada"); const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number); if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o !== 0 && o !== 255)) { return null; } let networkParts = []; let hostParts = []; let isHostPart = false; for (let i = 0; i < 4; i++) { if (maskOctets[i] === 255 && !isHostPart) { networkParts.push(ipOctets[i].toString()); } else { isHostPart = true; hostParts.push(ipOctets[i].toString()); } } const networkPortion = networkParts.join('.'); const hostPortion = hostParts.join('.'); return { networkPortion, hostPortion }; } catch (error) { console.error("Error en getIpPortions:", error); return null; } }
export function calculateNetworkAddress(ipString, maskString) { try { const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number); if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato IP o máscara inválido para cálculo de red."); } const networkOctets = []; for (let i = 0; i < 4; i++) { networkOctets.push(ipOctets[i] & maskOctets[i]); } return networkOctets.join('.'); } catch (error) { console.error("Error calculando dirección de red:", error); return null; } }
export function calculateWildcardMask(maskString) { try { const maskOctets = maskString.split('.').map(Number); if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) { throw new Error("Formato de máscara inválido para cálculo de wildcard."); } const wildcardOctets = maskOctets.map(octet => 255 - octet); return wildcardOctets.join('.'); } catch (error) { console.error("Error calculando wildcard mask:", error); return null; } }
export function calculateBroadcastAddress(networkAddrString, wildcardString) { try { const networkOctets = networkAddrString.split('.').map(Number); const wildcardOctets = wildcardString.split('.').map(Number); if (networkOctets.length !== 4 || wildcardOctets.length !== 4 || networkOctets.some(isNaN) || wildcardOctets.some(isNaN) || networkOctets.some(o => o < 0 || o > 255) || wildcardOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato Dir. Red o Wildcard inválido para cálculo de broadcast."); } const broadcastOctets = []; for (let i = 0; i < 4; i++) { broadcastOctets.push(networkOctets[i] | wildcardOctets[i]); } return broadcastOctets.join('.'); } catch (error) { console.error("Error calculando dirección de broadcast:", error); return null; } }

// --- Generadores de Tablas HTML para Explicaciones (Refactorizados con i18n) ---

/**
 * Genera tabla HTML de rangos de clases IP, usando traducciones.
 */
export function generateClassRangeTableHTML(highlightClass = null) {
    const ranges = [
        { class: 'A', range: '1 - 126' }, { class: 'B', range: '128 - 191' },
        { class: 'C', range: '192 - 223' }, { class: 'D', range: '224 - 239', note: '(Multicast)' },
        { class: 'E', range: '240 - 255', note: '(Experimental)' }
    ];
    // Usar getTranslation para el texto introductorio
    let tableHTML = `<p>${getTranslation('explanation_class_range_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    // Usar getTranslation para los encabezados de tabla
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_range')}</th><th>${getTranslation('table_header_note')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    if (highlightClass === 'A') {
        // Usar getTranslation para la nota de Loopback
        tableHTML += `<p style="font-size:0.8em; text-align:center; margin-top:5px;">${getTranslation('explanation_class_range_note_a')}</p>`;
    }
    return tableHTML;
}

/**
 * Genera tabla HTML Clase/Máscara Default, usando traducciones.
 */
export function generateClassMaskTableHTML(highlightClass = null) {
    const data = [
        { class: 'A', range: '1 - 126', mask: '255.0.0.0' },
        { class: 'B', range: '128 - 191', mask: '255.255.0.0' },
        { class: 'C', range: '192 - 223', mask: '255.255.255.0' }
    ];
    let tableHTML = `<p>${getTranslation('explanation_class_mask_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    // Usar getTranslation para encabezados
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_first_octet_range')}</th><th>${getTranslation('table_header_default_mask')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    data.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : '';
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    return tableHTML;
}

/**
 * Genera tabla HTML de Rangos Privados RFC 1918, usando traducciones.
 */
export function generatePrivateRangeTableHTML(highlightIp = null) {
    const ranges = [ { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' }, { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' }, { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' } ];
    const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
    let highlightCIDR = null; let ipType = 'N/A';
    if (highlightIp) {
        const info = getIpInfo(highlightIp); ipType = info.type;
        if (info.type === 'Privada') {
            const octets = highlightIp.split('.').map(Number);
            if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; }
            else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; }
            else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; }
        }
    }
    // Usar getTranslation para intro, pasando el enlace como reemplazo
    let tableHTML = `<p>${getTranslation('explanation_private_range_intro', { rfcLink: rfcLink })}</p>`;
    tableHTML += '<table class="explanation-table">';
    // Usar getTranslation para encabezados
    tableHTML += `<thead><tr><th>${getTranslation('table_header_block_cidr')}</th><th>${getTranslation('table_header_address_range')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; });
    tableHTML += '</tbody></table>';
    // Usar getTranslation para las notas finales
    if (highlightIp) {
        if (ipType === 'Privada' && highlightCIDR) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_private_range_note_private', { ip: highlightIp })}</p>`; }
        else if (ipType === 'Pública') { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_private_range_note_public', { ip: highlightIp })}</p>`; }
        else if (ipType !== 'N/A'){ tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_private_range_note_other', { ip: highlightIp, ipType: ipType })}</p>`; }
    }
    return tableHTML;
}

/**
 * Genera tabla HTML de cálculo Red/Broadcast/Wildcard, usando traducciones.
 */
export function generatePortionExplanationHTML(ipString, maskString, wildcardString, networkAddr, broadcastAddr) {
    try {
        if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) { throw new Error("Faltan datos para generar explicación de cálculo."); }

        // Usar getTranslation para el texto introductorio
        let html = `<p>${getTranslation('explanation_portion_intro', { ip: `<strong>${ipString}</strong>`, mask: `<strong>${maskString}</strong>` })}</p>`;
        html += '<table class="explanation-table">';
        // Usar getTranslation para los encabezados
        html += `<thead><tr><th>${getTranslation('table_header_concept')}</th><th>${getTranslation('table_header_value')}</th><th>${getTranslation('table_header_calculation_note')}</th></tr></thead>`;
        html += '<tbody>';
        // Usar getTranslation para los conceptos y notas
        html += `<tr><td>${getTranslation('explanation_portion_table_ip')}</td><td><code>${ipString}</code></td><td>-</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_mask')}</td><td><code>${maskString}</code></td><td>${getTranslation('explanation_portion_table_calc_mask')}</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_wildcard')}</td><td><code>${wildcardString}</code></td><td>${getTranslation('explanation_portion_table_calc_wildcard')}</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_netaddr')}</td><td><code>${networkAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_netaddr')}</td></tr>`;
        html += `<tr><td>${getTranslation('explanation_portion_table_broadaddr')}</td><td><code>${broadcastAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_broadaddr')}</td></tr>`;
        html += '</tbody></table>';

        return html;

    } catch (error) {
        console.error("Error generando explicación de cálculo:", error);
        // Usar getTranslation para el mensaje de error
        return `<p>${getTranslation('explanation_portion_calc_error', { ip: ipString, mask: maskString })}</p>`;
    }
}


/**
 * Genera explicación HTML para direcciones especiales, usando traducciones.
 */
export function generateSpecialAddressExplanationHTML(addressType) {
    let explanationKey = ''; // Clave para buscar la explicación base
    let rfcLink = '';
    let rfcText = '';

    switch (addressType) {
        case 'Loopback':
            explanationKey = 'explanation_special_loopback';
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3';
            rfcText = 'RFC 1122 (Sec 3.2.1.3)';
            break;
        case 'APIPA':
            explanationKey = 'explanation_special_apipa';
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1';
            rfcText = 'RFC 3927 (Sec 2.1)';
            break;
        case 'Broadcast Limitado':
            explanationKey = 'explanation_special_limited_broadcast';
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7';
            rfcText = 'RFC 919 (Sec 7)';
            break;
        default:
            explanationKey = 'explanation_special_default';
            break;
    }

    // Obtener la explicación base traducida
    let explanation = getTranslation(explanationKey);

    // Añadir el enlace traducido si existe
    if (rfcLink && rfcText) {
        explanation += ` ${getTranslation('explanation_special_defined_in', { rfcLink: rfcLink, rfcText: rfcText })}`;
    }

    return `<p>${explanation}</p>`;
}

/**
 * Función auxiliar interna para obtener el rango del primer octeto de una clase.
 * @param {string} ipClass - La clase ('A', 'B', 'C').
 * @returns {string} El rango como string (ej. "1-126") o "N/A".
 */
function getClassRange(ipClass) {
    // Esta función no necesita traducción ya que devuelve rangos numéricos
    switch (ipClass) {
        case 'A': return '1-126';
        case 'B': return '128-191';
        case 'C': return '192-223';
        default: return 'N/A';
    }
}
