// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// Contiene funciones para crear diferentes tipos de
// preguntas para cada nivel del juego.
// Devuelve objetos con claves de traducción y datos,
// la traducción final la realiza ui.js.
// ==================================================

// --- Importaciones de Módulos ---
// Importar funciones de utilidad necesarias desde utils.js
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML,
    calculateNetworkAddress, calculateBroadcastAddress, calculateWildcardMask
} from './utils.js';
// getTranslation NO se importa aquí, la traducción se hace en ui.js

// --- Generadores de Preguntas (Nivel Entry) ---
// Estas funciones generan preguntas básicas donde se evalúa un solo concepto.

/**
 * Genera una pregunta sobre la Clase (A, B, C, D, E) de una IP dada.
 * @returns {object|null} Objeto con { question: {key, replacements}, options, correctAnswer, explanation } o null si hay error.
 */
function generateClassQuestion() {
    try {
        const ip = generateRandomIp(); // Genera IP aleatoria
        const info = getIpInfo(ip);    // Obtiene info de la IP
        // Reintenta si la IP generada no tiene clase válida (p.ej., formato incorrecto)
        if (info.class === 'N/A') return generateClassQuestion();

        // Objeto pregunta con clave y datos para reemplazo
        const question = { key: 'question_given_ip_what_class', replacements: { ip: `<strong>${ip}</strong>` } };
        // Opciones son valores técnicos (no claves i18n)
        const options = ['A', 'B', 'C', 'D', 'E'];
        // Respuesta correcta es el valor técnico
        const correct = info.class;
        // La explicación es HTML generado por utils.js (ya refactorizado para i18n)
        const explanation = generateClassRangeTableHTML(correct);
        // Devuelve el objeto completo de la pregunta
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
        // Decide aleatoriamente si forzar la generación de una IP privada (40% prob.)
        let forcePrivate = Math.random() < 0.4;
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        // Reintenta si la IP generada es de tipo inválido o especial (se ven en Associate)
        while ((info.type === 'N/A' || info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') && attempts < 50) {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        }
        // Si sigue sin ser válida (Pública/Privada), usa un fallback conocido (IP pública)
        if (info.type !== 'Pública' && info.type !== 'Privada') {
             ip = '8.8.8.8'; // DNS de Google
             info = getIpInfo(ip);
        }

        // Objeto pregunta con clave y datos
        const question = { key: 'question_given_ip_what_type', replacements: { ip: `<strong>${ip}</strong>` } };
        // Opciones como claves de traducción
        const options = ['option_public', 'option_private'];
        // Respuesta correcta como clave de traducción
        const correct = `option_${info.type.toLowerCase()}`;
        // Explicación HTML generada por utils.js (ya refactorizado)
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
        // Busca una IP que sea Clase A, B o C y que no sea Loopback.
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        // Fallback si no encuentra rápido.
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }

        // Objeto pregunta con clave y datos
        const question = { key: 'question_given_ip_what_mask', replacements: { ip: `<strong>${ip}</strong>`, class: info.class } };
        // Opciones son valores técnicos (máscaras)
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        // Respuesta correcta es valor técnico
        const correct = info.defaultMask;
        // Explicación HTML generada por utils.js (ya refactorizado)
        const explanation = generateClassMaskTableHTML(info.class);
        // Asegura que la respuesta correcta esté entre las opciones válidas
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
        const targetClasses = ['A', 'B', 'C']; // Clases objetivo válidas
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)]; // Elige una al azar
        // Objeto pregunta con clave y datos
        const question = { key: 'question_select_ip_for_class', replacements: { targetClass: `<strong>${targetClass}</strong>` } };
        let correctIp = '';        // IP correcta (de la clase target)
        let incorrectIps = [];   // Array para IPs incorrectas
        let attempts = 0;
        let ipSet = new Set();     // Set para evitar IPs duplicadas en las opciones

        // Intenta generar una IP correcta para la clase objetivo (no Loopback)
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            if (info.class === targetClass && info.type !== 'Loopback') {
                correctIp = ip; ipSet.add(ip); // Guarda la IP correcta y la añade al Set
            }
            attempts++;
        }
        // Si falla la generación aleatoria, usa un fallback conocido para esa clase
        if (!correctIp) {
            if(targetClass === 'A') correctIp = '10.1.1.1';
            else if(targetClass === 'B') correctIp = '172.16.1.1';
            else correctIp = '192.168.1.1';
            ipSet.add(correctIp);
        }

        // Genera 3 IPs incorrectas (de clases diferentes a la target)
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Verifica que la clase sea diferente, no sea N/A, no sea Loopback y no esté ya en el Set
            if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) {
                 incorrectIps.push(ip); ipSet.add(ip); // Añade al array y al Set
            }
            attempts++;
        }
        // Si no se lograron generar 3 incorrectas, añade fallbacks conocidos
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                // Verifica que el fallback no sea de la clase target y no esté duplicado
                if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) {
                    incorrectIps.push(fb); ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Asegura que solo haya 3 incorrectas

        // Combina la correcta y las incorrectas, y baraja el orden
        // Las opciones son IPs (valores técnicos)
        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp; // La respuesta correcta es la IP
        // La explicación combina texto (clave + reemplazos) y tabla HTML
        const explanation = {
            key: 'explanation_select_ip_for_class',
            replacements: { targetClass: targetClass, correctIp: correct },
            table: generateClassRangeTableHTML(targetClass) // Tabla generada por utils.js
        };
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
        // Objeto pregunta con clave
        const question = { key: 'question_select_private_ip' };
        // Genera una IP privada garantizada
        let correctIp = generateRandomPrivateIp();
        let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]); // Añade la correcta al Set

        // Genera 3 IPs públicas incorrectas
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            // Verifica que sea pública y no duplicada
            if (info.type === 'Pública' && !ipSet.has(ip)) {
                 incorrectIps.push(ip); ipSet.add(ip);
            }
            attempts++;
        }
        // Añade fallbacks públicos si es necesario
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1'];
             for (const fb of fallbacks) {
                 if (incorrectIps.length < 3 && !ipSet.has(fb)) {
                     incorrectIps.push(fb); ipSet.add(fb);
                 }
             }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        // Opciones son IPs (valores técnicos)
        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp; // Respuesta correcta es la IP
        // Explicación es la tabla HTML generada por utils.js
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
        // Objeto pregunta con clave y datos
        const question = { key: 'question_select_ip_for_mask', replacements: { targetMask: `<strong>${targetMask}</strong>` } };
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

        // Opciones son IPs (valores técnicos)
        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp; // Respuesta correcta es la IP
        const correctClass = getIpInfo(correct).class;
        // Explicación como objeto con clave, datos y tabla HTML
        const explanation = {
            key: 'explanation_select_ip_for_mask',
            replacements: { class: correctClass, mask: targetMask },
            table: generateClassMaskTableHTML(correctClass)
        };
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

        // Objeto pregunta con clave y datos
        const question = { key: 'question_given_ip_what_class_type', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctType = info.type;
        // Respuesta correcta como objeto con claves i18n
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, typeKey: `option_${correctType.toLowerCase()}` };

        let options = []; // Array de objetos de opción {classKey, typeKey}
        options.push(correctAnswerObject); // Añadir la correcta

        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        const possibleTypes = ['Pública', 'Privada'].filter(t => t !== correctType);

        // Generar opciones incorrectas como objetos con claves i18n
        if (possibleTypes.length > 0) { options.push({ classKey: `option_class_${correctClass}`, typeKey: `option_${possibleTypes[0].toLowerCase()}` }); }
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, typeKey: `option_${correctType.toLowerCase()}` }); }
        if (possibleClasses.length > 0 && possibleTypes.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, typeKey: `option_${possibleTypes[0].toLowerCase()}` }); }
        // Rellenar hasta 4 opciones
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.typeKey}`));
        while (options.length < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)];
            const randomType = ['Pública', 'Privada'][getRandomInt(0, 1)];
            const potentialOption = { classKey: `option_class_${randomClass}`, typeKey: `option_${randomType.toLowerCase()}` };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.typeKey}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }

        options = options.slice(0, 4); // Asegurar 4 opciones
        shuffleArray(options);
        // Explicación HTML combinada (generada por utils.js)
        const explanation = `${generateClassRangeTableHTML(correctClass)}<hr style="margin: 10px 0;">${generatePrivateRangeTableHTML(ip)}`;
        // Devolver la respuesta correcta como objeto también
        return { question, options, correctAnswer: correctAnswerObject, explanation };
    } catch (error) { console.error("Error en generateClassAndTypeQuestion:", error); return null; }
}

/**
 * Genera una pregunta para identificar la Clase y la Máscara por Defecto de una IP.
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '172.16.50.50'; info = getIpInfo(ip); }
        // Objeto pregunta con clave y datos
        const question = { key: 'question_given_ip_what_class_mask', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctMask = info.defaultMask;
        // Respuesta correcta como objeto con clave de clase y valor de máscara
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, maskValue: correctMask };

        let options = []; options.push(correctAnswerObject); // Añadir la correcta
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);

        // Generar opciones incorrectas como objetos
        if (possibleMasks.length > 0) { options.push({ classKey: `option_class_${correctClass}`, maskValue: possibleMasks[0] }); }
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, maskValue: correctMask }); }
        if (possibleClasses.length > 0) {
             let incorrectMaskForIncorrectClass = '255.255.255.255'; // Fallback
             if (possibleClasses[0] === 'A' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0';
             else if (possibleClasses[0] === 'B' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0';
             else if (possibleClasses[0] === 'C' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0';
             else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0];
             const incorrectCombination = { classKey: `option_class_${possibleClasses[0]}`, maskValue: incorrectMaskForIncorrectClass };
             // Evitar duplicados exactos
             if (!options.some(o => o.classKey === incorrectCombination.classKey && o.maskValue === incorrectCombination.maskValue)) {
                 options.push(incorrectCombination);
             }
        }
        // Rellenar hasta 4 opciones
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.maskValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`;
            const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)];
            const potentialOption = { classKey: randomClassKey, maskValue: randomMask };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.maskValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                 options.push(potentialOption);
                 existingOptionsStr.add(potentialOptionStr);
            }
        }

        options = options.slice(0, 4); shuffleArray(options);
        // Explicación HTML generada por utils.js
        const explanation = generateClassMaskTableHTML(correctClass);
        // Devolver respuesta correcta como objeto
        return { question, options, correctAnswer: correctAnswerObject, explanation };
    } catch (error) { console.error("Error en generateClassAndDefaultMaskQuestion:", error); return null; }
}

