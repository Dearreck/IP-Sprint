// js/questions.js
// ==================================================
// Módulo Generador de Preguntas para IP Sprint
// ==================================================

// --- Importaciones ---
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML,
    generateSpecialAddressExplanationHTML // Importar NUEVA utilidad de explicación
} from './utils.js';

// --- Generadores de Preguntas (Nivel Entry) ---
// (Funciones generateClassQuestion, generateTypeQuestion, etc. sin cambios)
function generateClassQuestion() { try { const ip = generateRandomIp(); const info = getIpInfo(ip); if (info.class === 'N/A') return generateClassQuestion(); const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`; const options = ['A', 'B', 'C', 'D', 'E']; const correct = info.class; const explanation = generateClassRangeTableHTML(correct); return { question, options, correctAnswer: correct, explanation }; } catch (error) { console.error("Error en generateClassQuestion:", error); return null; } }
function generateTypeQuestion() { try { let ip, info, attempts = 0; let forcePrivate = Math.random() < 0.4; ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp(); info = getIpInfo(ip); while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 50) { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; } if (info.type === 'N/A' || info.type === 'Loopback') { ip = '8.8.8.8'; info = getIpInfo(ip); } const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`; const options = ['Pública', 'Privada']; const correct = info.type; const explanation = generatePrivateRangeTableHTML(ip); return { question, options, correctAnswer: correct, explanation }; } catch (error) { console.error("Error en generateTypeQuestion:", error); return null; } }
function generateDefaultMaskQuestion() { try { let ip, info, attempts = 0; do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100); if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); } const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`; const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; const correct = info.defaultMask; const explanation = generateClassMaskTableHTML(info.class); const finalCorrectAnswer = options.includes(correct) ? correct : options[0]; return { question, options, correctAnswer: finalCorrectAnswer, explanation }; } catch (error) { console.error("Error en generateDefaultMaskQuestion:", error); return null; } }
function generateSelectClassQuestion() { try{ const targetClasses = ['A', 'B', 'C']; const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)]; const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`; let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set(); while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class === targetClass && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; } if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); } attempts = 0; while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; } if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1']; for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) { incorrectIps.push(fb); ipSet.add(fb); } } } incorrectIps = incorrectIps.slice(0, 3); const options = [correctIp, ...incorrectIps]; shuffleArray(options); const correct = correctIp; const explanation = `Se busca una IP de Clase ${targetClass}. La correcta es ${correct}.<br>${generateClassRangeTableHTML(targetClass)}`; return { question, options, correctAnswer: correct, explanation }; } catch (error) { console.error("Error en generateSelectClassQuestion:", error); return null; } }
function generateSelectPrivateIpQuestion() { try { const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`; let correctIp = generateRandomPrivateIp(); let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]); while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; } if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1']; for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb)) { incorrectIps.push(fb); ipSet.add(fb); } } } incorrectIps = incorrectIps.slice(0, 3); const options = [correctIp, ...incorrectIps]; shuffleArray(options); const correct = correctIp; const explanation = generatePrivateRangeTableHTML(correct); return { question, options, correctAnswer: correct, explanation }; } catch (error) { console.error("Error en generateSelectPrivateIpQuestion:", error); return null; } }
function generateSelectIpByDefaultMaskQuestion() { try { const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)]; const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`; let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set(); while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask === targetMask && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; } if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); } attempts = 0; while (incorrectIps.length < 3 && attempts < 300) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && info.type !== 'Loopback' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; } if(incorrectIps.length < 3) { const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5', '126.1.1.1', '191.1.1.1']; for (const fb of fallbacks) { let fbInfo = getIpInfo(fb); if (incorrectIps.length < 3 && !ipSet.has(fb) && fbInfo.defaultMask !== targetMask && fbInfo.defaultMask !== 'N/A') { incorrectIps.push(fb); ipSet.add(fb); } } } incorrectIps = incorrectIps.slice(0, 3); const options = [correctIp, ...incorrectIps]; shuffleArray(options); const correct = correctIp; const correctClass = getIpInfo(correct).class; const explanation = `Se busca una IP cuya clase (${correctClass}) tenga la máscara por defecto ${targetMask}.<br>${generateClassMaskTableHTML(correctClass)}`; return { question, options, correctAnswer: correct, explanation }; } catch (error) { console.error("Error en generateSelectIpByDefaultMaskQuestion:", error); return null; } }

// --- Generadores de Preguntas (Nivel Associate) ---

/** Genera pregunta: Clase y Tipo */
function generateClassAndTypeQuestion() { try { let ip, info, attempts = 0; do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100); if (attempts >= 100) { ip = Math.random() < 0.5 ? '172.20.1.1' : '10.10.10.10'; info = getIpInfo(ip); } const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Tipo?`; const correctClass = info.class; const correctType = info.type; const correctAnswerText = `Clase ${correctClass}, ${correctType}`; let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); const possibleTypes = ['Pública', 'Privada'].filter(t => t !== correctType); if (possibleTypes.length > 0) { options.add(`Clase ${correctClass}, ${possibleTypes[0]}`); } if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, ${correctType}`); } if (possibleClasses.length > 0 && possibleTypes.length > 0) { options.add(`Clase ${possibleClasses[0]}, ${possibleTypes[0]}`); } while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; const randomType = ['Pública', 'Privada'][getRandomInt(0, 1)]; const potentialOption = `Clase ${randomClass}, ${randomType}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } } let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray); const explanation = `${generateClassRangeTableHTML(correctClass)}<hr style="margin: 10px 0;">${generatePrivateRangeTableHTML(ip)}`; return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation }; } catch (error) { console.error("Error en generateClassAndTypeQuestion:", error); return null; } }

/** Genera pregunta: Clase y Máscara por Defecto */
function generateClassAndDefaultMaskQuestion() { try { let ip, info, attempts = 0; do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100); if (attempts >= 100) { ip = '172.16.50.50'; info = getIpInfo(ip); } const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Máscara por Defecto?`; const correctClass = info.class; const correctMask = info.defaultMask; const correctAnswerText = `Clase ${correctClass}, Máscara ${correctMask}`; let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); const possibleMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'].filter(m => m !== correctMask); if (possibleMasks.length > 0) { options.add(`Clase ${correctClass}, Máscara ${possibleMasks[0]}`); } if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Máscara ${correctMask}`); } if (possibleClasses.length > 0) { let incorrectMaskForIncorrectClass = '255.255.255.255'; if (possibleClasses[0] === 'A' && possibleMasks.includes('255.0.0.0')) incorrectMaskForIncorrectClass = '255.0.0.0'; else if (possibleClasses[0] === 'B' && possibleMasks.includes('255.255.0.0')) incorrectMaskForIncorrectClass = '255.255.0.0'; else if (possibleClasses[0] === 'C' && possibleMasks.includes('255.255.255.0')) incorrectMaskForIncorrectClass = '255.255.255.0'; else if (possibleMasks.length > 0) incorrectMaskForIncorrectClass = possibleMasks[0]; const incorrectCombination = `Clase ${possibleClasses[0]}, Máscara ${incorrectMaskForIncorrectClass}`; if (!options.has(incorrectCombination)) { options.add(incorrectCombination); } } while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; const randomMask = ['255.0.0.0', '255.255.0.0', '255.255.255.0'][getRandomInt(0, 2)]; const potentialOption = `Clase ${randomClass}, Máscara ${randomMask}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } } let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray); const explanation = generateClassMaskTableHTML(correctClass); return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation }; } catch (error) { console.error("Error en generateClassAndDefaultMaskQuestion:", error); return null; } }

