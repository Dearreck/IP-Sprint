// js/utils.js
// ==================================================
// Módulo de Utilidades para IP Sprint
// CORREGIDO: Simplificada explicación de subnetting para enfocarse en ANDing cuando aplica.
// MODIFICADO: generatePortionExplanationHTML para aceptar parámetro highlightRowKey y mostrar rango utilizable.
// ==================================================

import { getTranslation } from './i18n.js';

// --- Utilidades Generales ---

/**
 * Genera un entero aleatorio entre min y max (ambos inclusive).
 * @param {number} min - El valor mínimo.
 * @param {number} max - El valor máximo.
 * @returns {number} Un entero aleatorio.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Baraja (desordena) los elementos de un array in-place usando el algoritmo Fisher-Yates.
 * @param {Array} array - El array a barajar.
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Intercambio de elementos
    }
}

/**
 * Convierte un número decimal (0-255) a su representación binaria de 8 bits, rellenando con ceros a la izquierda.
 * Devuelve '........' si el número es inválido.
 * @param {number} decimal - El número decimal a convertir.
 * @returns {string} La representación binaria de 8 bits o '........'.
 */
function decimalToBinaryPadded(decimal) {
    if (isNaN(decimal) || decimal < 0 || decimal > 255) {
        return '........'; // Indicador de valor inválido
    }
    return decimal.toString(2).padStart(8, '0');
}

/**
 * Formatea un número usando la configuración regional del navegador para separadores de miles.
 * @param {number} num - El número a formatear.
 * @returns {string} El número formateado como string.
 */
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

/**
 * Genera una dirección IP aleatoria válida (Clase A, B o C, excluyendo loopback y APIPA inicial).
 * @returns {string} Una dirección IP aleatoria como string.
 */
export function generateRandomIp() {
    let oct1;
    // Genera el primer octeto asegurándose de que no sea 127 (Loopback) ni 169 (inicio APIPA)
    // y esté en el rango de clases A, B o C utilizables (1-223).
    do {
        oct1 = getRandomInt(1, 223);
    } while (oct1 === 127 || oct1 === 169);

    let oct2 = getRandomInt(0, 255);
    // Si el primer octeto es 169, asegúrate de que el segundo no sea 254 (APIPA)
    if (oct1 === 169 && oct2 === 254) {
        oct2 = getRandomInt(0, 253); // Genera otro valor para el segundo octeto
    }
    const oct3 = getRandomInt(0, 255);
    // El último octeto no debe ser 0 ni 255 para ser una IP de host válida
    const oct4 = getRandomInt(1, 254);

    return `${oct1}.${oct2}.${oct3}.${oct4}`;
}

/**
 * Genera una dirección IP privada aleatoria (RFC 1918).
 * @returns {string} Una IP privada aleatoria (10.x.x.x, 172.16-31.x.x, 192.168.x.x).
 */
