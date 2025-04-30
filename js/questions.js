// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// CORREGIDO: Claves de clase en minúsculas para coincidir con JSONs
// ==================================================

// --- Importaciones de Módulos ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML,
    calculateNetworkAddress, calculateBroadcastAddress, calculateWildcardMask
} from './utils.js';

import { getTranslation } from './i18n.js';

// --- Generadores de Preguntas (Nivel Entry) ---
// (Sin cambios en esta sección, ya que usan 'A', 'B', 'C' directamente, no claves i18n)
/**
 * Genera una pregunta sobre la Clase (A, B, C, D, E) de una IP dada.
 * @returns {object|null} Objeto con { question: {key, replacements}, options, correctAnswer, explanation } o null si hay error.
 */
function generateClassQuestion() {
    try {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'N/A') return generateClassQuestion(); // Reintentar si la IP no tiene clase válida

        const question = { key: 'question_given_ip_what_class', replacements: { ip: `<strong>${ip}</strong>` } };
        const options = ['A', 'B', 'C', 'D', 'E']; // Opciones directas, no claves i18n
        const correct = info.class; // Respuesta directa
        // Guardar info para generar la tabla dinámicamente en ui.js
        const explanationInfo = {
            generatorName: 'generateClassRangeTableHTML',
            args: [correct] // Argumento para resaltar la clase correcta
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateClassQuestion:", error);
        return null;
    }
 }