/** Genera pregunta: Clase y Porción de Red (con máscara default) */
function generateClassAndNetworkPortionQuestion() { try { let ip, info, portions, attempts = 0; do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100); if (!portions) { ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); } const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Porción de Red (usando máscara default)?`; const correctClass = info.class; const correctNetworkPortion = portions.networkPortion; if (!correctNetworkPortion && correctNetworkPortion !== "") throw new Error(`No se pudo obtener networkPortion para ${ip}`); const correctAnswerText = `Clase ${correctClass}, Red ${correctNetworkPortion || 'Ninguna'}`; let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0; do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; } portionAttempts++; } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50); if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`Clase ${correctClass}, Red ${incorrectNetworkPortion}`); } else { if (correctClass !== 'A') options.add(`Clase ${correctClass}, Red ${getRandomInt(1,126)}`); else options.add(`Clase ${correctClass}, Red ${getRandomInt(128,191)}.${getRandomInt(0,255)}`); } if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Red ${correctNetworkPortion || 'Ninguna'}`); } if (possibleClasses.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`Clase ${possibleClasses[0]}, Red ${incorrectNetworkPortion}`); } while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`; else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`; const potentialOption = `Clase ${randomClass}, Red ${randomPortion}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } } let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray); const explanation = generatePortionExplanationHTML(ip, info.defaultMask, correctClass, correctNetworkPortion, portions.hostPortion); return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation }; } catch (error) { console.error("Error en generateClassAndNetworkPortionQuestion:", error); return null; } }

/** Genera pregunta: Clase y Porción de Host (con máscara default) */
function generateClassAndHostPortionQuestion() { try { let ip, info, portions, attempts = 0; do { ip = generateRandomIp(); info = getIpInfo(ip); if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); } else { portions = null; } attempts++; } while (!portions && attempts < 100); if (!portions) { ip = '172.16.10.20'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); } const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Porción de Host (usando máscara default)?`; const correctClass = info.class; const correctHostPortion = portions.hostPortion; if (!correctHostPortion && correctHostPortion !== "") throw new Error(`No se pudo obtener hostPortion para ${ip}`); const correctAnswerText = `Clase ${correctClass}, Host ${correctHostPortion || 'Ninguna'}`; let options = new Set([correctAnswerText]); const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0; do { randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion); if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; } portionAttempts++; } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50); if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`Clase ${correctClass}, Host ${incorrectHostPortion}`); } else { if (correctClass !== 'C') options.add(`Clase ${correctClass}, Host ${getRandomInt(1,254)}`); else options.add(`Clase ${correctClass}, Host ${getRandomInt(0,255)}.${getRandomInt(1,254)}`); } if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Host ${correctHostPortion || 'Ninguna'}`); } if (possibleClasses.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`Clase ${possibleClasses[0]}, Host ${incorrectHostPortion}`); } while (options.size < 4) { const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = ''; if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`; else randomPortion = `${getRandomInt(1, 254)}`; const potentialOption = `Clase ${randomClass}, Host ${randomPortion}`; if (potentialOption !== correctAnswerText) { options.add(potentialOption); } } let optionsArray = Array.from(options); if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); } optionsArray = optionsArray.slice(0, 4); shuffleArray(optionsArray); const explanation = generatePortionExplanationHTML(ip, info.defaultMask, correctClass, portions.networkPortion, correctHostPortion); return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation }; } catch (error) { console.error("Error en generateClassAndHostPortionQuestion:", error); return null; } }

