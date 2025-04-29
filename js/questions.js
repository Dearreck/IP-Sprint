// js/questions.js
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML,
    getIpPortions, generatePortionExplanationHTML // Importar NUEVA utilidad
} from './utils.js';

// --- Generadores de Preguntas (Nivel Entry) ---
// (Sin cambios aquí, mantenemos las funciones de Entry)
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

/**
 * Genera pregunta: Clase y Porción de Red (con máscara default).
 * @returns {object|null} Objeto de pregunta o null si hay error.
 */
function generateClassAndNetworkPortionQuestion() {
    try {
        let ip, info, portions, attempts = 0;
        do {
            ip = generateRandomIp(); info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); }
            else { portions = null; }
            attempts++;
        } while (!portions && attempts < 100);
        if (!portions) { ip = '192.168.1.100'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Porción de Red (usando máscara default)?`;
        const correctClass = info.class;
        const correctNetworkPortion = portions.networkPortion;
        if (!correctNetworkPortion && correctNetworkPortion !== "") throw new Error(`No se pudo obtener networkPortion para ${ip}`);
        const correctAnswerText = `Clase ${correctClass}, Red ${correctNetworkPortion || 'Ninguna'}`;

        let options = new Set([correctAnswerText]);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);

        // Generar opciones incorrectas
        let randomIpForPortion, randomInfoForPortion, incorrectNetworkPortion = null, portionAttempts = 0;
        do {
            randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectNetworkPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.networkPortion; }
            portionAttempts++;
        } while ((!incorrectNetworkPortion || incorrectNetworkPortion === correctNetworkPortion) && portionAttempts < 50);
        if (incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`Clase ${correctClass}, Red ${incorrectNetworkPortion}`); }
        else { if (correctClass !== 'A') options.add(`Clase ${correctClass}, Red ${getRandomInt(1,126)}`); else options.add(`Clase ${correctClass}, Red ${getRandomInt(128,191)}.${getRandomInt(0,255)}`); }

        if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Red ${correctNetworkPortion || 'Ninguna'}`); }
        if (possibleClasses.length > 0 && incorrectNetworkPortion && incorrectNetworkPortion !== correctNetworkPortion) { options.add(`Clase ${possibleClasses[0]}, Red ${incorrectNetworkPortion}`); }

        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = '';
            if (randomClass === 'A') randomPortion = `${getRandomInt(1, 126)}`;
            else if (randomClass === 'B') randomPortion = `${getRandomInt(128, 191)}.${getRandomInt(0, 255)}`;
            else randomPortion = `${getRandomInt(192, 223)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`;
            const potentialOption = `Clase ${randomClass}, Red ${randomPortion}`;
            if (potentialOption !== correctAnswerText) { options.add(potentialOption); }
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); }
        optionsArray = optionsArray.slice(0, 4);
        shuffleArray(optionsArray);

        // --- MODIFICADO: Usar nueva función para la explicación ---
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, correctClass, correctNetworkPortion, portions.hostPortion);
        // --- Fin Modificación ---

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
        do {
            ip = generateRandomIp(); info = getIpInfo(ip);
            if (info.class === 'A' || info.class === 'B' || info.class === 'C') { portions = getIpPortions(ip, info.defaultMask); }
            else { portions = null; }
            attempts++;
        } while (!portions && attempts < 100);
        if (!portions) { ip = '172.16.10.20'; info = getIpInfo(ip); portions = getIpPortions(ip, info.defaultMask); if (!portions) throw new Error("Fallback IP falló"); }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Porción de Host (usando máscara default)?`;
        const correctClass = info.class;
        const correctHostPortion = portions.hostPortion;
        if (!correctHostPortion && correctHostPortion !== "") throw new Error(`No se pudo obtener hostPortion para ${ip}`);
        const correctAnswerText = `Clase ${correctClass}, Host ${correctHostPortion || 'Ninguna'}`;

        let options = new Set([correctAnswerText]);
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass);

        // Generar opciones incorrectas
        let randomIpForPortion, randomInfoForPortion, incorrectHostPortion = null, portionAttempts = 0;
         do {
            randomIpForPortion = generateRandomIp(); randomInfoForPortion = getIpInfo(randomIpForPortion);
            if (randomInfoForPortion.defaultMask !== 'N/A') { incorrectHostPortion = getIpPortions(randomIpForPortion, randomInfoForPortion.defaultMask)?.hostPortion; }
            portionAttempts++;
        } while ((!incorrectHostPortion || incorrectHostPortion === correctHostPortion) && portionAttempts < 50);
        if (incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`Clase ${correctClass}, Host ${incorrectHostPortion}`); }
        else { if (correctClass !== 'C') options.add(`Clase ${correctClass}, Host ${getRandomInt(1,254)}`); else options.add(`Clase ${correctClass}, Host ${getRandomInt(0,255)}.${getRandomInt(1,254)}`); }

        if (possibleClasses.length > 0) { options.add(`Clase ${possibleClasses[0]}, Host ${correctHostPortion || 'Ninguna'}`); }
        if (possibleClasses.length > 0 && incorrectHostPortion && incorrectHostPortion !== correctHostPortion) { options.add(`Clase ${possibleClasses[0]}, Host ${incorrectHostPortion}`); }

        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)]; let randomPortion = '';
            if (randomClass === 'A') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else if (randomClass === 'B') randomPortion = `${getRandomInt(0, 255)}.${getRandomInt(1, 254)}`;
            else randomPortion = `${getRandomInt(1, 254)}`;
            const potentialOption = `Clase ${randomClass}, Host ${randomPortion}`;
            if (potentialOption !== correctAnswerText) { options.add(potentialOption); }
        }

        let optionsArray = Array.from(options);
        if (!optionsArray.includes(correctAnswerText)) { optionsArray.pop(); optionsArray.push(correctAnswerText); }
        optionsArray = optionsArray.slice(0, 4);
        shuffleArray(optionsArray);

        // --- MODIFICADO: Usar nueva función para la explicación ---
        const explanation = generatePortionExplanationHTML(ip, info.defaultMask, correctClass, portions.networkPortion, correctHostPortion);
        // --- Fin Modificación ---

        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };
    } catch (error) {
        console.error("Error en generateClassAndHostPortionQuestion:", error);
        return null;
    }
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
    // TODO: Añadir generadores para los puntos restantes de Associate:
    // generateRfc1918Question,
    // generateSpecialAddressQuestion,
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
