// js/questions.js
// ==================================================
// Módulo Principal de Preguntas para IP Sprint
// MODIFICADO: Añade lógica de reintento para Essential si se elige un fundamento sin preguntas.
// ==================================================

// --- Importaciones de Módulos ---
import { entryQuestionGenerators } from './questions_entry.js';
import { associateQuestionGenerators } from './questions_associate.js';
import { professionalQuestionGenerators } from './questions_professional.js';
import { essentialQuestionGenerators } from './questions_essential.js';
import { getRandomInt } from './utils.js';

// --- Función Principal para Obtener Pregunta ---

/**
 * Obtiene la siguiente pregunta basada en el nivel de dificultad.
 * Es ASÍNCRONA para poder esperar la carga de preguntas de Essential desde JSON.
 * @param {string} level - El nivel actual ('Essential', 'Entry', 'Associate', 'Professional', 'Expert').
 * @returns {Promise<object|null>} Una PROMESA que resuelve con el objeto de la pregunta formateado
 * para la UI, o null si ocurre un error persistente.
 */
export async function getNextQuestion(level) {
     let generators = [];
     let isEssential = false;
     let availableGeneratorsIndexes = []; // Para reintentos en Essential

     // Seleccionar generadores según el nivel
     switch (level) {
        case 'Essential':
            generators = essentialQuestionGenerators;
            isEssential = true;
            // Crear array de índices para poder reintentar sin repetir inmediatamente
            availableGeneratorsIndexes = generators.map((_, index) => index);
            break;
        case 'Entry':
            generators = entryQuestionGenerators;
            break;
        case 'Associate':
            generators = [...entryQuestionGenerators, ...associateQuestionGenerators];
            break;
        case 'Professional':
            generators = [...associateQuestionGenerators, ...professionalQuestionGenerators];
            break;
        // case 'Expert':
        //    generators = [...professionalQuestionGenerators, ...expertQuestionGenerators];
        //    break;
        default:
            console.error("Nivel desconocido solicitado:", level);
            return null;
     }

     if (!generators || generators.length === 0) {
         console.error(`No hay generadores de preguntas definidos para el nivel: ${level}`);
         return null;
     }

     let attempts = 0; // Contador para evitar bucles infinitos
     const maxAttempts = generators.length + 1; // Intentar cada generador una vez como máximo

     while (attempts < maxAttempts) {
         attempts++;
         let randomIndex;
         let generatorFunction;

         if (isEssential && availableGeneratorsIndexes.length > 0) {
             // Elegir un índice aleatorio de los disponibles y quitarlo para no repetir
             const availableIndexPosition = getRandomInt(0, availableGeneratorsIndexes.length - 1);
             randomIndex = availableGeneratorsIndexes.splice(availableIndexPosition, 1)[0];
             generatorFunction = generators[randomIndex];
             console.log(`[Questions] Intento ${attempts} (Essential): Seleccionado generador índice ${randomIndex} (${generatorFunction.name})`);
         } else if (!isEssential) {
             // Para otros niveles, elegir aleatoriamente como antes
             randomIndex = getRandomInt(0, generators.length - 1);
             generatorFunction = generators[randomIndex];
             console.log(`[Questions] Intento ${attempts} (${level}): Seleccionado generador índice ${randomIndex} (${generatorFunction.name})`);
         } else {
             // Si es Essential pero ya no quedan índices disponibles (todos fallaron)
             console.error(`[Questions] No quedan generadores Essential disponibles tras ${attempts - 1} intentos.`);
             return null;
         }


         if (generatorFunction && typeof generatorFunction === 'function') {
             try {
                 let questionData = null;
                 if (isEssential) {
                     // Esperar la promesa (puede devolver null si el fundamento está vacío)
                     questionData = await generatorFunction();
                 } else {
                     questionData = generatorFunction(); // Llamada síncrona
                 }

                 // --- Si obtuvimos datos válidos, devolverlos ---
                 if (questionData) {
                     console.log("[Questions] Datos de pregunta obtenidos:", questionData);
                     return questionData; // ¡Éxito! Salir del bucle y la función.
                 } else {
                     // Si questionData es null (pasó en Essential con fundamento vacío),
                     // el bucle while continuará para intentar con otro generador.
                     console.warn(`[Questions] El generador ${generatorFunction.name || 'anónimo'} devolvió null para ${level}. Reintentando...`);
                 }
             } catch (error) {
                 // Capturar error DENTRO del generador
                 console.error(`Error al ejecutar el generador ${generatorFunction.name || 'anónimo'} para ${level}:`, error);
                 // Considerar si reintentar o devolver null. Por ahora, continuamos el bucle.
                 console.warn(`[Questions] Error en generador ${generatorFunction.name}. Reintentando...`);
             }
         } else {
             console.error(`El generador seleccionado para ${level} en índice ${randomIndex} no es una función válida.`);
             // Continuar el bucle para intentar otro índice si es posible
         }
     } // Fin del bucle while

     // Si salimos del bucle porque se agotaron los intentos
     console.error(`[Questions] No se pudo obtener una pregunta válida para el nivel ${level} después de ${attempts} intentos.`);
     return null;
}