/**
 * Genera una pregunta sobre el Tipo (Pública o Privada) de una IP dada.
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        let forcePrivate = Math.random() < 0.4; // 40% de probabilidad de forzar IP privada
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        // Reintentar si la IP es de tipo especial (se ven en Associate)
        while ((info.type === 'N/A' || info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') && attempts < 50) {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        }
        // Fallback si sigue sin ser válida
        if (info.type !== 'Pública' && info.type !== 'Privada') {
             ip = '8.8.8.8'; // Usar IP pública conocida
             info = getIpInfo(ip);
        }

        const question = { key: 'question_given_ip_what_type', replacements: { ip: `<strong>${ip}</strong>` } };
        const options = ['option_public', 'option_private']; // Claves i18n
        const correct = (info.type === 'Pública') ? 'option_public' : 'option_private'; // Clave i18n
        // Info para generar la tabla de rangos privados
        const explanationInfo = {
            generatorName: 'generatePrivateRangeTableHTML',
            args: [ip] // Pasar la IP para resaltar el rango si aplica
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
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
        // Buscar IP de Clase A, B o C (no Loopback)
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        // Fallback
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }

        const question = { key: 'question_given_ip_what_mask', replacements: { ip: `<strong>${ip}</strong>`, class: info.class } };
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; // Valores directos
        const correct = info.defaultMask; // Valor directo
        // Info para generar la tabla de máscaras por clase
        const explanationInfo = {
            generatorName: 'generateClassMaskTableHTML',
            args: [info.class] // Pasar la clase para resaltar
        };
        // Asegurar que la respuesta correcta esté en las opciones
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0];
        return { question, options, correctAnswer: finalCorrectAnswer, explanation: explanationInfo };
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
        const targetClasses = ['A', 'B', 'C']; // Clases objetivo
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = { key: 'question_select_ip_for_class', replacements: { targetClass: `<strong>${targetClass}</strong>` } };
        let correctIp = '';
        let incorrectIps = [];
        let attempts = 0;
        let ipSet = new Set(); // Para evitar IPs duplicadas en opciones

        // Generar IP correcta
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            if (info.class === targetClass && info.type !== 'Loopback') {
                correctIp = ip;
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback para IP correcta
        if (!correctIp) {
            if(targetClass === 'A') correctIp = '10.1.1.1';
            else if(targetClass === 'B') correctIp = '172.16.1.1';
            else correctIp = '192.168.1.1';
            ipSet.add(correctIp);
        }

        // Generar IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            // Asegurar clase diferente, válida, no Loopback y no duplicada
            if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) {
                 incorrectIps.push(ip);
                 ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback para IPs incorrectas
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) {
                    incorrectIps.push(fb);
                    ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Asegurar máximo 3 incorrectas

        const options = [correctIp, ...incorrectIps]; // Opciones son IPs directas
        shuffleArray(options);
        const correct = correctIp; // Respuesta es la IP correcta
        // Info para explicación: texto base + tabla de rangos
        const explanationInfo = {
            baseTextKey: 'explanation_select_ip_for_class',
            replacements: { targetClass: targetClass, correctIp: correct },
            generatorName: 'generateClassRangeTableHTML',
            args: [targetClass] // Resaltar la clase buscada
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
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
        const question = { key: 'question_select_private_ip' };
        let correctIp = generateRandomPrivateIp(); // IP privada garantizada
        let incorrectIps = [];
        let attempts = 0;
        let ipSet = new Set([correctIp]); // Añadir la correcta al Set

        // Generar IPs públicas incorrectas
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            if (info.type === 'Pública' && !ipSet.has(ip)) { // Asegurar que sea pública y no duplicada
                 incorrectIps.push(ip);
                 ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback IPs públicas
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1'];
             for (const fb of fallbacks) {
                 if (incorrectIps.length < 3 && !ipSet.has(fb)) {
                     incorrectIps.push(fb);
                     ipSet.add(fb);
                 }
             }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps]; // Opciones son IPs
        shuffleArray(options);
        const correct = correctIp; // Respuesta es la IP privada
        // Info para generar tabla de rangos privados
        const explanationInfo = {
            generatorName: 'generatePrivateRangeTableHTML',
            args: [correct] // Pasar IP correcta para resaltar
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
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
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = { key: 'question_select_ip_for_mask', replacements: { targetMask: `<strong>${targetMask}</strong>` } };
        let correctIp = '';
        let incorrectIps = [];
        let attempts = 0;
        let ipSet = new Set();

        // Generar IP correcta
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            if (info.defaultMask === targetMask && info.type !== 'Loopback') {
                correctIp = ip;
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback IP correcta
        if (!correctIp) {
            if(targetMask === '255.0.0.0') correctIp = '10.1.1.1';
            else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1';
            else correctIp = '192.168.1.1';
            ipSet.add(correctIp);
        }

        // Generar IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            let info = getIpInfo(ip);
            // Asegurar máscara válida, diferente a target, no Loopback y no duplicada
            if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && info.type !== 'Loopback' && !ipSet.has(ip)) {
                incorrectIps.push(ip);
                ipSet.add(ip);
            }
            attempts++;
        }
        // Fallback IPs incorrectas
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                let fbInfo = getIpInfo(fb);
                if (incorrectIps.length < 3 && !ipSet.has(fb) && fbInfo.defaultMask !== targetMask && fbInfo.defaultMask !== 'N/A') {
                    incorrectIps.push(fb);
                    ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps]; // Opciones son IPs
        shuffleArray(options);
        const correct = correctIp; // Respuesta es la IP
        const correctClass = getIpInfo(correct).class;
        // Info para explicación: texto base + tabla de máscaras
        const explanationInfo = {
            baseTextKey: 'explanation_select_ip_for_mask',
            replacements: { class: correctClass, mask: targetMask },
            generatorName: 'generateClassMaskTableHTML',
            args: [correctClass] // Resaltar la clase correcta
        };
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSelectIpByDefaultMaskQuestion:", error);
        return null;
    }
}


// --- Generadores de Preguntas (Nivel Associate) ---

/**
 * Genera una pregunta para identificar la Clase y el Tipo (Pública/Privada) de una IP.
 */
function generateClassAndTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = Math.random() < 0.5 ? '172.20.1.1' : '10.10.10.10'; info = getIpInfo(ip); }

        const question = { key: 'question_given_ip_what_class_type', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctType = info.type;
        // --- CORREGIDO: Usar claves en minúscula ---
        const correctAnswerObject = { classKey: `option_class_${correctClass.toLowerCase()}`, typeKey: (correctType === 'Pública' ? 'option_public' : 'option_private') };

        let options = []; options.push(correctAnswerObject);
        // --- CORREGIDO: Usar claves en minúscula al generar incorrectas ---
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());
        const possibleTypeKeys = ['option_public', 'option_private'].filter(k => k !== correctAnswerObject.typeKey);

        // Generar opciones incorrectas combinando clase y tipo
        if (possibleTypeKeys.length > 0) { options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, typeKey: possibleTypeKeys[0] }); }
        if (possibleClassesLower.length > 0) { options.push({ classKey: `option_class_${possibleClassesLower[0]}`, typeKey: correctAnswerObject.typeKey }); }
        if (possibleClassesLower.length > 0 && possibleTypeKeys.length > 0) { options.push({ classKey: `option_class_${possibleClassesLower[0]}`, typeKey: possibleTypeKeys[0] }); }

        // Rellenar hasta 4 opciones asegurando unicidad
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.typeKey}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`; // minúscula
            const randomTypeKey = ['option_public', 'option_private'][getRandomInt(0, 1)];
            const potentialOption = { classKey: randomClassKey, typeKey: randomTypeKey };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.typeKey}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4); shuffleArray(options);
        // --- FIN CORRECCIÓN ---

        // Info para explicación: dos tablas con separador
        const explanationInfo = {
            generators: [
                { generatorName: 'generateClassRangeTableHTML', args: [correctClass] }, // Tabla de clases
                { generatorName: 'generatePrivateRangeTableHTML', args: [ip] } // Tabla de rangos privados
            ],
            separator: '<hr style="margin: 10px 0;">' // Separador visual
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateClassAndTypeQuestion:", error); return null; }
}

/**
 * Genera una pregunta para identificar la Clase y la Máscara por Defecto de una IP.
 */
function generateClassAndDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '172.16.50.50'; info = getIpInfo(ip); }
        const question = { key: 'question_given_ip_what_class_mask', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctMask = info.defaultMask;
        // --- CORREGIDO: Usar claves en minúscula ---
        const correctAnswerObject = { classKey: `option_class_${correctClass.toLowerCase()}`, maskValue: correctMask };

        let options = []; options.push(correctAnswerObject);
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());
        const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);

        // Generar opciones incorrectas combinando clase y máscara
        if (possibleMasks.length > 0) { options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, maskValue: possibleMasks[0] }); }
        if (possibleClassesLower.length > 0) { options.push({ classKey: `option_class_${possibleClassesLower[0]}`, maskValue: correctMask }); }
        if (possibleClassesLower.length > 0) {
             let incorrectMaskForIncorrectClass = '255.255.255.255'; // Fallback
             // Intentar asignar una máscara incorrecta pero válida para la clase incorrecta
             if (possibleClassesLower[0] === 'a' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0';
             else if (possibleClassesLower[0] === 'b' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0';
             else if (possibleClassesLower[0] === 'c' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0';
             else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0]; // Usar otra máscara incorrecta
             const incorrectCombination = { classKey: `option_class_${possibleClassesLower[0]}`, maskValue: incorrectMaskForIncorrectClass };
             // Evitar duplicados exactos
             if (!options.some(o => o.classKey === incorrectCombination.classKey && o.maskValue === incorrectCombination.maskValue)) {
                 options.push(incorrectCombination);
             }
        }
        // Rellenar hasta 4 opciones asegurando unicidad
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.maskValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`; // minúscula
            const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)];
            const potentialOption = { classKey: randomClassKey, maskValue: randomMask };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.maskValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4); shuffleArray(options);
        // --- FIN CORRECCIÓN ---

        // Info para generar tabla de máscaras por clase
        const explanationInfo = {
            generatorName: 'generateClassMaskTableHTML',
            args: [correctClass] // Resaltar clase correcta
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateClassAndDefaultMaskQuestion:", error); return null; }
}

/**
 * Genera pregunta: Clase y Porción de Red (con máscara default).
 */
function generateClassAndNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = { key: 'question_given_ip_what_class_net_portion', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctNetworkPortion = portions.networkPortion;
        if (!correctNetworkPortion && correctNetworkPortion !== "") throw new Error(`No se pudo obtener networkPortion para ${ip}`);
        // --- CORREGIDO: Usar claves en minúscula ---
        const correctAnswerObject = { classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || 'None' };

        let options = []; options.push(correctAnswerObject);
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());

        // Generar opciones incorrectas combinando clase y porción de red
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { // Buscar una porción de red incorrecta
            randomIpForPortion = generateRandomIp();
            randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') {
                incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion;
            }
            portionAttempts++;
        } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        // Opción 1: Misma clase, porción incorrecta
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) {
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion });
        } else { // Fallback si no se encontró porción incorrecta
            let fallbackPortion = (correctClass !== 'A') ? `${getRandomInt(1,126)}` : `${getRandomInt(128,191)}.${getRandomInt(0,255)}`;
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_network_portion', portionValue: fallbackPortion });
        }
        // Opción 2: Clase incorrecta, misma porción
        if (possibleClassesLower.length > 0) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || 'None' });
        }
        // Opción 3: Clase incorrecta, porción incorrecta
        if (possibleClassesLower.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion });
        }
        // Rellenar hasta 4 opciones asegurando unicidad
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`; // minúscula
            let randomPortion = ''; // Generar porción aleatoria basada en la clase aleatoria
            if (randomClassKey === 'option_class_a') randomPortion = `${getRandomInt(1, 126)}`;
            else if (randomClassKey === 'option_class_b') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`;
            else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`;
            const potentialOption = { classKey: randomClassKey, portionKey: 'option_network_portion', portionValue: randomPortion };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4); shuffleArray(options);
        // --- FIN CORRECCIÓN ---

        // Info para generar tabla de cálculo de porciones
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateClassAndNetworkPortionQuestion:", error); return null; }
}

/**
 * Genera pregunta: Clase y Porción de Host (con máscara default).
 */
function generateClassAndHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '172.16.10.20'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = { key: 'question_given_ip_what_class_host_portion', replacements: { ip: `<strong>${ip}</strong>` } };
        const correctClass = info.class; const correctHostPortion = portions.hostPortion;
        if (!correctHostPortion && correctHostPortion !== "") throw new Error(`No se pudo obtener hostPortion para ${ip}`);
        // --- CORREGIDO: Usar claves en minúscula ---
        const correctAnswerObject = { classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_host_portion', portionValue: correctHostPortion || 'None' };

        let options = []; options.push(correctAnswerObject);
        const possibleClassesLower = ['a', 'b', 'c'].filter(c => c !== correctClass.toLowerCase());

        // Generar opciones incorrectas combinando clase y porción de host
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
         do { // Buscar porción de host incorrecta
             randomIpForPortion = generateRandomIp();
             randomInfoForPortion = getIpInfo(randomIpForPortion);
             if (randomInfoForPortion.defaultMask !== 'N/A') {
                 incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion;
             }
             portionAttempts++;
         } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50);
        // Opción 1: Misma clase, porción incorrecta
        if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) {
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_host_portion', portionValue: incorrectHostPortion });
        } else { // Fallback
            let fallbackPortion = (correctClass !== 'C') ? `${getRandomInt(1,254)}` : `${getRandomInt(0,255)}.${getRandomInt(1,254)}`;
            options.push({ classKey: `option_class_${correctClass.toLowerCase()}`, portionKey: 'option_host_portion', portionValue: fallbackPortion });
        }
        // Opción 2: Clase incorrecta, misma porción
        if (possibleClassesLower.length > 0) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, portionKey: 'option_host_portion', portionValue: correctHostPortion || 'None' });
        }
        // Opción 3: Clase incorrecta, porción incorrecta
        if (possibleClassesLower.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) {
            options.push({ classKey: `option_class_${possibleClassesLower[0]}`, portionKey: 'option_host_portion', portionValue: incorrectHostPortion });
        }
        // Rellenar hasta 4 opciones asegurando unicidad
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) {
            const randomClassKey = `option_class_${['a', 'b', 'c'][getRandomInt(0, 2)]}`; // minúscula
            let randomPortion = ''; // Generar porción aleatoria basada en clase aleatoria
            if (randomClassKey === 'option_class_a') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else if (randomClassKey === 'option_class_b') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else randomPortion = `${getRandomInt(1, 254)}`;
            const potentialOption = { classKey: randomClassKey, portionKey: 'option_host_portion', portionValue: randomPortion };
            const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`;
            if (!existingOptionsStr.has(potentialOptionStr)) {
                options.push(potentialOption);
                existingOptionsStr.add(potentialOptionStr);
            }
        }
        options = options.slice(0, 4); shuffleArray(options);
        // --- FIN CORRECCIÓN ---

        // Info para generar tabla de cálculo de porciones
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        return { question, options, correctAnswer: correctAnswerObject, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateClassAndHostPortionQuestion:", error); return null; }
}

