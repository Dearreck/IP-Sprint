// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// ... (otros comentarios sin cambios) ...
// CORREGIDO: Estructura HTML en generateBitsForHostsExplanationHTML para numeración correcta.
// ==================================================

import { getTranslation } from './i18n.js';

// --- Utilidades Generales ---
// ... (funciones getRandomInt, shuffleArray, decimalToBinaryPadded, formatNumber sin cambios) ...
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Intercambio de elementos
    }
}
function decimalToBinaryPadded(decimal) {
    if (isNaN(decimal) || decimal < 0 || decimal > 255) {
        return '........'; // Indicador de valor inválido
    }
    return decimal.toString(2).padStart(8, '0');
}
export function formatNumber(num) {
    try {
        // Intenta usar el idioma actual de la página para el formato
        const lang = document.documentElement.lang || 'es'; // Usa 'es' como fallback
        return num.toLocaleString(lang);
    } catch (e) {
        // Si falla (ej. en entornos sin soporte completo de locale), devuelve el número como string simple
        console.warn("toLocaleString no soportado o falló, usando toString():", e);
        return num.toString();
    }
}


// --- Utilidades de Direccionamiento IP ---
// ... (funciones generateRandomIp, generateRandomPrivateIp, getIpInfo, getIpPortions, etc. sin cambios) ...
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
export function generateRandomPrivateIp() {
    const type = getRandomInt(1, 3);
    let ip = '';
    if (type === 1) {
        ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    } else if (type === 2) {
        ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    } else {
        ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
    }
    return ip;
}
export function getIpInfo(ipString) {
    const defaultResult = { class: 'N/A', type: 'N/A', typeKey: 'unknown', defaultMask: 'N/A' };
    try {
        if (!ipString || typeof ipString !== 'string') { return defaultResult; }
        const octets = ipString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) { return defaultResult; }
        const firstOctet = octets[0];
        let ipClass = 'N/A'; let ipTypeKey = 'unknown'; let defaultMask = 'N/A';
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet === 127) { ipClass = 'A'; defaultMask = '255.0.0.0'; ipTypeKey = 'loopback'; }
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; defaultMask = 'N/A'; ipTypeKey = 'multicast'; }
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; defaultMask = 'N/A'; ipTypeKey = 'experimental'; }
        if (ipTypeKey === 'unknown') {
            if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { ipTypeKey = 'private'; }
            else if (firstOctet === 169 && octets[1] === 254) { ipTypeKey = 'apipa'; ipClass = 'B'; defaultMask = 'N/A'; }
            else { ipTypeKey = 'public'; }
        }
        if (ipString === '255.255.255.255') { ipTypeKey = 'limited_broadcast'; ipClass = 'N/A'; defaultMask = 'N/A'; }
        const ipTypeTranslated = getTranslation(`option_${ipTypeKey}`) || ipTypeKey;
        return { class: ipClass, type: ipTypeTranslated, typeKey: ipTypeKey, defaultMask: defaultMask };
    } catch (error) { console.error("Error en getIpInfo:", error, "IP:", ipString); return defaultResult; }
}
export function getIpPortions(ipString, maskString) {
    try {
        if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada");
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);
        if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o !== 0 && o !== 255)) {
             console.warn("getIpPortions sólo funciona con máscaras de octetos completos (0 o 255). Mask:", maskString); return null;
        }
        let networkParts = []; let hostParts = []; let isHostPart = false;
        for (let i = 0; i < 4; i++) {
            if (maskOctets[i] === 255 && !isHostPart) { networkParts.push(ipOctets[i].toString()); }
            else { isHostPart = true; hostParts.push(ipOctets[i].toString()); }
        }
        const networkPortion = networkParts.join('.'); const hostPortion = hostParts.join('.');
        return { networkPortion, hostPortion };
    } catch (error) { console.error("Error en getIpPortions:", error); return null; }
}
export function generateRandomSubnetMask() {
    const prefix = getRandomInt(8, 30);
    let mask = ''; let remainingBits = prefix;
    for (let i = 0; i < 4; i++) {
        let octetValue = 0;
        if (remainingBits >= 8) { octetValue = 255; remainingBits -= 8; }
        else if (remainingBits > 0) { octetValue = 256 - Math.pow(2, 8 - remainingBits); remainingBits = 0; }
        else { octetValue = 0; }
        mask += octetValue + (i < 3 ? '.' : '');
    }
    return mask;
}
export function calculateNetworkAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number);
        if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato IP o máscara inválido"); }
        const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]); return networkOctets.join('.');
    } catch (error) { console.error("Error calculando dirección de red:", error); return null; }
}
export function calculateWildcardMask(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) { throw new Error("Formato de máscara inválido"); }
        const wildcardOctets = maskOctets.map(octet => 255 - octet); return wildcardOctets.join('.');
    } catch (error) { console.error("Error calculando wildcard mask:", error); return null; }
}
export function calculateBroadcastAddress(networkAddrString, wildcardString) {
    try {
        const networkOctets = networkAddrString.split('.').map(Number); const wildcardOctets = wildcardString.split('.').map(Number);
        if (networkOctets.length !== 4 || wildcardOctets.length !== 4 || networkOctets.some(isNaN) || wildcardOctets.some(isNaN) || networkOctets.some(o => o < 0 || o > 255) || wildcardOctets.some(o => o < 0 || o > 255) ) { throw new Error("Formato Dir. Red o Wildcard inválido"); }
        const broadcastOctets = networkOctets.map((octet, i) => octet | wildcardOctets[i]); return broadcastOctets.join('.');
    } catch (error) { console.error("Error calculando dirección de broadcast:", error); return null; }
}
export function getMaskPrefixLength(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) { throw new Error("Formato de máscara inválido"); }
        let prefixLength = 0; let validMask = true; let encounteredZero = false;
        for (const octet of maskOctets) {
            const binaryOctet = octet.toString(2).padStart(8, '0');
            for (const bit of binaryOctet) {
                if (bit === '1') { if (encounteredZero) { validMask = false; break; } prefixLength++; }
                else { encounteredZero = true; }
            }
            if (!validMask) break;
        }
        if (validMask) {
            let checkMask = ''; let bits = prefixLength;
            for(let i=0; i<4; i++){ let oct = 0; if(bits>=8){oct=255; bits-=8;} else if(bits>0){oct=256-Math.pow(2, 8-bits); bits=0;} else {oct=0;} checkMask += oct + (i<3?'.':''); }
            if(checkMask !== maskString) validMask = false;
        }
        return validMask ? prefixLength : null;
    } catch (error) { console.error("Error calculando longitud de prefijo:", error); return null; }
}
export function calculateUsableHosts(maskString) {
    const prefixLength = getMaskPrefixLength(maskString); if (prefixLength === null) return null;
    const hostBits = 32 - prefixLength; if (hostBits < 2) return 0;
    return Number(BigInt(2) ** BigInt(hostBits) - BigInt(2));
}
export function calculateNumberOfSubnets(originalClassMask, subnetMask) {
    const originalPrefix = getMaskPrefixLength(originalClassMask); const subnetPrefix = getMaskPrefixLength(subnetMask);
    if (originalPrefix === null || subnetPrefix === null || subnetPrefix < originalPrefix) { return null; }
    const subnetBits = subnetPrefix - originalPrefix; if (subnetBits === 0) return 1;
    return Number(BigInt(2) ** BigInt(subnetBits));
}
export function getFirstUsableHost(networkAddrString, maskString) {
    const prefixLength = getMaskPrefixLength(maskString); if (prefixLength === null || prefixLength >= 31) { return null; }
    try {
        const networkOctets = networkAddrString.split('.').map(Number); if (networkOctets.length !== 4 || networkOctets.some(isNaN)) return null;
        networkOctets[3] += 1; for (let i = 3; i > 0; i--) { if (networkOctets[i] > 255) { networkOctets[i] = 0; networkOctets[i - 1] += 1; } }
        if (networkOctets.some(o => o < 0 || o > 255)) return null; return networkOctets.join('.');
    } catch (e) { console.error("Error in getFirstUsableHost:", e); return null; }
}
export function getLastUsableHost(broadcastAddrString, maskString) {
    const prefixLength = getMaskPrefixLength(maskString); if (prefixLength === null || prefixLength >= 31) { return null; }
    try {
        const broadcastOctets = broadcastAddrString.split('.').map(Number); if (broadcastOctets.length !== 4 || broadcastOctets.some(isNaN)) return null;
        broadcastOctets[3] -= 1; for (let i = 3; i > 0; i--) { if (broadcastOctets[i] < 0) { broadcastOctets[i] = 255; broadcastOctets[i - 1] -= 1; } }
        if (broadcastOctets.some(o => o < 0 || o > 255)) return null; return broadcastOctets.join('.');
    } catch (e) { console.error("Error in getLastUsableHost:", e); return null; }
}
export function prefixToMaskString(prefixLength) {
    if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) { return null; }
    let mask = ''; let bits = prefixLength;
    for(let i = 0; i < 4; i++){ let octetValue = 0; if(bits >= 8){ octetValue = 255; bits -= 8; } else if(bits > 0){ octetValue = 256 - Math.pow(2, 8 - bits); bits = 0; } else { octetValue = 0; } mask += octetValue + (i < 3 ? '.' : ''); }
    return mask;
}