export function generateRandomPrivateIp() {
    const type = getRandomInt(1, 3); // Elige uno de los 3 rangos privados
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
 * Obtiene información básica sobre una dirección IP (Clase, Tipo, Máscara por defecto).
 * @param {string} ipString - La dirección IP a analizar.
 * @returns {object} Un objeto con { class, type, typeKey, defaultMask }.
 */
export function getIpInfo(ipString) {
    const defaultResult = { class: 'N/A', type: 'N/A', typeKey: 'unknown', defaultMask: 'N/A' };
    try {
        if (!ipString || typeof ipString !== 'string') {
            return defaultResult;
        }
        const octets = ipString.split('.').map(Number);
        // Validar formato básico de IP
        if (octets.length !== 4 || octets.some(isNaN) || octets.some(o => o < 0 || o > 255)) {
            return defaultResult;
        }

        const firstOctet = octets[0];
        let ipClass = 'N/A';
        let ipTypeKey = 'unknown'; // Clave interna para el tipo
        let defaultMask = 'N/A';

        // Determinar Clase y Máscara por defecto basada en el primer octeto
        if (firstOctet >= 1 && firstOctet <= 126) { ipClass = 'A'; defaultMask = '255.0.0.0'; }
        else if (firstOctet === 127) { ipClass = 'A'; defaultMask = '255.0.0.0'; ipTypeKey = 'loopback'; } // Loopback
        else if (firstOctet >= 128 && firstOctet <= 191) { ipClass = 'B'; defaultMask = '255.255.0.0'; }
        else if (firstOctet >= 192 && firstOctet <= 223) { ipClass = 'C'; defaultMask = '255.255.255.0'; }
        else if (firstOctet >= 224 && firstOctet <= 239) { ipClass = 'D'; defaultMask = 'N/A'; ipTypeKey = 'multicast'; } // Multicast
        else if (firstOctet >= 240 && firstOctet <= 255) { ipClass = 'E'; defaultMask = 'N/A'; ipTypeKey = 'experimental'; } // Experimental

        // Determinar Tipo (Pública/Privada/APIPA) si no es un tipo especial ya identificado
        if (ipTypeKey === 'unknown') {
            if (firstOctet === 10 ||
               (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
               (firstOctet === 192 && octets[1] === 168))
            {
                ipTypeKey = 'private'; // RFC 1918
            } else if (firstOctet === 169 && octets[1] === 254) {
                ipTypeKey = 'apipa'; // APIPA/Link-Local
                ipClass = 'B'; // Aunque APIPA usa /16, técnicamente cae en el rango B
                defaultMask = 'N/A'; // No tiene máscara "por defecto" relevante en este contexto
            } else {
                ipTypeKey = 'public'; // Si no es privada ni APIPA, es pública (dentro de A, B, C)
            }
        }

        // Caso especial: Broadcast Limitado
        if (ipString === '255.255.255.255') {
            ipTypeKey = 'limited_broadcast';
            ipClass = 'N/A';
            defaultMask = 'N/A';
        }

        // Traducir la clave del tipo al texto visible usando i18n
        const ipTypeTranslated = getTranslation(`option_${ipTypeKey}`) || ipTypeKey;

        return { class: ipClass, type: ipTypeTranslated, typeKey: ipTypeKey, defaultMask: defaultMask };

    } catch (error) {
        console.error("Error en getIpInfo:", error, "IP:", ipString);
        return defaultResult; // Devolver valores por defecto en caso de error
    }
}

/**
 * Separa una IP en sus porciones de Red y Host basándose en una máscara simple (solo octetos 255 o 0).
 * @param {string} ipString - La dirección IP.
 * @param {string} maskString - La máscara de subred (ej. '255.255.0.0').
 * @returns {object|null} Objeto { networkPortion, hostPortion } o null si la máscara es inválida.
 */
export function getIpPortions(ipString, maskString) {
    try {
        if (!ipString || !maskString) throw new Error("IP o Máscara no proporcionada");
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);

        // Validar que la máscara solo contenga 255 o 0 (simplificación para preguntas de nivel básico/medio)
        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) ||
            maskOctets.some(o => o !== 0 && o !== 255)) // <-- Validación clave para esta función
        {
             console.warn("getIpPortions sólo funciona con máscaras de octetos completos (0 o 255). Mask:", maskString);
             return null;
        }

        let networkParts = [];
        let hostParts = [];
        let isHostPart = false; // Flag para saber cuándo empezamos la porción de host

        for (let i = 0; i < 4; i++) {
            if (maskOctets[i] === 255 && !isHostPart) {
                // Si el octeto de la máscara es 255 y aún no hemos llegado a la parte de host
                networkParts.push(ipOctets[i].toString());
            } else {
                // Si el octeto es 0, o si ya hemos encontrado un 0 antes, es parte del host
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
 * Genera una máscara de subred aleatoria válida (prefijo entre /8 y /30).
 * @returns {string} Una máscara de subred válida como string.
 */
export function generateRandomSubnetMask() {
    const prefix = getRandomInt(8, 30); // Prefijos comunes para subnetting, evita /31, /32
    let mask = '';
    let remainingBits = prefix;
    for (let i = 0; i < 4; i++) {
        let octetValue = 0;
        if (remainingBits >= 8) {
            octetValue = 255; // Octeto completo de 1s
            remainingBits -= 8;
        } else if (remainingBits > 0) {
            // Calcular valor del octeto con bits parciales (ej. 11110000 = 240)
            octetValue = 256 - Math.pow(2, 8 - remainingBits);
            remainingBits = 0;
        } else {
            octetValue = 0; // Octeto completo de 0s
        }
        mask += octetValue + (i < 3 ? '.' : ''); // Añadir '.' excepto al final
    }
    return mask;
}

/**
 * Calcula la dirección de red aplicando la operación AND bit a bit entre la IP y la máscara.
 * @param {string} ipString - La dirección IP.
 * @param {string} maskString - La máscara de subred.
 * @returns {string|null} La dirección de red o null si hay error.
 */
export function calculateNetworkAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);
        // Validación básica
        if (ipOctets.length !== 4 || maskOctets.length !== 4 ||
            ipOctets.some(isNaN) || maskOctets.some(isNaN) ||
            ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o < 0 || o > 255) )
        {
            throw new Error("Formato IP o máscara inválido");
        }
        // Operación AND bit a bit para cada octeto
        const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]);
        return networkOctets.join('.');
    } catch (error) {
        console.error("Error calculando dirección de red:", error);
        return null;
    }
}

/**
 * Calcula la máscara wildcard invirtiendo los bits de la máscara de subred (255 - octeto).
 * @param {string} maskString - La máscara de subred.
 * @returns {string|null} La máscara wildcard o null si hay error.
 */