/** Genera preguntas sobre los bloques privados RFC 1918 (CIDR, Rango, Clase) */
function generateRfc1918Question() {
    try {
        const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
        const rfc1918Blocks = [ { cidr: '/8', range: '10.0.0.0 - 10.255.255.255', blockStart: '10.0.0.0', class: 'A', blockId: '10.0.0.0/8' }, { cidr: '/12', range: '172.16.0.0 - 172.31.255.255', blockStart: '172.16.0.0', class: 'B', blockId: '172.16.0.0/12' }, { cidr: '/16', range: '192.168.0.0 - 192.168.255.255', blockStart: '192.168.0.0', class: 'C', blockId: '192.168.0.0/16' } ];
        const otherCidrs = ['/10', '/20', '/24', '/28']; const possibleClasses = ['A', 'B', 'C'];
        const chosenBlock = rfc1918Blocks[getRandomInt(0, rfc1918Blocks.length - 1)];
        let question = {}; let correctAnswer = ''; let options = []; let explanationInfo = {};
        const questionType = getRandomInt(0, 2);
        const rfcLinkHTML = `<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>`;

        // Generar pregunta y opciones según el tipo
        if (questionType === 0) { // Pregunta CIDR
            question = { key: 'question_rfc1918_cidr_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockStart: `<strong>${chosenBlock.blockStart}</strong>` } };
            correctAnswer = chosenBlock.cidr; // Respuesta es el CIDR
            options = [correctAnswer];
            let incorrectOptions = otherCidrs.filter(c => c !== correctAnswer);
            shuffleArray(incorrectOptions);
            options.push(...incorrectOptions.slice(0, 3));
        } else if (questionType === 1) { // Pregunta Rango
            question = { key: 'question_rfc1918_range_from_cidr', replacements: { rfcLinkHTML: rfcLinkHTML, cidr: `<strong>${chosenBlock.cidr}</strong>` } };
            correctAnswer = chosenBlock.range; // Respuesta es el rango
            options = [correctAnswer];
            let incorrectOptions = rfc1918Blocks.filter(b => b.cidr !== chosenBlock.cidr).map(b => b.range);
            if (incorrectOptions.length < 3) { incorrectOptions.push('8.8.0.0 - 8.8.255.255'); } // Añadir un rango falso
            options.push(...incorrectOptions.slice(0, 3));
        } else { // Pregunta Clase
            const blockIdentifier = chosenBlock.blockId;
            question = { key: 'question_rfc1918_class_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockIdentifier: `<strong>${blockIdentifier}</strong>` } };
            correctAnswer = chosenBlock.class; // Respuesta es la Clase (A, B, C)
            options = [correctAnswer];
            let incorrectOptions = possibleClasses.filter(c => c !== correctAnswer);
            options.push(...incorrectOptions);
        }
        // Barajar y asegurar 4 opciones
        shuffleArray(options);
        if (options.length > 4) options = options.slice(0, 4);
        if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }

        // Info para explicación: tabla de rangos privados
        explanationInfo = {
            generatorName: 'generatePrivateRangeTableHTML',
            args: [chosenBlock.blockStart] // Pasar IP para resaltar
        };
        // Añadir texto base si la pregunta era sobre la clase
        if (questionType === 2) {
            explanationInfo.baseTextKey = 'explanation_rfc1918_class_note';
            explanationInfo.replacements = { blockId: `<strong>${chosenBlock.blockId}</strong>`, class: `<strong>${chosenBlock.class}</strong>` };
        }
        return { question, options, correctAnswer, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateRfc1918Question:", error); return null; }
}

/** Genera preguntas sobre direcciones IP especiales (Loopback, APIPA, Broadcast Limitado) */
function generateSpecialAddressQuestion() {
    try {
        const specialAddresses = [ { ip: '127.0.0.1', type: 'Loopback', descriptionKey: 'option_loopback' }, { ip: `169.254.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`, type: 'APIPA', descriptionKey: 'option_apipa' }, { ip: '255.255.255.255', type: 'Broadcast Limitado', descriptionKey: 'option_limited_broadcast' } ];
        const normalIpTypeKeys = ['option_public', 'option_private']; // Claves para tipos normales
        const pickSpecial = Math.random() < 0.6; // 60% prob. de preguntar por una especial
        let targetIp = '';
        let correctAnswerKey = ''; // Clave i18n de la respuesta correcta
        let questionFormat = getRandomInt(0, 1); // 0: Dada IP, ¿qué tipo? 1: Dada tipo, ¿qué IP?
        let chosenSpecialType = ''; // Para la explicación ('Loopback', 'APIPA', etc.)
        let explanationInfo = {};

        if (pickSpecial) { // Pregunta sobre IP especial
            const chosenSpecial = specialAddresses[getRandomInt(0, specialAddresses.length - 1)];
            targetIp = chosenSpecial.ip;
            correctAnswerKey = chosenSpecial.descriptionKey;
            chosenSpecialType = chosenSpecial.type;
            // Info para explicación de dirección especial
            explanationInfo = {
                generatorName: 'generateSpecialAddressExplanationHTML',
                args: [chosenSpecialType] // Pasar el tipo
            };

            if (questionFormat === 0) { // Dada IP especial, preguntar tipo
                const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
                let options = [correctAnswerKey]; // Opciones son claves i18n
                let incorrectOptions = specialAddresses.filter(s => s.type !== chosenSpecial.type).map(s => s.descriptionKey);
                incorrectOptions.push(...normalIpTypeKeys); // Añadir "Pública", "Privada" como incorrectas
                shuffleArray(incorrectOptions);
                options.push(...incorrectOptions.slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswerKey)) { options.pop(); options.push(correctAnswerKey); shuffleArray(options); }
                return { question, options, correctAnswer: correctAnswerKey, explanation: explanationInfo };
            } else { // Dado tipo especial, preguntar IP
                const typeDescription = getTranslation(correctAnswerKey); // Obtener descripción traducida
                const question = { key: 'question_special_which_is_type', replacements: { typeDescription: `<strong>${typeDescription}</strong>` } };
                let options = [targetIp]; // Opciones son IPs
                let incorrectIps = new Set();
                // Generar IPs normales incorrectas
                while (incorrectIps.size < 2) {
                    let ip = generateRandomIp();
                    if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); }
                }
                // Añadir otra IP especial como incorrecta
                let otherSpecial = specialAddresses.find(s => s.type !== chosenSpecial.type);
                if (otherSpecial) { incorrectIps.add(otherSpecial.ip); }
                else { // Si solo quedan 2 tipos especiales, generar otra normal
                    while (incorrectIps.size < 3) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } }
                }
                options.push(...Array.from(incorrectIps).slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(targetIp)) { options.pop(); options.push(targetIp); shuffleArray(options); }
                return { question, options, correctAnswer: targetIp, explanation: explanationInfo }; // Respuesta es IP
            }
        } else { // Pregunta sobre IP normal (Pública/Privada)
            targetIp = generateRandomIp();
            const info = getIpInfo(targetIp);
            // Si sale especial por casualidad, reintentar
            if (info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') {
                return generateSpecialAddressQuestion();
            }
            correctAnswerKey = `option_${info.type.toLowerCase()}`; // option_public o option_private
            chosenSpecialType = info.type; // Guardar 'Pública' o 'Privada'
            const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
            let options = [correctAnswerKey]; // Opciones son claves i18n
            let incorrectOptions = specialAddresses.map(s => s.descriptionKey); // Añadir tipos especiales como incorrectos
            shuffleArray(incorrectOptions);
            options.push(...incorrectOptions.slice(0, 3));
            shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswerKey)) { options.pop(); options.push(correctAnswerKey); shuffleArray(options); }
            // Explicación es la tabla de rangos privados
            explanationInfo = {
                generatorName: 'generatePrivateRangeTableHTML',
                args: [targetIp] // Pasar IP para resaltar
            };
            return { question, options, correctAnswer: correctAnswerKey, explanation: explanationInfo };
        }
    } catch (error) { console.error("Error en generateSpecialAddressQuestion:", error); return null; }
}

