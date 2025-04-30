// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// ... (Importaciones y funciones auxiliares igual que antes) ...
// ==================================================

// --- Importaciones de Módulos ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    // Importamos las funciones generadoras de tablas directamente
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML,
    calculateNetworkAddress, calculateBroadcastAddress, calculateWildcardMask
} from './utils.js';

import { getTranslation } from './i18n.js';

// --- Generadores de Preguntas (Nivel Entry) ---

/**
 * Genera una pregunta sobre la Clase (A, B, C, D, E) de una IP dada.
 */
function generateClassQuestion() {
    try {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'N/A') return generateClassQuestion();

        const question = { key: 'question_given_ip_what_class', replacements: { ip: `<strong>${ip}</strong>` } };
        const options = ['A', 'B', 'C', 'D', 'E'];
        const correct = info.class;
        // --- MODIFICADO: Guardar info para generar tabla ---
        const explanationInfo = {
            generatorName: 'generateClassRangeTableHTML',
            args: [correct] // Argumentos para la función
        };
        // --- FIN MODIFICADO ---
        return { question, options, correctAnswer: correct, explanation: explanationInfo }; // Devolver info
    } catch (error) {
        console.error("Error en generateClassQuestion:", error);
        return null;
    }
 }

/**
 * Genera una pregunta sobre el Tipo (Pública o Privada) de una IP dada.
 */
function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        let forcePrivate = Math.random() < 0.4;
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        while ((info.type === 'N/A' || info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') && attempts < 50) {
            ip = generateRandomIp(); info = getIpInfo(ip); attempts++;
        }
        if (info.type !== 'Pública' && info.type !== 'Privada') { ip = '8.8.8.8'; info = getIpInfo(ip); }

        const question = { key: 'question_given_ip_what_type', replacements: { ip: `<strong>${ip}</strong>` } };
        const options = ['option_public', 'option_private'];
        const correct = (info.type === 'Pública') ? 'option_public' : 'option_private';
        // --- MODIFICADO ---
        const explanationInfo = {
            generatorName: 'generatePrivateRangeTableHTML',
            args: [ip]
        };
        // --- FIN MODIFICADO ---
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateTypeQuestion:", error);
        return null;
    }
}

/**
 * Genera una pregunta sobre la Máscara de Subred por Defecto de una IP (Clase A, B o C).
 */
function generateDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }

        const question = { key: 'question_given_ip_what_mask', replacements: { ip: `<strong>${ip}</strong>`, class: info.class } };
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const correct = info.defaultMask;
        // --- MODIFICADO ---
        const explanationInfo = {
            generatorName: 'generateClassMaskTableHTML',
            args: [info.class]
        };
        // --- FIN MODIFICADO ---
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0];
        return { question, options, correctAnswer: finalCorrectAnswer, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateDefaultMaskQuestion:", error);
        return null;
    }
}

/**
 * Genera una pregunta de formato inverso: "¿Cuál de estas IPs es Clase X?".
 */
function generateSelectClassQuestion() {
    try{
        const targetClasses = ['A', 'B', 'C'];
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = { key: 'question_select_ip_for_class', replacements: { targetClass: `<strong>${targetClass}</strong>` } };
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // ... (lógica para generar correctIp e incorrectIps igual que antes) ...
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class === targetClass && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1']; for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) { incorrectIps.push(fb); ipSet.add(fb); } } }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        // --- MODIFICADO ---
        const explanationInfo = {
            // Añadimos una clave de texto base para la explicación
            baseTextKey: 'explanation_select_ip_for_class',
            replacements: { targetClass: targetClass, correctIp: correct },
            // Y la info para generar la tabla
            generatorName: 'generateClassRangeTableHTML',
            args: [targetClass]
        };
        // --- FIN MODIFICADO ---
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSelectClassQuestion:", error);
        return null;
    }
 }