export function calculateWildcardMask(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        // Validación básica
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
 * Calcula la dirección de broadcast aplicando la operación OR bit a bit entre la Dir. Red y la Wildcard.
 * @param {string} networkAddrString - La dirección de red.
 * @param {string} wildcardString - La máscara wildcard.
 * @returns {string|null} La dirección de broadcast o null si hay error.
 */
export function calculateBroadcastAddress(networkAddrString, wildcardString) {
    try {
        const networkOctets = networkAddrString.split('.').map(Number);
        const wildcardOctets = wildcardString.split('.').map(Number);
        // Validación básica
        if (networkOctets.length !== 4 || wildcardOctets.length !== 4 ||
            networkOctets.some(isNaN) || wildcardOctets.some(isNaN) ||
            networkOctets.some(o => o < 0 || o > 255) || wildcardOctets.some(o => o < 0 || o > 255) )
        {
            throw new Error("Formato Dir. Red o Wildcard inválido");
        }
        // Operación OR bit a bit para cada octeto
        const broadcastOctets = networkOctets.map((octet, i) => octet | wildcardOctets[i]);
        return broadcastOctets.join('.');
    } catch (error) {
        console.error("Error calculando dirección de broadcast:", error);
        return null;
    }
}

/**
 * Calcula la longitud del prefijo (notación CIDR /x) a partir de una máscara de subred.
 * Valida que la máscara sea contigua (todos los 1s juntos a la izquierda).
 * @param {string} maskString - La máscara de subred.
 * @returns {number|null} La longitud del prefijo o null si la máscara es inválida.
 */
export function getMaskPrefixLength(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        // Validación básica
        if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) {
            throw new Error("Formato de máscara inválido");
        }

        let prefixLength = 0;
        let validMask = true;
        let encounteredZero = false; // Flag para detectar si encontramos un 0 antes de terminar los 1s

        // Recorrer los bits de la máscara
        for (const octet of maskOctets) {
            const binaryOctet = octet.toString(2).padStart(8, '0');
            for (const bit of binaryOctet) {
                if (bit === '1') {
                    // Si encontramos un 1 después de haber encontrado un 0, la máscara no es contigua
                    if (encounteredZero) {
                        validMask = false;
                        break;
                    }
                    prefixLength++;
                } else {
                    encounteredZero = true; // Marcamos que ya encontramos un 0
                }
            }
            if (!validMask) break; // Salir si ya sabemos que es inválida
        }

        // Doble verificación: reconstruir la máscara desde el prefijo calculado y comparar
        if (validMask) {
            let checkMask = '';
            let bits = prefixLength;
            for(let i=0; i<4; i++){
                let oct = 0;
                if(bits>=8){oct=255; bits-=8;}
                else if(bits>0){oct=256-Math.pow(2, 8-bits); bits=0;}
                else {oct=0;}
                checkMask += oct + (i<3?'.':'');
            }
            if(checkMask !== maskString) validMask = false; // La máscara original no correspondía al prefijo contado
        }

        return validMask ? prefixLength : null; // Devolver prefijo solo si la máscara es válida
    } catch (error) {
        console.error("Error calculando longitud de prefijo:", error);
        return null;
    }
}

/**
 * Calcula el número de hosts utilizables en una subred (2^h - 2).
 * @param {string} maskString - La máscara de subred.
 * @returns {number|null} El número de hosts utilizables o null si la máscara es inválida.
 */
export function calculateUsableHosts(maskString) {
    const prefixLength = getMaskPrefixLength(maskString);
    if (prefixLength === null) return null; // Máscara inválida

    const hostBits = 32 - prefixLength;
    // Se necesitan al menos 2 bits de host para tener direcciones utilizables (/31 y /32 no tienen)
    if (hostBits < 2) return 0;

    // Usar BigInt para evitar problemas con potencias grandes (aunque improbable con /30 max)
    return Number(BigInt(2) ** BigInt(hostBits) - BigInt(2));
}

/**
 * Calcula el número de subredes creadas a partir de una máscara de clase original.
 * @param {string} originalClassMask - La máscara por defecto de la clase (ej. '255.0.0.0').
 * @param {string} subnetMask - La máscara de subred utilizada.
 * @returns {number|null} El número de subredes (2^s) o null si hay error o no hay subnetting.
 */
export function calculateNumberOfSubnets(originalClassMask, subnetMask) {
    const originalPrefix = getMaskPrefixLength(originalClassMask);
    const subnetPrefix = getMaskPrefixLength(subnetMask);

    // Validar prefijos y que se esté haciendo subnetting (prefijo nuevo > original)
    if (originalPrefix === null || subnetPrefix === null || subnetPrefix < originalPrefix) {
        return null;
    }

    const subnetBits = subnetPrefix - originalPrefix; // Bits prestados para subredes
    if (subnetBits === 0) return 1; // Si no se prestaron bits, técnicamente hay 1 subred (la original)

    // Calcular 2 elevado a la potencia de los bits de subred
    return Number(BigInt(2) ** BigInt(subnetBits));
}

/**
 * Calcula la primera dirección IP utilizable en una subred (Dirección de Red + 1).
 * @param {string} networkAddrString - La dirección de red.
 * @param {string} maskString - La máscara de subred (usada para validar prefijo /31, /32).
 * @returns {string|null} La primera IP utilizable o null si no hay hosts utilizables.
 */
export function getFirstUsableHost(networkAddrString, maskString) {
    const prefixLength = getMaskPrefixLength(maskString);
    // /31 y /32 no tienen hosts utilizables
    if (prefixLength === null || prefixLength >= 31) {
        return null;
    }
    try {
        const networkOctets = networkAddrString.split('.').map(Number);
        if (networkOctets.length !== 4 || networkOctets.some(isNaN)) return null;

        // Sumar 1 al último octeto (manejo de acarreo si es necesario)
        networkOctets[3] += 1;
        for (let i = 3; i > 0; i--) {
            if (networkOctets[i] > 255) { // Si el octeto supera 255...
                networkOctets[i] = 0;      // ...se resetea a 0...
                networkOctets[i - 1] += 1; // ...y se suma 1 al anterior (acarreo).
            }
        }
        // Verificar que ningún octeto sea inválido después del acarreo (poco probable aquí)
        if (networkOctets.some(o => o < 0 || o > 255)) return null;

        return networkOctets.join('.');
    } catch (e) {
        console.error("Error in getFirstUsableHost:", e);
        return null;
    }
}

/**
 * Calcula la última dirección IP utilizable en una subred (Dirección de Broadcast - 1).
 * @param {string} broadcastAddrString - La dirección de broadcast.
 * @param {string} maskString - La máscara de subred (usada para validar prefijo /31, /32).
 * @returns {string|null} La última IP utilizable o null si no hay hosts utilizables.
 */