/** Genera pregunta para identificar la porción de red de una IP (con máscara default) */
function generateIdentifyNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.10.50'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = { key: 'question_identify_network_portion', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` } };
        const correctAnswer = portions.networkPortion || getTranslation('option_none'); // Respuesta es valor directo
        let options = new Set([correctAnswer]); // Opciones son valores directos

        // Añadir porción de host como opción incorrecta
        if (portions.hostPortion && portions.hostPortion !== correctAnswer) {
            options.add(portions.hostPortion || getTranslation('option_none'));
        }
        // Añadir porción de red/host de otra IP como incorrectas
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, incorrectHostPortion = null, portionAttempts = 0;
        do {
            randomIpForPortion = generateRandomIp();
            randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') {
                incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion;
                incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion;
            }
            portionAttempts++;
        } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctAnswer) && portionAttempts < 50); // Intentar encontrar una porción de red diferente
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctAnswer) { options.add(incorrectNetworkPortion); }
        if (incorrectHostPortion && incorrectHostPortion !== correctAnswer && !options.has(incorrectHostPortion)) { options.add(incorrectHostPortion || getTranslation('option_none')); }
        // Rellenar hasta 4 opciones con porciones aleatorias
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)];
            let randomPortion = '';
            if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`;
            else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`;
            else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`;
            if (randomPortion !== correctAnswer) { options.add(randomPortion); }
        }
        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); }
        optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);

        // Info para generar tabla de cálculo de porciones
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateIdentifyNetworkPortionQuestion:", error); return null; }
}

/** Genera pregunta para identificar la porción de host de una IP (con máscara default) */
function generateIdentifyHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '172.25.200.15'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = { key: 'question_identify_host_portion', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` } };
        const correctAnswer = portions.hostPortion || getTranslation('option_none'); // Respuesta es valor directo
        let options = new Set([correctAnswer]); // Opciones son valores directos

        // Añadir porción de red como opción incorrecta
        if (portions.networkPortion && portions.networkPortion !== correctAnswer) {
            options.add(portions.networkPortion || getTranslation('option_none'));
        }
        // Añadir porción de red/host de otra IP como incorrectas
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, incorrectNetworkPortion = null, portionAttempts = 0;
        do {
            randomIpForPortion = generateRandomIp();
            randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') {
                incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion;
                incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion;
            }
            portionAttempts++;
        } while ((!incorrectHostPortion || incorrectHostPortion === correctAnswer) && portionAttempts < 50); // Intentar encontrar porción de host diferente
        if (incorrectHostPortion && incorrectHostPortion !== correctAnswer) { options.add(incorrectHostPortion); }
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctAnswer && !options.has(incorrectNetworkPortion)) { options.add(incorrectNetworkPortion || getTranslation('option_none')); }
        // Rellenar hasta 4 opciones con porciones aleatorias
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)];
            let randomPortion = '';
            if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else randomPortion = `${getRandomInt(1, 254)}`;
            if (randomPortion !== correctAnswer) { options.add(randomPortion); }
        }
        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); }
        optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);

        // Info para generar tabla de cálculo de porciones
        const wildcardMask = calculateWildcardMask(info.defaultMask);
        const networkAddr = calculateNetworkAddress(ip, info.defaultMask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateIdentifyHostPortionQuestion:", error); return null; }
}

