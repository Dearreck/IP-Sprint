// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// ==================================================

// --- Utilidades Generales ---
export function getRandomInt(min, max) { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }
export function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

// --- Utilidades de Direccionamiento IP ---
export function generateRandomIp() { let oct1; do { oct1 = getRandomInt(1, 223); } while (oct1 === 127 || oct1 === 169); let oct2 = getRandomInt(0, 255); if (oct1 === 169 && oct2 === 254) { oct2 = getRandomInt(0, 253); } const oct3 = getRandomInt(0, 255); const oct4 = getRandomInt(1, 254); return `${oct1}.${oct2}.${oct3}.${oct4}`; }
export function generateRandomPrivateIp() { const type = getRandomInt(1, 3); let ip = ''; if (type === 1) { ip = `10.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } else if (type === 2) { ip = `172.${getRandomInt(16, 31)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } else { ip = `192.168.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; } return ip; }
export function getIpInfo(ipString) { try { if (!ipString || typeof ipString !== 'string') { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } const octets = ipString.split('.').map(Number); if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } const firstOctet = octets[0]; let ipClass = 'N/A'; let ipType = 'Pública'; let defaultMask = 'N/A'; if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; } else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; } else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; } else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; } else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'Multicast'; defaultMask = 'N/A'; } else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'Experimental'; defaultMask = 'N/A'; } if (ipType === 'Pública') { if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { ipType = 'Privada'; } else if (firstOctet === 169 && octets[1] === 254) { ipType = 'APIPA'; ipClass = 'B'; defaultMask = 'N/A'; } } return { class: ipClass, type: ipType, defaultMask: defaultMask }; } catch (error) { console.error("Error en getIpInfo:", error, "IP:", ipString); return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } }
export function getIpPortions(ipString, maskString) { try { if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada"); const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number); if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o !== 0 && o !== 255)) { return null; } let networkParts = []; let hostParts = []; let isHostPart = false; for (let i = 0; i < 4; i++) { if (maskOctets[i] === 255 && !isHostPart) { networkParts.push(ipOctets[i].toString()); } else { isHostPart = true; hostParts.push(ipOctets[i].toString()); } } const networkPortion = networkParts.join('.'); const hostPortion = hostParts.join('.'); return { networkPortion, hostPortion }; } catch (error) { console.error("Error en getIpPortions:", error); return null; } }

// --- Generadores de Tablas HTML para Explicaciones ---
export function generateClassRangeTableHTML(highlightClass = null) { const ranges = [ { class: 'A', range: '1 - 126' }, { class: 'B', range: '128 - 191' }, { class: 'C', range: '192 - 223' }, { class: 'D', range: '224 - 239', note: '(Multicast)' }, { class: 'E', range: '240 - 255', note: '(Experimental)' } ]; let tableHTML = '<p>La clase se determina por el <strong>primer octeto</strong>:</p>'; tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Clase</th><th>Rango</th><th>Nota</th></tr></thead>'; tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`; }); tableHTML += '</tbody></table>'; if (highlightClass === 'A') { tableHTML += '<p style="font-size:0.8em; text-align:center; margin-top:5px;">(Nota: El rango 127.x.x.x es para Loopback)</p>'; } return tableHTML; }
export function generateClassMaskTableHTML(highlightClass = null) { const data = [ { class: 'A', range: '1 - 126', mask: '255.0.0.0' }, { class: 'B', range: '128 - 191', mask: '255.255.0.0' }, { class: 'C', range: '192 - 223', mask: '255.255.255.0' } ]; let tableHTML = '<p>La máscara por defecto está determinada por la clase (basada en el 1er octeto):</p>'; tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Clase</th><th>Rango 1er Octeto</th><th>Máscara por Defecto</th></tr></thead>'; tableHTML += '<tbody>'; data.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`; }); tableHTML += '</tbody></table>'; return tableHTML; }
export function generatePrivateRangeTableHTML(highlightIp = null) { const ranges = [ { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' }, { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' }, { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' } ]; let highlightCIDR = null; let ipType = 'N/A'; if (highlightIp) { const info = getIpInfo(highlightIp); ipType = info.type; if (info.type === 'Privada') { const octets = highlightIp.split('.').map(Number); if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; } else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; } else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; } } } let tableHTML = '<p>Los rangos de IP privadas (RFC 1918) son:</p>'; tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Bloque (CIDR)</th><th>Rango de Direcciones</th></tr></thead>'; tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; }); tableHTML += '</tbody></table>'; if (highlightIp) { if (ipType === 'Privada' && highlightCIDR) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Privada</strong> y pertenece al rango resaltado).</p>`; } else if (ipType === 'Pública') { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Pública</strong>).</p>`; } else if (ipType !== 'N/A'){ tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es de tipo <strong>${ipType}</strong>).</p>`; } } return tableHTML; }

/**
 * NUEVA FUNCIÓN: Genera el HTML para la explicación de porciones de Red/Host.
 * @param {string} ipString - La IP original.
 * @param {string} maskString - La máscara de subred default usada.
 * @param {string} ipClass - La clase determinada de la IP.
 * @param {string} networkPortion - La porción de red calculada.
 * @param {string} hostPortion - La porción de host calculada.
 * @returns {string} El string HTML de la explicación.
 */
export function generatePortionExplanationHTML(ipString, maskString, ipClass, networkPortion, hostPortion) {
    try {
        const ipOctets = ipString.split('.');
        const maskOctets = maskString.split('.');
        let networkRepresentation = [];
        let hostRepresentation = [];

        // Construir representaciones con 'X'
        for (let i = 0; i < 4; i++) {
            if (maskOctets[i] === '255') {
                networkRepresentation.push(ipOctets[i]); // Mantener octeto de red
                hostRepresentation.push('X');          // Reemplazar octeto de red con X
            } else {
                networkRepresentation.push('X');          // Reemplazar octeto de host con X
                hostRepresentation.push(ipOctets[i]); // Mantener octeto de host
            }
        }

        const networkRepString = networkRepresentation.join('.');
        const hostRepString = hostRepresentation.join('.');

        // Construir el HTML final
        let html = `<p>La IP <strong>${ipString}</strong> es de <strong>Clase ${ipClass}</strong> (primer octeto entre ${getClassRange(ipClass)}).`;
        html += ` Usando su máscara por defecto (<strong>${maskString}</strong>), las porciones son:</p>`;
        html += '<table class="explanation-table">';
        html += '<thead><tr><th>Porción</th><th>Representación</th></tr></thead>';
        html += '<tbody>';
        // Añadir fila de Red
        html += `<tr><td>Red</td><td><code>${networkRepString}</code></td></tr>`;
        // Añadir fila de Host
        html += `<tr><td>Host</td><td><code>${hostRepString}</code></td></tr>`;
        html += '</tbody></table>';
        // Añadir las porciones extraídas como nota (opcional pero útil)
        html += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(Porción de Red: ${networkPortion || 'Ninguna'} / Porción de Host: ${hostPortion || 'Ninguna'})</p>`;

        return html;

    } catch (error) {
        console.error("Error generando explicación de porciones:", error);
        // Devolver explicación básica en caso de error
        return `La IP ${ipString} es Clase ${ipClass}. Su máscara por defecto es ${maskString}. No se pudo generar la tabla de porciones.`;
    }
}

/**
 * Función auxiliar para obtener el rango del primer octeto de una clase.
 * @param {string} ipClass - La clase ('A', 'B', 'C').
 * @returns {string} El rango como string.
 */
function getClassRange(ipClass) {
    switch (ipClass) {
        case 'A': return '1-126';
        case 'B': return '128-191';
        case 'C': return '192-223';
        default: return 'N/A';
    }
}