export function getLastUsableHost(broadcastAddrString, maskString) {
    const prefixLength = getMaskPrefixLength(maskString);
    // /31 y /32 no tienen hosts utilizables
    if (prefixLength === null || prefixLength >= 31) {
        return null;
    }
    try {
        const broadcastOctets = broadcastAddrString.split('.').map(Number);
        if (broadcastOctets.length !== 4 || broadcastOctets.some(isNaN)) return null;

        // Restar 1 al último octeto (manejo de "préstamo" si es necesario)
        broadcastOctets[3] -= 1;
        for (let i = 3; i > 0; i--) {
            if (broadcastOctets[i] < 0) { // Si el octeto es negativo...
                broadcastOctets[i] = 255;   // ...se pone a 255...
                broadcastOctets[i - 1] -= 1; // ...y se resta 1 al anterior ("préstamo").
            }
        }
        // Verificar que ningún octeto sea inválido después del préstamo
        if (broadcastOctets.some(o => o < 0 || o > 255)) return null;

        return broadcastOctets.join('.');
    } catch (e) {
        console.error("Error in getLastUsableHost:", e);
        return null;
    }
}

/**
 * Convierte una longitud de prefijo CIDR (/x) a su máscara de subred decimal punteada.
 * @param {number} prefixLength - La longitud del prefijo (0-32).
 * @returns {string|null} La máscara de subred o null si el prefijo es inválido.
 */
export function prefixToMaskString(prefixLength) {
    if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
        return null; // Prefijo inválido
    }
    let mask = '';
    let bits = prefixLength;
    for(let i = 0; i < 4; i++){
        let octetValue = 0;
        if(bits >= 8){ // Octeto completo de 1s
            octetValue = 255;
            bits -= 8;
        } else if(bits > 0){ // Octeto parcial
            octetValue = 256 - Math.pow(2, 8 - bits);
            bits = 0;
        } else { // Octeto completo de 0s
            octetValue = 0;
        }
        mask += octetValue + (i < 3 ? '.' : ''); // Añadir '.' excepto al final
    }
    return mask;
}


// --- Generadores de Tablas HTML para Explicaciones (Usan i18n) ---

/**
 * Genera una tabla HTML explicando los rangos de clases de IP y máscaras por defecto.
 * @param {string|null} [highlightClass=null] - La clase ('A', 'B', 'C', etc.) a resaltar en la tabla.
 * @returns {string} El HTML de la tabla.
 */
export function generateClassRangeTableHTML(highlightClass = null) {
    // Datos de las clases
    const classData = [
        { class: 'A', range: '1 - 126', mask: '255.0.0.0', noteKey: 'explanation_class_range_note_a' },
        { class: 'B', range: '128 - 191', mask: '255.255.0.0', noteKey: '' },
        { class: 'C', range: '192 - 223', mask: '255.255.255.0', noteKey: '' },
        { class: 'D', range: '224 - 239', mask: 'N/A', noteKey: 'class_note_multicast' },
        { class: 'E', range: '240 - 255', mask: 'N/A', noteKey: 'class_note_experimental' }
    ];
    // Construir HTML
    let tableHTML = `<p>${getTranslation('explanation_class_mask_intro')}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_class')}</th><th>${getTranslation('table_header_first_octet_range')}</th><th>${getTranslation('table_header_default_mask')}</th><th>${getTranslation('table_header_note')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    classData.forEach(item => {
        const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; // Añadir clase si coincide
        const noteText = item.noteKey ? getTranslation(item.noteKey) : ''; // Traducir nota
        tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td><code>${item.mask}</code></td><td>${noteText}</td></tr>`;
    });
    tableHTML += '</tbody></table>';
    return tableHTML;
}

/**
 * Genera una tabla HTML explicando los rangos de IP privadas (RFC 1918).
 * @param {string|null} [highlightIp=null] - Una IP para determinar qué rango (si aplica) resaltar.
 * @returns {string} El HTML de la tabla y una nota contextual.
 */
export function generatePrivateRangeTableHTML(highlightIp = null) {
    // Datos de los rangos privados
    const ranges = [
        { cidr: '10.0.0.0/8', range: '10.0.0.0 - 10.255.255.255' },
        { cidr: '172.16.0.0/12', range: '172.16.0.0 - 172.31.255.255' },
        { cidr: '192.168.0.0/16', range: '192.168.0.0 - 192.168.255.255' }
    ];
    const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
    let highlightCIDR = null;
    let ipTypeKey = 'unknown';
    let ipTypeTranslated = '';

    // Determinar si la IP dada pertenece a un rango privado para resaltarlo
    if (highlightIp) {
        const info = getIpInfo(highlightIp);
        ipTypeKey = info.typeKey;
        ipTypeTranslated = info.type;
        if (ipTypeKey === 'private') {
            const octets = highlightIp.split('.').map(Number);
            if(octets[0] === 10) { highlightCIDR = '10.0.0.0/8'; }
            else if(octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) { highlightCIDR = '172.16.0.0/12'; }
            else if(octets[0] === 192 && octets[1] === 168) { highlightCIDR = '192.168.0.0/16'; }
        }
    }

    // Construir HTML de la tabla
    let tableHTML = `<p>${getTranslation('explanation_private_range_intro', { rfcLink: rfcLink })}</p>`;
    tableHTML += '<table class="explanation-table">';
    tableHTML += `<thead><tr><th>${getTranslation('table_header_block_cidr')}</th><th>${getTranslation('table_header_address_range')}</th></tr></thead>`;
    tableHTML += '<tbody>';
    ranges.forEach(item => {
        const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; // Añadir clase si coincide
        tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`;
    });
    tableHTML += '</tbody></table>';

    // Añadir nota contextual sobre la IP proporcionada
    if (highlightIp) {
        let noteKey = '';
        if (ipTypeKey === 'private' && highlightCIDR) { noteKey = 'explanation_private_range_note_private'; }
        else if (ipTypeKey === 'public') { noteKey = 'explanation_private_range_note_public'; }
        else if (ipTypeKey !== 'unknown') { noteKey = 'explanation_private_range_note_other'; } // Para APIPA, Loopback, etc.

        if (noteKey) {
            tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation(noteKey, { ip: highlightIp, ipType: ipTypeTranslated })}</p>`;
        }
    }
    return tableHTML;
}

