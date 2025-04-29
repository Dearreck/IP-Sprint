// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// Contiene funciones para crear diferentes tipos de
// preguntas para cada nivel del juego.
// ==================================================

// --- Importaciones de Módulos ---
// Importar funciones de utilidad necesarias desde utils.js
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML // Funciones para porciones y explicaciones
} from './utils.js';

// --- Generadores de Preguntas (Nivel Entry) ---
// Estas funciones generan preguntas básicas donde se evalúa un solo concepto.

/**
 * Genera una pregunta sobre la Clase (A, B, C, D, E) de una IP dada.
 * @returns {object|null} Objeto con { question, options, correctAnswer, explanation } o null si hay error.
 */
function generateClassQuestion() {
    try {
        const ip = generateRandomIp(); // Genera IP aleatoria
        const info = getIpInfo(ip);    // Obtiene info de la IP
        // Reintenta si la IP generada no tiene clase válida (p.ej., formato incorrecto)
        if (info.class === 'N/A') return generateClassQuestion();

        // Construye la pregunta
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        // Opciones de respuesta fijas para las clases
        const options = ['A', 'B', 'C', 'D', 'E'];
        // Respuesta correcta
        const correct = info.class;
        // Genera HTML para la tabla de explicación de clases
        const explanation = generateClassRangeTableHTML(correct);
        // Devuelve el objeto de la pregunta
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateClassQuestion:", error);
        return null; // Indica fallo
    }
 }