// --- Generadores de Tablas HTML para Explicaciones (Usan i18n) ---

export function generateClassRangeTableHTML(highlightClass = null) {
    const classData = [ { class: 'A', range: '1 - 126', mask: '255.0.0.0', noteKey: 'explanation_class_range_note_a' }, { class: 'B', range: '128 - 191', mask: '255.255.0.0', noteKey: '' }, { class: 'C', range: '192 - 223', mask: '255.255.255.0', noteKey: '' }, { class: 'D', range: '224 - 239', mask: 'N/A', noteKey: 'class_note_multicast' }, { class: 'E', range: '240 - 255', mask: 'N/A', noteKey: 'class_note_experimental' } ];
    let tableHTML = `<p>${getTranslation('explanation_class_mask_intro')}</p>`; tableHTML += '<table class="explanation-table">'; tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_first_octet_range')}</th><th>${getTranslation('table_header_default_mask')}</th><th>${getTranslation('table_header_note')}</th></tr></thead>`; tableHTML += '<tbody>';
    classData.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; const noteText = item.noteKey ? getTranslation(item.noteKey) : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td><code>${item.mask}</code></td><td>${noteText}</td></tr>`; });
    tableHTML += '</tbody></table>'; return tableHTML;
}
export function generatePrivateRangeTableHTML(highlightIp = null) {
    const ranges = [ { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' }, { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' }, { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' } ]; const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918'; let highlightCIDR = null; let ipTypeKey = 'unknown'; let ipTypeTranslated = '';
    if (highlightIp) { const info = getIpInfo(highlightIp); ipTypeKey = info.typeKey; ipTypeTranslated = info.type; if (ipTypeKey === 'private') { const octets = highlightIp.split('.').map(Number); if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; } else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; } else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; } } }
    let tableHTML = `<p>${getTranslation('explanation_private_range_intro', { rfcLink: rfcLink })}</p>`; tableHTML += '<table class="explanation-table">'; tableHTML += `<thead><tr><th>${getTranslation('table_header_block_cidr')}</th><th>${getTranslation('table_header_address_range')}</th></tr></thead>`; tableHTML += '<tbody>';
    ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; }); tableHTML += '</tbody></table>';
    if (highlightIp) { let noteKey = ''; if (ipTypeKey === 'private' && highlightCIDR) { noteKey = 'explanation_private_range_note_private'; } else if (ipTypeKey === 'public') { noteKey = 'explanation_private_range_note_public'; } else if (ipTypeKey !== 'unknown') { noteKey = 'explanation_private_range_note_other'; } if (noteKey) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation(noteKey, { ip: highlightIp, ipType: ipTypeTranslated })}</p>`; } }
    return tableHTML;
}
export function generatePortionExplanationHTML(ipString, maskString, wildcardString, networkAddr, broadcastAddr, firstUsable = null, lastUsable = null, highlightRowKey = null) {
    try {
        if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) { throw new Error("Faltan datos para generar explicación de cálculo."); }
        let html = '<table class="explanation-table" style="margin-top: 15px;">'; html += `<thead><tr><th>${getTranslation('table_header_concept')}</th><th>${getTranslation('table_header_value')}</th><th>${getTranslation('table_header_calculation_note')}</th></tr></thead>`; html += '<tbody>';
        html += `<tr${highlightRowKey === 'ip' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_ip')}</td><td><code>${ipString}</code></td><td>-</td></tr>`;
        html += `<tr${highlightRowKey === 'mask' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_mask')}</td><td><code>${maskString}</code></td><td>${getTranslation('explanation_portion_table_calc_mask')}</td></tr>`;
        html += `<tr${highlightRowKey === 'wildcard' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_wildcard')}</td><td><code>${wildcardString}</code></td><td>${getTranslation('explanation_portion_table_calc_wildcard')}</td></tr>`;
        html += `<tr${highlightRowKey === 'netaddr' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_netaddr')}</td><td><code>${networkAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_netaddr')}</td></tr>`;
        if (firstUsable && lastUsable) { const usableRangeText = `${firstUsable} - ${lastUsable}`; html += `<tr${highlightRowKey === 'usable' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_usable_range')}</td><td><code>${usableRangeText}</code></td><td>${getTranslation('explanation_portion_table_calc_usable_range')}</td></tr>`;
        } else if (firstUsable === null && lastUsable === null) { // Handle cases like /31, /32 where getFirst/Last return null
             html += `<tr${highlightRowKey === 'usable' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_usable_range')}</td><td><code>N/A</code></td><td>(${getTranslation('no_usable_hosts') || 'No Usable Hosts'})</td></tr>`;
        }
        html += `<tr${highlightRowKey === 'broadaddr' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_broadaddr')}</td><td><code>${broadcastAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_broadaddr')}</td></tr>`;
        html += '</tbody></table>'; return html;
    } catch (error) { console.error("Error generando explicación de cálculo:", error); return `<p>${getTranslation('explanation_portion_calc_error', { ip: ipString, mask: maskString })}</p>`; }
}
export function generateSpecialAddressExplanationHTML(addressTypeKey) {
    let explanationKey = ''; let rfcLink = ''; let rfcText = '';
    switch (addressTypeKey) { case 'loopback': explanationKey = 'explanation_special_loopback'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3'; rfcText = 'RFC 1122 (Sec 3.2.1.3)'; break; case 'apipa': explanationKey = 'explanation_special_apipa'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1'; rfcText = 'RFC 3927 (Sec 2.1)'; break; case 'limited_broadcast': explanationKey = 'explanation_special_limited_broadcast'; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7'; rfcText = 'RFC 919 (Sec 7)'; break; default: explanationKey = 'explanation_special_default'; break; }
    let explanation = getTranslation(explanationKey); if (rfcLink && rfcText) { explanation += ` ${getTranslation('explanation_special_defined_in', { rfcLink: rfcLink, rfcText: rfcText })}`; }
    return `<p>${explanation}</p>`;
}
export function generateWildcardExplanationHTML(subnetMask, wildcardMask) {
    try {
        const maskOctets = subnetMask.split('.').map(Number); const wildcardOctets = wildcardMask.split('.').map(Number);
        if (maskOctets.length !== 4 || wildcardOctets.length !== 4 || maskOctets.some(isNaN) || wildcardOctets.some(isNaN)) { throw new Error("Formato inválido de máscara o wildcard al generar explicación"); }
        let html = `<p>${getTranslation('explanation_wildcard_intro')}</p>`; const cellStyle = "padding: 2px 5px; text-align: right; font-family: monospace;"; const labelCellStyle = "padding: 2px 5px; text-align: left; font-family: monospace;"; const separatorCellStyle = "padding: 0 2px; text-align: center; font-family: monospace;"; const hrCellStyle = "border-bottom: 1px solid #ccc; height: 1px; padding: 0; margin: 2px 0;";
        html += `<table style="width: auto; margin: 10px auto; border-collapse: collapse;"><tbody>`;
        html += `<tr><td style="${cellStyle}"></td><td style="${cellStyle}">255</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">255</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">255</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">255</td><td style="${labelCellStyle}"></td></tr>`;
        html += `<tr><td style="${cellStyle}">-</td><td style="${cellStyle}">${maskOctets[0]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${maskOctets[1]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${maskOctets[2]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${maskOctets[3]}</td><td style="${labelCellStyle}">(${getTranslation('explanation_portion_table_mask')})</td></tr>`;
        html += `<tr><td colspan="9" style="${hrCellStyle}"></td></tr>`;
        html += `<tr><td style="${cellStyle}">=</td><td style="${cellStyle}">${wildcardOctets[0]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${wildcardOctets[1]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${wildcardOctets[2]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${wildcardOctets[3]}</td><td style="${labelCellStyle}">(${getTranslation('explanation_portion_table_wildcard')})</td></tr>`;
        html += `</tbody></table>`; return html;
    } catch (error) { console.error("Error generando explicación de wildcard:", error); return `<p>${getTranslation('explanation_portion_calc_error', { ip: subnetMask, mask: 'N/A' })}</p>`; }
}
export function generateSubnettingExplanationHTML(ip, mask, networkAddr, broadcastAddr, usableHosts, numSubnets, originalClassMask) {
    try {
        const prefixLength = getMaskPrefixLength(mask); const hostBits = 32 - prefixLength; const originalPrefix = getMaskPrefixLength(originalClassMask); const subnetBits = prefixLength - originalPrefix; const ipInfo = getIpInfo(ip); const wildcardMask = calculateWildcardMask(mask);
        if (prefixLength === null || originalPrefix === null || ipInfo.class === 'N/A' || wildcardMask === null || networkAddr === null || broadcastAddr === null || usableHosts === null || numSubnets === null) { throw new Error("Datos inválidos para explicación de subnetting"); }
        let html = ''; const firstUsable = getFirstUsableHost(networkAddr, mask); const lastUsable = getLastUsableHost(broadcastAddr, mask); html += generatePortionExplanationHTML(ip, mask, wildcardMask, networkAddr, broadcastAddr, firstUsable, lastUsable, null);
        const ipOctets = ip.split('.').map(Number); const maskOctets = mask.split('.').map(Number); const networkOctets = networkAddr.split('.').map(Number);
        let andingHtml = `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`; andingHtml += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_anding_process')}</strong></p>`; const cellStyle = "padding: 1px 4px; text-align: center; font-family: monospace; font-size: 0.9em;"; const labelCellStyle = "padding: 1px 4px; text-align: left; font-family: monospace; white-space: nowrap; font-size: 0.9em;"; const separatorCellStyle = "padding: 0 1px; text-align: center; font-family: monospace; font-size: 0.9em;"; const hrCellStyle = "border-bottom: 1px solid #ccc; height: 1px; padding: 0; margin: 1px 0;";
        andingHtml += `<table style="width: auto; margin: 5px auto; border-collapse: collapse;"><tbody>`; andingHtml += `<tr><td style="${labelCellStyle}">${getTranslation('explanation_ip_binary')}</td>`; for (let i = 0; i < 4; i++) { andingHtml += `<td style="${cellStyle}">${decimalToBinaryPadded(ipOctets[i])}</td>`; if (i < 3) andingHtml += `<td style="${separatorCellStyle}">.</td>`; } andingHtml += `</tr>`; andingHtml += `<tr><td style="${labelCellStyle}">${getTranslation('explanation_mask_binary')}</td>`; for (let i = 0; i < 4; i++) { andingHtml += `<td style="${cellStyle}">${decimalToBinaryPadded(maskOctets[i])}</td>`; if (i < 3) andingHtml += `<td style="${separatorCellStyle}">.</td>`; } andingHtml += `</tr>`; andingHtml += `<tr><td style="${labelCellStyle}"><strong>AND</strong></td><td colspan="${4 * 2 - 1}" style="${hrCellStyle}"></td></tr>`; andingHtml += `<tr><td style="${labelCellStyle}">${getTranslation('explanation_and_result')}</td>`; for (let i = 0; i < 4; i++) { andingHtml += `<td style="${cellStyle}">${decimalToBinaryPadded(networkOctets[i])}</td>`; if (i < 3) andingHtml += `<td style="${separatorCellStyle}">.</td>`; } andingHtml += `</tr>`; andingHtml += `</tbody></table>`; andingHtml += `<p style="text-align:center; font-size:0.9em; margin-top:5px;">${getTranslation('explanation_network_address_decimal')} <code>${networkAddr}</code></p>`; andingHtml += `</div>`;
        let subnetCalcHtml = ''; if (subnetBits > 0) { subnetCalcHtml += `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`; subnetCalcHtml += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_subnetting_num_subnets')}</strong></p>`; subnetCalcHtml += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`; subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step1', { class: ipInfo.class })} <code>${originalClassMask}</code> (/${originalPrefix})</li>`; subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step2')} <code>${mask}</code> (/${prefixLength})</li>`; subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step3')} ${prefixLength} - ${originalPrefix} = <strong>${subnetBits}</strong></li>`; subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step4')} <code>${getTranslation('explanation_subnet_calc_formula', { subnetBits: subnetBits, numSubnets: formatNumber(numSubnets) })}</code></li>`; subnetCalcHtml += `</ol></div>`; } else { subnetCalcHtml += `<p style="font-size: 0.9em; margin-top: 15px;"><em>(${getTranslation('no_subnetting_performed')})</em></p>`; }
        let hostCalcHtml = ''; hostCalcHtml += `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`; hostCalcHtml += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_subnetting_usable_hosts')}</strong></p>`; hostCalcHtml += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`; hostCalcHtml += `<li>${getTranslation('explanation_host_calc_step1')} <code>${mask}</code> (/${prefixLength})</li>`; hostCalcHtml += `<li>${getTranslation('explanation_host_calc_step2')} 32 - ${prefixLength} = <strong>${hostBits}</strong></li>`; hostCalcHtml += `<li>${getTranslation('explanation_host_calc_step3')} <code>${getTranslation('explanation_host_calc_formula', { hostBits: hostBits, usableHosts: formatNumber(usableHosts) })}</code></li>`; hostCalcHtml += `</ol></div>`;
        html += andingHtml + subnetCalcHtml + hostCalcHtml; return html;
    } catch (error) { console.error("Error generando explicación de subnetting:", error); return `<p>${getTranslation('explanation_portion_calc_error', { ip: ip, mask: mask })}</p>`; }
}
// *** NUEVA FUNCIÓN ***
/**
 * Genera explicación HTML específica para el cálculo del Número de Subredes.
 * @param {string} ipClass - Clase de la IP original ('A', 'B', 'C').
 * @param {string} originalClassMask - Máscara por defecto de la clase.
 * @param {number} originalPrefix - Prefijo por defecto de la clase.
 * @param {string} subnetMask - Máscara de subred utilizada.
 * @param {number} prefixLength - Prefijo de la máscara utilizada.
 * @param {number} subnetBits - Bits prestados para subred (calculado: prefixLength - originalPrefix).
 * @param {number} numSubnets - Número de subredes calculado (2^subnetBits).
 * @returns {string} El HTML de la explicación paso a paso.
 */
export function generateNumSubnetsExplanationHTML(ipClass, originalClassMask, originalPrefix, subnetMask, prefixLength, subnetBits, numSubnets) {
    try {
        if (subnetBits <= 0) {
             // Si no hay bits de subred, mostrar mensaje simple
             return `<p style="font-size: 0.9em; margin-top: 15px;"><em>(${getTranslation('no_subnetting_performed')})</em></p>`;
        }
        // Construir la explicación paso a paso
        let html = `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`;
        html += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_subnetting_num_subnets')}</strong></p>`;
        html += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        html += `<li>${getTranslation('explanation_subnet_calc_step1', { class: ipClass })} <code>${originalClassMask}</code> (/${originalPrefix})</li>`;
        html += `<li>${getTranslation('explanation_subnet_calc_step2')} <code>${subnetMask}</code> (/${prefixLength})</li>`;
        html += `<li>${getTranslation('explanation_subnet_calc_step3')} ${prefixLength} - ${originalPrefix} = <strong>${subnetBits}</strong></li>`;
        html += `<li>${getTranslation('explanation_subnet_calc_step4')} <code>${getTranslation('explanation_subnet_calc_formula', { subnetBits: subnetBits, numSubnets: formatNumber(numSubnets) })}</code></li>`;
        html += `</ol></div>`;
        return html;
    } catch (error) { console.error("Error generando explicación de número de subredes:", error); return `<p>Error al generar la explicación.</p>`; }
}
// *** FIN NUEVA FUNCIÓN ***

