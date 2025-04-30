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
                ipClass = 'B'; // Cae en el rango B
                defaultMask = 'N/A';
            }
        }

        // --- Comprobar Broadcast Limitado ---
        // Se hace al final para sobreescribir otros tipos si coincide exactamente.
        if (ipString === '255.255.255.255') {
            ipType = 'Broadcast Limitado';
            ipClass = 'N/A'; // No pertenece a una clase estándar
            defaultMask = 'N/A';
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

/**
 * Calcula la dirección de red para una IP y máscara dadas.
 * Realiza una operación AND bitwise entre la IP y la máscara.
 * @param {string} ipString - La dirección IP en formato "x.x.x.x".
 * @param {string} maskString - La máscara de subred en formato "x.x.x.x".
 * @returns {string|null} La dirección de red calculada o null si hay error.
 */
export function calculateNetworkAddress(ipString, maskString) {
    try {
        const ipOctets = ipString.split('.').map(Number);
        const maskOctets = maskString.split('.').map(Number);
        // Validación básica de formato
        if (ipOctets.length !== 4 || maskOctets.length !== 4 || ipOctets.some(isNaN) || maskOctets.some(isNaN) || ipOctets.some(o => o < 0 || o > 255) || maskOctets.some(o => o < 0 || o > 255) ) {
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
 * Calcula la máscara wildcard a partir de una máscara de subred.
 * @param {string} maskString - La máscara de subred en formato "x.x.x.x".
 * @returns {string|null} La máscara wildcard calculada o null si hay error.
 */
export function calculateWildcardMask(maskString) {
    try {
        const maskOctets = maskString.split('.').map(Number);
        // Validación básica de formato
        if (maskOctets.length !== 4 || maskOctets.some(isNaN) || maskOctets.some(o => o < 0 || o > 255)) {
            throw new Error("Formato de máscara inválido para cálculo de wildcard.");
        }
        // La wildcard se calcula restando cada octeto de la máscara de 255
        const wildcardOctets = maskOctets.map(octet => 255 - octet);
        return wildcardOctets.join('.');
    } catch (error) {
        console.error("Error calculando wildcard mask:", error);
        return null;
    }
}


/**
 * Calcula la dirección de broadcast para una dirección de red y máscara wildcard dadas.
 * Realiza una operación OR bitwise entre la dirección de red y la wildcard.
 * @param {string} networkAddrString - La dirección de RED en formato "x.x.x.x".
 * @param {string} wildcardString - La máscara wildcard en formato "x.x.x.x".
 * @returns {string|null} La dirección de broadcast calculada o null si hay error.
 */
export function calculateBroadcastAddress(networkAddrString, wildcardString) {
    try {
        const networkOctets = networkAddrString.split('.').map(Number);
        const wildcardOctets = wildcardString.split('.').map(Number);
        // Validación básica de formato
        if (networkOctets.length !== 4 || wildcardOctets.length !== 4 ||
            networkOctets.some(isNaN) || wildcardOctets.some(isNaN) ||
            networkOctets.some(o => o < 0 || o > 255) ||
            wildcardOctets.some(o => o < 0 || o > 255) ) {
            throw new Error("Formato Dir. Red o Wildcard inválido para cálculo de broadcast.");
        }

        const broadcastOctets = [];
        for (let i = 0; i < 4; i++) {
            // Operación OR bitwise entre el octeto de la Dir. Red y el octeto de la Wildcard
            broadcastOctets.push(networkOctets[i] | wildcardOctets[i]);
        }

        return broadcastOctets.join('.'); // Devuelve la dirección de broadcast resultante

    } catch (error) {
        console.error("Error calculando dirección de broadcast:", error);
        return null;
    }
}


// --- Generadores de Tablas HTML para Explicaciones ---

/**
 * Genera el código HTML para una tabla que muestra los rangos de las clases IP.
 * @param {string | null} highlightClass - La clase a resaltar (ej. 'A', 'B') o null.
 * @returns {string} El string HTML completo de la tabla.
 */
export function generateClassRangeTableHTML(highlightClass = null) {
    const ranges = [ { class: 'A', range: '1 - 126' }, { class: 'B', range: '128 - 191' }, { class: 'C', range: '192 - 223' }, { class: 'D', range: '224 - 239', note: '(Multicast)' }, { class: 'E', range: '240 - 255', note: '(Experimental)' } ];
    let tableHTML = '<p>La clase se determina por el <strong>primer octeto</strong>:</p>';
    tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Clase</th><th>Rango</th><th>Nota</th></tr></thead>'; tableHTML += '<tbody>';
    ranges.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.note || ''}</td></tr>`; });
    tableHTML += '</tbody></table>'; if (highlightClass === 'A') { tableHTML += '<p style="font-size:0.8em; text-align:center; margin-top:5px;">(Nota: El rango 127.x.x.x es para Loopback)</p>'; }
    return tableHTML;
}

/**
 * Genera el código HTML para una tabla que muestra la relación Clase-Máscara por Defecto.
 * @param {string | null} highlightClass - La clase a resaltar (A, B, C) o null.
 * @returns {string} El string HTML completo de la tabla.
 */
export function generateClassMaskTableHTML(highlightClass = null) {
    const data = [ { class: 'A', range: '1 - 126', mask: '255.0.0.0' }, { class: 'B', range: '128 - 191', mask: '255.255.0.0' }, { class: 'C', range: '192 - 223', mask: '255.255.255.0' } ];
    let tableHTML = '<p>La máscara por defecto está determinada por la clase (basada en el 1er octeto):</p>';
    tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Clase</th><th>Rango 1er Octeto</th><th>Máscara por Defecto</th></tr></thead>'; tableHTML += '<tbody>';
    data.forEach(item => { const highlight = (item.class === highlightClass) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.class}</td><td>${item.range}</td><td>${item.mask}</td></tr>`; });
    tableHTML += '</tbody></table>';
    return tableHTML;
}

/**
 * Genera HTML para tabla de Rangos Privados RFC 1918, incluyendo enlace al RFC.
 * @param {string | null} highlightIp - La IP a comprobar para resaltar su rango, o null.
 * @returns {string} El string HTML completo de la tabla y la nota adicional.
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
    let tableHTML = `<p>Los rangos de IP privadas (<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>) son:</p>`;
    tableHTML += '<table class="explanation-table">'; tableHTML += '<thead><tr><th>Bloque (CIDR)</th><th>Rango de Direcciones</th></tr></thead>'; tableHTML += '<tbody>';
    ranges.forEach(item => { const highlight = (item.cidr === highlightCIDR) ? ' class="highlight-row"' : ''; tableHTML += `<tr${highlight}><td>${item.cidr}</td><td>${item.range}</td></tr>`; });
    tableHTML += '</tbody></table>';
    if (highlightIp) {
        if (ipType === 'Privada' && highlightCIDR) { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Privada</strong> y pertenece al rango resaltado).</p>`; }
        else if (ipType === 'Pública') { tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es <strong>Pública</strong>).</p>`; }
        else if (ipType !== 'N/A'){ tableHTML += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">(La IP ${highlightIp} es de tipo <strong>${ipType}</strong>).</p>`; }
    }
    return tableHTML;
}

/**
 * REESCRITA Y CORREGIDA: Genera el HTML para la explicación de cálculo de Red/Broadcast/Wildcard.
 * Muestra IP, Máscara, Wildcard, Dir. Red y Dir. Broadcast en una tabla didáctica.
 * @param {string} ipString - La IP original.
 * @param {string} maskString - La máscara de subred usada.
 * @param {string} wildcardString - La máscara wildcard calculada.
 * @param {string} networkAddr - La dirección de red calculada.
 * @param {string} broadcastAddr - La dirección de broadcast calculada.
 * @returns {string} El string HTML de la explicación.
 */
export function generatePortionExplanationHTML(ipString, maskString, wildcardString, networkAddr, broadcastAddr) {
    try {
        // Validar entradas mínimas
        if (!ipString || !maskString || !wildcardString || !networkAddr || !broadcastAddr) {
            console.warn("Datos incompletos para generatePortionExplanationHTML", {ipString, maskString, wildcardString, networkAddr, broadcastAddr});
            // Intentar calcular lo que falte si es posible (ej. wildcard desde mask)
            if (maskString && !wildcardString) wildcardString = calculateWildcardMask(maskString) || 'Error';
            if (ipString && maskString && !networkAddr) networkAddr = calculateNetworkAddress(ipString, maskString) || 'Error';
            if (networkAddr && wildcardString && !broadcastAddr) broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardString) || 'Error';

            // Si aún faltan datos cruciales, lanzar error
            if (!wildcardString || !networkAddr || !broadcastAddr || wildcardString === 'Error' || networkAddr === 'Error' || broadcastAddr === 'Error') {
                 throw new Error("Faltan datos cruciales o hubo error en cálculos internos para generar explicación.");
            }
        }

        // Construir el HTML de la tabla
        let html = `<p>Cálculos para IP <strong>${ipString}</strong> / Máscara <strong>${maskString}</strong>:</p>`;
        html += '<table class="explanation-table">';
        html += '<thead><tr><th>Concepto</th><th>Valor</th><th>Cálculo / Nota</th></tr></thead>';
        html += '<tbody>';
        html += `<tr><td>IP Original</td><td><code>${ipString}</code></td><td>-</td></tr>`;
        html += `<tr><td>Máscara</td><td><code>${maskString}</code></td><td>Define la porción de red</td></tr>`;
        html += `<tr><td>Wildcard</td><td><code>${wildcardString}</code></td><td>Inverso de Máscara (255 - octeto)</td></tr>`;
        html += `<tr><td>Dir. Red</td><td><code>${networkAddr}</code></td><td>IP <strong>AND</strong> Máscara</td></tr>`;
        html += `<tr><td>Dir. Broadcast</td><td><code>${broadcastAddr}</code></td><td>Dir. Red <strong>OR</strong> Wildcard</td></tr>`;
        html += '</tbody></table>';

        return html;

    } catch (error) {
        console.error("Error generando explicación de cálculo:", error);
        // Devolver explicación básica en caso de error
        return `<p>No se pudo generar la tabla de explicación detallada para ${ipString} / ${maskString}.</p>`;
    }
}


