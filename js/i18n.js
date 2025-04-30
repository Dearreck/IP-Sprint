// js/i18n.js
// ==================================================
// Módulo de Internacionalización (i18n) para IP Sprint
// Carga archivos de idioma y aplica traducciones a la UI.
// ==================================================

// Variable para almacenar las cadenas del idioma actual cargado
let currentLanguageStrings = {};

/**
 * Carga el archivo JSON del idioma especificado.
 * @param {string} lang - Código del idioma (ej. 'es', 'en').
 * @returns {Promise<object>} Promesa que resuelve con los datos del idioma o rechaza con error.
 */
async function loadLanguage(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`); // Construye la ruta al archivo JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`); // Error si no se puede cargar
        }
        const data = await response.json(); // Parsea la respuesta JSON
        return data;
    } catch (error) {
        console.error(`Error cargando el archivo de idioma ${lang}.json:`, error);
        // Podríamos cargar un idioma por defecto (ej. 'es') en caso de error
        if (lang !== 'es') {
             console.warn("Intentando cargar idioma por defecto 'es'.");
             return await loadLanguage('es'); // Intenta cargar español como fallback
        } else {
            // Si falla incluso el español, devuelve un objeto vacío o lanza el error
             return {}; // O: throw error;
        }
    }
}

/**
 * Aplica las traducciones a los elementos del DOM.
 * Busca elementos con atributos 'data-translate' y 'data-translate-placeholder'.
 * @param {object} languageData - Objeto con las claves y textos del idioma cargado.
 */
function applyTranslations(languageData) {
    if (!languageData) return; // Salir si no hay datos

    currentLanguageStrings = languageData; // Guarda las cadenas cargadas globalmente

    // Traducir elementos con data-translate (para texto interno)
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate'); // Obtiene la clave (ej. "welcome_title")
        if (languageData[key]) {
            // Si la clave existe en el JSON, actualiza el contenido del elemento
            // Usamos innerHTML para permitir etiquetas como <strong> en las traducciones
            element.innerHTML = languageData[key];
        } else {
            console.warn(`Clave de traducción no encontrada: ${key}`); // Advierte si falta una clave
        }
    });

    // Traducir placeholders de inputs
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (languageData[key]) {
            element.placeholder = languageData[key]; // Actualiza el atributo placeholder
        } else {
            console.warn(`Clave de traducción para placeholder no encontrada: ${key}`);
        }
    });

    // Traducir el título de la página
    if (languageData['app_title']) {
        document.title = languageData['app_title'].replace(/🚀/g, '').trim(); // Quita el emoji para el título
    }
}

/**
 * Establece el idioma de la aplicación.
 * Carga el archivo de idioma, aplica las traducciones y guarda la preferencia.
 * @param {string} lang - Código del idioma a establecer ('es', 'en').
 */
export async function setLanguage(lang) {
    try {
        const languageData = await loadLanguage(lang); // Carga el JSON del idioma
        applyTranslations(languageData); // Aplica los textos a la página

        // Actualiza el atributo 'lang' de la etiqueta <html>
        document.documentElement.lang = lang;

        // Guarda el idioma seleccionado en localStorage para persistencia
        localStorage.setItem('preferredLanguage', lang);

        // Actualiza el estilo de los botones de idioma (marca el activo)
        document.querySelectorAll('#language-selector button').forEach(button => {
            if (button.getAttribute('data-lang') === lang) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

    } catch (error) {
        console.error("Error al establecer el idioma:", error);
        // Manejar el error, quizás mostrar un mensaje al usuario
    }
}

/**
 * Obtiene el idioma preferido actual (guardado o del navegador).
 * @returns {string} Código del idioma ('es' o 'en').
 */
export function getCurrentLanguage() {
    // Intenta obtener el idioma guardado en localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
        return savedLang;
    }

    // Si no hay idioma guardado, intenta detectar el idioma del navegador
    const browserLang = navigator.language.split('-')[0]; // Obtiene 'es' de 'es-ES' o 'en' de 'en-US'
    if (browserLang === 'es' || browserLang === 'en') {
        return browserLang;
    }

    // Si no se detecta español o inglés, usa español por defecto
    return 'es';
}

/**
 * Obtiene una cadena de texto traducida según la clave.
 * Útil para obtener textos que se generan dinámicamente en JS.
 * @param {string} key - La clave de la cadena (ej. "correct_feedback").
 * @param {object} [replacements={}] - Un objeto con valores para reemplazar placeholders (ej. { score: 100 }).
 * @returns {string} La cadena traducida o la clave si no se encuentra.
 */
export function getTranslation(key, replacements = {}) {
    let translatedString = currentLanguageStrings[key] || key; // Usa la clave como fallback

    // Reemplazar placeholders como {variable}
    for (const placeholder in replacements) {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        translatedString = translatedString.replace(regex, replacements[placeholder]);
    }

    return translatedString;
}
