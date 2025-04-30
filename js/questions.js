// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// ==================================================

// --- Importaciones ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML, generateSpecialAddressExplanationHTML,
    calculateNetworkAddress, calculateBroadcastAddress, calculateWildcardMask
} from './utils.js';
import { getTranslation } from './i18n.js'; // Importar función de traducción

// --- Generadores de Preguntas (Nivel Entry) ---

function generateClassQuestion() {
    try {
        const ip = generateRandomIp(); const info = getIpInfo(ip);
        if (info.class === 'N/A') return generateClassQuestion();
        const question = getTranslation('question_given_ip_what_class', { ip: `<strong>${ip}</strong>` });
        const options = ['A', 'B', 'C', 'D', 'E'];
        const correct = info.class;
        const explanation = generateClassRangeTableHTML(correct);
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) { console.error("Error en generateClassQuestion:", error); return null; }
}

function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0; let forcePrivate = Math.random() < 0.4;
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp(); info = getIpInfo(ip);
        while ((info.type === 'N/A' || info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') && attempts < 50) { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        if (info.type !== 'Pública' && info.type !== 'Privada') { ip = '8.8.8.8'; info = getIpInfo(ip); }
        const question = getTranslation('question_given_ip_what_type', { ip: `<strong>${ip}</strong>` });
        const options = [getTranslation('option_public'), getTranslation('option_private')];
        const correct = getTranslation(`option_${info.type.toLowerCase()}`);
        const explanation = generatePrivateRangeTableHTML(ip);
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) { console.error("Error en generateTypeQuestion:", error); return null; }
}

function generateDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }
        const question = getTranslation('question_given_ip_what_mask', { ip: `<strong>${ip}</strong>`, class: info.class });
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const correct = info.defaultMask;
        const explanation = generateClassMaskTableHTML(info.class);
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0];
        return { question, options, correctAnswer: finalCorrectAnswer, explanation };
    } catch (error) { console.error("Error en generateDefaultMaskQuestion:", error); return null; }
}

function generateSelectClassQuestion() {
    try{
        const targetClasses = ['A', 'B', 'C'];
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = getTranslation('question_select_ip_for_class', { targetClass: `<strong>${targetClass}</strong>` });
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
        while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class === targetClass && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; }
        if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1']; for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) { incorrectIps.push(fb); ipSet.add(fb); } } }
        incorrectIps = incorrectIps.slice(0, 3);
        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        // TODO: Añadir clave explanation_select_ip_for_class a los JSON
        const explanation = `${getTranslation('explanation_select_ip_for_class', { targetClass: targetClass, correctIp: correct })}<br>${generateClassRangeTableHTML(targetClass)}`;
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) { console.error("Error en generateSelectClassQuestion:", error); return null; }
 }

function generateSelectPrivateIpQuestion() {
    try {
        const question = getTranslation('question_select_private_ip');
        let correctIp = generateRandomPrivateIp(); let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]);
        while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
        if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1']; for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb)) { incorrectIps.push(fb); ipSet.add(fb); } } }
        incorrectIps = incorrectIps.slice(0, 3);
        const options = [correctIp, ...incorrectIps];
        shuffleArray(options);
        const correct = correctIp;
        const explanation = generatePrivateRangeTableHTML(correct);
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) { console.error("Error en generateSelectPrivateIpQuestion:", error); return null; }
 }

function generateSelectIpByDefaultMaskQuestion() {
    try {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = getTranslation('question_select_ip_for_mask', { targetMask: `<strong>${targetMask}</strong>` });
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
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
        // --- CORREGIDO: Usar getTranslation para la explicación ---
        const explanation = `${getTranslation('explanation_select_ip_for_mask', { class: correctClass, mask: targetMask })}<br>${generateClassMaskTableHTML(correctClass)}`;
        // --- Fin Corrección ---
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) { console.error("Error en generateSelectIpByDefaultMaskQuestion:", error); return null; }
}


// --- Generadores de Preguntas (Nivel Associate) ---

function generateClassAndTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = Math.random() < 0.5 ? '172.20.1.1' : '10.10.10.10'; info = getIpInfo(ip); }
        const question = getTranslation('question_given_ip_what_class_type', { ip: `<strong>${ip}</strong>` });
        const correctClass = info.class; const correctType = info.type;
        const correctAnswerText = `${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_' + correctType.toLowerCase())}`;
        let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); const possibleTypes = ['Pública', 'Privada'].filter(t => t !== correctType);
        if (possibleTypes.length > 0) { options.add(`${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_' + possibleTypes[0].toLowerCase())}`); }
        if (possibleClasses.length > 0) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_' + correctType.toLowerCase())}`); }
        if (possibleClasses.length > 0 && possibleTypes.length > 0) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_' + possibleTypes[0].toLowerCase())}`); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; const randomType = ['Pública', 'Privada'][getRandomInt(0, 1)]; const potentialOption = `${getTranslation('option_class_' + randomClass)}, ${getTranslation('option_' + randomType.toLowerCase())}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        const explanation = `${generateClassRangeTableHTML(correctClass)}<hr style="margin: 10px 0;">${generatePrivateRangeTableHTML(ip)}`;
        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) { console.error("Error en generateClassAndTypeQuestion:", error); return null; }
}

function generateClassAndDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
        while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '172.16.50.50'; info = getIpInfo(ip); }
        // TODO: Añadir clave 'question_given_ip_what_class_mask' a JSONs
        const question = getTranslation('question_given_ip_what_class_mask', { ip: `<strong>${ip}</strong>` });
        const correctClass = info.class; const correctMask = info.defaultMask;
        // TODO: Añadir clave 'option_mask' a JSONs
        const correctAnswerText = `${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_mask', { mask: correctMask })}`;
        let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask);
        if (possibleMasks.length > 0) { options.add(`${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_mask', { mask: possibleMasks[0] })}`); }
        if (possibleClasses.length > 0) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_mask', { mask: correctMask })}`); }
        if (possibleClasses.length > 0) { let incorrectMaskForIncorrectClass = '255.255.255.255'; if (possibleClasses[0] === 'A' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0'; else if (possibleClasses[0] === 'B' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0'; else if (possibleClasses[0] === 'C' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0'; else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0]; const incorrectCombination = `${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_mask', { mask: incorrectMaskForIncorrectClass })}`; if (!options.has(incorrectCombination)) { options.add(incorrectCombination); } }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)]; const potentialOption = `${getTranslation('option_class_' + randomClass)}, ${getTranslation('option_mask', { mask: randomMask })}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        const explanation = generateClassMaskTableHTML(correctClass);
        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) { console.error("Error en generateClassAndDefaultMaskQuestion:", error); return null; }
}

function generateClassAndNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = getTranslation('question_given_ip_what_class_net_portion', { ip: `<strong>${ip}</strong>` });
        const correctClass = info.class; const correctNetworkPortion = portions.networkPortion;
        if (!correctNetworkPortion && correctNetworkPortion !== "") throw new Error(`No se pudo obtener networkPortion para ${ip}`);
        const correctAnswerText = `${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_network_portion', { portion: correctNetworkPortion || getTranslation('option_none') })}`;
        let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; } portionAttempts++; } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_network_portion', { portion: incorrectNetworkPortion })}`); }
        else { let fallbackPortion = (correctClass !== 'A') ? `${getRandomInt(1,126)}` : `${getRandomInt(128,191)}.${getRandomInt(0,255)}`; options.add(`${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_network_portion', { portion: fallbackPortion })}`); }
        if (possibleClasses.length > 0) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_network_portion', { portion: correctNetworkPortion || getTranslation('option_none') })}`); }
        if (possibleClasses.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_network_portion', { portion: incorrectNetworkPortion })}`); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`; else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`; const potentialOption = `${getTranslation('option_class_' + randomClass)}, ${getTranslation('option_network_portion', { portion: randomPortion })}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr);
        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) { console.error("Error en generateClassAndNetworkPortionQuestion:", error); return null; }
}

function generateClassAndHostPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '172.16.10.20'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = getTranslation('question_given_ip_what_class_host_portion', { ip: `<strong>${ip}</strong>` });
        const correctClass = info.class; const correctHostPortion = portions.hostPortion;
        if (!correctHostPortion && correctHostPortion !== "") throw new Error(`No se pudo obtener hostPortion para ${ip}`);
        const correctAnswerText = `${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_host_portion', { portion: correctHostPortion || getTranslation('option_none') })}`;
        let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
        do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; } portionAttempts++; } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_host_portion', { portion: incorrectHostPortion })}`); }
        else { let fallbackPortion = (correctClass !== 'C') ? `${getRandomInt(1,254)}` : `${getRandomInt(0,255)}.${getRandomInt(1,254)}`; options.add(`${getTranslation('option_class_' + correctClass)}, ${getTranslation('option_host_portion', { portion: fallbackPortion })}`); }
        if (possibleClasses.length > 0) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_host_portion', { portion: correctHostPortion || getTranslation('option_none') })}`); }
        if (possibleClasses.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`${getTranslation('option_class_' + possibleClasses[0])}, ${getTranslation('option_host_portion', { portion: incorrectHostPortion })}`); }
        while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else randomPortion = `${getRandomInt(1, 254)}`; const potentialOption = `${getTranslation('option_class_' + randomClass)}, ${getTranslation('option_host_portion', { portion: randomPortion })}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } }
        let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray);
        const wildcardMask = calculateWildcardMask(info.defaultMask); const networkAddr = calculateNetworkAddress(ip, info.defaultMask); const broadcastAddr = calculateBroadcastAddress(networkAddr, wildcardMask);
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, wildcardMask, networkAddr, broadcastAddr);
        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) { console.error("Error en generateClassAndHostPortionQuestion:", error); return null; }
}

function generateRfc1918Question() {
    try {
        const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918';
        const rfc1918Blocks = [ { cidr: '/8', range: '10.0.0.0 - 10.255.255.255', blockStart: '10.0.0.0', class: 'A', blockId: '10.0.0.0/8' }, { cidr: '/12', range: '172.16.0.0 - 172.31.255.255', blockStart: '172.16.0.0', class: 'B', blockId: '172.16.0.0/12' }, { cidr: '/16', range: '192.168.0.0 - 192.168.255.255', blockStart: '192.168.0.0', class: 'C', blockId: '192.168.0.0/16' } ];
        const otherCidrs = ['/10', '/20', '/24', '/28']; const possibleClasses = ['A', 'B', 'C'];
        const chosenBlock = rfc1918Blocks[getRandomInt(0, rfc1918Blocks.length - 1)];
        let question = ''; let correctAnswer = ''; let options = []; let explanation = '';
        const questionType = getRandomInt(0, 2);
        const rfcLinkHTML = `<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>`;

        if (questionType === 0) {
            question = getTranslation('question_rfc1918_cidr_from_block', { rfcLinkHTML: rfcLinkHTML, blockStart: `<strong>${chosenBlock.blockStart}</strong>` });
            correctAnswer = chosenBlock.cidr; options = [correctAnswer];
            let incorrectOptions = otherCidrs.filter(c => c !== correctAnswer); shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
        } else if (questionType === 1) {
            question = getTranslation('question_rfc1918_range_from_cidr', { rfcLinkHTML: rfcLinkHTML, cidr: `<strong>${chosenBlock.cidr}</strong>` });
            correctAnswer = chosenBlock.range; options = [correctAnswer];
            let incorrectOptions = rfc1918Blocks.filter(b => b.cidr !== chosenBlock.cidr).map(b => b.range);
            if (incorrectOptions.length < 3) { incorrectOptions.push('8.8.0.0 - 8.8.255.255'); } options.push(...incorrectOptions.slice(0, 3));
        } else {
            const blockIdentifier = chosenBlock.blockId;
            question = getTranslation('question_rfc1918_class_from_block', { rfcLinkHTML: rfcLinkHTML, blockIdentifier: `<strong>${blockIdentifier}</strong>` });
            correctAnswer = chosenBlock.class; options = [correctAnswer];
            let incorrectOptions = possibleClasses.filter(c => c !== correctAnswer); options.push(...incorrectOptions);
        }
        shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }
        explanation = generatePrivateRangeTableHTML(chosenBlock.blockStart);
        if (questionType === 2) {
            explanation += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">${getTranslation('explanation_rfc1918_class_note', { blockId: `<strong>${chosenBlock.blockId}</strong>`, class: `<strong>${chosenBlock.class}</strong>` })}</p>`;
        }
        return { question, options, correctAnswer, explanation };
    } catch (error) { console.error("Error en generateRfc1918Question:", error); return null; }
}