/**
 * Genera pregunta: Clase y Porción de Red (con máscara default).
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        // Objeto pregunta con clave y datos
        const question = { key: 'question_given_ip_what_class_net_portion', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctNetworkPortion = portions.networkPortion;
        if (!correctNetworkPortion && correctNetworkPortion !== "") throw new Error(`No se pudo obtener networkPortion para ${ip}`);
        // Respuesta correcta como objeto con clave de clase y valor de porción
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || 'None' }; // 'None' si está vacío

        let options = []; options.push(correctAnswerObject);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);

        // Generar opciones incorrectas como objetos
        // 1. Clase Correcta, Porción Red Incorrecta
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; } portionAttempts++; } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion }); }
        else { let fallbackPortion = (correctClass !== 'A') ? `${getRandomInt(1,126)}` : `${getRandomInt(128,191)}.${getRandomInt(0,255)}`; options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_network_portion', portionValue: fallbackPortion }); }

        // 2. Clase Incorrecta, Porción Red Correcta
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || 'None' }); }

        // 3. Clase Incorrecta, Porción Red Incorrecta
        if (possibleClasses.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion }); }

        // Rellenar hasta 4 opciones
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`; let randomPortion = '';
            if (randomClassKey === 'option_class_A') randomPortion = `${getRandomInt(1, 126)}`;
            else if (randomClassKey === 'option_class_B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`;
            else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`;
            const potentialOption = { classKey: randomClassKey, portionKey: 'option_network_portion', portionValue: randomPortion };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) { options.push(potentialOption); existingOptionsStr.add(potentialOptionStr); }
        }

        options = options.slice(0, 4); shuffleArray(options);
        // Explicación HTML generada por utils.js
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr);
        // Devolver respuesta correcta como objeto
        return { question, options, correctAnswer: correctAnswerObject, explanation };
    } catch (error) { console.error("Error en generateClassAndNetworkPortionQuestion:", error); return null; }
}

/**
 * Genera pregunta: Clase y Porción de Host (con máscara default).
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '172.16.10.20'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        // Objeto pregunta con clave y datos
        const question = { key: 'question_given_ip_what_class_host_portion', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctHostPortion = portions.hostPortion;
        if (!correctHostPortion && correctHostPortion !== "") throw new Error(`No se pudo obtener hostPortion para ${ip}`);
        // Respuesta correcta como objeto
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, portionKey: 'option_host_portion', portionValue: correctHostPortion || 'None' };

        let options = []; options.push(correctAnswerObject);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);

        // Generar opciones incorrectas como objetos
        // 1. Clase Correcta, Porción Host Incorrecta
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
         do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; } portionAttempts++; } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_host_portion', portionValue: incorrectHostPortion }); }
        else { let fallbackPortion = (correctClass !== 'C') ? `${getRandomInt(1,254)}` : `${getRandomInt(0,255)}.${getRandomInt(1,254)}`; options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_host_portion', portionValue: fallbackPortion }); }

        // 2. Clase Incorrecta, Porción Host Correcta
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_host_portion', portionValue: correctHostPortion || 'None' }); }

        // 3. Clase Incorrecta, Porción Host Incorrecta
         if (possibleClasses.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_host_portion', portionValue: incorrectHostPortion }); }

        // Rellenar hasta 4 opciones
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`; let randomPortion = '';
            if (randomClassKey === 'option_class_A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else if (randomClassKey === 'option_class_B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else randomPortion = `${getRandomInt(1, 254)}`;
            const potentialOption = { classKey: randomClassKey, portionKey: 'option_host_portion', portionValue: randomPortion };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) { options.push(potentialOption); existingOptionsStr.add(potentialOptionStr); }
        }

        options = options.slice(0, 4); shuffleArray(options);
        // Explicación HTML generada por utils.js
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr);
        // Devolver respuesta correcta como objeto
        return { question, options, correctAnswer: correctAnswerObject, explanation };
    } catch (error) { console.error("Error en generateClassAndHostPortionQuestion:", error); return null; }
}

function generateRfc1918Question() {
    try {
        const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
        const rfc1918Blocks = [ { cidr: '/8', range: '10.0.0.0 - 10.255.255.255', blockStart: '10.0.0.0', class: 'A', blockId: '10.0.0.0/8' }, { cidr: '/12', range: '172.16.0.0 - 172.31.255.255', blockStart: '172.16.0.0', class: 'B', blockId: '172.16.0.0/12' }, { cidr: '/16', range: '192.168.0.0 - 192.168.255.255', blockStart: '192.168.0.0', class: 'C', blockId: '192.168.0.0/16' } ];
        const otherCidrs = ['/10', '/20', '/24', '/28']; const possibleClasses = ['A', 'B', 'C'];
        const chosenBlock = rfc1918Blocks[getRandomInt(0, rfc1918Blocks.length - 1)];
        let question = {}; let correctAnswer = ''; let options = []; let explanation = '';
        const questionType = getRandomInt(0, 2);
        const rfcLinkHTML = `<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>`;

        if (questionType === 0) {
            question = { key: 'question_rfc1918_cidr_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockStart: `<strong>${chosenBlock.blockStart}</strong>` } };
            correctAnswer = chosenBlock.cidr; options = [correctAnswer];
            let incorrectOptions = otherCidrs.filter(c => c !== correctAnswer); shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
        } else if (questionType === 1) {
            question = { key: 'question_rfc1918_range_from_cidr', replacements: { rfcLinkHTML: rfcLinkHTML, cidr: `<strong>${chosenBlock.cidr}</strong>` } };
            correctAnswer = chosenBlock.range; options = [correctAnswer];
            let incorrectOptions = rfc1918Blocks.filter(b => b.cidr !== chosenBlock.cidr).map(b => b.range);
            if (incorrectOptions.length < 3) { incorrectOptions.push('8.8.0.0 - 8.8.255.255'); } options.push(...incorrectOptions.slice(0, 3));
        } else {
            const blockIdentifier = chosenBlock.blockId;
            question = { key: 'question_rfc1918_class_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockIdentifier: `<strong>${blockIdentifier}</strong>` } };
            correctAnswer = chosenBlock.class; options = [correctAnswer]; // Clase no se traduce como opción
            let incorrectOptions = possibleClasses.filter(c => c !== correctAnswer); options.push(...incorrectOptions);
        }
        shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }
        // Explicación como objeto con tabla y posible texto adicional
        explanation = { table: generatePrivateRangeTableHTML(chosenBlock.blockStart) };
        if (questionType === 2) {
            explanation.key = 'explanation_rfc1918_class_note';
            explanation.replacements = { blockId: `<strong>${chosenBlock.blockId}</strong>`, class: `<strong>${chosenBlock.class}</strong>` };
        }
        return { question, options, correctAnswer, explanation };
    } catch (error) { console.error("Error en generateRfc1918Question:", error); return null; }
}

function generateSpecialAddressQuestion() {
    try {
        const specialAddresses = [ { ip: '127.0.0.1', type: 'Loopback', descriptionKey: 'option_loopback' }, { ip: `169.254.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`, type: 'APIPA', descriptionKey: 'option_apipa' }, { ip: '255.255.255.255', type: 'Broadcast Limitado', descriptionKey: 'option_limited_broadcast' } ];
        const normalIpTypeKeys = ['option_public', 'option_private'];
        const pickSpecial = Math.random() < 0.6; let targetIp = ''; let correctAnswerKey = ''; let questionFormat = getRandomInt(0, 1);

        if (pickSpecial) {
            const chosenSpecial = specialAddresses[getRandomInt(0, specialAddresses.length - 1)]; targetIp = chosenSpecial.ip; correctAnswerKey = chosenSpecial.descriptionKey;
            if (questionFormat === 0) {
                const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
                let options = [correctAnswerKey]; // Opciones como claves
                let incorrectOptions = specialAddresses.filter(s => s.type !== chosenSpecial.type).map(s => s.descriptionKey);
                incorrectOptions.push(...normalIpTypeKeys);
                shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswerKey)) { options.pop(); options.push(correctAnswerKey); shuffleArray(options); }
                const explanation = generateSpecialAddressExplanationHTML(chosenSpecial.type);
                return { question, options, correctAnswer: correctAnswerKey, explanation };
            } else {
                const typeDescription = getTranslation(correctAnswerKey); // Traducir para la pregunta
                const question = { key: 'question_special_which_is_type', replacements: { typeDescription: `<strong>${typeDescription}</strong>` } };
                let options = [targetIp]; let incorrectIps = new Set(); // Opciones son IPs
                while (incorrectIps.size < 2) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } }
                let otherSpecial = specialAddresses.find(s => s.type !== chosenSpecial.type);
                if (otherSpecial) { incorrectIps.add(otherSpecial.ip); } else { while (incorrectIps.size < 3) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } } }
                options.push(...Array.from(incorrectIps).slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(targetIp)) { options.pop(); options.push(targetIp); shuffleArray(options); }
                const explanation = generateSpecialAddressExplanationHTML(chosenSpecial.type);
                return { question, options, correctAnswer: targetIp, explanation }; // Respuesta es IP
            }
        } else {
            targetIp = generateRandomIp(); const info = getIpInfo(targetIp);
            if (info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') { return generateSpecialAddressQuestion(); }
            correctAnswerKey = `option_${info.type.toLowerCase()}`; // Respuesta correcta es clave
            const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
            let options = [correctAnswerKey]; // Opciones como claves
            let incorrectOptions = specialAddresses.map(s => s.descriptionKey);
            shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
            shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswerKey)) { options.pop(); options.push(correctAnswerKey); shuffleArray(options); }
            const explanation = generatePrivateRangeTableHTML(targetIp);
            return { question, options, correctAnswer: correctAnswerKey, explanation };
        }
    } catch (error) { console.error("Error en generateSpecialAddressQuestion:", error); return null; }
}

function generateIdentifyNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.10.50'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = { key: 'question_identify_network_portion', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` } };
        const correctAnswer = portions.networkPortion || getTranslation('option_none'); // Respuesta es valor técnico
        let options = new Set([correctAnswer]);
        if (portions.hostPortion && portions.hostPortion !== correctAnswer) { options.add(portions.hostPortion || getTranslation('option_none')); }
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; } portionAttempts++; } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctAnswer) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctAnswer) { options.add(incorrectNetworkPortion); }
        let incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion;
        if (incorrectHostPortion && incorrectHostPortion !== correctAnswer && !options.has(incorrectHostPortion)) { options.add(incorrectHostPortion || getTranslation('option_none')); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`; else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`; if (randomPortion !== correctAnswer) { options.add(randomPortion); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr);
        return { question, options: optionsArray, correctAnswer, explanation };
    } catch (error) { console.error("Error en generateIdentifyNetworkPortionQuestion:", error); return null; }
}

function generateIdentifyHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '172.25.200.15'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = { key: 'question_identify_host_portion', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` } };
        const correctAnswer = portions.hostPortion || getTranslation('option_none'); // Respuesta es valor técnico
        let options = new Set([correctAnswer]);
        if (portions.networkPortion && portions.networkPortion !== correctAnswer) { options.add(portions.networkPortion || getTranslation('option_none')); }
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; } portionAttempts++; } while ((!incorrectHostPortion || incorrectHostPortion === correctAnswer) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctAnswer) { options.add(incorrectHostPortion); }
        let incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion;
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctAnswer && !options.has(incorrectNetworkPortion)) { options.add(incorrectNetworkPortion || getTranslation('option_none')); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else randomPortion = `${getRandomInt(1, 254)}`; if (randomPortion !== correctAnswer) { options.add(randomPortion); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr);
        return { question, options: optionsArray, correctAnswer, explanation };
    } catch (error) { console.error("Error en generateIdentifyHostPortionQuestion:", error); return null; }
}

function generateNetworkBroadcastAddressQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '172.18.120.30'; info = getIpInfo(ip); }
        const mask = info.defaultMask; const networkAddr = calculateNetworkAddress(ip, mask); const wildcardMask = calculateWildcardMask(mask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        if (!networkAddr || !broadcastAddr || !wildcardMask) { throw new Error("Error calculando direcciones de red/broadcast/wildcard"); }

        const askForNetwork = Math.random() < 0.5;
        const questionTypeKey = askForNetwork ? "address_type_network" : "address_type_broadcast";
        // La respuesta correcta es la dirección IP (valor técnico)
        const correctAnswer = askForNetwork ? networkAddr : broadcastAddr;

        // Objeto pregunta con clave y datos
        const question = { key: 'question_calculate_address', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${mask}</strong>`, addressType: `<strong>${getTranslation(questionTypeKey)}</strong>` } };

        let options = new Set([correctAnswer]); // Opciones son IPs
        const otherAddress = askForNetwork ? broadcastAddr : networkAddr;
        if (otherAddress !== correctAnswer) options.add(otherAddress);
        if (ip !== correctAnswer && !options.has(ip)) options.add(ip);
        let randomIp2, randomInfo2, randomNetAddr, randomBroadAddr, attempts2 = 0;
        do { randomIp2 = generateRandomIp(); randomInfo2 = getIpInfo(randomIp2); attempts2++; } while ((randomInfo2.class !== 'A' && randomInfo2.class !== 'B' && randomInfo2.class !== 'C' || randomInfo2.type === 'Loopback') && attempts2 < 50);
        if (randomInfo2.defaultMask !== 'N/A') {
            randomNetAddr = calculateNetworkAddress(randomIp2, randomInfo2.defaultMask);
            const randomWildcard = calculateWildcardMask(randomInfo2.defaultMask);
            if (randomNetAddr && randomWildcard) {
                randomBroadAddr = calculateBroadcastAddress(randomNetAddr, randomWildcard);
                if (randomNetAddr && randomNetAddr !== correctAnswer && !options.has(randomNetAddr)) options.add(randomNetAddr);
                if (randomBroadAddr && randomBroadAddr !== correctAnswer && !options.has(randomBroadAddr)) options.add(randomBroadAddr);
            }
        }
        while (options.size < 4) { let randomOptionIp = generateRandomIp(); if (randomOptionIp !== correctAnswer && !options.has(randomOptionIp)) { options.add(randomOptionIp); } }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); }
        optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        // La explicación usa la función de utils.js ya refactorizada
        const explanation = generatePortionExplanationHTML(ip, mask, wildcardMask, networkAddr, broadcastAddr);
        return { question, options: optionsArray, correctAnswer, explanation };

    } catch (error) { console.error("Error en generateNetworkBroadcastAddressQuestion:", error); return null; }
}


// --- Agrupar Generadores por Nivel ---

const entryQuestionGenerators = [
    generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion,
    generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion
];

const associateQuestionGenerators = [
    generateClassAndTypeQuestion,
    generateClassAndDefaultMaskQuestion,
    generateClassAndNetworkPortionQuestion,
    generateClassAndHostPortionQuestion,
    generateRfc1918Question,
    generateSpecialAddressQuestion,
    generateIdentifyNetworkPortionQuestion,
    generateIdentifyHostPortionQuestion,
    generateNetworkBroadcastAddressQuestion // Cálculo de Dir Red/Broadcast
];

// TODO: Crear professionalQuestionGenerators = [...]

// --- Función Principal para Obtener Pregunta ---

export function getNextQuestion(level) {
     let generators = [];
     if (level === 'Entry') { generators = entryQuestionGenerators; }
     else if (level === 'Associate') { generators = associateQuestionGenerators; }
     else if (level === 'Professional') { console.warn("Generadores de nivel Professional aún no implementados."); return null; }
     else { console.error("Nivel desconocido solicitado:", level); return null; }

     if (!generators || generators.length === 0) { console.warn(`No hay generadores de preguntas definidos para el nivel: ${level}`); return null; }

     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             const questionData = generatorFunction();
             // Validación básica del objeto devuelto por el generador
             if (questionData && questionData.question && Array.isArray(questionData.options) && questionData.options.length > 0 && questionData.correctAnswer !== undefined && questionData.explanation !== undefined) {
                 return questionData; // Devuelve los datos si son válidos
             } else {
                 console.error(`El generador ${generatorFunction.name} devolvió datos inválidos o incompletos.`, questionData);
                 return null;
             }
         } catch (error) { console.error(`Error al ejecutar el generador ${generatorFunction.name}:`, error); return null; }
     } else { console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`); return null; }
}
