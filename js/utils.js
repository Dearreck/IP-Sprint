// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// Añadidas funciones para generar máscaras de subred aleatorias
// y explicación de cálculo de wildcard.
// ==================================================

import { getTranslation } from './i18n.js';

// --- Utilidades Generales ---
// (getRandomInt, shuffleArray sin cambios)
export function getRandomInt(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }
export function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

// --- Utilidades de Direccionamiento IP ---
// (generateRandomIp, generateRandomPrivateIp, getIpInfo, getIpPortions sin cambios)
export function generateRandomIp() { let oct1; do { oct1 = getRandomInt(1, 223); } while (oct1 === 127 || oct1 === 169); let oct2 = getRandomInt(0, 255); if (oct1 === 169 && oct2 === 254) { oct2 = getRandomInt(0, 253); } const oct3 = getRandomInt(0, 255); const oct4 = getRandomInt(1, 254); return `${oct1}.${oct2}.${oct3}.${oct4}`; }
export function generateRandomPrivateIp() { const type = getRandomInt(1, 3); let ip = ''; if (type === 1) { ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } else if (type === 2) { ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } else { ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } return ip; }
export function getIpInfo(ipString) { const defaultResult = { class: 'N/A', type: 'N/A', typeKey: 'unknown', defaultMask: 'N/A' }; try { if (!ipString || typeof ipString !== 'string') { return defaultResult; } const octets = ipString.split('.').map(Number); if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) { return defaultResult; } const firstOctet = octets[0]; let ipClass = 'N/A'; let ipTypeKey = 'unknown'; let defaultMask = 'N/A'; if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; } else if (firstOctet === 127) { ipClass = 'A'; defaultMask = '255.0.0.0'; ipTypeKey = 'loopback'; } else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; } else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; } else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; defaultMask = 'N/A'; ipTypeKey = 'multicast'; } else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; defaultMask = 'N/A'; ipTypeKey = 'experimental'; } if (ipTypeKey === 'unknown') { if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { ipTypeKey = 'private'; } else if (firstOctet === 169 && octets[1] === 254) { ipTypeKey = 'apipa'; ipClass = 'B'; defaultMask = 'N/A'; } else { ipTypeKey = 'public'; } } if (ipString === '255.255.255.255') { ipTypeKey = 'limited_broadcast'; ipClass = 'N/A'; defaultMask = 'N/A'; } const ipTypeTranslated = getTranslation(`option_${ipTypeKey}`) || ipTypeKey; return { class: ipClass, type: ipTypeTranslated, typeKey: ipTypeKey, defaultMask: defaultMask }; } catch (error) { console.error("Error en getIpInfo:", error, "IP:", ipString); return defaultResult; } }
export function getIpPortions(ipString, maskString) { try { if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada"); const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number); if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o !== 0 && o !== 255)) { console.warn("getIpPortions llamada con IP/Máscara inválida o no de clase:", ipString, maskString); return null; } let networkParts = []; let hostParts = []; let isHostPart = false; for (let i = 0; i < 4; i++) { if (maskOctets[i] === 255 && !isHostPart) { networkParts.push(ipOctets[i].toString()); } else { isHostPart = true; hostParts.push(ipOctets[i].toString()); } } const networkPortion = networkParts.join('.'); const hostPortion = hostParts.join('.'); return { networkPortion, hostPortion }; } catch (error) { console.error("Error en getIpPortions:", error); return null; } }

/**
 * --- NUEVO: Genera una máscara de subred válida aleatoria ---
 * Genera máscaras comunes de /8 a /30, excluyendo /31 y /32.
 * @returns {string} Una máscara de subred como "255.x.x.x".
 */
export function generateRandomSubnetMask() {
    // Prefijos válidos comunes (excluyendo /0, /31, /32)
    const prefix = getRandomInt(8, 30);
    let mask = '';
    let remainingBits = prefix;

    for (let i = 0; i < 4; i++) {
        let octetValue = 0;
        if (remainingBits >= 8) {
            octetValue = 255;
            remainingBits -= 8;
        } else if (remainingBits > 0) {
            // Calcular valor del octeto basado en bits restantes
            octetValue = 256 - Math.pow(2, 8 - remainingBits);
            remainingBits = 0;
        } else {
            octetValue = 0;
        }
        mask += octetValue + (i < 3 ? '.' : '');
    }
    return mask;
}
// --- FIN NUEVO ---

// (calculateNetworkAddress sin cambios)
export function calculateNetworkAddress(ipString, maskString) { try { const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number); if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato IP o máscara inválido"); } const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]); return networkOctets.join('.'); } catch (error) { console.error("Error calculando dirección de red:", error); return null; } }

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
        const wildcardOctets = maskOctets.map(octet => 255 - octet);
        return wildcardOctets.join('.');
    } catch (error) {
        console.error("Error calculando wildcard mask:", error);
        return null;
    }
}

// (calculateBroadcastAddress sin cambios)
export function calculateBroadcastAddress(networkAddrString, wildcardString) { try { const networkOctets = networkAddrString.split('.').map(Number); const wildcardOctets = wildcardString.split('.').map(Number); if (networkOctets.length !== 4 || wildcardOctets.length !== 4 || networkOctets.some(isNaN) || wildcardOctets.some(isNaN) || networkOctets.some(o => o < 0 || o > 255) || wildcardOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato Dir. Red o Wildcard inválido"); } const broadcastOctets = networkOctets.map((octet, i) => octet | wildcardOctets[i]); return broadcastOctets.join('.'); } catch (error) { console.error("Error calculando dirección de broadcast:", error); return null; } }


// --- Generadores de Tablas HTML para Explicaciones (Usan i18n) ---
// (generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML sin cambios)
export function generateClassRangeTableHTML(highlightClass = null) { const ranges = [ { class: 'A', range: '1 - 126' }, { class: 'B', range: '128 - 191' }, { class: 'C', range: '192 - 223' }, { class: 'D', range: '224 - 239', note: getTranslation('class_note_multicast') || '(Multicast)' }, { class: 'E', range: '240 - 255', note: getTranslation('class_note_experimental') || '(Experimental)' } ]; let tableHTML = `<p>${getTranslation('explanation_class_range_intro')}</p>`; tableHTML += '<table class="explanation-table">'; tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_range')}</th><th>${getTranslation('table_header_note')}</th></tr></thead>`; tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`; }); tableHTML += '</tbody></table>'; if (highlightClass === 'A') { tableHTML += `<p style="font-size:0.8em; text-align:center; margin-top:5px;">${getTranslation('explanation_class_range_note_a')}</p>`; } return tableHTML; }
export function generateClassMaskTableHTML(highlightClass = null) { const data = [ { class: 'A', range: '1 - 126', mask: '255.0.0.0' }, { class: 'B', range: '128 - 191', mask: '255.255.0.0' }, { class: 'C', range: '192 - 223', mask: '255.255.255.0' } ]; let tableHTML = `<p>${getTranslation('explanation_class_mask_intro')}</p>`; tableHTML += '<table class="explanation-table">'; tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_first_octet_range')}</th><th>${getTranslation('table_header_default_mask')}</th></tr></thead>`; tableHTML += '<tbody>'; data.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`; }); tableHTML += '</tbody></table>'; return tableHTML; }
export function generatePrivateRangeTableHTML(highlightIp = null) { const ranges = [ { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' }, { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' }, { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' } ]; const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918'; let highlightCIDR = null; let ipTypeKey = 'unknown'; let ipTypeTranslated = ''; if (highlightIp) { const info = getIpInfo(highlightIp); ipTypeKey = info.typeKey; ipTypeTranslated = info.type; if (ipTypeKey === 'private') { const octets = highlightIp.split('.').map(Number); if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; } else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; } else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; } } } let tableHTML = `<p>${getTranslation('explanation_private_range_intro', { rfcLink: rfcLink })}</p>`; tableHTML += '<table class="explanation-table">'; tableHTML += `<thead><tr><th>${getTranslation('table_header_block_cidr')}</th><th>${getTranslation('table_header_address_range')}</th></tr></thead>`; tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; }); tableHTML += '</tbody></table>'; if (highlightIp) { let noteKey = ''; if (ipTypeKey === 'private' && highlightCIDR) { noteKey = 'explanation_private_range_note_private'; } else if (ipTypeKey === 'public') { noteKey = 'explanation_private_range_note_public'; } else if (ipTypeKey !== 'unknown') { noteKey = 'explanation_private_range_note_other'; } if (noteKey) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation(noteKey, { ip: highlightIp, ipType: ipTypeTranslated })}</p>`; } } return tableHTML; }
export function generatePortionExplanationHTML(ipString, maskString, wildcardString, networkAddr, broadcastAddr) { try { if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) { throw new Error("Faltan datos para generar explicación de cálculo."); } let html = `<p>${getTranslation('explanation_portion_intro', { ip: `<strong>${ipString}</strong>`, mask: `<strong>${maskString}</strong>` })}</p>`; html += '<table class="explanation-table">'; html += `<thead><tr><th>${getTranslation('table_header_concept')}</th><th>${getTranslation('table_header_value')}</th><th>${getTranslation('table_header_calculation_note')}</th></tr></thead>`; html += '<tbody>'; html += `<tr><td>${getTranslation('explanation_portion_table_ip')}</td><td><code>${ipString}</code></td><td>-</td></tr>`; html += `<tr><td>${getTranslation('explanation_portion_table_mask')}</td><td><code>${maskString}</code></td><td>${getTranslation('explanation_portion_table_calc_mask')}</td></tr>`; html += `<tr><td>${getTranslation('explanation_portion_table_wildcard')}</td><td><code>${wildcardString}</code></td><td>${getTranslation('explanation_portion_table_calc_wildcard')}</td></tr>`; html += `<tr><td>${getTranslation('explanation_portion_table_netaddr')}</td><td><code>${networkAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_netaddr')}</td></tr>`; html += `<tr><td>${getTranslation('explanation_portion_table_broadaddr')}</td><td><code>${broadcastAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_broadaddr')}</td></tr>`; html += '</tbody></table>'; return html; } catch (error) { console.error("Error generando explicación de cálculo:", error); return `<p>${getTranslation('explanation_portion_calc_error', { ip: ipString, mask: maskString })}</p>`; } }
export function generateSpecialAddressExplanationHTML(addressTypeKey) { let explanationKey = ''; let rfcLink = ''; let rfcText = ''; switch (addressTypeKey) { case 'loopback': explanationKey = 'explanation_special_loopback'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3'; rfcText = 'RFC 1122 (Sec 3.2.1.3)'; break; case 'apipa': explanationKey = 'explanation_special_apipa'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1'; rfcText = 'RFC 3927 (Sec 2.1)'; break; case 'limited_broadcast': explanationKey = 'explanation_special_limited_broadcast'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7'; rfcText = 'RFC 919 (Sec 7)'; break; default: console.warn("generateSpecialAddressExplanationHTML llamada con tipo no especial:", addressTypeKey); explanationKey = 'explanation_special_default'; break; } let explanation = getTranslation(explanationKey); if (rfcLink && rfcText) { explanation += ` ${getTranslation('explanation_special_defined_in', { rfcLink: rfcLink, rfcText: rfcText })}`; } return `<p>${explanation}</p>`; }

/**
 * --- NUEVO: Genera explicación HTML para cálculo de Wildcard ---
 * @param {string} subnetMask - La máscara de subred original.
 * @param {string} wildcardMask - La máscara wildcard calculada.
 * @returns {string} El string HTML de la explicación.
 */
export function generateWildcardExplanationHTML(subnetMask, wildcardMask) {
    try {
        const maskOctets = subnetMask.split('.').map(Number);
        const wildcardOctets = wildcardMask.split('.').map(Number);
        if (maskOctets.length !== 4 || wildcardOctets.length !== 4) {
            throw new Error("Formato inválido de máscara o wildcard");
        }

        let html = `<p>${getTranslation('explanation_wildcard_intro')}</p>`;
        html += '<table class="explanation-table">';
        html += `<thead><tr><th>${getTranslation('table_header_octet')}</th><th>${getTranslation('table_header_calculation_note')}</th></tr></thead>`;
        html += '<tbody>';
        for (let i = 0; i < 4; i++) {
            const calculationText = getTranslation('explanation_wildcard_calculation', {
                octetValue: maskOctets[i],
                wildcardOctet: wildcardOctets[i]
            });
            html += `<tr><td>Octeto ${i + 1}</td><td><code>${calculationText}</code></td></tr>`;
        }
        html += '</tbody></table>';
        return html;
    } catch (error) {
        console.error("Error generando explicación de wildcard:", error);
        return `<p>${getTranslation('explanation_portion_calc_error', { ip: subnetMask, mask: 'N/A' })}</p>`; // Reutilizar clave de error
    }
}
// --- FIN NUEVO ---