function generateSpecialAddressQuestion() {
    try {
        const specialAddresses = [ { ip: '127.0.0.1', type: 'Loopback', descriptionKey: 'option_loopback' }, { ip: `169.254.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`, type: 'APIPA', descriptionKey: 'option_apipa' }, { ip: '255.255.255.255', type: 'Broadcast Limitado', descriptionKey: 'option_limited_broadcast' } ];
        const normalIpTypeKeys = ['option_public', 'option_private'];
        const pickSpecial = Math.random() < 0.6; let targetIp = ''; let correctAnswer = ''; let questionFormat = getRandomInt(0, 1);

        if (pickSpecial) {
            const chosenSpecial = specialAddresses[getRandomInt(0, specialAddresses.length - 1)]; targetIp = chosenSpecial.ip; correctAnswer = getTranslation(chosenSpecial.descriptionKey);
            if (questionFormat === 0) {
                const question = getTranslation('question_special_what_type', { ip: `<strong>${targetIp}</strong>` });
                let options = [correctAnswer];
                let incorrectOptions = specialAddresses.filter(s => s.type !== chosenSpecial.type).map(s => getTranslation(s.descriptionKey));
                incorrectOptions.push(...normalIpTypeKeys.map(k => getTranslation(k)));
                shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }
                const explanation = generateSpecialAddressExplanationHTML(chosenSpecial.type);
                return { question, options, correctAnswer, explanation };
            } else {
                const question = getTranslation('question_special_which_is_type', { typeDescription: `<strong>${correctAnswer}</strong>` });
                let options = [targetIp]; let incorrectIps = new Set();
                while (incorrectIps.size < 2) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } }
                let otherSpecial = specialAddresses.find(s => s.type !== chosenSpecial.type);
                if (otherSpecial) { incorrectIps.add(otherSpecial.ip); } else { while (incorrectIps.size < 3) { let ip = generateRandomIp(); if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); } } }
                options.push(...Array.from(incorrectIps).slice(0, 3));
                shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(targetIp)) { options.pop(); options.push(targetIp); shuffleArray(options); }
                const explanation = generateSpecialAddressExplanationHTML(chosenSpecial.type);
                return { question, options, correctAnswer: targetIp, explanation };
            }
        } else {
            targetIp = generateRandomIp(); const info = getIpInfo(targetIp);
            if (info.type === 'Loopback' || info.type === 'APIPA' || info.type === 'Broadcast Limitado') { return generateSpecialAddressQuestion(); }
            correctAnswer = getTranslation(`option_${info.type.toLowerCase()}`);
            const question = getTranslation('question_special_what_type', { ip: `<strong>${targetIp}</strong>` });
            let options = [correctAnswer];
            let incorrectOptions = specialAddresses.map(s => getTranslation(s.descriptionKey));
            shuffleArray(incorrectOptions); options.push(...incorrectOptions.slice(0, 3));
            shuffleArray(options); if (options.length > 4) options = options.slice(0, 4); if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }
            const explanation = generatePrivateRangeTableHTML(targetIp);
            return { question, options, correctAnswer, explanation };
        }
    } catch (error) { console.error("Error en generateSpecialAddressQuestion:", error); return null; }
}

function generateIdentifyNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.10.50'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }
        const question = getTranslation('question_identify_network_portion', { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` });
        const correctAnswer = portions.networkPortion || getTranslation('option_none');
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
        const question = getTranslation('question_identify_host_portion', { ip: `<strong>${ip}</strong>`, mask: `<strong>${info.defaultMask}</strong>` });
        const correctAnswer = portions.hostPortion || getTranslation('option_none');
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
        const questionType = getTranslation(questionTypeKey);
        const correctAnswer = askForNetwork ? networkAddr : broadcastAddr;

        const question = getTranslation('question_calculate_address', { ip: `<strong>${ip}</strong>`, mask: `<strong>${mask}</strong>`, addressType: `<strong>${questionType}</strong>` });

        let options = new Set([correctAnswer]);
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
             if (questionData && questionData.question && Array.isArray(questionData.options) && questionData.options.length > 0 && questionData.correctAnswer && questionData.explanation !== undefined) {
                 return questionData;
             } else {
                 console.error(`El generador ${generatorFunction.name} devolvió datos inválidos o incompletos.`, questionData);
                 return null;
             }
         } catch (error) { console.error(`Error al ejecutar el generador ${generatorFunction.name}:`, error); return null; }
     } else { console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`); return null; }
}