/**
 * Genera tabla HTML de cálculo IP/Mask/Wildcard/Red/Broadcast/Usable Range.
 * @param {string} ipString - IP original.
 * @param {string} maskString - Máscara de subred.
 * @param {string} wildcardString - Máscara wildcard.
 * @param {string} networkAddr - Dirección de red/subred calculada.
 * @param {string} broadcastAddr - Dirección de broadcast calculada.
 * @param {string|null} [firstUsable=null] - Primera IP utilizable.
 * @param {string|null} [lastUsable=null] - Última IP utilizable.
 * @param {string|null} [highlightRowKey=null] - Clave de la fila a resaltar ('ip', 'mask', 'wildcard', 'netaddr', 'broadaddr', 'usable').
 * @returns {string} El string HTML de la tabla de explicación.
 */
export function generatePortionExplanationHTML(ipString, maskString, wildcardString, networkAddr, broadcastAddr, firstUsable = null, lastUsable = null, highlightRowKey = null) {
    try {
        if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) {
            throw new Error("Faltan datos para generar explicación de cálculo.");
        }
        let html = '<table class="explanation-table" style="margin-top: 15px;">'; // Añadir margen superior
        html += `<thead><tr><th>${getTranslation('table_header_concept')}</th><th>${getTranslation('table_header_value')}</th><th>${getTranslation('table_header_calculation_note')}</th></tr></thead>`;
        html += '<tbody>';
        // Añadir clase 'highlight-row' a la fila correspondiente si highlightRowKey coincide
        html += `<tr${highlightRowKey === 'ip' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_ip')}</td><td><code>${ipString}</code></td><td>-</td></tr>`;
        html += `<tr${highlightRowKey === 'mask' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_mask')}</td><td><code>${maskString}</code></td><td>${getTranslation('explanation_portion_table_calc_mask')}</td></tr>`;
        html += `<tr${highlightRowKey === 'wildcard' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_wildcard')}</td><td><code>${wildcardString}</code></td><td>${getTranslation('explanation_portion_table_calc_wildcard')}</td></tr>`;
        html += `<tr${highlightRowKey === 'netaddr' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_netaddr')}</td><td><code>${networkAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_netaddr')}</td></tr>`;

        // --- NUEVA FILA: Rango Utilizable ---
        if (firstUsable && lastUsable) {
            const usableRangeText = `${firstUsable} - ${lastUsable}`;
            // Resaltar si highlightRowKey es 'usable'
            html += `<tr${highlightRowKey === 'usable' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_usable_range')}</td><td><code>${usableRangeText}</code></td><td>${getTranslation('explanation_portion_table_calc_usable_range')}</td></tr>`;
        }
        // --- FIN NUEVA FILA ---

        html += `<tr${highlightRowKey === 'broadaddr' ? ' class="highlight-row"' : ''}><td>${getTranslation('explanation_portion_table_broadaddr')}</td><td><code>${broadcastAddr}</code></td><td>${getTranslation('explanation_portion_table_calc_broadaddr')}</td></tr>`;
        html += '</tbody></table>';
        return html;
    } catch (error) {
        console.error("Error generando explicación de cálculo:", error);
        // Devolver mensaje de error traducido
        return `<p>${getTranslation('explanation_portion_calc_error', { ip: ipString, mask: maskString })}</p>`;
    }
}


/**
 * Genera un párrafo HTML explicando el propósito de direcciones IP especiales (Loopback, APIPA, Broadcast Limitado).
 * @param {string} addressTypeKey - La clave del tipo de dirección ('loopback', 'apipa', 'limited_broadcast').
 * @returns {string} El HTML del párrafo explicativo.
 */
export function generateSpecialAddressExplanationHTML(addressTypeKey) {
    let explanationKey = '';
    let rfcLink = '';
    let rfcText = '';
    // Seleccionar texto y enlace RFC según el tipo
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
            explanationKey = 'explanation_special_default'; // Fallback genérico
            break;
    }
    // Obtener texto base traducido
    let explanation = getTranslation(explanationKey);
    // Añadir enlace al RFC si existe
    if (rfcLink && rfcText) {
        explanation += ` ${getTranslation('explanation_special_defined_in', { rfcLink: rfcLink, rfcText: rfcText })}`;
    }
    return `<p>${explanation}</p>`; // Devolver como párrafo HTML
}

/**
 * Genera una tabla HTML mostrando el cálculo de la máscara wildcard (255 - máscara).
 * @param {string} subnetMask - La máscara de subred.
 * @param {string} wildcardMask - La máscara wildcard calculada.
 * @returns {string} El HTML de la tabla de cálculo.
 */
