// js/questions_essential.js
// ==================================================
// Generadores de Preguntas - Nivel Essential (Teórico)
// Carga preguntas desde JSON.
// MODIFICADO: Exporta la función de formateo.
// ==================================================

import { getRandomInt, shuffleArray } from './utils.js';
import { getCurrentLanguage, getTranslation } from './i18n.js';

// --- Variables del Módulo ---
let essentialQuestionsData = null;
let isLoading = false;
let loadPromise = null;

// --- Función para Cargar el JSON ---
async function loadEssentialQuestions() {
    if (essentialQuestionsData) return essentialQuestionsData;
    if (isLoading && loadPromise) return loadPromise;

    isLoading = true;
    console.log("[Essential Questions] Iniciando carga de questions_essential.json...");
    loadPromise = new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('data/questions_essential.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            essentialQuestionsData = data;
            isLoading = false;
            console.log("[Essential Questions] JSON cargado y parseado correctamente.");
            resolve(essentialQuestionsData);
        } catch (error) {
            console.error("Error cargando questions_essential.json:", error);
            isLoading = false;
            essentialQuestionsData = null;
            reject(error);
        }
    });
    return loadPromise;
}

/**
 * Formatea los datos brutos de una pregunta del JSON para la UI,
 * seleccionando el idioma correcto.
 * ESTA FUNCIÓN AHORA SE EXPORTA.
 * @param {object} rawQuestionData - El objeto de pregunta crudo del JSON.
 * @param {string} lang - El código de idioma ('es' o 'en') a usar.
 * @returns {object|null} El objeto de pregunta formateado para la UI o null si hay error.
 */
export function formatEssentialQuestionForUI(rawQuestionData, lang) { // <--- EXPORTADA y recibe lang
    if (!rawQuestionData || !rawQuestionData.questionText || !rawQuestionData.options || !rawQuestionData.explanationText) {
        console.error("[Essential Questions] Datos crudos de pregunta inválidos para formatear:", rawQuestionData);
        return null;
    }

    try {
        // Extraer textos en el idioma correcto (con fallback a inglés)
        const qText = rawQuestionData.questionText[lang] || rawQuestionData.questionText['en'];
        const explanation = rawQuestionData.explanationText[lang] || rawQuestionData.explanationText['en'];
        let optionsText = [];
        let correctAnswerText = ''; // Texto de la respuesta correcta para displayFeedback
        let correctAnswerValue = ''; // Valor original/clave para comparación en handleAnswerClick

        // Procesar opciones
        if (rawQuestionData.type === 'VF') {
            optionsText = rawQuestionData.options.map(opt => getTranslation(opt.key)); // Traduce 'option_true'/'option_false'
            const correctOption = rawQuestionData.options.find(opt => opt.correct);
            if (correctOption) {
                correctAnswerText = getTranslation(correctOption.key);
                correctAnswerValue = correctOption.key; // El valor es la clave i18n
            } else {
                console.error("Pregunta V/F sin opción correcta marcada:", rawQuestionData);
                correctAnswerText = 'Error';
                correctAnswerValue = 'Error';
            }
            // shuffleArray(optionsText); // Desordenar V/F? Quizás mejor mantener orden estándar.
        } else { // Asumir MC
            optionsText = rawQuestionData.options.map(opt => opt[lang] || opt['en']); // Texto directo
            const correctOption = rawQuestionData.options.find(opt => opt.correct);
            if (correctOption) {
                correctAnswerText = correctOption[lang] || correctOption['en'];
                correctAnswerValue = correctAnswerText; // Para MC con texto directo, el valor es el texto mismo
            } else {
                 console.error("Pregunta MC sin opción correcta marcada:", rawQuestionData);
                 correctAnswerText = 'Error';
                 correctAnswerValue = 'Error';
            }
            shuffleArray(optionsText); // Desordenar opciones MC
        }

        // Devolver la estructura que espera ui.js
        return {
            // Añadir el ID original para posible referencia futura
            originalId: rawQuestionData.id,
            // Necesitamos una forma de obtener la clave de teoría asociada
            // Asumimos que el ID empieza con el nombre del fundamento: "purpose_q1" -> "purpose"
            theoryKey: `theory_essential_${rawQuestionData.id.split('_')[0]}`,
            question: {
                // No necesitamos 'key' si pasamos 'text'
                text: qText // Texto directo de la pregunta
            },
            options: optionsText,           // Array de strings con texto de opciones
            correctAnswer: correctAnswerValue, // VALOR original/clave para comparación lógica
            // Guardamos también el texto para mostrar en feedback
            correctAnswerDisplay: correctAnswerText,
            explanation: {
                 // No necesitamos 'baseTextKey' si pasamos 'text'
                 text: explanation // Texto directo de la explicación
            },
            // Guardar los datos originales por si se necesitan para refrescar
             // rawData: rawQuestionData // <--- Podríamos añadir esto si fuera necesario
        };
    } catch (error) {
        console.error("Error formateando pregunta Essential:", error, rawQuestionData);
        return null;
    }
}


// --- Función Auxiliar para Obtener Pregunta Aleatoria por Fundamento ---
// Esta función ahora solo obtiene los datos crudos. El formateo se hace después.
async function getRandomRawQuestionByFundamental(fundamentalKey) {
    try {
        const questions = await loadEssentialQuestions();
        if (!questions || !questions[fundamentalKey] || questions[fundamentalKey].length === 0) {
            console.warn(`[Essential Questions] No se encontraron preguntas para el fundamento: ${fundamentalKey}`); // Cambiado a warn
            return null; // Devolver null si no hay preguntas para este fundamento
        }
        const bank = questions[fundamentalKey];
        const randomIndex = getRandomInt(0, bank.length - 1);
        return bank[randomIndex]; // Devolver el objeto crudo del JSON
    } catch (error) {
        console.error(`Error obteniendo pregunta cruda para ${fundamentalKey}:`, error);
        return null; // Devolver null en caso de error de carga/proceso
    }
}

// --- Generadores Exportados (Uno por Fundamento) ---
// Ahora devuelven los datos crudos. El formateo se hará en getNextQuestion (questions.js)

export async function generatePurposeQuestion() {
    return await getRandomRawQuestionByFundamental('purpose');
}

export async function generateFormatQuestion() {
    return await getRandomRawQuestionByFundamental('format');
}

export async function generateBinaryStructureQuestion() {
    return await getRandomRawQuestionByFundamental('binary');
}

export async function generateNetworkHostPortionQuestion() {
    return await getRandomRawQuestionByFundamental('portions');
}

export async function generateSubnetMaskIntroQuestion() {
    return await getRandomRawQuestionByFundamental('mask');
}


// --- Array de Generadores para este Nivel ---
export const essentialQuestionGenerators = [
    generatePurposeQuestion,
    generateFormatQuestion,
    generateBinaryStructureQuestion,
    generateNetworkHostPortionQuestion,
    generateSubnetMaskIntroQuestion
];