export function generateIpTypeExplanationHTML(targetIp, ipType, networkAddr, broadcastAddr, prefixLength) {
    let explanationKey = ''; const replacements = { targetIp: `<strong>${targetIp}</strong>`, networkAddr: `<code>${networkAddr}</code>`, broadcastAddr: `<code>${broadcastAddr}</code>`, prefixLength: prefixLength };
    switch (ipType) { case 'network': explanationKey = 'explanation_ip_type_net'; break; case 'broadcast': explanationKey = 'explanation_ip_type_broad'; break; case 'usable': explanationKey = 'explanation_ip_type_usable'; break; case 'outside': explanationKey = 'explanation_ip_type_outside'; break; default: return `<p>Error: Tipo de IP desconocido '${ipType}'</p>`; }
    let html = `<p>${getTranslation(explanationKey, replacements)}</p>`; return html;
}
export function generateBitsForSubnetsExplanationHTML(requiredSubnets, subnetBits, resultingSubnets) {
    try {
        let html = `<p>${getTranslation('explanation_bits_for_subnets_intro', { requiredSubnets: formatNumber(requiredSubnets) })}</p>`; html += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        html += `<li>${getTranslation('explanation_bits_for_subnets_step1', { requiredSubnets: formatNumber(requiredSubnets) })}</li>`; let calculationStepsHTML = ''; calculationStepsHTML += `<div style="margin-left: -10px; margin-top: 5px; margin-bottom: 5px;">${getTranslation('explanation_bits_for_subnets_step2')}</div>`; calculationStepsHTML += `<ul style="list-style: none; padding-left: 10px; margin-top: 0;">`;
        for (let s = Math.max(0, subnetBits - 2); s <= subnetBits + 1; s++) { const powerOf2BigInt = BigInt(2) ** BigInt(s); const powerOf2Num = Number(powerOf2BigInt); const isCorrect = s === subnetBits; const comparison = (powerOf2Num >= requiredSubnets) ? '&ge;' : '&lt;'; let line = `2<sup>${s}</sup> = ${formatNumber(powerOf2Num)}`; line += ` (${comparison} ${formatNumber(requiredSubnets)})`; if (isCorrect) { line = `<strong>${line}</strong>`; } calculationStepsHTML += `<li><code>${line}</code></li>`; }
        calculationStepsHTML += `</ul>`; html += `<li>${calculationStepsHTML}</li>`; html += `<li>${getTranslation('explanation_bits_for_subnets_step3', { subnetBits: subnetBits })}</li>`; html += `</ol>`; return html;
    } catch (error) { console.error("Error generando explicación de bits para subredes:", error); return `<p>Error al generar la explicación.</p>`; }
}