export function generateWildcardExplanationHTML(subnetMask, wildcardMask) {
    try {
        const maskOctets = subnetMask.split('.').map(Number);
        const wildcardOctets = wildcardMask.split('.').map(Number);
        // Validación básica
        if (maskOctets.length !== 4 || wildcardOctets.length !== 4 || maskOctets.some(isNaN) || wildcardOctets.some(isNaN)) {
            throw new Error("Formato inválido de máscara o wildcard al generar explicación");
        }
        // Construir HTML
        let html = `<p>${getTranslation('explanation_wildcard_intro')}</p>`;
        // Estilos inline para formato compacto tipo calculadora
        const cellStyle = "padding: 2px 5px; text-align: right; font-family: monospace;";
        const labelCellStyle = "padding: 2px 5px; text-align: left; font-family: monospace;";
        const separatorCellStyle = "padding: 0 2px; text-align: center; font-family: monospace;";
        const hrCellStyle = "border-bottom: 1px solid #ccc; height: 1px; padding: 0; margin: 2px 0;";

        html += `<table style="width: auto; margin: 10px auto; border-collapse: collapse;"><tbody>`;
        // Fila 1: 255.255.255.255
        html += `<tr><td style="${cellStyle}"></td><td style="${cellStyle}">255</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">255</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">255</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">255</td><td style="${labelCellStyle}"></td></tr>`;
        // Fila 2: Restar Máscara de Subred
        html += `<tr><td style="${cellStyle}">-</td><td style="${cellStyle}">${maskOctets[0]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${maskOctets[1]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${maskOctets[2]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${maskOctets[3]}</td><td style="${labelCellStyle}">(${getTranslation('explanation_portion_table_mask')})</td></tr>`;
        // Fila 3: Línea separadora
        html += `<tr><td colspan="9" style="${hrCellStyle}"></td></tr>`;
        // Fila 4: Resultado Wildcard
        html += `<tr><td style="${cellStyle}">=</td><td style="${cellStyle}">${wildcardOctets[0]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${wildcardOctets[1]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${wildcardOctets[2]}</td><td style="${separatorCellStyle}">.</td><td style="${cellStyle}">${wildcardOctets[3]}</td><td style="${labelCellStyle}">(${getTranslation('explanation_portion_table_wildcard')})</td></tr>`;
        html += `</tbody></table>`;
        return html;
    } catch (error) {
        console.error("Error generando explicación de wildcard:", error);
        return `<p>${getTranslation('explanation_portion_calc_error', { ip: subnetMask, mask: 'N/A' })}</p>`;
    }
}

/**
 * Genera explicación HTML para cálculos de Subnetting (Red, Broadcast, ANDing, Hosts, Subredes).
 * @param {string} ip - IP original.
 * @param {string} mask - Máscara de subred usada.
 * @param {string} networkAddr - Dirección de subred calculada.
 * @param {string} broadcastAddr - Dirección de broadcast calculada.
 * @param {number} usableHosts - Número de hosts utilizables calculado.
 * @param {number} numSubnets - Número de subredes calculado.
 * @param {string} originalClassMask - Máscara de clase original.
 * @returns {string} El string HTML de la explicación combinada.
 */
