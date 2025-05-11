// js/i18n.js
// ==================================================
// Módulo de Internacionalización (i18n) para IP Sprint
// Optimizado para coordinar con script anti-FOUC en <head>
// ==================================================

let currentLanguageStrings = {};
let currentLangCode = 'es'; // Se actualizará al obtener el idioma actual

// Clave para guardar la preferencia de idioma en localStorage
const LANG_STORAGE_KEY = 'preferredLanguage';
const DEFAULT_LANG = 'es';
// Elemento del DOM para el texto del botón de idioma
let languageToggleButtonTextSpan = null;

/**
 * Carga el archivo JSON del idioma especificado de forma asíncrona.
 * @param {string} lang - Código del idioma ('es', 'en').
 * @returns {Promise<object>} Promesa que resuelve con los datos del idioma o un objeto vacío en caso de error.
 */
async function loadLanguageFile(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, lang: ${lang}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error cargando el archivo de idioma ${lang}.json:`, error);
        if (lang !== DEFAULT_LANG) {
            console.warn(`Intentando cargar idioma por defecto '${DEFAULT_LANG}' como fallback.`);
            try {
                return await loadLanguageFile(DEFAULT_LANG);
            } catch (fallbackError) {
                console.error(`Error cargando idioma por defecto '${DEFAULT_LANG}':`, fallbackError);
                return {};
            }
        }
        return {};
    }
}

/**
 * Aplica las traducciones a los elementos del DOM que tienen atributos 'data-translate'
 * o 'data-translate-placeholder', usando las cadenas de currentLanguageStrings.
 */
function applyStaticTranslations() {
    if (!currentLanguageStrings || Object.keys(currentLanguageStrings).length === 0) {
        // console.warn("[i18n] applyStaticTranslations llamado sin datos de idioma cargados.");
        return;
    }

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (currentLanguageStrings.hasOwnProperty(key)) {
            element.innerHTML = currentLanguageStrings[key];
        }
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (currentLanguageStrings.hasOwnProperty(key)) {
            element.placeholder = currentLanguageStrings[key];
        }
    });

    if (currentLanguageStrings['app_title']) {
        document.title = currentLanguageStrings['app_title'].replace(/🚀/g, '').trim();
    }
    // console.log("[i18n] Traducciones estáticas aplicadas para el idioma:", currentLangCode);
}

/**
 * Actualiza el texto del botón de cambio de idioma (ej. "EN" o "ES").
 */
function updateLanguageButtonUI() {
    if (!languageToggleButtonTextSpan) {
        languageToggleButtonTextSpan = document.getElementById('language-toggle-text');
        if (!languageToggleButtonTextSpan) {
            // console.warn("[i18n] Elemento #language-toggle-text no encontrado para actualizar UI del botón.");
            return;
        }
    }
    // Muestra el código del *otro* idioma (al que se cambiará al hacer clic)
    const nextLangDisplay = currentLangCode === 'es' ? 'EN' : 'ES';
    languageToggleButtonTextSpan.textContent = nextLangDisplay;
}

/**
 * Establece el idioma de la aplicación.
 * @param {string} lang - Código del idioma a establecer ('es' o 'en').
 * @param {boolean} [isInitialLoad=false] - Indica si es la carga inicial.
 */
export async function setLanguage(lang, isInitialLoad = false) {
    const validLangs = ['es', 'en'];
    if (!validLangs.includes(lang)) {
        // console.warn(`[i18n] Idioma inválido solicitado: ${lang}. Usando el actual o default.`);
        lang = getCurrentLanguage(); // Revertir al actual o al default
    }

    // console.log(`[i18n] setLanguage llamado con: ${lang}, esCargaInicial: ${isInitialLoad}`);

    try {
        // Solo cargar el archivo de idioma si es diferente al actual o si no hay cadenas cargadas
        if (lang !== currentLangCode || Object.keys(currentLanguageStrings).length === 0) {
            currentLanguageStrings = await loadLanguageFile(lang);
        }
        currentLangCode = lang; // Actualizar el código de idioma actual del módulo

        if (!isInitialLoad) {
            // Si NO es la carga inicial (es decir, el usuario hizo clic para cambiar),
            // SÍ actualizamos el atributo lang en <html> y guardamos en localStorage.
            // El script del <head> ya se encargó de esto para la carga inicial.
            document.documentElement.lang = lang;
            localStorage.setItem(LANG_STORAGE_KEY, lang);
            // console.log(`[i18n] Atributo lang y localStorage actualizados a: ${lang}`);
        } else {
            // Si ES la carga inicial, el script del <head> ya puso el lang en <html>.
            // Solo nos aseguramos de que nuestro currentLangCode interno esté sincronizado.
            // Esto se hace en getCurrentLanguage() o al inicio de esta función.
            // console.log(`[i18n] Carga inicial, lang en <html> ya debería ser: ${document.documentElement.lang}`);
        }

        applyStaticTranslations(); // Aplicar traducciones a elementos estáticos
        updateLanguageButtonUI(); // Actualizar el texto del botón (ej. "EN" o "ES")

    } catch (error) {
        console.error(`[i18n] Error al establecer el idioma a ${lang}:`, error);
    }
}

/**
 * Obtiene el código del idioma preferido actual.
 * Prioriza: 1. Atributo lang de <html> (establecido por script <head>), 2. localStorage, 3. Default.
 * @returns {string} Código del idioma ('es' o 'en').
 */
export function getCurrentLanguage() {
    // 1. Confiar en el atributo lang de <html>, ya que el script del <head> lo establece.
    const htmlLang = document.documentElement.lang;
    if (htmlLang && (htmlLang === 'es' || htmlLang === 'en')) {
        currentLangCode = htmlLang; // Sincronizar estado interno del módulo
        return htmlLang;
    }

    // 2. Fallback a localStorage si documentElement.lang no está (muy poco probable después del script <head>)
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
        currentLangCode = savedLang;
        return savedLang;
    }

    // 3. Default si todo lo demás falla
    currentLangCode = DEFAULT_LANG;
    return DEFAULT_LANG;
}

/**
 * Obtiene una cadena de texto traducida según la clave proporcionada.
 * @param {string} key - La clave de la cadena de traducción.
 * @param {object} [replacements={}] - Un objeto opcional con pares clave-valor para reemplazar placeholders.
 * @returns {string} La cadena traducida, o la clave original si no se encuentra.
 */
export function getTranslation(key, replacements = {}) {
    let translatedString = currentLanguageStrings.hasOwnProperty(key) ? currentLanguageStrings[key] : key;

    if (typeof translatedString !== 'string') {
        return key; // Devuelve la clave si no es un string (ej. si la clave existe pero el valor es null)
    }

    try {
        for (const placeholder in replacements) {
            if (replacements.hasOwnProperty(placeholder)) {
                // Usar una función de reemplazo para manejar casos donde el valor de reemplazo podría ser null/undefined
                // y evitar que se convierta en "null" o "undefined" literal en la cadena.
                const replacementValue = replacements[placeholder];
                translatedString = translatedString.replace(
                    new RegExp(`{${placeholder}}`, 'g'),
                    replacementValue !== null && replacementValue !== undefined ? String(replacementValue) : '' // Reemplazar con string vacío si es null/undefined
                );
            }
        }
    } catch (e) {
        console.error(`[i18n] Error reemplazando placeholder en clave '${key}':`, e);
        return key; // Devuelve la clave original en caso de error de reemplazo
    }
    return translatedString;
}