/**
 * Genera una pregunta sobre el Tipo (Pública o Privada) de una IP dada.
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        // 40% de probabilidad de generar una IP privada directamente
        let forcePrivate = Math.random() < 0.4;
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        // Reintenta si la IP es de tipo inválido (N/A) o Loopback
        while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 50) {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        }
        // Si sigue sin ser válida, usa un fallback conocido (IP pública)
        if (info.type === 'N/A' || info.type === 'Loopback') {
             ip = '8.8.8.8'; // DNS Google
             info = getIpInfo(ip);
        }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada']; // Opciones fijas
        const correct = info.type; // Respuesta correcta
        // Genera HTML para tabla de rangos privados (indica si la IP es pública/privada)
        const explanation = generatePrivateRangeTableHTML(ip);
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateTypeQuestion:", error);
        return null;
    }
}

/**
 * Genera una pregunta sobre la Máscara de Subred por Defecto de una IP (Clase A, B o C).
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        // Busca una IP válida (Clase A, B, o C, no Loopback)
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        // Fallback si no encuentra rápido
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }

        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; // Opciones fijas
        const correct = info.defaultMask; // Respuesta correcta
        // Genera HTML para tabla Clase-Máscara
        const explanation = generateClassMaskTableHTML(info.class);
        // Asegura que la respuesta correcta esté entre las opciones
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0];
        return { question, options, correctAnswer: finalCorrectAnswer, explanation };
    } catch (error) {
        console.error("Error en generateDefaultMaskQuestion:", error);
        return null;
    }
}

/**
 * Genera una pregunta de formato inverso: "¿Cuál de estas IPs es Clase X?".
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateSelectClassQuestion() {
    try{
        const targetClasses = ['A', 'B', 'C']; // Clases válidas como objetivo
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)]; // Elige una
        const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // Genera IP correcta
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            if (info.class === targetClass && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); }
            attempts++;
        }
        // Fallback
        if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }

        // Genera IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegura que sea de clase diferente, válida y no duplicada
            if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); }
            attempts++;
        }
        // Rellena con fallbacks si es necesario
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) { incorrectIps.push(fb); ipSet.add(fb); } }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Asegura 3 incorrectas

        // Combina opciones, baraja y define explicación
        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const explanation = `Se busca una IP de Clase ${targetClass}. La correcta es ${correct}.<br>${generateClassRangeTableHTML(targetClass)}`;
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateSelectClassQuestion:", error);
        return null;
    }
 }

/**
 * Genera una pregunta de formato inverso: "¿Cuál de estas IPs es Privada?".
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateSelectPrivateIpQuestion() {
    try {
        const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`;
        let correctIp = generateRandomPrivateIp(); // IP privada garantizada
        let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]);

        // Genera IPs públicas incorrectas
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            if (info.type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); }
            attempts++;
        }
        // Rellena con fallbacks públicos si es necesario
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1'];
             for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb)) { incorrectIps.push(fb); ipSet.add(fb); } }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        // Explicación con tabla de rangos privados
        const explanation = generatePrivateRangeTableHTML(correct);
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateSelectPrivateIpQuestion:", error);
        return null;
    }
 }

/**
 * Genera una pregunta de formato inverso: "¿Cuál de estas IPs usaría la máscara X por defecto?".
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateSelectIpByDefaultMaskQuestion() {
    try {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; // Máscaras objetivo
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)]; // Elige una
        const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // Genera IP correcta
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            if (info.defaultMask === targetMask && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); }
            attempts++;
        }
        // Fallback
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }

        // Genera IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegura máscara válida, diferente a target, no Loopback y no duplicada
            if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); }
            attempts++;
        }
        // Rellena con fallbacks si es necesario
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) { let fbInfo = getIpInfo(fb); if (incorrectIps.length < 3 && !ipSet.has(fb) && fbInfo.defaultMask !== targetMask && fbInfo.defaultMask !== 'N/A') { incorrectIps.push(fb); ipSet.add(fb); } }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const correctClass = getIpInfo(correct).class;
        // Explicación con tabla Clase-Máscara
        const explanation = `Se busca una IP cuya clase (${correctClass}) tenga la máscara por defecto ${targetMask}.<br>${generateClassMaskTableHTML(correctClass)}`;
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateSelectIpByDefaultMaskQuestion:", error);
        return null;
    }
}


// --- Generadores de Preguntas (Nivel Associate) ---
// Estas funciones generan preguntas que combinan dos conceptos o introducen temas nuevos.

/**
 * Genera una pregunta para identificar la Clase y el Tipo (Pública/Privada) de una IP.
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        // Genera IP válida (A, B, C, no Loopback)
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = Math.random() < 0.5 ? '172.20.1.1' : '10.10.10.10'; info = getIpInfo(ip); } // Fallback

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Tipo?`;
        const correctClass = info.class;
        const correctType = info.type;
        const correctAnswerText = `Clase ${correctClass}, ${correctType}`; // Respuesta combinada

        // Genera opciones únicas usando un Set
        let options = new Set([correctAnswerText]);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        const possibleTypes = ['Pública', 'Privada'].filter(t => t !== correctType);

        // Añade opciones incorrectas plausibles
        if (possibleTypes.length > 0) { options.add(`Clase ${correctClass}, ${possibleTypes[0]}`); }
        if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, ${correctType}`); }
        if (possibleClasses.length > 0 && possibleTypes.length > 0) { options.add(`Clase ${possibleClasses[0]}, ${possibleTypes[0]}`); }
        // Rellena hasta 4 opciones si es necesario
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)];
            const randomType = ['Pública', 'Privada'][getRandomInt(0, 1)];
            const potentialOption = `Clase ${randomClass}, ${randomType}`;
            if (potentialOption !== correctAnswerText) { options.add(potentialOption); }
        }

        // Convierte a array, asegura 4 opciones y baraja
        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); }
        optionsArray = optionsArray.slice(0, 4);
        shuffleArray(optionsArray);

        // Combina explicaciones de clase y tipo/rango privado
        const explanation = `${generateClassRangeTableHTML(correctClass)}<hr style="margin: 10px 0;">${generatePrivateRangeTableHTML(ip)}`;
        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) {
        console.error("Error en generateClassAndTypeQuestion:", error);
        return null;
    }
}

/**
 * Genera una pregunta para identificar la Clase y la Máscara por Defecto de una IP.
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        // Genera IP válida (A, B, C, no Loopback)
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '172.16.50.50'; info = getIpInfo(ip); } // Fallback

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Máscara por Defecto?`;
        const correctClass = info.class;
        const correctMask = info.defaultMask;
        const correctAnswerText = `Clase ${correctClass}, Máscara ${correctMask}`; // Respuesta combinada

        let options = new Set([correctAnswerText]);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);

        // Genera opciones incorrectas
        if (possibleMasks.length > 0) { options.add(`Clase ${correctClass}, Máscara ${possibleMasks[0]}`); }
        if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Máscara ${correctMask}`); }
        if (possibleClasses.length > 0) {
            let incorrectMaskForIncorrectClass = '255.255.255.255'; // Fallback
            if (possibleClasses[0] === 'A' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0';
            else if (possibleClasses[0] === 'B' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0';
            else if (possibleClasses[0] === 'C' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0';
            else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0];
            const incorrectCombination = `Clase ${possibleClasses[0]}, Máscara ${incorrectMaskForIncorrectClass}`;
            if (!options.has(incorrectCombination)) { options.add(incorrectCombination); }
        }
        // Rellena hasta 4 opciones
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)];
            const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)];
            const potentialOption = `Clase ${randomClass}, Máscara ${randomMask}`;
             if (potentialOption !== correctAnswerText) { options.add(potentialOption); }
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); }
        optionsArray = optionsArray.slice(0, 4);
        shuffleArray(optionsArray);

        // Explicación con tabla Clase-Máscara
        const explanation = generateClassMaskTableHTML(correctClass);
        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) {
        console.error("Error en generateClassAndDefaultMaskQuestion:", error);
        return null;
    }
}

/**
 * Genera pregunta: Clase y Porción de Red (con máscara default).
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Genera IP válida (A, B, C) y obtiene sus porciones con máscara default
        do {
            ip = generateRandomIp(); info = getIpInfo(ip);
            // Solo calcula porciones si la clase y máscara son válidas (A, B, C)
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') {
                portions = getIpPortions(ip, info.defaultMask);
            } else { portions = null; }
            attempts++;
        } while (!portions && attempts < 100); // Repetir si no se obtuvieron porciones válidas
        // Fallback
        if (!portions) { ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Porción de Red (usando máscara default)?`;
        const correctClass = info.class;
        const correctNetworkPortion = portions.networkPortion;
        if (!correctNetworkPortion && correctNetworkPortion !== "") throw new Error(`No se pudo obtener networkPortion para ${ip}`); // Validación
        const correctAnswerText = `Clase ${correctClass}, Red ${correctNetworkPortion || 'Ninguna'}`; // Respuesta combinada

        let options = new Set([correctAnswerText]);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);

        // Generar opciones incorrectas
        // 1. Clase Correcta, Porción Red Incorrecta
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { // Intenta obtener una porción de red DIFERENTE
            randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; }
            portionAttempts++;
        } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        // Añade la opción incorrecta si se encontró una diferente, o un fallback
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`Clase ${correctClass}, Red ${incorrectNetworkPortion}`); }
        else { if (correctClass !== 'A') options.add(`Clase ${correctClass}, Red ${getRandomInt(1,126)}`); else options.add(`Clase ${correctClass}, Red ${getRandomInt(128,191)}.${getRandomInt(0,255)}`); }

        // 2. Clase Incorrecta, Porción Red Correcta
        if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Red ${correctNetworkPortion || 'Ninguna'}`); }

        // 3. Clase Incorrecta, Porción Red Incorrecta
        if (possibleClasses.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`Clase ${possibleClasses[0]}, Red ${incorrectNetworkPortion}`); }

        // Rellenar hasta 4 opciones
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = '';
            if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`;
            else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`;
            else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`;
            const potentialOption = `Clase ${randomClass}, Red ${randomPortion}`;
            if (potentialOption !== correctAnswerText) { options.add(potentialOption); }
        }

        // Convierte a array, asegura 4 opciones y baraja
        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); }
        optionsArray = optionsArray.slice(0, 4);
        shuffleArray(optionsArray);

        // Usa la nueva función para generar la explicación visual de porciones
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, correctClass, correctNetworkPortion, portions.hostPortion);

        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) {
        console.error("Error en generateClassAndNetworkPortionQuestion:", error);
        return null;
    }
}

/**
 * Genera pregunta: Clase y Porción de Host (con máscara default).
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        // Genera IP válida (A, B, C) y obtiene porciones
        do {
            ip = generateRandomIp(); info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); }
            else { portions = null; }
            attempts++;
        } while (!portions && attempts < 100);
        // Fallback
        if (!portions) { ip = '172.16.10.20'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Porción de Host (usando máscara default)?`;
        const correctClass = info.class;
        const correctHostPortion = portions.hostPortion;
        if (!correctHostPortion && correctHostPortion !== "") throw new Error(`No se pudo obtener hostPortion para ${ip}`); // Validación
        const correctAnswerText = `Clase ${correctClass}, Host ${correctHostPortion || 'Ninguna'}`; // Respuesta combinada

        let options = new Set([correctAnswerText]);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);

        // Generar opciones incorrectas
        // 1. Clase Correcta, Porción Host Incorrecta
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
         do {
            randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; }
            portionAttempts++;
        } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`Clase ${correctClass}, Host ${incorrectHostPortion}`); }
        else { if (correctClass !== 'C') options.add(`Clase ${correctClass}, Host ${getRandomInt(1,254)}`); else options.add(`Clase ${correctClass}, Host ${getRandomInt(0,255)}.${getRandomInt(1,254)}`); }

        // 2. Clase Incorrecta, Porción Host Correcta
        if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Host ${correctHostPortion || 'Ninguna'}`); }

        // 3. Clase Incorrecta, Porción Host Incorrecta
         if (possibleClasses.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`Clase ${possibleClasses[0]}, Host ${incorrectHostPortion}`); }

        // Rellenar hasta 4 opciones
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = '';
            if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else randomPortion = `${getRandomInt(1, 254)}`;
            const potentialOption = `Clase ${randomClass}, Host ${randomPortion}`;
            if (potentialOption !== correctAnswerText) { options.add(potentialOption); }
        }

        // Convierte a array, asegura 4 opciones y baraja
        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); }
        optionsArray = optionsArray.slice(0, 4);
        shuffleArray(optionsArray);

        // Usa la nueva función para generar la explicación visual de porciones
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, correctClass, portions.networkPortion, correctHostPortion);

        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) {
        console.error("Error en generateClassAndHostPortionQuestion:", error);
        return null;
    }
}


// --- Agrupar Generadores por Nivel ---

// Array con las funciones generadoras para el Nivel Entry
const entryQuestionGenerators = [
    generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion,
    generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion
];

// Array con las funciones generadoras para el Nivel Associate
const associateQuestionGenerators = [
    generateClassAndTypeQuestion,
    generateClassAndDefaultMaskQuestion,
    generateClassAndNetworkPortionQuestion,
    generateClassAndHostPortionQuestion,
    // TODO: Añadir aquí los generadores para los puntos restantes de Associate:
    // generateRfc1918Question,
    // generateSpecialAddressQuestion,
    // generateNetworkBroadcastAddressQuestion
];

// TODO: Crear array professionalQuestionGenerators = [...]

// --- Función Principal para Obtener Pregunta ---

/**
 * Selecciona y llama a un generador de preguntas aleatorio según el nivel actual.
 * @param {string} level - El nivel actual ('Entry', 'Associate', etc.)
 * @returns {object|null} - El objeto con los datos de la pregunta o null si falla.
 */
