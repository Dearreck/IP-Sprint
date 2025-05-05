// js/questions_essential.js
// ==================================================
// Generadores de Preguntas - Nivel Essential (Teórico)
// Carga preguntas desde un archivo JSON externo.
// ==================================================

import { getRandomInt, shuffleArray } from './utils.js';
import { getCurrentLanguage, getTranslation } from './i18n.js'; // Necesitamos el idioma actual

// --- Variables del Módulo ---
let essentialQuestionsData = null; // Almacenará las preguntas cargadas del JSON
let isLoading = false;             // Flag para evitar cargas múltiples
let loadPromise = null;            // Promesa para manejar la carga asíncrona

// --- Función para Cargar el JSON ---
async function loadEssentialQuestions() {
    // Si ya está cargado, devolverlo
    if (essentialQuestionsData) {
        return essentialQuestionsData;
    }
    // Si ya se está cargando, devolver la promesa existente
    if (isLoading && loadPromise) {
        return loadPromise;
    }

    // Marcar como cargando e iniciar la carga
    isLoading = true;
    console.log("[Essential Questions] Iniciando carga de questions_essential.json...");

    loadPromise = new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('data/questions_essential.json'); // Ruta al archivo JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            essentialQuestionsData = data; // Guardar los datos cargados
            isLoading = false;
            console.log("[Essential Questions] JSON cargado y parseado correctamente.");
            resolve(essentialQuestionsData);
        } catch (error) {
            console.error("Error cargando questions_essential.json:", error);
            isLoading = false;
            essentialQuestionsData = null; // Resetear en caso de error
            reject(error); // Rechazar la promesa
        }
    });

    return loadPromise;
}

// --- Función Auxiliar para Obtener Pregunta Aleatoria por Fundamento ---
async function getRandomQuestionByFundamental(fundamentalKey) {
    try {
        // Asegurarse de que los datos estén cargados
        const questions = await loadEssentialQuestions();

        // Verificar que el fundamento y las preguntas existan
        if (!questions || !questions[fundamentalKey] || questions[fundamentalKey].length === 0) {
            console.error(`No se encontraron preguntas para el fundamento: ${fundamentalKey}`);
            return null; // O lanzar un error más específico
        }

        // Seleccionar una pregunta aleatoria de ese fundamento
        const bank = questions[fundamentalKey];
        const randomIndex = getRandomInt(0, bank.length - 1);
        const questionData = bank[randomIndex];

        // Formatear la pregunta para la UI
        return formatQuestionForUI(questionData);

    } catch (error) {
        console.error(`Error obteniendo pregunta para ${fundamentalKey}:`, error);
        return null;
    }
}

// --- Función Auxiliar para Formatear la Pregunta ---
function formatQuestionForUI(questionData) {
    const lang = getCurrentLanguage(); // Obtener idioma actual

    // Extraer textos en el idioma correcto
    const qText = questionData.questionText[lang] || questionData.questionText['en']; // Fallback a inglés
    const explanation = questionData.explanationText[lang] || questionData.explanationText['en'];
    let optionsText = [];
    let correctAnswerText = '';

    // Procesar opciones (diferente para VF y MC)
    if (questionData.type === 'VF') {
        // Para V/F, las opciones usan claves i18n estándar
        optionsText = questionData.options.map(opt => getTranslation(opt.key));
        const correctOption = questionData.options.find(opt => opt.correct);
        correctAnswerText = correctOption ? getTranslation(correctOption.key) : 'Error';
        // Opcional: Desordenar ['Verdadero', 'Falso']
        // shuffleArray(optionsText);
    } else { // Asumir MC
        // Para MC, las opciones tienen texto directo multilingüe
        optionsText = questionData.options.map(opt => opt[lang] || opt['en']); // Fallback a inglés
        const correctOption = questionData.options.find(opt => opt.correct);
        correctAnswerText = correctOption ? (correctOption[lang] || correctOption['en']) : 'Error';
        // Desordenar opciones MC
        shuffleArray(optionsText);
    }

    // Devolver la estructura que espera ui.js (con texto directo)
    return {
        // Incluir la teoría asociada a este fundamento (siempre la misma clave por fundamento)
        // Necesitamos una forma de mapear fundamentalKey a theoryKey, o pasar theoryKey
        theoryKey: `theory_essential_${questionData.id.split('_')[0]}`, // Ej: 'theory_essential_purpose'
        question: {
            key: questionData.id, // Usar ID como clave interna (no se traduce)
            text: qText // Texto directo de la pregunta
        },
        options: optionsText,       // Array de strings con texto de opciones
        correctAnswer: correctAnswerText, // Texto de la respuesta correcta
        explanation: {
             baseTextKey: questionData.id + '_expl', // Clave interna para explicación (no se traduce)
             text: explanation // Texto directo de la explicación
        }
    };
}


// --- Generadores Exportados (Uno por Fundamento) ---

export async function generatePurposeQuestion() {
    return await getRandomQuestionByFundamental('purpose');
}

export async function generateFormatQuestion() {
    return await getRandomQuestionByFundamental('format');
}

export async function generateBinaryStructureQuestion() {
    return await getRandomQuestionByFundamental('binary');
}

export async function generateNetworkHostPortionQuestion() {
    return await getRandomQuestionByFundamental('portions');
}

export async function generateSubnetMaskIntroQuestion() {
    return await getRandomQuestionByFundamental('mask');
}


// --- Array de Generadores para este Nivel ---
// Estas funciones ahora son ASÍNCRONAS debido al fetch
export const essentialQuestionGenerators = [
    generatePurposeQuestion,
    generateFormatQuestion,
    generateBinaryStructureQuestion,
    generateNetworkHostPortionQuestion,
    generateSubnetMaskIntroQuestion
];

// --- Precarga Opcional ---
// Podríamos llamar a loadEssentialQuestions() aquí para iniciar la carga
// tan pronto como se carga este módulo, aunque no es estrictamente necesario.
// loadEssentialQuestions().catch(err => console.error("Error en precarga inicial de preguntas Essential:", err));

