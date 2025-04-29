// js/questions.js
import {
    getRandomInt, generateRandomIp, generateRandomPrivateIp, getIpInfo, shuffleArray,
    generateClassRangeTableHTML, generateClassMaskTableHTML, generatePrivateRangeTableHTML
} from './utils.js';

// --- Generadores de Preguntas (Nivel Entry) ---

/** Genera una pregunta sobre la Clase de una IP */
function generateClassQuestion() {
    try {
        const ip = generateRandomIp();
        const info = getIpInfo(ip);
        if (info.class === 'N/A') return generateClassQuestion(); // Reintentar si la clase no es válida
        const question = `Dada la IP: <strong>${ip}</strong><br>¿A qué clase pertenece?`;
        const options = ['A', 'B', 'C', 'D', 'E'];
        const correct = info.class;
        const explanation = generateClassRangeTableHTML(correct);
        return { question, options, correctAnswer: correct, explanation };
    } catch (error) {
        console.error("Error en generateClassQuestion:", error);
        return null;
    }
 }

/** Genera una pregunta sobre el Tipo (Pública/Privada) de una IP */
function generateTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        let forcePrivate = Math.random() < 0.4;
        ip = forcePrivate ? generateRandomPrivateIp() : generateRandomIp();
        info = getIpInfo(ip);
        // Regenerar si es tipo N/A (D, E) o Loopback
        while ((info.type === 'N/A' || info.type === 'Loopback') && attempts < 50) {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        }
        if (info.type === 'N/A' || info.type === 'Loopback') {
             ip = '8.8.8.8'; info = getIpInfo(ip); // Fallback público
        }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Es Pública o Privada?`;
        const options = ['Pública', 'Privada'];
        const correct = info.type;
        const explanation = generatePrivateRangeTableHTML(ip);
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
        // Buscar una IP de clase A, B o C (no Loopback)
        do {
            ip = generateRandomIp(); info = getIpInfo(ip); attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);
        if (attempts >= 100) { ip = '192.168.1.1'; info = getIpInfo(ip); } // Fallback

        const question = `Dada la IP: <strong>${ip}</strong> (Clase ${info.class})<br>¿Cuál es su máscara de subred por defecto?`;
        const options = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
        const correct = info.defaultMask;
        const explanation = generateClassMaskTableHTML(info.class);
        const finalCorrectAnswer = options.includes(correct) ? correct : options[0]; // Asegurar que la correcta esté en opciones
        return { question, options, correctAnswer: finalCorrectAnswer, explanation };
    } catch (error) {
        console.error("Error en generateDefaultMaskQuestion:", error);
        return null;
    }
}

/** Genera una pregunta para seleccionar la IP de una Clase específica */
function generateSelectClassQuestion() {
    try{
        const targetClasses = ['A', 'B', 'C'];
        const targetClass = targetClasses[getRandomInt(0, targetClasses.length - 1)];
        const question = `¿Cuál de las siguientes IPs pertenece a la Clase <strong>${targetClass}</strong>?`;
        let correctIp = ''; let incorrectIps = []; let attempts = 0; let ipSet = new Set();

        // Generar IP correcta (Clase A/B/C, no Loopback)
        while (!correctIp && attempts < 100) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            if (info.class === targetClass && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); }
            attempts++;
        }
        if (!correctIp) { if(targetClass === 'A') correctIp = '10.1.1.1'; else if(targetClass === 'B') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }

        // Generar IPs incorrectas
        attempts = 0;
        const otherClasses = targetClasses.filter(c => c !== targetClass);
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegurarse que no sea de la clase correcta, no sea Loopback/N/A y no esté duplicada
            if (info.class !== targetClass && info.class !== 'N/A' && info.type !== 'Loopback' && !ipSet.has(ip)) {
                 incorrectIps.push(ip); ipSet.add(ip);
            } attempts++;
        }
        // Rellenar con fallbacks si aún faltan incorrectas
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.5', '169.254.1.1', '150.150.1.1', '200.200.1.1', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                if (incorrectIps.length < 3 && !ipSet.has(fb) && getIpInfo(fb).class !== targetClass) { incorrectIps.push(fb); ipSet.add(fb); }
            }
        }
        incorrectIps = incorrectIps.slice(0, 3);

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
        let correctIp = generateRandomPrivateIp();
        let incorrectIps = []; let attempts = 0; let ipSet = new Set([correctIp]);

        // Generar IPs públicas incorrectas
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegurar que sea pública y no duplicada
            if (info.type === 'Pública' && !ipSet.has(ip)) { incorrectIps.push(ip); ipSet.add(ip); }
            attempts++;
        }
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '1.1.1.1', '203.0.113.1', '198.51.100.1', '172.15.1.1', '192.169.1.1'];
             for (const fb of fallbacks) { if (incorrectIps.length < 3 && !ipSet.has(fb)) { incorrectIps.push(fb); ipSet.add(fb); } }
        }
        incorrectIps = incorrectIps.slice(0, 3);

        const options = [correctIp, ...incorrectIps]; shuffleArray(options);
        const correct = correctIp;
        const explanation = generatePrivateRangeTableHTML(correct);
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
            if (info.defaultMask === targetMask && info.type !== 'Loopback') { correctIp = ip; ipSet.add(ip); }
            attempts++;
        }
        if (!correctIp) { if(targetMask === '255.0.0.0') correctIp = '10.1.1.1'; else if(targetMask === '255.255.0.0') correctIp = '172.16.1.1'; else correctIp = '192.168.1.1'; ipSet.add(correctIp); }

        // Generar IPs incorrectas
        attempts = 0;
        while (incorrectIps.length < 3 && attempts < 300) {
            let ip = generateRandomIp(); let info = getIpInfo(ip);
            // Asegurar que NO tiene la máscara correcta (y no es N/A, Loopback o duplicada)
            if (info.defaultMask !== 'N/A' && info.defaultMask !== targetMask && info.type !== 'Loopback' && !ipSet.has(ip)) {
                incorrectIps.push(ip); ipSet.add(ip);
            } attempts++;
        }
        if(incorrectIps.length < 3) {
            const fallbacks = ['8.8.8.8', '224.0.0.1', '169.254.1.1', '172.30.1.1', '192.168.5.5', '126.1.1.1', '191.1.1.1'];
            for (const fb of fallbacks) {
                 let fbInfo = getIpInfo(fb);
                 if (incorrectIps.length < 3 && !ipSet.has(fb) && fbInfo.defaultMask !== targetMask && fbInfo.defaultMask !== 'N/A') { incorrectIps.push(fb); ipSet.add(fb); }
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

// --- Generadores de Preguntas (Nivel Associate) ---

/**
 * Genera una pregunta para identificar la Clase y el Tipo (Pública/Privada) de una IP.
 */
function generateClassAndTypeQuestion() {
    try {
        let ip, info, attempts = 0;
        // Generar una IP válida (Clase A, B o C, no Loopback)
        do {
            ip = generateRandomIp();
            info = getIpInfo(ip);
            attempts++;
        } while ((info.class !== 'A' && info.class !== 'B' && info.class !== 'C' || info.type === 'Loopback') && attempts < 100);

        // Fallback si no se encuentra rápido
        if (attempts >= 100) {
            ip = Math.random() < 0.5 ? '172.20.1.1' : '10.10.10.10'; // Pública B o Privada A
            info = getIpInfo(ip);
        }

        const question = `Dada la IP: <strong>${ip}</strong><br>¿Cuál es su Clase y Tipo?`;

        const correctClass = info.class;
        const correctType = info.type; // Será 'Pública' o 'Privada'
        const correctAnswerText = `Clase ${correctClass}, ${correctType}`;

        let options = new Set([correctAnswerText]); // Usar Set para evitar duplicados iniciales
        const possibleClasses = ['A', 'B', 'C'].filter(c => c !== correctClass); // Clases incorrectas
        const possibleTypes = ['Pública', 'Privada'].filter(t => t !== correctType); // Tipo incorrecto

        // Generar opciones incorrectas (intentar variedad)
        // 1. Clase Correcta, Tipo Incorrecto
        if (possibleTypes.length > 0) {
            options.add(`Clase ${correctClass}, ${possibleTypes[0]}`);
        }
        // 2. Clase Incorrecta, Tipo Correcto
        if (possibleClasses.length > 0) {
            options.add(`Clase ${possibleClasses[0]}, ${correctType}`);
        }
        // 3. Clase Incorrecta, Tipo Incorrecto
        if (possibleClasses.length > 0 && possibleTypes.length > 0) {
            options.add(`Clase ${possibleClasses[0]}, ${possibleTypes[0]}`);
        }
        // Rellenar si faltan opciones (poco probable pero por si acaso)
        while (options.size < 4) {
            const randomClass = ['A', 'B', 'C'][getRandomInt(0, 2)];
            const randomType = ['Pública', 'Privada'][getRandomInt(0, 1)];
            options.add(`Clase ${randomClass}, ${randomType}`);
        }

        // Convertir Set a Array y barajar
        let optionsArray = Array.from(options);
        // Asegurarse de que la respuesta correcta esté y que haya 4 opciones
        if (!optionsArray.includes(correctAnswerText)) {
            optionsArray.pop(); // Quitar una aleatoria (la última después de convertir)
            optionsArray.push(correctAnswerText); // Añadir la correcta
        }
        optionsArray = optionsArray.slice(0, 4); // Asegurar solo 4 opciones
        shuffleArray(optionsArray);

        // Generar explicación combinada
        const explanation = `
            ${generateClassRangeTableHTML(correctClass)}
            <hr style="margin: 10px 0;">
            ${generatePrivateRangeTableHTML(ip)}
        `;

        return { question, options: optionsArray, correctAnswer: correctAnswerText, explanation };

    } catch (error) {
        console.error("Error en generateClassAndTypeQuestion:", error);
        return null; // Indicar fallo
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

// NUEVO: Array para generadores de nivel Associate
const associateQuestionGenerators = [
    generateClassAndTypeQuestion,
    // TODO: Añadir aquí las otras funciones generadoras para Associate:
    // generateRfc1918Question,
    // generateSpecialAddressQuestion,
    // generateNetworkHostPortionQuestion,
    // generateNetworkBroadcastAddressQuestion
];

// TODO: Crear professionalQuestionGenerators = [...]

// --- Función Principal para Obtener Pregunta ---

/**
 * Selecciona y llama a un generador de preguntas según el nivel actual.
 * @param {string} level - El nivel actual ('Entry', 'Associate', etc.)
 * @returns {object|null} - El objeto con los datos de la pregunta o null si falla.
 */
export function getNextQuestion(level) {
     let generators = []; // Array de funciones generadoras para el nivel

     // Seleccionar el array de generadores correcto según el nivel
     if (level === 'Entry') {
         generators = entryQuestionGenerators;
     } else if (level === 'Associate') {
         generators = associateQuestionGenerators; // Usar el nuevo array
     } else if (level === 'Professional') {
          // TODO: Asignar array de Professional cuando exista
         console.warn("Generadores de nivel Professional aún no implementados.");
         return null; // Devolver null si no hay generadores para este nivel
     } else {
         console.error("Nivel desconocido solicitado:", level);
         return null; // Nivel inválido
     }

     // Verificar si hay generadores disponibles para el nivel seleccionado
     if (!generators || generators.length === 0) {
         console.warn(`No hay generadores de preguntas definidos para el nivel: ${level}`);
         return null; // No hay funciones para generar preguntas
     }

     // Seleccionar una función generadora aleatoria del array correspondiente
     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     // Ejecutar la función generadora seleccionada
     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             // Llamar a la función y devolver su resultado (el objeto de la pregunta)
             const questionData = generatorFunction();
             // Pequeña validación extra del resultado
             if (questionData && questionData.question && questionData.options && questionData.correctAnswer) {
                 return questionData;
             } else {
                 console.error(`El generador ${generatorFunction.name} devolvió datos inválidos.`);
                 return null; // El generador falló o devolvió datos incompletos
             }
         } catch (error) {
              // Capturar errores que ocurran DENTRO de la función generadora
              console.error(`Error al ejecutar el generador ${generatorFunction.name}:`, error);
              return null; // Indicar fallo
         }
     } else {
         console.error(`El generador seleccionado para el nivel ${level} no es una función válida.`);
         return null; // El elemento seleccionado no era una función
     }
}