// *** MODIFIED Function (HTML Structure) ***
export function generateBitsForHostsExplanationHTML(requiredHosts, hostBits, resultingHosts) {
    try {
        let html = `<p>${getTranslation('explanation_bits_for_hosts_intro', { requiredHosts: formatNumber(requiredHosts) })}</p>`;
        html += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        // Paso 1: Objetivo (2^h - 2 >= req)
        html += `<li>${getTranslation('explanation_bits_for_hosts_step1', { requiredHosts: formatNumber(requiredHosts) })}</li>`;
        // Paso 2: Equivalencia (2^h >= req + 2)
        const requiredTotal = BigInt(requiredHosts) + BigInt(2);
        html += `<li>${getTranslation('explanation_bits_for_hosts_step2', { requiredHosts: formatNumber(requiredHosts), requiredTotal: formatNumber(Number(requiredTotal)) })}</li>`;
        // Paso 3: Cálculo de potencias de 2 (Ahora dentro del LI)
        let calculationStepsHTML = '';
        calculationStepsHTML += `${getTranslation('explanation_bits_for_hosts_step3')}`; // Texto introductorio
        calculationStepsHTML += `<ul style="list-style: none; padding-left: 10px; margin-top: 0; margin-bottom: 0;">`; // Lista de cálculos
        // Mostrar cálculos para bits cercanos al resultado (mínimo 2 bits de host)
        for (let h = Math.max(2, hostBits - 2); h <= hostBits + 1; h++) {
            const powerOf2 = BigInt(2) ** BigInt(h);
            const usable = (h >= 2) ? Number(powerOf2 - BigInt(2)) : 0; // Usable = 2^h - 2
            const isCorrect = h === hostBits;
            const comparison = (powerOf2 >= requiredTotal) ? '&ge;' : '&lt;'; // Comparar 2^h con (req + 2)
            // Usar clave de traducción para la línea de cálculo
            let line = getTranslation('explanation_bits_for_hosts_calculation_line', {
                exponent: h,
                powerOf2: formatNumber(Number(powerOf2)),
                usableHosts: formatNumber(usable),
                comparison: comparison,
                requiredHosts: formatNumber(requiredHosts) // Pasar requiredHosts para el texto
            });
            if (isCorrect) { line = `<strong>${line}</strong>`; } // Resaltar la línea correcta
            calculationStepsHTML += `<li><code>${line}</code></li>`;
        }
        calculationStepsHTML += `</ul>`;
        // Añadir el contenido del paso 3 al LI
        html += `<li>${calculationStepsHTML}</li>`;
        // Paso 4: Conclusión
        html += `<li>${getTranslation('explanation_bits_for_hosts_step4', { hostBits: hostBits })}</li>`;
        html += `</ol>`;
        return html;
    } catch (error) {
        console.error("Error generando explicación de bits para hosts:", error);
        return `<p>Error al generar la explicación.</p>`;
    }
}