export function generateSubnettingExplanationHTML(ip, mask, networkAddr, broadcastAddr, usableHosts, numSubnets, originalClassMask) {
    try {
        const prefixLength = getMaskPrefixLength(mask);
        const hostBits = 32 - prefixLength;
        const originalPrefix = getMaskPrefixLength(originalClassMask);
        const subnetBits = prefixLength - originalPrefix;
        const ipInfo = getIpInfo(ip);
        const wildcardMask = calculateWildcardMask(mask);

        // Validar datos de entrada
        if (prefixLength === null || originalPrefix === null || ipInfo.class === 'N/A' || wildcardMask === null ||
            networkAddr === null || broadcastAddr === null || usableHosts === null || numSubnets === null) {
            throw new Error("Datos inválidos para explicación de subnetting");
        }

        let html = ''; // Empezar vacío

        // --- 1. Reutilizar tabla de porciones para Red/Broadcast ---
        // Calcular rango utilizable para incluirlo
        const firstUsable = getFirstUsableHost(networkAddr, mask);
        const lastUsable = getLastUsableHost(broadcastAddr, mask);
        html += generatePortionExplanationHTML(ip, mask, wildcardMask, networkAddr, broadcastAddr, firstUsable, lastUsable, null); // No resaltar nada aquí inicialmente

        // --- 2. Explicación ANDing binario ---
        const ipOctets = ip.split('.').map(Number);
        const maskOctets = mask.split('.').map(Number);
        const networkOctets = networkAddr.split('.').map(Number);
        let andingHtml = `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`;
        andingHtml += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_anding_process')}</strong></p>`;
        // Estilos para la tabla binaria
        const cellStyle = "padding: 1px 4px; text-align: center; font-family: monospace; font-size: 0.9em;";
        const labelCellStyle = "padding: 1px 4px; text-align: left; font-family: monospace; white-space: nowrap; font-size: 0.9em;";
        const separatorCellStyle = "padding: 0 1px; text-align: center; font-family: monospace; font-size: 0.9em;";
        const hrCellStyle = "border-bottom: 1px solid #ccc; height: 1px; padding: 0; margin: 1px 0;";
        andingHtml += `<table style="width: auto; margin: 5px auto; border-collapse: collapse;"><tbody>`;
        // Fila IP Binario
        andingHtml += `<tr><td style="${labelCellStyle}">${getTranslation('explanation_ip_binary')}</td>`;
        for (let i = 0; i < 4; i++) { andingHtml += `<td style="${cellStyle}">${decimalToBinaryPadded(ipOctets[i])}</td>`; if (i < 3) andingHtml += `<td style="${separatorCellStyle}">.</td>`; }
        andingHtml += `</tr>`;
        // Fila Máscara Binario
        andingHtml += `<tr><td style="${labelCellStyle}">${getTranslation('explanation_mask_binary')}</td>`;
        for (let i = 0; i < 4; i++) { andingHtml += `<td style="${cellStyle}">${decimalToBinaryPadded(maskOctets[i])}</td>`; if (i < 3) andingHtml += `<td style="${separatorCellStyle}">.</td>`; }
        andingHtml += `</tr>`;
        // Línea AND
        andingHtml += `<tr><td style="${labelCellStyle}"><strong>AND</strong></td><td colspan="${4 * 2 - 1}" style="${hrCellStyle}"></td></tr>`;
        // Fila Resultado Binario (Dir. Red)
        andingHtml += `<tr><td style="${labelCellStyle}">${getTranslation('explanation_and_result')}</td>`;
        for (let i = 0; i < 4; i++) { andingHtml += `<td style="${cellStyle}">${decimalToBinaryPadded(networkOctets[i])}</td>`; if (i < 3) andingHtml += `<td style="${separatorCellStyle}">.</td>`; }
        andingHtml += `</tr>`;
        andingHtml += `</tbody></table>`;
        // Añadir resultado decimal (Dir. Red)
        andingHtml += `<p style="text-align:center; font-size:0.9em; margin-top:5px;">${getTranslation('explanation_network_address_decimal')} <code>${networkAddr}</code></p>`;
        andingHtml += `</div>`;

        // --- 3. Explicación paso a paso para Número de Subredes (si aplica) ---
        let subnetCalcHtml = '';
        if (subnetBits > 0) {
            subnetCalcHtml += `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`;
            subnetCalcHtml += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_subnetting_num_subnets')}</strong></p>`;
            subnetCalcHtml += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
            subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step1', { class: ipInfo.class })} <code>${originalClassMask}</code> (/${originalPrefix})</li>`;
            subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step2')} <code>${mask}</code> (/${prefixLength})</li>`;
            subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step3')} ${prefixLength} - ${originalPrefix} = <strong>${subnetBits}</strong></li>`;
            subnetCalcHtml += `<li>${getTranslation('explanation_subnet_calc_step4')} <code>${getTranslation('explanation_subnet_calc_formula', { subnetBits: subnetBits, numSubnets: formatNumber(numSubnets) })}</code></li>`;
            subnetCalcHtml += `</ol></div>`;
        } else {
            // Mensaje si no hubo subnetting
            subnetCalcHtml += `<p style="font-size: 0.9em; margin-top: 15px;"><em>(${getTranslation('no_subnetting_performed')})</em></p>`;
        }

        // --- 4. Explicación paso a paso para Hosts Utilizables ---
        let hostCalcHtml = '';
        hostCalcHtml += `<div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd;">`;
        hostCalcHtml += `<p style="margin-top:0; margin-bottom: 5px;"><strong>${getTranslation('explanation_subnetting_usable_hosts')}</strong></p>`;
        hostCalcHtml += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        hostCalcHtml += `<li>${getTranslation('explanation_host_calc_step1')} <code>${mask}</code> (/${prefixLength})</li>`;
        hostCalcHtml += `<li>${getTranslation('explanation_host_calc_step2')} 32 - ${prefixLength} = <strong>${hostBits}</strong></li>`;
        hostCalcHtml += `<li>${getTranslation('explanation_host_calc_step3')} <code>${getTranslation('explanation_host_calc_formula', { hostBits: hostBits, usableHosts: formatNumber(usableHosts) })}</code></li>`;
        hostCalcHtml += `</ol></div>`;

        // Combinar todas las partes de la explicación
        html += andingHtml + subnetCalcHtml + hostCalcHtml;

        return html;
    } catch (error) {
        console.error("Error generando explicación de subnetting:", error);
        return `<p>${getTranslation('explanation_portion_calc_error', { ip: ip, mask: mask })}</p>`;
    }
}

/**
 * Genera un párrafo HTML explicando por qué una IP específica es de Red, Broadcast, Utilizable o Externa a una subred dada.
 * @param {string} targetIp - La IP cuyo tipo se está explicando.
 * @param {string} ipType - El tipo determinado ('network', 'broadcast', 'usable', 'outside').
 * @param {string} networkAddr - La dirección de red de la subred de referencia.
 * @param {string} broadcastAddr - La dirección de broadcast de la subred de referencia.
 * @param {number} prefixLength - El prefijo de la subred de referencia.
 * @returns {string} El HTML del párrafo explicativo.
 */
