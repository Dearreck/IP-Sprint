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
export function getIpInfo(ipString) { try { if (!ipString || typeof ipString !== 'string') { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } const octets = ipString.split('.').map(Number); if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) { return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } const firstOctet = octets[0]; let ipClass = 'N/A'; let ipType = 'Pública'; let defaultMask = 'N/A'; if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; } else if (firstOctet === 127) { ipClass = 'A'; ipType = 'Loopback'; defaultMask = '255.0.0.0'; } else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; } else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; } else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; ipType = 'Multicast'; defaultMask = 'N/A'; } else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; ipType = 'Experimental'; defaultMask = 'N/A'; } if (ipType === 'Pública') { if (firstOctet === 10 || (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) || (firstOctet === 192 && octets[1] === 168)) { ipType = 'Privada'; } else if (firstOctet === 169 && octets[1] === 254) { ipType = 'APIPA'; ipClass = 'B'; defaultMask = 'N/A'; } } if (ipString === '255.255.255.255') { ipType = 'Broadcast Limitado'; ipClass = 'N/A'; defaultMask = 'N/A'; } return { class: ipClass, type: ipType, defaultMask: defaultMask }; } catch (error) { console.error("Error en getIpInfo:", error, "IP:", ipString); return { class: 'N/A', type: 'N/A', defaultMask: 'N/A' }; } }
export function getIpPortions(ipString, maskString) { try { if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada"); const ipOctets = ipString.split('.').map(Number); const maskOctets = maskString.split('.').map(Number); if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o !== 0 && o !== 255)) { return null; } let networkParts = []; let hostParts = []; let isHostPart = false; for (let i = 0; i < 4; i++) { if (maskOctets[i] === 255 && !isHostPart) { networkParts.push(ipOctets[i].toString()); } else { isHostPart = true; hostParts.push(ipOctets[i].toString()); } } const networkPortion = networkParts.join('.'); const hostPortion = hostParts.join('.'); return { networkPortion, hostPortion }; } catch (error) { console.error("Error en getIpPortions:", error); return null; } }

/**
 * NUEVA FUNCIÓN: Calcula la dirección de red para una IP y máscara dadas.
 * Realiza una operación AND bitwise entre la IP y la máscara.
 * @param {string} ipString - La dirección IP en formato "x.x.x.x".
 * @param {string} maskString - La máscara de subred en formato "x.x.x.x".
 * @returns {string|null} La dirección de red calculada o null si hay error.
 */
export function calculateNetworkAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);

        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) ||
            maskOctets.some(o => o < 0 || o > 255) ) { // Permitir máscaras no estándar aquí si fuera necesario en el futuro
            throw new Error("Formato IP o máscara inválido para cálculo de red.");
        }

        const networkOctets = [];
        for (let i = 0; i < 4; i++) {
            // Operación AND bitwise entre el octeto de la IP y el octeto de la máscara
            networkOctets.push(ipOctets[i] & maskOctets[i]);
        }

        return networkOctets.join('.'); // Devuelve la dirección de red resultante

    } catch (error) {
        console.error("Error calculando dirección de red:", error);
        return null;
    }
}

/**
 * NUEVA FUNCIÓN: Calcula la dirección de broadcast para una IP y máscara dadas.
 * Realiza una operación OR bitwise entre la IP y la máscara invertida (wildcard).
 * @param {string} ipString - La dirección IP en formato "x.x.x.x".
 * @param {string} maskString - La máscara de subred en formato "x.x.x.x".
 * @returns {string|null} La dirección de broadcast calculada o null si hay error.
 */
export function calculateBroadcastAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);

        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) ||
            maskOctets.some(o => o < 0 || o > 255) ) {
            throw new Error("Formato IP o máscara inválido para cálculo de broadcast.");
        }

        const broadcastOctets = [];
        for (let i = 0; i < 4; i++) {
            // 1. Invertir los bits de la máscara (Wildcard): ~maskOctets[i]
            //    Javascript trata los números como 32 bits con signo, por lo que la inversión
            //    directa puede dar negativos. Usamos XOR con 255 para obtener el complemento a 8 bits.
            const wildcardOctet = maskOctets[i] ^ 255;
            // 2. Operación OR bitwise entre el octeto de la IP y el octeto de la wildcard
            broadcastOctets.push(ipOctets[i] | wildcardOctet);
        }

        return broadcastOctets.join('.'); // Devuelve la dirección de broadcast resultante

    } catch (error) {
        console.error("Error calculando dirección de broadcast:", error);
        return null;
    }
}


