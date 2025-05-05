// js/questions.js
// ==================================================
// Módulo Principal de Preguntas para IP Sprint
// Importa generadores de módulos específicos por nivel
// y selecciona uno aleatoriamente según el nivel actual.
// Maneja generadores asíncronos para Nivel Essential y reintenta si un fundamento está vacío.
// Versión sin console.log
// ==================================================

// --- Importaciones de Módulos ---
import { entryQuestionGenerators } from './questions_entry.js';
import { associateQuestionGenerators } from './questions_associate.js';
import { professionalQuestionGenerators } from './questions_professional.js';
// Importar generadores y formateador Essential
import { essentialQuestionGenerators, formatEssentialQuestionForUI } from './questions_essential.js';
import { getRandomInt } from './utils.js';
// Importar para obtener idioma actual
import { getCurrentLanguage } from './i18n.js';

// --- Función Principal para Obtener Pregunta ---

/**
 * Obtiene la siguiente pregunta basada en el nivel de dificultad.
 * Es ASÍNCRONA para poder esperar la carga de preguntas de Essential desde JSON.
 * @param {string} level - El nivel actual ('Essential', 'Entry', 'Associate', 'Professional', 'Expert').
 * @returns {Promise<object|null>} Una PROMESA que resuelve con el objeto de la pregunta formateado
 * para la UI, o null si ocurre un error persistente.
 */
export async function getNextQuestion(level) {
     let generators = [];      // Array para los generadores del nivel seleccionado
     let isEssential = false;  // Flag para saber si estamos pidiendo una pregunta Essential
     let availableGeneratorsIndexes = []; // Para reintentos en Essential

     // Seleccionar el conjunto correcto de generadores según el nivel
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
            // Combinar Associate y Entry para más variedad
            generators = [...entryQuestionGenerators, ...associateQuestionGenerators];
            break;
        case 'Professional':
            // Combinar Professional y Associate
            generators = [...associateQuestionGenerators, ...professionalQuestionGenerators];
            break;
        // case 'Expert': // Descomentar y añadir lógica cuando exista Expert
        //    generators = [...professionalQuestionGenerators, ...expertQuestionGenerators];
        //    break;
        default:
            console.error(`Nivel desconocido solicitado: ${level}`); // Mantener error crítico
            return null; // Nivel no reconocido
     }

     // Verificar que tenemos generadores para el nivel seleccionado
     if (!generators || generators.length === 0) {
         console.error(`No hay generadores de preguntas definidos para el nivel: ${level}`); // Mantener error crítico
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
             // console.log(`[Questions] Intento ${attempts} (Essential): Seleccionado generador índice ${randomIndex} (${generatorFunction.name})`);
         } else if (!isEssential) {
             // Para otros niveles, elegir aleatoriamente como antes
             randomIndex = getRandomInt(0, generators.length - 1);
             generatorFunction = generators[randomIndex];
             // console.log(`[Questions] Intento ${attempts} (${level}): Seleccionado generador índice ${randomIndex} (${generatorFunction.name})`);
         } else {
             // Si es Essential pero ya no quedan índices disponibles (todos fallaron)
             console.error(`[Questions] No quedan generadores Essential disponibles tras ${attempts - 1} intentos.`); // Mantener error crítico
             return null;
         }


         if (generatorFunction && typeof generatorFunction === 'function') {
             try {
                 let rawQuestionData = null;
                 let formattedQuestionData = null;

                 if (isEssential) {
                     // 1. Obtener datos crudos (puede ser null si el fundamento está vacío)
                     rawQuestionData = await generatorFunction();
                     // 2. Si obtuvimos datos crudos, formatearlos para el idioma actual
                     if (rawQuestionData) {
                         const currentLang = getCurrentLanguage();
                         // console.log(`[Questions] Formateando pregunta Essential para idioma: ${currentLang}`);
                         formattedQuestionData = formatEssentialQuestionForUI(rawQuestionData, currentLang);
                         // Adjuntar datos crudos para posible refresco posterior
                         if (formattedQuestionData) {
                             formattedQuestionData.rawData = rawQuestionData;
                         }
                     } else {
                          // Si rawQuestionData es null, formattedQuestionData también será null
                          formattedQuestionData = null;
                     }
                 } else {
                     // Para otros niveles, el generador ya devuelve el formato final
                     formattedQuestionData = generatorFunction();
                 }

                 // Si obtuvimos datos formateados válidos, devolverlos
                 if (formattedQuestionData) {
                     // console.log("[Questions] Datos de pregunta formateados obtenidos:", formattedQuestionData);
                     return formattedQuestionData; // ¡Éxito! Salir del bucle y la función.
                 } else {
                     // Si formattedQuestionData es null (porque raw era null o el formateo falló)
                     // console.warn(`[Questions] El generador ${generatorFunction.name || 'anónimo'} o el formateador devolvió null para ${level}. Reintentando...`);
                     // El bucle while continuará para intentar con otro generador.
                 }
             } catch (error) {
                 // Capturar error DENTRO del generador o formateador
                 console.error(`Error al ejecutar/formatear generador ${generatorFunction.name || 'anónimo'} para ${level}:`, error); // Mantener error crítico
                 // console.warn(`[Questions] Error en generador/formateador ${generatorFunction.name}. Reintentando...`);
                 // Continuar el bucle para intentar otro generador si es posible
             }
         } else {
             console.error(`El generador seleccionado para ${level} en índice ${randomIndex} no es una función válida.`); // Mantener error crítico
             // Continuar el bucle para intentar otro índice si es posible
         }
     } // Fin del bucle while

     // Si salimos del bucle porque se agotaron los intentos
     console.error(`[Questions] No se pudo obtener una pregunta válida para el nivel ${level} después de ${attempts} intentos.`); // Mantener error crítico
     return null;
}