export function generateIpTypeExplanationHTML(targetIp, ipType, networkAddr, broadcastAddr, prefixLength) {
    let explanationKey = '';
    // Crear objeto con reemplazos para las traducciones
    const replacements = {
        targetIp: `<strong>${targetIp}</strong>`,
        networkAddr: `<code>${networkAddr}</code>`,
        broadcastAddr: `<code>${broadcastAddr}</code>`,
        prefixLength: prefixLength
    };
    // Seleccionar la clave de traducción correcta según el tipo
    switch (ipType) {
        case 'network': explanationKey = 'explanation_ip_type_net'; break;
        case 'broadcast': explanationKey = 'explanation_ip_type_broad'; break;
        case 'usable': explanationKey = 'explanation_ip_type_usable'; break;
        case 'outside': explanationKey = 'explanation_ip_type_outside'; break; // Asumiendo que existe esta clave
        default: return `<p>Error: Tipo de IP desconocido '${ipType}'</p>`;
    }
    // Obtener y formatear la traducción
    let html = `<p>${getTranslation(explanationKey, replacements)}</p>`;
    return html;
}

/**
 * Genera una explicación HTML paso a paso para calcular los bits de subred necesarios.
 * @param {number} requiredSubnets - Número mínimo de subredes requeridas.
 * @param {number} subnetBits - Número de bits de subred calculados (resultado).
 * @param {number} resultingSubnets - Número real de subredes creadas (2^subnetBits).
 * @returns {string} El HTML de la explicación.
 */
export function generateBitsForSubnetsExplanationHTML(requiredSubnets, subnetBits, resultingSubnets) {
    try {
        let html = `<p>${getTranslation('explanation_bits_for_subnets_intro', { requiredSubnets: formatNumber(requiredSubnets) })}</p>`;
        html += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        // Paso 1: Objetivo
        html += `<li>${getTranslation('explanation_bits_for_subnets_step1', { requiredSubnets: formatNumber(requiredSubnets) })}</li>`;
        // Paso 2: Cálculo de potencias de 2
        let calculationStepsHTML = '';
        calculationStepsHTML += `<div style="margin-left: -10px; margin-top: 5px; margin-bottom: 5px;">${getTranslation('explanation_bits_for_subnets_step2')}</div>`;
        calculationStepsHTML += `<ul style="list-style: none; padding-left: 10px; margin-top: 0;">`;
        // Mostrar cálculos para bits cercanos al resultado
        for (let s = Math.max(0, subnetBits - 2); s <= subnetBits + 1; s++) {
            const powerOf2BigInt = BigInt(2) ** BigInt(s);
            const powerOf2Num = Number(powerOf2BigInt);
            const isCorrect = s === subnetBits;
            const comparison = (powerOf2Num >= requiredSubnets) ? '&ge;' : '&lt;'; // Símbolo >= o <
            let line = `2<sup>${s}</sup> = ${formatNumber(powerOf2Num)}`;
            line += ` (${comparison} ${formatNumber(requiredSubnets)})`;
            if (isCorrect) { line = `<strong>${line}</strong>`; } // Resaltar la línea correcta
            calculationStepsHTML += `<li><code>${line}</code></li>`;
        }
        calculationStepsHTML += `</ul>`;
        html += `<li>${calculationStepsHTML}</li>`;
        // Paso 3: Conclusión
        html += `<li>${getTranslation('explanation_bits_for_subnets_step3', { subnetBits: subnetBits })}</li>`;
        html += `</ol>`;
        return html;
    } catch (error) {
        console.error("Error generando explicación de bits para subredes:", error);
        return `<p>Error al generar la explicación.</p>`;
    }
}

/**
 * Genera una explicación HTML paso a paso para calcular los bits de host necesarios.
 * @param {number} requiredHosts - Número mínimo de hosts utilizables requeridos.
 * @param {number} hostBits - Número de bits de host calculados (resultado).
 * @param {number} resultingHosts - Número real de hosts utilizables creados (2^hostBits - 2).
 * @returns {string} El HTML de la explicación.
 */
export function generateBitsForHostsExplanationHTML(requiredHosts, hostBits, resultingHosts) {
    try {
        let html = `<p>${getTranslation('explanation_bits_for_hosts_intro', { requiredHosts: formatNumber(requiredHosts) })}</p>`;
        html += `<ol style="margin-left: 20px; padding-left: 10px; font-size: 0.9em; margin-top: 5px; margin-bottom: 5px;">`;
        // Paso 1: Objetivo (2^h - 2 >= req)
        html += `<li>${getTranslation('explanation_bits_for_hosts_step1', { requiredHosts: formatNumber(requiredHosts) })}</li>`;
        // Paso 2: Equivalencia (2^h >= req + 2)
        const requiredTotal = BigInt(requiredHosts) + BigInt(2);
        html += `<li>${getTranslation('explanation_bits_for_hosts_step2', { requiredHosts: formatNumber(requiredHosts), requiredTotal: formatNumber(Number(requiredTotal)) })}</li>`;
        // Paso 3: Cálculo de potencias de 2
        let calculationStepsHTML = '';
        calculationStepsHTML += `<div style="margin-left: -10px; margin-top: 5px; margin-bottom: 5px;">${getTranslation('explanation_bits_for_hosts_step3')}</div>`;
        calculationStepsHTML += `<ul style="list-style: none; padding-left: 10px; margin-top: 0;">`;
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

/**
 * Genera una explicación HTML paso a paso para calcular la máscara necesaria para un número de hosts.
 * @param {number} requiredHosts - Número mínimo de hosts utilizables requeridos.
 * @param {number} hostBits - Número de bits de host calculados.
 * @param {number} prefixLength - Longitud de prefijo calculada (32 - hostBits).
 * @param {string} subnetMask - Máscara de subred calculada (resultado).
 * @returns {string} El HTML de la explicación.
 */
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

