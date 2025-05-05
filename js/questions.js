// js/questions.js
// ==================================================
// Módulo Principal de Preguntas para IP Sprint
// Importa generadores de módulos específicos por nivel
// y selecciona uno aleatoriamente según el nivel actual.
// MODIFICADO: Maneja generadores asíncronos para Nivel Essential.
// ==================================================

// --- Importaciones de Módulos ---
// Importar los arrays de generadores de cada nivel
import { entryQuestionGenerators } from './questions_entry.js';
import { associateQuestionGenerators } from './questions_associate.js';
import { professionalQuestionGenerators } from './questions_professional.js';
// Importar generadores Essential (que ahora son async)
import { essentialQuestionGenerators } from './questions_essential.js';
// Importar utilidades generales
import { getRandomInt } from './utils.js';

// --- Función Principal para Obtener Pregunta ---

/**
 * Obtiene la siguiente pregunta basada en el nivel de dificultad.
 * Es ASÍNCRONA para poder esperar la carga de preguntas de Essential desde JSON.
 * @param {string} level - El nivel actual ('Essential', 'Entry', 'Associate', 'Professional', 'Expert').
 * @returns {Promise<object|null>} Una PROMESA que resuelve con el objeto de la pregunta formateado
 * para la UI, o null si ocurre un error.
 */
export async function getNextQuestion(level) { // Marcada como async
     let generators = [];      // Array para los generadores del nivel seleccionado
     let isEssential = false;  // Flag para saber si estamos pidiendo una pregunta Essential

     // Seleccionar el conjunto correcto de generadores según el nivel
     switch (level) {
        case 'Essential':
            generators = essentialQuestionGenerators;
            isEssential = true; // Marcar que usaremos generadores async
            break;
        case 'Entry':
            generators = entryQuestionGenerators;
            break;
        case 'Associate':
            // Combinar Associate y Entry para más variedad
            generators = [...entryQuestionGenerators, ...associateQuestionGenerators];
            break;
        case 'Professional':
            // Combinar Professional y Associate
            // Podríamos añadir también Entry si quisiéramos repaso completo
            generators = [...associateQuestionGenerators, ...professionalQuestionGenerators];
            break;
        // Añadir caso para 'Expert' cuando se implemente
        // case 'Expert':
        //    generators = [...professionalQuestionGenerators, ...expertQuestionGenerators];
        //    break;
        default:
            console.error("Nivel desconocido solicitado:", level);
            return null; // Nivel no reconocido
     }

     // Verificar que tenemos generadores para el nivel seleccionado
     if (!generators || generators.length === 0) {
         console.error(`No hay generadores de preguntas definidos o disponibles para el nivel: ${level}`);
         return null;
     }

     // Seleccionar una función generadora aleatoria del array correspondiente
     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     // Verificar que el elemento seleccionado sea una función válida
     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             let questionData = null;
             // Ejecutar el generador: usar await si es Essential (async), sino llamada normal (sync)
             if (isEssential) {
                 console.log(`[Questions] Llamando a generador ASYNC Essential: ${generatorFunction.name}`);
                 // Esperar a que la promesa del generador Essential resuelva (fetch del JSON + selección)
                 questionData = await generatorFunction();
             } else {
                 // Llamada síncrona normal para los generadores de Entry, Associate, etc.
                 console.log(`[Questions] Llamando a generador SYNC: ${generatorFunction.name}`);
                 questionData = generatorFunction();
             }

             // Validar el resultado obtenido del generador
             // (La validación más estricta se hizo en la versión anterior, aquí simplificamos
             // asumiendo que si no es null/undefined, es válido para pasar a la UI)
             if (questionData) {
                 console.log("[Questions] Datos de pregunta obtenidos:", questionData);
                 // Devolver los datos formateados (la función generadora ya lo hizo)
                 return questionData;
             } else {
                 // Error si el generador devolvió null (posiblemente por error interno o falta de preguntas)
                 console.error(`El generador ${generatorFunction.name || 'anónimo'} devolvió null o datos inválidos para ${level}.`);
                 // Devolver null para que game.js maneje el error (evita recursión infinita)
                 return null;
             }
         } catch (error) {
             // Capturar cualquier error que ocurra DENTRO del generador (sync o async)
             console.error(`Error al ejecutar el generador ${generatorFunction.name || 'anónimo'} para ${level}:`, error);
             return null; // Devolver null en caso de error
         }
     } else {
         // Error si el elemento seleccionado del array no era una función
         console.error(`El generador seleccionado para ${level} en índice ${randomIndex} no es una función válida.`);
         return null;
     }
}