/**
 * Genera preguntas sobre los bloques privados RFC 1918 (CIDR, Rango, Clase).
 * Incluye enlace al RFC en la pregunta y explicación.
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateRfc1918Question() {
    try {
        const rfcLink = 'https://datatracker.ietf.org/doc/html/rfc1918'; // Enlace RFC 1918
        const rfc1918Blocks = [
            { cidr: '/8', range: '10.0.0.0 - 10.255.255.255', blockStart: '10.0.0.0', class: 'A' },
            { cidr: '/12', range: '172.16.0.0 - 172.31.255.255', blockStart: '172.16.0.0', class: 'B' },
            { cidr: '/16', range: '192.168.0.0 - 192.168.255.255', blockStart: '192.168.0.0', class: 'C' }
        ];
        const otherCidrs = ['/10', '/20', '/24', '/28'];
        const possibleClasses = ['A', 'B', 'C'];

        const chosenBlock = rfc1918Blocks[getRandomInt(0, rfc1918Blocks.length - 1)];
        let question = ''; let correctAnswer = ''; let options = []; let explanation = '';
        const questionType = getRandomInt(0, 2); // 0: CIDR, 1: Rango, 2: Clase

        // Añadir enlace al RFC en la pregunta general
        const rfcLinkHTML = `<a href="${rfcLink}" target="_blank" rel="noopener noreferrer">RFC 1918</a>`;

        if (questionType === 0) {
            question = `Según ${rfcLinkHTML}, ¿qué notación CIDR corresponde al bloque privado que comienza en <strong>${chosenBlock.blockStart}</strong>?`;
            correctAnswer = chosenBlock.cidr;
            options = [correctAnswer];
            let incorrectOptions = otherCidrs.filter(c => c !== correctAnswer);
            shuffleArray(incorrectOptions);
            options.push(...incorrectOptions.slice(0, 3));
        } else if (questionType === 1) {
            question = `Según ${rfcLinkHTML}, ¿qué rango de direcciones corresponde al bloque privado definido como <strong>${chosenBlock.cidr}</strong>?`;
            correctAnswer = chosenBlock.range;
            options = [correctAnswer];
            let incorrectOptions = rfc1918Blocks.filter(b => b.cidr !== chosenBlock.cidr).map(b => b.range);
            if (incorrectOptions.length < 3) { incorrectOptions.push('8.8.0.0 - 8.8.255.255'); }
            options.push(...incorrectOptions.slice(0, 3));
        } else {
            const blockIdentifier = Math.random() < 0.5 ? chosenBlock.cidr : chosenBlock.blockStart;
            question = `El bloque privado ${rfcLinkHTML} <strong>${blockIdentifier}</strong> pertenece originalmente a la Clase:`;
            correctAnswer = chosenBlock.class;
            options = [correctAnswer];
            let incorrectOptions = possibleClasses.filter(c => c !== correctAnswer);
            options.push(...incorrectOptions);
        }

        shuffleArray(options);
        if (options.length > 4) options = options.slice(0, 4);
        if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }

        // La explicación ya incluye el enlace al RFC a través de la función de utilidad
        explanation = generatePrivateRangeTableHTML(chosenBlock.blockStart);
        if (questionType === 2) {
            explanation += `<p style="font-size:0.9em; text-align:center; margin-top:5px;">Este bloque usa direcciones que caen dentro del rango original de la <strong>Clase ${chosenBlock.class}</strong>.</p>`;
        }

        return { question, options, correctAnswer, explanation };
    } catch (error) {
        console.error("Error en generateRfc1918Question:", error);
        return null;
    }
}

/**
 * NUEVA FUNCIÓN: Genera preguntas sobre direcciones IP especiales.
 * (Loopback, APIPA, Broadcast Limitado)
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateSpecialAddressQuestion() {
    try {
        const specialAddresses = [
            { ip: '127.0.0.1', type: 'Loopback', description: 'Dirección de Loopback' },
            { ip: `169.254.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`, type: 'APIPA', description: 'Dirección APIPA (Link-Local)' },
            { ip: '255.255.255.255', type: 'Broadcast Limitado', description: 'Broadcast Limitado' }
        ];
        const normalIpTypes = ['Pública', 'Privada']; // Tipos normales para opciones incorrectas

        // Elige aleatoriamente una dirección especial o una normal
        const pickSpecial = Math.random() < 0.6; // 60% de probabilidad de preguntar por una especial
        let targetIp = '';
        let correctAnswer = '';
        let questionFormat = getRandomInt(0, 1); // 0: "¿Qué tipo es X?", 1: "¿Cuál es de tipo Y?"

        if (pickSpecial) {
            // Pregunta sobre una dirección especial
            const chosenSpecial = specialAddresses[getRandomInt(0, specialAddresses.length - 1)];
            targetIp = chosenSpecial.ip;
            correctAnswer = chosenSpecial.description; // Usar descripción como respuesta correcta

            if (questionFormat === 0) {
                // Formato: Dada la IP especial, preguntar su tipo
                const question = `La dirección IP <strong>${targetIp}</strong> es una dirección de tipo:`;
                let options = [correctAnswer];
                // Añadir otros tipos especiales y tipos normales como incorrectos
                let incorrectOptions = specialAddresses.filter(s => s.type !== chosenSpecial.type).map(s => s.description);
                incorrectOptions.push(...normalIpTypes);
                shuffleArray(incorrectOptions);
                options.push(...incorrectOptions.slice(0, 3));
                shuffleArray(options);
                if (options.length > 4) options = options.slice(0, 4);
                if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }

                const explanation = generateSpecialAddressExplanationHTML(chosenSpecial.type);
                return { question, options, correctAnswer, explanation };

            } else {
                // Formato: Preguntar cuál de las opciones es de un tipo especial específico
                const question = `¿Cuál de las siguientes es una dirección de <strong>${correctAnswer}</strong>?`;
                let options = [targetIp]; // La IP especial correcta
                let incorrectIps = new Set();
                // Añadir IPs normales (públicas/privadas)
                while (incorrectIps.size < 2) {
                    let ip = generateRandomIp();
                    if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { // Evitar otras especiales
                        incorrectIps.add(ip);
                    }
                }
                // Añadir otra IP especial (diferente) si es posible
                let otherSpecial = specialAddresses.find(s => s.type !== chosenSpecial.type);
                if (otherSpecial) {
                    incorrectIps.add(otherSpecial.ip);
                } else { // Si no, añadir otra normal
                     while (incorrectIps.size < 3) {
                         let ip = generateRandomIp();
                         if (getIpInfo(ip).type !== 'Loopback' && getIpInfo(ip).type !== 'APIPA') { incorrectIps.add(ip); }
                     }
                }
                options.push(...Array.from(incorrectIps).slice(0, 3));
                shuffleArray(options);
                 if (options.length > 4) options = options.slice(0, 4);
                 if (!options.includes(targetIp)) { options.pop(); options.push(targetIp); shuffleArray(options); }

                const explanation = generateSpecialAddressExplanationHTML(chosenSpecial.type);
                return { question, options, correctAnswer: targetIp, explanation };
            }

        } else {
            // Pregunta trampa: mostrar una IP normal y preguntar si es especial
            targetIp = generateRandomIp(); // Genera una IP normal (pública o privada)
            const info = getIpInfo(targetIp);
            correctAnswer = info.type; // La respuesta correcta es 'Pública' o 'Privada'
            const question = `La dirección IP <strong>${targetIp}</strong> es de tipo:`;
            let options = [correctAnswer];
            // Añadir tipos especiales como opciones incorrectas
            let incorrectOptions = specialAddresses.map(s => s.description);
            shuffleArray(incorrectOptions);
            options.push(...incorrectOptions.slice(0, 3));
            shuffleArray(options);
             if (options.length > 4) options = options.slice(0, 4);
             if (!options.includes(correctAnswer)) { options.pop(); options.push(correctAnswer); shuffleArray(options); }

            // Explicación basada en si es pública o privada
            const explanation = generatePrivateRangeTableHTML(targetIp);
            return { question, options, correctAnswer, explanation };
        }

    } catch (error) {
        console.error("Error en generateSpecialAddressQuestion:", error);
        return null;
    }
}


// --- Agrupar Generadores por Nivel ---

const entryQuestionGenerators = [
    generateClassQuestion, generateTypeQuestion, generateDefaultMaskQuestion,
    generateSelectClassQuestion, generateSelectPrivateIpQuestion, generateSelectIpByDefaultMaskQuestion
];

// Array para generadores de nivel Associate
const associateQuestionGenerators = [
    generateClassAndTypeQuestion,
    generateClassAndDefaultMaskQuestion,
    generateClassAndNetworkPortionQuestion,
    generateClassAndHostPortionQuestion,
    generateRfc1918Question,
    generateSpecialAddressQuestion, // <-- Nueva función añadida
    // TODO: Añadir generador para:
    // generateNetworkBroadcastAddressQuestion
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