// --- Generadores de Tablas HTML para Explicaciones ---
export function generateClassRangeTableHTML(highlightClass = null) { const ranges = [ { class: 'A', range: '1 - 126' }, { class: 'B', range: '128 - 191' }, { class: 'C', range: '192 - 223' }, { class: 'D', range: '224 - 239', note: '(Multicast)' }, { class: 'E', range: '240 - 255', note: '(Experimental)' } ]; let tableHTML = '<p>La clase se determina por el <strong>primer octeto</strong>:</p>'; tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Clase</th><th>Rango</th><th>Nota</th></tr></thead>'; tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`; }); tableHTML += '</tbody></table>'; if (highlightClass === 'A') { tableHTML += '<p style="font-size:0.8em; text-align:center; margin-top:5px;">(Nota: El rango 127.x.x.x es para Loopback)</p>'; } return tableHTML; }
export function generateClassMaskTableHTML(highlightClass = null) { const data = [ { class: 'A', range: '1 - 126', mask: '255.0.0.0' }, { class: 'B', range: '128 - 191', mask: '255.255.0.0' }, { class: 'C', range: '192 - 223', mask: '255.255.255.0' } ]; let tableHTML = '<p>La máscara por defecto está determinada por la clase (basada en el 1er octeto):</p>'; tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Clase</th><th>Rango 1er Octeto</th><th>Máscara por Defecto</th></tr></thead>'; tableHTML += '<tbody>'; data.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`; }); tableHTML += '</tbody></table>'; return tableHTML; }
export function generatePrivateRangeTableHTML(highlightIp = null) { const ranges = [ { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' }, { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' }, { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' } ]; const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918'; let highlightCIDR = null; let ipType = 'N/A'; if (highlightIp) { const info = getIpInfo(highlightIp); ipType = info.type; if (info.type === 'Privada') { const octets = highlightIp.split('.').map(Number); if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; } else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; } else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; } } } let tableHTML = `<p>Los rangos de IP privadas (<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>) son:</p>`; tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Bloque (CIDR)</th><th>Rango de Direcciones</th></tr></thead>'; tableHTML += '<tbody>'; ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; }); tableHTML += '</tbody></table>'; if (highlightIp) { if (ipType === 'Privada' && highlightCIDR) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Privada</strong> y pertenece al rango resaltado).</p>`; } else if (ipType === 'Pública') { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Pública</strong>).</p>`; } else if (ipType !== 'N/A'){ tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es de tipo <strong>${ipType}</strong>).</p>`; } } return tableHTML; }
export function generatePortionExplanationHTML(ipString, maskString, ipClass, networkPortion, hostPortion) { try { if (!ipString || !maskString || !ipClass) { throw new Error("Faltan datos para generar explicación de porciones."); } const ipOctets = ipString.split('.'); const maskOctets = maskString.split('.'); if (ipOctets.length !== 4 || maskOctets.length !== 4) { throw new Error("Formato IP o Máscara inválido en explicación."); } let networkRepresentation = []; let hostRepresentation = []; for (let i = 0; i < 4; i++) { if (maskOctets[i] === '255') { networkRepresentation.push(ipOctets[i]); hostRepresentation.push('X'); } else { networkRepresentation.push('X'); hostRepresentation.push(ipOctets[i]); } } const networkRepString = networkRepresentation.join('.'); const hostRepString = hostRepresentation.join('.'); let html = `<p>La IP <strong>${ipString}</strong> es de <strong>Clase ${ipClass}</strong> (primer octeto ${ipOctets[0]} cae en el rango ${getClassRange(ipClass)}).`; html += ` Usando su máscara por defecto (<strong>${maskString}</strong>), las porciones son:</p>`; html += '<table class="explanation-table">'; html += '<thead><tr><th>Porción</th><th>Representación Visual</th></tr></thead>'; html += '<tbody>'; html += `<tr><td>Red</td><td><code>${networkRepString}</code></td></tr>`; html += `<tr><td>Host</td><td><code>${hostRepString}</code></td></tr>`; html += '</tbody></table>'; html += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(Porción de Red: <strong>${networkPortion || 'Ninguna'}</strong> / Porción de Host: <strong>${hostPortion || 'Ninguna'}</strong>)</p>`; return html; } catch (error) { console.error("Error generando explicación de porciones:", error); return `<p>La IP ${ipString} es Clase ${ipClass}. Su máscara por defecto es ${maskString}. No se pudo generar la tabla de porciones.</p>`; } }
export function generateSpecialAddressExplanationHTML(addressType) { let explanation = ''; let rfcLink = ''; let rfcText = ''; switch (addressType) { case 'Loopback': explanation = `La red <strong>127.0.0.0/8</strong> está reservada para <strong>Loopback</strong>. Se utiliza para pruebas de red internas en el propio host (comunicarse consigo mismo). La dirección más común es 127.0.0.1 (localhost).`; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3'; rfcText = 'RFC 1122 (Sec 3.2.1.3)'; break; case 'APIPA': explanation = `El rango <strong>169.254.0.0/16</strong> se usa para <strong>APIPA</strong> (Automatic Private IP Addressing) o Direcciones Link-Local. Un host se autoasigna una IP de este rango si no puede obtener una de un servidor DHCP. Estas IPs no son enrutables.`; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1'; rfcText = 'RFC 3927 (Sec 2.1)'; break; case 'Broadcast Limitado': explanation = `La dirección <strong>255.255.255.255</strong> es la dirección de <strong>Broadcast Limitado</strong>. Los paquetes enviados a esta dirección se entregan a todos los hosts en la misma subred local, pero los routers no los reenvían a otras redes.`; rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7'; rfcText = 'RFC 919 (Sec 7)'; break; default: explanation = 'Esta es una dirección con un propósito especial no detallado aquí.'; break; } if (rfcLink && rfcText) { explanation += ` (Definido en <a href="${rfcLink}" target="_blank" rel="noopener noreferrer">${rfcText}</a>).`; } return `<p>${explanation}</p>`; }
function getClassRange(ipClass) { switch (ipClass) { case 'A': return '1-126'; case 'B': return '128-191'; case 'C': return '192-223'; default: return 'N/A'; } }