/**
 * Genera una pregunta de formato inverso: "¿Cuál de estas IPs es Privada?".
 */
function generateSelectPrivateIpQuestion() {
    try {
        const question = { key: 'question_select_private_ip' };
        let correctIp = generateRandomPrivateIp();
        let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]);

        // ... (lógica para generar incorrectIps igual que antes) ...
        while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1']; for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb)) { incorrectIps.push(fb); ipSet.add(fb); } } }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        // --- MODIFICADO ---
        const explanationInfo = {
            generatorName: 'generatePrivateRangeTableHTML',
            args: [correct] // Pasamos la IP correcta para que la tabla la resalte
        };
        // --- FIN MODIFICADO ---
        return { question, options, correctAnswer: correct, explanation: explanationInfo };
    } catch (error) {
        console.error("Error en generateSelectPrivateIpQuestion:", error);
        return null;
    }
 }

/**
 * Genera una pregunta de formato inverso: "¿Cuál de estas IPs usaría la máscara X por defecto?".
 */
function generateSelectIpByDefaultMaskQuestion() {
    try {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = { key: 'question_select_ip_for_mask', replacements: { targetMask: `<strong>${targetMask}</strong>` } };
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // ... (lógica para generar correctIp e incorrectIps igual que antes) ...
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask === targetMask && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5', '126.1.1.1', '191.1.1.1']; for (const fb of fallbacks) { let fbInfo = getIpInfo(fb); if (incorrectIps.length < 3 && !ipSet.has(fb) && fbInfo.defaultMask !== targetMask && fbInfo.defaultMask !== 'N/A') { incorrectIps.push(fb); ipSet.add(fb); } } }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const correctClass = getIpInfo(correct).class;
        // --- MODIFICADO ---
        const explanationInfo = {
            baseTextKey: 'explanation_select_ip_for_mask',
            replacements: { class: correctClass, mask: targetMask },
            generatorName: 'generateClassMaskTableHTML',
            args: [correctClass]
        };
        // --- FIN MODIFICADO ---
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
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, typeKey: (correctType === 'Pública' ? 'option_public' : 'option_private') };

        let options = []; options.push(correctAnswerObject);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        const possibleTypeKeys = ['option_public', 'option_private'].filter(k => k !== correctAnswerObject.typeKey);
        if (possibleTypeKeys.length > 0) { options.push({ classKey: `option_class_${correctClass}`, typeKey: possibleTypeKeys[0] }); }
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, typeKey: correctAnswerObject.typeKey }); }
        if (possibleClasses.length > 0 && possibleTypeKeys.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, typeKey: possibleTypeKeys[0] }); }
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.typeKey}`));
        while (options.length < 4) { const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`; const randomTypeKey = ['option_public', 'option_private'][getRandomInt(0, 1)]; const potentialOption = { classKey: randomClassKey, typeKey: randomTypeKey }; const potentialOptionStr = `${potentialOption.classKey},${potentialOption.typeKey}`; if (!existingOptionsStr.has(potentialOptionStr)) { options.push(potentialOption); existingOptionsStr.add(potentialOptionStr); } }
        options = options.slice(0, 4); shuffleArray(options);

        // --- MODIFICADO: Explicación con dos generadores ---
        const explanationInfo = {
            // Usamos un array de generadores
            generators: [
                { generatorName: 'generateClassRangeTableHTML', args: [correctClass] },
                { generatorName: 'generatePrivateRangeTableHTML', args: [ip] }
            ],
            separator: '<hr style="margin: 10px 0;">' // Separador opcional
        };
        // --- FIN MODIFICADO ---
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
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, maskValue: correctMask };

        let options = []; options.push(correctAnswerObject);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);
        if (possibleMasks.length > 0) { options.push({ classKey: `option_class_${correctClass}`, maskValue: possibleMasks[0] }); }
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, maskValue: correctMask }); }
        if (possibleClasses.length > 0) { let incorrectMaskForIncorrectClass = '255.255.255.255'; if (possibleClasses[0] === 'A' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0'; else if (possibleClasses[0] === 'B' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0'; else if (possibleClasses[0] === 'C' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0'; else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0]; const incorrectCombination = { classKey: `option_class_${possibleClasses[0]}`, maskValue: incorrectMaskForIncorrectClass }; if (!options.some(o => o.classKey === incorrectCombination.classKey && o.maskValue === incorrectCombination.maskValue)) { options.push(incorrectCombination); } }
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.maskValue}`));
        while (options.length < 4) { const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`; const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)]; const potentialOption = { classKey: randomClassKey, maskValue: randomMask }; const potentialOptionStr = `${potentialOption.classKey},${potentialOption.maskValue}`; if (!existingOptionsStr.has(potentialOptionStr)) { options.push(potentialOption); existingOptionsStr.add(potentialOptionStr); } }
        options = options.slice(0, 4); shuffleArray(options);

        // --- MODIFICADO ---
        const explanationInfo = {
            generatorName: 'generateClassMaskTableHTML',
            args: [correctClass]
        };
        // --- FIN MODIFICADO ---
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
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || 'None' };

        let options = []; options.push(correctAnswerObject);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; } portionAttempts++; } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion }); } else { let fallbackPortion = (correctClass !== 'A') ? `${getRandomInt(1,126)}` : `${getRandomInt(128,191)}.${getRandomInt(0,255)}`; options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_network_portion', portionValue: fallbackPortion }); }
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_network_portion', portionValue: correctNetworkPortion || 'None' }); }
        if (possibleClasses.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_network_portion', portionValue: incorrectNetworkPortion }); }
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) { const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`; let randomPortion = ''; if (randomClassKey === 'option_class_A') randomPortion = `${getRandomInt(1, 126)}`; else if (randomClassKey === 'option_class_B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`; else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`; const potentialOption = { classKey: randomClassKey, portionKey: 'option_network_portion', portionValue: randomPortion }; const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`; if (!existingOptionsStr.has(potentialOptionStr)) { options.push(potentialOption); existingOptionsStr.add(potentialOptionStr); } }
        options = options.slice(0, 4); shuffleArray(options);

        // --- MODIFICADO ---
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            // Solo generador de tabla
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        // --- FIN MODIFICADO ---
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
        const correctAnswerObject = { classKey: `option_class_${correctClass}`, portionKey: 'option_host_portion', portionValue: correctHostPortion || 'None' };

        let options = []; options.push(correctAnswerObject);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
         do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; } portionAttempts++; } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_host_portion', portionValue: incorrectHostPortion }); } else { let fallbackPortion = (correctClass !== 'C') ? `${getRandomInt(1,254)}` : `${getRandomInt(0,255)}.${getRandomInt(1,254)}`; options.push({ classKey: `option_class_${correctClass}`, portionKey: 'option_host_portion', portionValue: fallbackPortion }); }
        if (possibleClasses.length > 0) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_host_portion', portionValue: correctHostPortion || 'None' }); }
        if (possibleClasses.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.push({ classKey: `option_class_${possibleClasses[0]}`, portionKey: 'option_host_portion', portionValue: incorrectHostPortion }); }
        let existingOptionsStr = new Set(options.map(o => `${o.classKey},${o.portionKey},${o.portionValue}`));
        while (options.length < 4) { const randomClassKey = `option_class_${['A', 'B', 'C'][getRandomInt(0, 2)]}`; let randomPortion = ''; if (randomClassKey === 'option_class_A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else if (randomClassKey === 'option_class_B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else randomPortion = `${getRandomInt(1, 254)}`; const potentialOption = { classKey: randomClassKey, portionKey: 'option_host_portion', portionValue: randomPortion }; const potentialOptionStr = `${potentialOption.classKey},${potentialOption.portionKey},${potentialOption.portionValue}`; if (!existingOptionsStr.has(potentialOptionStr)) { options.push(potentialOption); existingOptionsStr.add(potentialOptionStr); } }
        options = options.slice(0, 4); shuffleArray(options);

        // --- MODIFICADO ---
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        // --- FIN MODIFICADO ---
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

        if (questionType === 0) { /* CIDR from block */ }
        else if (questionType === 1) { /* Range from CIDR */ }
        else { /* Class from block */ }
        // ... (lógica de la pregunta, opciones y correctAnswer igual que antes) ...
        if (questionType === 0) { question = { key: 'question_rfc1918_cidr_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockStart: `<strong>${chosenBlock.blockStart}</strong>` } }; correctAnswer = chosenBlock.cidr; options = [correctAnswer]; let incorrectOptions = otherCidrs.filter(c => c !== correctAnswer); shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3)); }
        else if (questionType === 1) { question = { key: 'question_rfc1918_range_from_cidr', replacements: { rfcLinkHTML: rfcLinkHTML, cidr: `<strong>${chosenBlock.cidr}</strong>` } }; correctAnswer = chosenBlock.range; options = [correctAnswer]; let incorrectOptions = rfc1918Blocks.filter(b => b.cidr !== chosenBlock.cidr).map(b => b.range); if (incorrectOptions.length < 3) { incorrectOptions.push('8.8.0.0 - 8.8.255.255'); } options.push(...incorrectOptions.slice(0, 3)); }
        else { const blockIdentifier = chosenBlock.blockId; question = { key: 'question_rfc1918_class_from_block', replacements: { rfcLinkHTML: rfcLinkHTML, blockIdentifier: `<strong>${blockIdentifier}</strong>` } }; correctAnswer = chosenBlock.class; options = [correctAnswer]; let incorrectOptions = possibleClasses.filter(c => c !== correctAnswer); options.push(...incorrectOptions); }
        shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }

        // --- MODIFICADO ---
        explanationInfo = {
            generatorName: 'generatePrivateRangeTableHTML',
            args: [chosenBlock.blockStart] // Pasamos IP para resaltar
        };
        if (questionType === 2) { // Si la pregunta era sobre la clase, añadimos texto base
            explanationInfo.baseTextKey = 'explanation_rfc1918_class_note';
            explanationInfo.replacements = { blockId: `<strong>${chosenBlock.blockId}</strong>`, class: `<strong>${chosenBlock.class}</strong>` };
        }
        // --- FIN MODIFICADO ---
        return { question, options, correctAnswer, explanation: explanationInfo };
    } catch (error) { console.error("Error en generateRfc1918Question:", error); return null; }
}