/**
 * Genera pregunta para calcular la Dir. de Red o Broadcast (con máscara default).
 */
function generateNetworkBroadcastAddressQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '172.18.120.30'; info = getIpInfo(ip); }
        const mask = info.defaultMask;
        const networkAddr = calculateNetworkAddress(ip, mask);
        const wildcardMask = calculateWildcardMask(mask);
        const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        if (!networkAddr || !broadcastAddr || !wildcardMask) { throw new Error("Error calculando direcciones de red/broadcast/wildcard"); }

        const askForNetwork = Math.random() < 0.5; // Decide si preguntar por Red o Broadcast
        const questionTypeKey = askForNetwork ? "address_type_network" : "address_type_broadcast";
        const correctAnswer = askForNetwork ? networkAddr : broadcastAddr; // Respuesta es IP

        const question = { key: 'question_calculate_address', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${mask}</strong>`, addressType: `<strong>${getTranslation(questionTypeKey)}</strong>` } };

        let options = new Set([correctAnswer]); // Opciones son IPs
        // Añadir la otra dirección (si se preguntó por red, añadir broadcast y viceversa)
        const otherAddress = askForNetwork ? broadcastAddr : networkAddr;
        if (otherAddress !== correctAnswer) options.add(otherAddress);
        // Añadir la IP original si es diferente
        if (ip !== correctAnswer && !options.has(ip)) options.add(ip);
        // Añadir red/broadcast de otra IP como incorrectas
        let randomIp2, randomInfo2, randomNetAddr, randomBroadAddr, attempts2 = 0;
        do { // Buscar otra IP válida
            randomIp2 = generateRandomIp();
            randomInfo2 = getIpInfo(randomIp2);
            attempts2++;
        } while ((randomInfo2.class !== 'A' && randomInfo2.class !== 'B' && randomInfo2.class !== 'C' || randomInfo2.type === 'Loopback') && attempts2 < 50);
        if (randomInfo2.defaultMask !== 'N/A') {
            randomNetAddr = calculateNetworkAddress(randomIp2, randomInfo2.defaultMask);
            const randomWildcard = calculateWildcardMask(randomInfo2.defaultMask);
            if (randomNetAddr && randomWildcard) {
                randomBroadAddr = calculateBroadcastAddress(randomNetAddr, randomWildcard);
                if (randomNetAddr && randomNetAddr !== correctAnswer && !options.has(randomNetAddr)) options.add(randomNetAddr);
                if (randomBroadAddr && randomBroadAddr !== correctAnswer && !options.has(randomBroadAddr)) options.add(randomBroadAddr);
            }
        }
        // Rellenar hasta 4 opciones con IPs aleatorias
        while (options.size < 4) {
            let randomOptionIp = generateRandomIp();
            if (randomOptionIp !== correctAnswer && !options.has(randomOptionIp)) {
                options.add(randomOptionIp);
            }
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); }
        optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);

        // Info para generar tabla de cálculo de porciones
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, mask, wildcardMask, networkAddr, broadcastAddr]
        };
        return { question, options: optionsArray, correctAnswer, explanation: explanationInfo };

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
    generateNetworkBroadcastAddressQuestion
];

// TODO: Crear array professionalQuestionGenerators = [...] para el siguiente nivel

// --- Función Principal para Obtener Pregunta ---
/**
 * Selecciona aleatoriamente un generador de preguntas para el nivel dado y lo ejecuta.
 * @param {string} level - El nivel actual ('Entry', 'Associate', 'Professional').
 * @returns {object|null} Los datos de la pregunta generada o null si hay error.
 */
export function getNextQuestion(level) {
     let generators = [];
     // Seleccionar el array de generadores correcto
     if (level === 'Entry') { generators = entryQuestionGenerators; }
     else if (level === 'Associate') { generators = associateQuestionGenerators; }
     else if (level === 'Professional') {
         // TODO: Asignar professionalQuestionGenerators cuando se implementen
         console.warn("Generadores de nivel Professional aún no implementados.");
         return null; // Devolver null por ahora
        }
     else {
         console.error("Nivel desconocido solicitado:", level);
         return null;
        }

     // Verificar que haya generadores para el nivel
     if (!generators || generators.length === 0) {
         console.warn(`No hay generadores de preguntas definidos para el nivel: ${level}`);
         return null;
        }

     // Elegir un generador al azar
     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     // Ejecutar el generador y validar el resultado
     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             const questionData = generatorFunction();
             // Validación básica del objeto devuelto
             if (questionData && questionData.question && Array.isArray(questionData.options) && questionData.options.length > 0 && questionData.correctAnswer !== undefined && questionData.explanation !== undefined) {
                 return questionData; // Devolver datos válidos
             } else {
                 console.error(`El generador ${generatorFunction.name} devolvió datos inválidos o incompletos.`, questionData);
                 return null; // Devolver null si los datos son inválidos
             }
         } catch (error) {
             console.error(`Error al ejecutar el generador ${generatorFunction.name}:`, error);
             return null; // Devolver null si hubo un error en la ejecución
            }
     } else {
         console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`);
         return null;
        }
}
