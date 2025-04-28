// js/questions.js
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML
} from './utils.js';

// Nota: No necesitamos una variable _correctAnswer aquí,
// cada función generadora devolverá el objeto completo incluyendo correctAnswer.

// --- Generadores de Preguntas (Nivel Entry) ---

/** Genera una pregunta sobre la Clase de una IP */
function generateClassQuestion() {
    try {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E'];
        const correct = info.class || 'A'; // Fallback por si getIpInfo falla
        const explanation = generateClassRangeTableHTML(correct);
        // Devolver el objeto completo
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateClassQuestion:", error);
        return null; // Indicar fallo
    }
 }

/** Genera una pregunta sobre el Tipo (Pública/Privada) de una IP */
function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        // Intentar generar una IP válida (no N/A o Loopback)
        let forcePrivate = Math.random() < 0.4; // 40% de probabilidad de forzar privada
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 50) {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        }
        // Si sigue sin ser válida después de intentos, usar un fallback público
        if (info.type === 'N/A' || info.type === 'Loopback') {
             ip = '8.8.8.8'; info = getIpInfo(ip);
        }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada'];
        const correct = info.type;
        const explanation = generatePrivateRangeTableHTML(ip); // La tabla se adapta si es pública o privada
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateTypeQuestion:", error);
        return null;
    }
}

/** Genera una pregunta sobre la Máscara por Defecto de una IP */
function generateDefaultMaskQuestion() {
    try {
        let ip, info, attempts = 0;
        // Buscar una IP de clase A, B o C
        do {
            ip = generateRandomIp(); info = getIpInfo(ip); attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C') && attempts < 100);
        // Si no se encuentra rápido, usar un fallback
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); }

        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const correct = info.defaultMask;
        const explanation = generateClassMaskTableHTML(info.class); // Mostrar tabla de máscaras resaltando la clase
        // Asegurarse que la respuesta correcta sea una opción válida si getIpInfo falló
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0];
        return { question, options, correctAnswer: finalCorrectAnswer, explanation };
    } catch (error) {
        console.error("Error en generateDefaultMaskQuestion:", error);
        return null;
    }
}

/** Genera una pregunta para seleccionar la IP de una Clase específica */
function generateSelectClassQuestion() {
    try{
        const targetClasses = ['A', 'B', 'C']; // Simplificado para asegurar generación fácil
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // Generar IP correcta (Clase A/B/C, no Loopback)
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            if (info.class === targetClass && info.type !== 'Loopback') {
                correctIp = ip; ipSet.add(ip);
            } attempts++;
        }
        // Fallback si falla la generación aleatoria
        if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }

        // Generar IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) { // Aumentar intentos si es necesario
            let ip = generateRandomIp();
            // Asegurarse que no sea de la clase correcta y no esté duplicada
            if (getIpInfo(ip).class !== targetClass && !ipSet.has(ip)) {
                 incorrectIps.push(ip); ipSet.add(ip);
            } attempts++;
        }
        // Rellenar con fallbacks si aún faltan incorrectas
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1'];
            for (const fb of fallbacks) {
                if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) {
                    incorrectIps.push(fb); ipSet.add(fb);
                }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Asegurar 3 incorrectas

        const options = [correctIp, ...incorrectIps]; shuffleArray(options);
        const correct = correctIp;
        const explanation = `Se busca una IP de Clase ${targetClass}. La correcta es ${correct}.<br>${generateClassRangeTableHTML(targetClass)}`;
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateSelectClassQuestion:", error);
        return null;
    }
 }

/** Genera una pregunta para seleccionar una IP Privada */
function generateSelectPrivateIpQuestion() {
    try {
        const question = `¿Cuál de las siguientes direcciones IP es <strong>Privada</strong>?`;
        let correctIp = generateRandomPrivateIp(); // Genera una IP privada garantizada
        let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]);

        // Generar IPs públicas incorrectas
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp();
            if (getIpInfo(ip).type === 'Pública' && !ipSet.has(ip)) {
                 incorrectIps.push(ip); ipSet.add(ip);
            } attempts++;
        }
        // Rellenar con fallbacks públicos si es necesario
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1'];
             for (const fb of fallbacks) {
                 if (incorrectIps.length < 3 && !ipSet.has(fb)) {
                     incorrectIps.push(fb); ipSet.add(fb);
                 }
             }
        }
        incorrectIps = incorrectIps.slice(0, 3); // Asegurar 3 incorrectas

        const options = [correctIp, ...incorrectIps]; shuffleArray(options);
        const correct = correctIp;
        const explanation = generatePrivateRangeTableHTML(correct); // Muestra tabla privada y resalta
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateSelectPrivateIpQuestion:", error);
        return null;
    }
 }

/** Genera una pregunta para seleccionar una IP por su Máscara Default */
function generateSelectIpByDefaultMaskQuestion() {
    try {
        const targetMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const targetMask = targetMasks[getRandomInt(0, targetMasks.length - 1)];
        const question = `¿Cuál de las siguientes IPs usaría la máscara por defecto <strong>${targetMask}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // Generar IP correcta
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegurar que tiene la máscara correcta y NO es loopback
            if (info.defaultMask === targetMask && info.type !== 'Loopback') {
                 correctIp = ip; ipSet.add(ip);
            } attempts++;
        }
        // Fallback si falla
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }

        // Generar IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegurar que NO tiene la máscara correcta (y no es N/A o duplicada)
            if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && !ipSet.has(ip)) {
                incorrectIps.push(ip); ipSet.add(ip);
            } attempts++;
        }
        // Rellenar si faltan
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5'];
            for (const fb of fallbacks) {
                 if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).defaultMask !== targetMask) {
                     incorrectIps.push(fb); ipSet.add(fb);
                 }
             }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps]; shuffleArray(options);
        const correct = correctIp;
        const correctClass = getIpInfo(correct).class;
        const explanation = `Se busca una IP cuya clase (${correctClass}) tenga la máscara por defecto ${targetMask}.<br>${generateClassMaskTableHTML(correctClass)}`;
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateSelectIpByDefaultMaskQuestion:", error);
        return null;
    }
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

// TODO: Crear associateQuestionGenerators = [...]
// TODO: Crear professionalQuestionGenerators = [...]

// --- Función Principal para Obtener Pregunta ---

/**
 * Selecciona y llama a un generador de preguntas según el nivel actual.
 * @param {string} level - El nivel actual ('Entry', 'Associate', etc.)
 * @returns {object|null} - El objeto con los datos de la pregunta o null.
 */
export function getNextQuestion(level) {
     let generatorFunction = null;
     if (level === 'Entry') {
         if (entryQuestionGenerators.length === 0) return null; // No hay generadores
         const randomIndex = getRandomInt(0, entryQuestionGenerators.length - 1);
         generatorFunction = entryQuestionGenerators[randomIndex];
     } else if (level === 'Associate') {
         // TODO: Implementar generadores y selección para Associate
         console.warn("Generadores de nivel Associate aún no implementados.");
         return null;
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
             // Ejecutar el generador y devolver su resultado
             return generatorFunction();
         } catch (error) {
              console.error("Error al ejecutar generador:", generatorFunction.name, error);
              return null; // Indicar fallo
         }
     }
     return null; // Fallback si no se encontró función
}