export function getNextQuestion(level) {
     let generators = []; // Array para almacenar las funciones generadoras del nivel

     // Selecciona el array de generadores apropiado basado en el nivel
     if (level === 'Entry') {
         generators = entryQuestionGenerators;
     } else if (level === 'Associate') {
         generators = associateQuestionGenerators;
     } else if (level === 'Professional') {
         // Aún no implementado
         console.warn("Generadores de nivel Professional aún no implementados.");
         return null;
     } else {
         // Nivel desconocido
         console.error("Nivel desconocido solicitado:", level);
         return null;
     }

     // Verifica si existen generadores para el nivel seleccionado
     if (!generators || generators.length === 0) {
         console.warn(`No hay generadores de preguntas definidos para el nivel: ${level}`);
         return null;
     }

     // Elige un índice aleatorio para seleccionar una función generadora
     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     // Verifica si el elemento seleccionado es realmente una función
     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             // Ejecuta la función generadora para obtener los datos de la pregunta
             const questionData = generatorFunction();
             // Validación básica del objeto devuelto por el generador
             if (questionData && questionData.question && Array.isArray(questionData.options) && questionData.options.length > 0 && questionData.correctAnswer && questionData.explanation !== undefined) {
                 return questionData; // Devuelve los datos si son válidos
             } else {
                 // Log si el generador devuelve datos inválidos o incompletos
                 console.error(`El generador ${generatorFunction.name} devolvió datos inválidos o incompletos.`, questionData);
                 // Podríamos intentar con otro generador aquí, pero por simplicidad devolvemos null
                 return null;
             }
         } catch (error) {
              // Captura errores que ocurran DENTRO de la función generadora
              console.error(`Error al ejecutar el generador ${generatorFunction.name}:`, error);
              return null; // Indica fallo
         }
     } else {
         // Log si el elemento seleccionado del array no era una función
         console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`);
         return null;
     }
}
