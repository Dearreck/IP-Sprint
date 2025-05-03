// js/questions.js
// ==================================================
// Módulo Principal de Preguntas para IP Sprint
// Importa generadores de módulos específicos por nivel
// y selecciona uno aleatoriamente según el nivel actual.
// ==================================================

// --- Importaciones de Módulos ---
// Importar los arrays de generadores de cada nivel
import { entryQuestionGenerators } from './questions_entry.js';
import { associateQuestionGenerators } from './questions_associate.js';
import { professionalQuestionGenerators } from './questions_professional.js';
// Importar utilidades generales si son necesarias aquí directamente (getRandomInt sí lo es)
import { getRandomInt } from './utils.js';

// --- Función Principal para Obtener Pregunta ---

/**
 * Obtiene la siguiente pregunta basada en el nivel de dificultad.
 * @param {string} level - El nivel actual ('Entry', 'Associate', 'Professional').
 * @returns {object|null} Un objeto con los datos de la pregunta o null si hay error.
 */
export function getNextQuestion(level) {
     let generators = []; // Array para almacenar los generadores del nivel seleccionado

     // Seleccionar el conjunto correcto de generadores según el nivel
     if (level === 'Entry') {
         generators = entryQuestionGenerators;
     } else if (level === 'Associate') {
         generators = associateQuestionGenerators;
     } else if (level === 'Professional') {
         // Para el nivel Professional, combinar preguntas de Associate y Professional
         // para mayor variedad y repaso.
         generators = [...associateQuestionGenerators, ...professionalQuestionGenerators];
         // Opcional: Podrías añadir lógica para ponderar o asegurar variedad si es necesario
     } else {
         console.error("Nivel desconocido solicitado:", level);
         return null; // Nivel no reconocido
     }

     // Verificar que tenemos generadores para el nivel
     if (!generators || generators.length === 0) {
         console.error(`No hay generadores de preguntas definidos o disponibles para el nivel: ${level}`);
         return null;
     }

     // Seleccionar una función generadora aleatoria del array correspondiente
     const randomIndex = getRandomInt(0, generators.length - 1);
     const generatorFunction = generators[randomIndex];

     // Verificar que es una función válida y ejecutarla
     if (generatorFunction && typeof generatorFunction === 'function') {
         try {
             // Ejecutar la función generadora seleccionada
             const questionData = generatorFunction();

             // Validación básica de la estructura de datos devuelta por el generador
             if (questionData &&
                 questionData.question && questionData.question.key &&
                 Array.isArray(questionData.options) && questionData.options.length > 0 &&
                 questionData.correctAnswer !== undefined &&
                 questionData.explanation !== undefined)
             {
                 // Si los datos son válidos, devolverlos
                 return questionData;
             } else {
                 // Si el generador devuelve datos inválidos, registrar error e intentar de nuevo
                 console.error(`El generador ${generatorFunction.name || 'anónimo'} devolvió datos inválidos o incompletos para el nivel ${level}.`, questionData);
                 // Llamada recursiva para intentar obtener otra pregunta del mismo nivel
                 // ¡Cuidado! Esto podría causar un bucle infinito si TODOS los generadores fallan.
                 // Se podría añadir un contador de intentos para evitarlo si fuera un problema recurrente.
                 return getNextQuestion(level);
             }
         } catch (error) {
             // Si ocurre un error DENTRO del generador, registrarlo e intentar de nuevo
             console.error(`Error al ejecutar el generador ${generatorFunction.name || 'anónimo'} para el nivel ${level}:`, error);
              // Llamada recursiva para intentar obtener otra pregunta
             return getNextQuestion(level);
         }
     } else {
         // Si el elemento seleccionado del array no es una función válida
         console.error(`El generador seleccionado para el nivel ${level} en el índice ${randomIndex} no es una función válida.`);
         return null;
     }
}
