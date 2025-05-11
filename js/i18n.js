// js/i18n.js
// ==================================================
// Módulo de Internacionalización (i18n) para IP Sprint
// Optimizado para coordinar con script anti-FOUC en <head>
// ==================================================

let currentLanguageStrings = {};
let currentLangCode = 'es'; // Se actualizará con la preferencia del usuario o del script <head>

// Clave para guardar la preferencia de idioma en localStorage
const LANG_STORAGE_KEY = 'preferredLanguage';
// Elemento del DOM para el texto del botón de idioma (se cachea una vez)
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
        if (lang !== 'es') {
            console.warn("Intentando cargar idioma por defecto 'es' como fallback.");
            try {
                return await loadLanguageFile('es');
            } catch (fallbackError) {
                console.error("Error cargando idioma por defecto 'es':", fallbackError);
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
        console.warn("[i18n] applyStaticTranslations llamado sin datos de idioma cargados.");
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
            console.warn("[i18n] Elemento #language-toggle-text no encontrado para actualizar UI del botón.");
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
 * @param {boolean} [isInitialLoad=false] - Indica si es la carga inicial (para no re-setear lang en <html>).
 */
export async function setLanguage(lang, isInitialLoad = false) {
    const validLangs = ['es', 'en'];
    if (!validLangs.includes(lang)) {
        console.warn(`[i18n] Idioma inválido solicitado: ${lang}. Usando ${currentLangCode} o 'es'.`);
        lang = getCurrentLanguage(); // Revertir al actual o al default
    }

    // console.log(`[i18n] setLanguage llamado con: ${lang}, esCargaInicial: ${isInitialLoad}`);

    try {
        currentLanguageStrings = await loadLanguageFile(lang);
        currentLangCode = lang; // Actualizar el código de idioma actual del módulo

        if (!isInitialLoad) {
            // Solo si NO es la carga inicial (es decir, el usuario hizo clic para cambiar),
            // actualizamos el atributo lang en <html> y guardamos en localStorage.
            // El script del <head> ya se encargó de esto en la carga inicial.
            document.documentElement.lang = lang;
            localStorage.setItem(LANG_STORAGE_KEY, lang);
            // console.log(`[i18n] Atributo lang y localStorage actualizados a: ${lang}`);
        }

        applyStaticTranslations(); // Aplicar traducciones a elementos estáticos
        updateLanguageButtonUI(); // Actualizar el texto del botón (ej. "EN" o "ES")

    } catch (error) {
        console.error(`[i18n] Error al establecer el idioma a ${lang}:`, error);
    }
}

/**
 * Obtiene el código del idioma preferido actual.
 * El script del <head> ya establece document.documentElement.lang,
 * por lo que podemos confiar en él como fuente primaria después de la carga inicial.
 * Si no, recurre a localStorage o a un default.
 * @returns {string} Código del idioma ('es' o 'en').
 */
export function getCurrentLanguage() {
    // El script del <head> ya debería haber establecido esto.
    // Si estamos antes de que el DOM esté listo y se llama desde el script del <head>,
    // esta función aún no será llamada. Cuando main.js la llama, el DOM está listo.
    const htmlLang = document.documentElement.lang;
    if (htmlLang && (htmlLang === 'es' || htmlLang === 'en')) {
        // console.log("[i18n] getCurrentLanguage: Usando document.documentElement.lang:", htmlLang);
        currentLangCode = htmlLang; // Sincronizar estado interno del módulo
        return htmlLang;
    }

    // Fallback a localStorage si documentElement.lang no está (poco probable después del script del <head>)
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
        // console.log("[i18n] getCurrentLanguage: Usando localStorage:", savedLang);
        currentLangCode = savedLang;
        return savedLang;
    }

    // console.log("[i18n] getCurrentLanguage: Usando default 'es'.");
    currentLangCode = 'es'; // Default si todo lo demás falla
    return 'es';
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
        return key;
    }

    try {
        for (const placeholder in replacements) {
            if (replacements.hasOwnProperty(placeholder)) {
                const regex = new RegExp(`{${placeholder}}`, 'g');
                translatedString = translatedString.replace(regex, String(replacements[placeholder] ?? `{${placeholder}}`));
            }
        }
    } catch (e) {
        console.error(`[i18n] Error reemplazando placeholder en clave '${key}':`, e);
        return key;
    }
    return translatedString;
}