export function generateMaskForHostsExplanationHTML(requiredHosts, hostBits, prefixLength, subnetMask) {
    try {
        let html = `<p>${getTranslation('explanation_mask_for_hosts_intro', { requiredHosts: formatNumber(requiredHosts) })}</p>`;
        html += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        // Reutilizar pasos del cálculo de bits de host
        const requiredTotal = requiredHosts + 2;
        html += `<li>${getTranslation('explanation_bits_for_hosts_step1', { requiredHosts: formatNumber(requiredHosts) })}</li>`; // Paso 1: 2^h - 2 >= req
        html += `<li>${getTranslation('explanation_bits_for_hosts_step2', { requiredHosts: formatNumber(requiredHosts), requiredTotal: formatNumber(requiredTotal) })}</li>`; // Paso 2: 2^h >= req + 2 -> h = hostBits
        // html += `<li>${getTranslation('explanation_bits_for_hosts_step4', { hostBits: hostBits })}</li>`; // Paso 3: Concluir bits de host (implícito en paso 2)
        // Paso 4: Calcular prefijo
        html += `<li>${getTranslation('explanation_mask_for_hosts_step3', { hostBits: hostBits, prefixLength: prefixLength })}</li>`; // 32 - h = prefix
        // Paso 5: Convertir prefijo a máscara
        html += `<li>${getTranslation('explanation_mask_for_hosts_step4', { prefixLength: prefixLength, subnetMask: `<code>${subnetMask}</code>` })}</li>`; // /prefix -> mask
        html += `</ol>`;
        return html;
    } catch (error) {
        console.error("Error generando explicación de máscara para hosts:", error);
        return `<p>Error al generar la explicación.</p>`;
    }
}

