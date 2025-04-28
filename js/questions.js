// js/questions.js
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML
} from './utils.js';

// Variable interna para guardar la respuesta correcta temporalmente
// No se exporta, se accede a través del objeto devuelto
let _correctAnswer = null;

// --- Generadores de Preguntas (Nivel Entry) ---

function generateClassQuestion() {
    const ip = generateRandomIp(); const info = getIpInfo(ip);
    const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
    const options = ['A', 'B', 'C', 'D', 'E'];
    const correct = info.class || 'A'; // Fallback
    const explanation = generateClassRangeTableHTML(correct);
    _correctAnswer = correct;
    return { question, options, correctAnswer: correct, explanation };
 }

function generateTypeQuestion() {
    let ip, info, attempts = 0; let forcePrivate = Math.random() < 0.4;
    ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp(); info = getIpInfo(ip);
    while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 50) { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
    if (attempts >= 50 || info.type === 'N/A' || info.type === 'Loopback') { ip = '8.8.8.8'; info = getIpInfo(ip); }
    const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
    const options = ['Pública', 'Privada']; const correct = info.type;
    const explanation = generatePrivateRangeTableHTML(ip);
    _correctAnswer = correct;
    return { question, options, correctAnswer: correct, explanation };
}

function generateDefaultMaskQuestion() {
    let ip, info, attempts = 0;
    do { ip = generateRandomIp(); info = getIpInfo(ip); attempts++; }
    while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C') && attempts < 100);
    if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }
    const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
    const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
    const correct = info.defaultMask;
    const explanation = generateClassMaskTableHTML(info.class);
    _correctAnswer = correct;
    if (!options.includes(correct)) _correctAnswer = options[0]; // Fallback si info falló
    return { question, options, correctAnswer: _correctAnswer, explanation };
}

function generateSelectClassQuestion() {
    const targetClasses = ['A', 'B', 'C']; const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
    const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
    let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
    while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.class === targetClass && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; }
    if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
    attempts = 0; while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).class !== targetClass && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
    while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } else { attempts++; if(attempts > 500) break;} }
    if(incorrectIps.length < 3) {incorrectIps.push(...['8.8.8.8', '224.0.0.5', '169.254.1.1'].filter(ip => !ipSet.has(ip) && getIpInfo(ip).class !== targetClass).slice(0, 3 - incorrectIps.length)); } incorrectIps = incorrectIps.slice(0, 3);
    const options = [correctIp, ...incorrectIps]; shuffleArray(options);
    const correct = correctIp;
    const explanation = `Se busca una IP de Clase ${targetClass}. La correcta es ${correct}.<br>${generateClassRangeTableHTML(targetClass)}`;
    _correctAnswer = correct;
    return { question, options, correctAnswer: correct, explanation };
 }

function generateSelectPrivateIpQuestion() {
    const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`;
    let correctIp = generateRandomPrivateIp(); let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]);
    while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); if (getIpInfo(ip).type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
    while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(getIpInfo(ip).type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip);} else {attempts++; if(attempts > 500) break;}}
    if(incorrectIps.length < 3) {incorrectIps.push(...['8.8.8.8', '1.1.1.1', '203.0.113.1'].filter(ip => !ipSet.has(ip)).slice(0, 3 - incorrectIps.length));} incorrectIps = incorrectIps.slice(0, 3);
    const options = [correctIp, ...incorrectIps]; shuffleArray(options);
    const correct = correctIp;
    const explanation = generatePrivateRangeTableHTML(correct);
    _correctAnswer = correct;
    return { question, options, correctAnswer: correct, explanation };
 }

function generateSelectIpByDefaultMaskQuestion() {
    const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0']; const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
    const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`;
    let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();
    while (!correctIp && attempts < 100) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask === targetMask && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); } attempts++; }
    if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }
    attempts = 0; while (incorrectIps.length < 3 && attempts < 200) { let ip = generateRandomIp(); let info = getIpInfo(ip); if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } attempts++; }
    while (incorrectIps.length < 3) { let ip = generateRandomIp(); if(!ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); } else { attempts++; if(attempts > 500) break;} }
    if(incorrectIps.length < 3) {incorrectIps.push(...['8.8.8.8', '224.0.0.1', '169.254.1.1'].filter(ip => !ipSet.has(ip) && getIpInfo(ip).defaultMask !== targetMask).slice(0, 3 - incorrectIps.length));} incorrectIps = incorrectIps.slice(0, 3);
    const options = [correctIp, ...incorrectIps]; shuffleArray(options);
    const correct = correctIp;
    const correctClass = getIpInfo(correct).class;
    const explanation = `Se busca una IP cuya clase (${correctClass}) tenga la máscara por defecto ${targetMask}.<br>${generateClassMaskTableHTML(correctClass)}`;
    _correctAnswer = correct;
    return { question, options, correctAnswer: correct, explanation };
}

// --- Agrupar Generadores por Nivel ---

const entryQuestionGenerators = [
    generateClassQuestion,
    generateTypeQuestion,
    generateDefaultMaskQuestion,
    generateSelectClassQuestion,
    generateSelectPrivateIpQuestion,
    generateSelectIpByDefaultMaskQuestion
];

// TODO: Crear arrays similares para associateQuestionGenerators y professionalQuestionGenerators

// --- Función Principal para Obtener Pregunta ---

/**
 * Selecciona y llama a un generador de preguntas según el nivel actual.
 * @param {string} level - El nivel actual ('Entry', 'Associate', etc.)
 * @returns {object|null} - El objeto con los datos de la pregunta o null si el nivel no está implementado.
 */
export function getNextQuestion(level) {
     let generatorFunction = null;
     if (level === 'Entry') {
         const randomIndex = getRandomInt(0, entryQuestionGenerators.length - 1);
         generatorFunction = entryQuestionGenerators[randomIndex];
     } else if (level === 'Associate') {
         // TODO: Implementar generadores y selección para Associate
         console.warn("Generadores de nivel Associate aún no implementados.");
         return null; // Indicar que no hay pregunta para este nivel todavía
     } else if (level === 'Professional') {
          // TODO: Implementar generadores y selección para Professional
         console.warn("Generadores de nivel Professional aún no implementados.");
         return null;
     } else {
         console.error("Nivel desconocido solicitado:", level);
         return null;
     }

     if (generatorFunction) {
         try {
             return generatorFunction(); // Ejecutar el generador seleccionado
         } catch (error) {
              console.error("Error al ejecutar generador:", generatorFunction.name, error);
              return null; // Devolver null si el generador falla
         }
     }
     return null; // Fallback
}