/** Genera preguntas sobre direcciones IP especiales (Loopback, APIPA, Broadcast Limitado) */
function generateSpecialAddressQuestion() {
    try {
        const specialAddresses = [ { ip: '127.0.0.1', type: 'Loopback', descriptionKey: 'option_loopback' }, { ip: `169.254.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`, type: 'APIPA', descriptionKey: 'option_apipa' }, { ip: '255.255.255.255', type: 'Broadcast Limitado', descriptionKey: 'option_limited_broadcast' } ];
        const normalIpTypeKeys = ['option_public', 'option_private'];
        const pickSpecial = Math.random() < 0.6; let targetIp = ''; let correctAnswerKey = ''; let questionFormat = getRandomInt(0, 1);
        let chosenSpecialType = ''; // Para la explicación

        if (pickSpecial) {
            const chosenSpecial = specialAddresses[getRandomInt(0, specialAddresses.length - 1)];
            targetIp = chosenSpecial.ip;
            correctAnswerKey = chosenSpecial.descriptionKey;
            chosenSpecialType = chosenSpecial.type; // Guardamos el tipo para la explicación

            if (questionFormat === 0) { // Pregunta: ¿Qué tipo es esta IP especial?
                const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
                let options = [correctAnswerKey];
                let incorrectOptions = specialAddresses.filter(s => s.type !== chosenSpecial.type).map(s => s.descriptionKey);
                incorrectOptions.push(...normalIpTypeKeys);
                shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswerKey)) { options.pop(); options.push(correctAnswerKey); shuffleArray(options); }
                // --- MODIFICADO ---
                const explanationInfo = {
                    generatorName: 'generateSpecialAddressExplanationHTML',
                    args: [chosenSpecialType] // Pasamos el tipo ('Loopback', 'APIPA', etc.)
                };
                // --- FIN MODIFICADO ---
                return { question, options, correctAnswer: correctAnswerKey, explanation: explanationInfo };
            } else { // Pregunta: ¿Cuál de estas IPs es de tipo X?
                const typeDescription = getTranslation(correctAnswerKey);
                const question = { key: 'question_special_which_is_type', replacements: { typeDescription: `<strong>${typeDescription}</strong>` } };
                let options = [targetIp]; let incorrectIps = new Set();
                // ... (lógica para generar opciones incorrectas igual que antes) ...
                while (incorrectIps.size < 2) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } }
                let otherSpecial = specialAddresses.find(s => s.type !== chosenSpecial.type);
                if (otherSpecial) { incorrectIps.add(otherSpecial.ip); } else { while (incorrectIps.size < 3) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } } }
                options.push(...Array.from(incorrectIps).slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(targetIp)) { options.pop(); options.push(targetIp); shuffleArray(options); }
                // --- MODIFICADO ---
                const explanationInfo = {
                    generatorName: 'generateSpecialAddressExplanationHTML',
                    args: [chosenSpecialType]
                };
                // --- FIN MODIFICADO ---
                return { question, options, correctAnswer: targetIp, explanation: explanationInfo };
            }
        } else { // Pregunta sobre IP normal (Pública/Privada)
            targetIp = generateRandomIp(); const info = getIpInfo(targetIp);
            if (info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') { return generateSpecialAddressQuestion(); } // Reintentar si sale especial
            correctAnswerKey = `option_${info.type.toLowerCase()}`;
            chosenSpecialType = info.type; // Guardamos 'Pública' o 'Privada'
            const question = { key: 'question_special_what_type', replacements: { ip: `<strong>${targetIp}</strong>` } };
            let options = [correctAnswerKey];
            let incorrectOptions = specialAddresses.map(s => s.descriptionKey);
            shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
            shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswerKey)) { options.pop(); options.push(correctAnswerKey); shuffleArray(options); }
            // --- MODIFICADO ---
            // Para IPs normales, la explicación es la tabla de rangos privados
            const explanationInfo = {
                generatorName: 'generatePrivateRangeTableHTML',
                args: [targetIp] // Pasamos la IP para resaltar
            };
            // --- FIN MODIFICADO ---
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
        const correctAnswer = portions.networkPortion || getTranslation('option_none');
        let options = new Set([correctAnswer]);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        if (portions.hostPortion && portions.hostPortion !== correctAnswer) { options.add(portions.hostPortion || getTranslation('option_none')); }
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; } portionAttempts++; } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctAnswer) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctAnswer) { options.add(incorrectNetworkPortion); }
        let incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion;
        if (incorrectHostPortion && incorrectHostPortion !== correctAnswer && !options.has(incorrectHostPortion)) { options.add(incorrectHostPortion || getTranslation('option_none')); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`; else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`; if (randomPortion !== correctAnswer) { options.add(randomPortion); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);

        // --- MODIFICADO ---
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        // --- FIN MODIFICADO ---
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
        const correctAnswer = portions.hostPortion || getTranslation('option_none');
        let options = new Set([correctAnswer]);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        if (portions.networkPortion && portions.networkPortion !== correctAnswer) { options.add(portions.networkPortion || getTranslation('option_none')); }
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; } portionAttempts++; } while ((!incorrectHostPortion || incorrectHostPortion === correctAnswer) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctAnswer) { options.add(incorrectHostPortion); }
        let incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion;
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctAnswer && !options.has(incorrectNetworkPortion)) { options.add(incorrectNetworkPortion || getTranslation('option_none')); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else randomPortion = `${getRandomInt(1, 254)}`; if (randomPortion !== correctAnswer) { options.add(randomPortion); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);

        // --- MODIFICADO ---
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr]
        };
        // --- FIN MODIFICADO ---
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
        const mask = info.defaultMask; const networkAddr = calculateNetworkAddress(ip, mask); const wildcardMask = calculateWildcardMask(mask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        if (!networkAddr || !broadcastAddr || !wildcardMask) { throw new Error("Error calculando direcciones de red/broadcast/wildcard"); }

        const askForNetwork = Math.random() < 0.5;
        const questionTypeKey = askForNetwork ? "address_type_network" : "address_type_broadcast";
        const correctAnswer = askForNetwork ? networkAddr : broadcastAddr;

        const question = { key: 'question_calculate_address', replacements: { ip: `<strong>${ip}</strong>`, mask: `<strong>${mask}</strong>`, addressType: `<strong>${getTranslation(questionTypeKey)}</strong>` } };

        let options = new Set([correctAnswer]);
        // ... (lógica para generar opciones incorrectas igual que antes) ...
        const otherAddress = askForNetwork ? broadcastAddr : networkAddr;
        if (otherAddress !== correctAnswer) options.add(otherAddress);
        if (ip !== correctAnswer && !options.has(ip)) options.add(ip);
        let randomIp2, randomInfo2, randomNetAddr, randomBroadAddr, attempts2 = 0;
        do { randomIp2 = generateRandomIp(); randomInfo2 = getIpInfo(randomIp2); attempts2++; } while ((randomInfo2.class !== 'A' && randomInfo2.class !== 'B' && randomInfo2.class !== 'C' || randomInfo2.type === 'Loopback') && attempts2 < 50);
        if (randomInfo2.defaultMask !== 'N/A') { randomNetAddr = calculateNetworkAddress(randomIp2, randomInfo2.defaultMask); const randomWildcard = calculateWildcardMask(randomInfo2.defaultMask); if (randomNetAddr && randomWildcard) { randomBroadAddr = calculateBroadcastAddress(randomNetAddr, randomWildcard); if (randomNetAddr && randomNetAddr !== correctAnswer && !options.has(randomNetAddr)) options.add(randomNetAddr); if (randomBroadAddr && randomBroadAddr !== correctAnswer && !options.has(randomBroadAddr)) options.add(randomBroadAddr); } }
        while (options.size < 4) { let randomOptionIp = generateRandomIp(); if (randomOptionIp !== correctAnswer && !options.has(randomOptionIp)) { options.add(randomOptionIp); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswer)) { optionsArray.pop(); optionsArray.push(correctAnswer); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);

        // --- MODIFICADO ---
        const explanationInfo = {
            generatorName: 'generatePortionExplanationHTML',
            args: [ip, mask, wildcardMask, networkAddr, broadcastAddr]
        };
        // --- FIN MODIFICADO ---
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

// TODO: Crear array professionalQuestionGenerators = [...]

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
             // Validación MÁS SIMPLE ahora que la explicación es un objeto info
             if (questionData && questionData.question && Array.isArray(questionData.options) && questionData.options.length > 0 && questionData.correctAnswer !== undefined && questionData.explanation !== undefined) {
                 return questionData;
             } else {
                 console.error(`El generador ${generatorFunction.name} devolvió datos inválidos o incompletos.`, questionData);
                 return null;
             }
         } catch (error) { console.error(`Error al ejecutar el generador ${generatorFunction.name}:`, error); return null; }
     } else { console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`); return null; }
}