/**
 * Genera explicación HTML para direcciones especiales (Loopback, APIPA, Broadcast Limitado).
 * Incluye enlaces a los RFCs relevantes.
 * @param {string} addressType - El tipo de dirección especial ('Loopback', 'APIPA', 'Broadcast Limitado').
 * @returns {string} El string HTML de la explicación.
 */
export function generateSpecialAddressExplanationHTML(addressType) {
    let explanation = '';
    let rfcLink = '';
    let rfcText = '';

    switch (addressType) {
        case 'Loopback':
            explanation = `La red <strong>127.0.0.0/8</strong> está reservada para <strong>Loopback</strong>. Se utiliza para pruebas de red internas en el propio host (comunicarse consigo mismo). La dirección más común es 127.0.0.1 (localhost).`;
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1122#section-3.2.1.3';
            rfcText = 'RFC 1122 (Sec 3.2.1.3)';
            break;
        case 'APIPA':
            explanation = `El rango <strong>169.254.0.0/16</strong> se usa para <strong>APIPA</strong> (Automatic Private IP Addressing) o Direcciones Link-Local. Un host se autoasigna una IP de este rango si no puede obtener una de un servidor DHCP. Estas IPs no son enrutables.`;
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc3927#section-2.1'; // Enlace específico
            rfcText = 'RFC 3927 (Sec 2.1)';
            break;
        case 'Broadcast Limitado':
            explanation = `La dirección <strong>255.255.255.255</strong> es la dirección de <strong>Broadcast Limitado</strong>. Los paquetes enviados a esta dirección se entregan a todos los hosts en la misma subred local, pero los routers no los reenvían a otras redes.`;
            rfcLink = 'https://datatracker.ietf.org/doc/html/rfc919#section-7'; // Enlace específico
            rfcText = 'RFC 919 (Sec 7)';
            break;
        default:
            // Caso por defecto si se pasa un tipo no esperado
            explanation = 'Esta es una dirección con un propósito especial no detallado aquí.';
            break;
    }

    // Añadir el enlace al final de la explicación si existe
    if (rfcLink && rfcText) {
        explanation += ` (Definido en <a href="${rfcLink}" target="_blank" rel="noopener noreferrer">${rfcText}</a>).`;
    }

    // Devolver el párrafo HTML completo
    return `<p>${explanation}</p>`;
}


// --- Función Auxiliar Interna ---
/**
 * Obtiene el rango del primer octeto de una clase.
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
