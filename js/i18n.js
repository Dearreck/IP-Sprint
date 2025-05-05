// js/i18n.js
// ==================================================
// Módulo de Internacionalización (i18n) para IP Sprint
// Carga archivos de idioma y aplica traducciones a la UI.
// MODIFICADO: Actualiza el texto del botón toggle de idioma.
// ==================================================

let currentLanguageStrings = {}; // Almacena las traducciones cargadas
let currentLangCode = 'es'; // Guarda el código del idioma actual ('es' o 'en')

/**
 * Carga el archivo JSON del idioma especificado de forma asíncrona.
 * @param {string} lang - Código del idioma ('es', 'en').
 * @returns {Promise<object>} Promesa que resuelve con los datos del idioma o un objeto vacío en caso de error.
 */
async function loadLanguage(lang) {
    try {
        // Construye la ruta al archivo JSON del idioma
        const response = await fetch(`lang/${lang}.json`);
        // Verifica si la carga fue exitosa
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, lang: ${lang}`);
        }
        // Parsea la respuesta como JSON
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error cargando el archivo de idioma ${lang}.json:`, error);
        // Intenta cargar el idioma por defecto (español) si falla el solicitado
        if (lang !== 'es') {
             console.warn("Intentando cargar idioma por defecto 'es'.");
             try {
                 return await loadLanguage('es'); // Intenta cargar español como fallback
             } catch (fallbackError) {
                 console.error("Error cargando idioma por defecto 'es':", fallbackError);
                 return {}; // Devuelve objeto vacío si incluso el fallback falla
             }
        } else {
            // Si falla el español, devuelve objeto vacío
             return {};
        }
    }
}

/**
 * Aplica las traducciones a los elementos del DOM que tienen atributos 'data-translate'
 * o 'data-translate-placeholder'.
 * @param {object} languageData - Objeto con las claves y textos del idioma cargado.
 */
function applyTranslations(languageData) {
    // Salir si no hay datos de idioma
    if (!languageData || Object.keys(languageData).length === 0) {
        console.warn("applyTranslations llamado sin datos de idioma válidos.");
        return;
    }

    // Guardar las cadenas cargadas para uso posterior por getTranslation
    currentLanguageStrings = languageData;

    // Traducir elementos con data-translate (contenido interno)
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (languageData.hasOwnProperty(key)) { // Usar hasOwnProperty para evitar problemas con prototipos
            // Usar innerHTML permite incluir etiquetas HTML (ej. <strong>) en las traducciones
            element.innerHTML = languageData[key];
        } else {
            // Opcional: Advertir si falta una clave (puede ser útil en desarrollo)
            // console.warn(`Clave de traducción [data-translate] no encontrada: ${key}`);
        }
    });

    // Traducir atributos placeholder
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (languageData.hasOwnProperty(key)) {
            element.placeholder = languageData[key];
        } else {
            // console.warn(`Clave de traducción [data-translate-placeholder] no encontrada: ${key}`);
        }
    });

    // Traducir el título de la página (eliminando el emoji si existe)
    if (languageData['app_title']) {
        document.title = languageData['app_title'].replace(/🚀/g, '').trim();
    }
}

/**
 * Establece el idioma de la aplicación.
 * Carga el archivo de idioma correspondiente, aplica las traducciones a los elementos estáticos,
 * actualiza el atributo lang del HTML, guarda la preferencia en localStorage y actualiza el botón toggle.
 * @param {string} lang - Código del idioma a establecer ('es' o 'en').
 */
export async function setLanguage(lang) {
    // Validar que el idioma solicitado sea 'es' o 'en'
    const validLangs = ['es', 'en'];
    if (!validLangs.includes(lang)) {
        console.warn(`Idioma inválido solicitado: ${lang}. Usando ${currentLangCode} o 'es'.`);
        lang = getCurrentLanguage(); // Revertir al actual o al default si es inválido
    }

    console.log(`[i18n] Estableciendo idioma a: ${lang}`); // Log

    try {
        // Cargar los datos del idioma (JSON)
        const languageData = await loadLanguage(lang);
        // Aplicar las traducciones a los elementos HTML estáticos
        applyTranslations(languageData);
        // Actualizar el código del idioma actual
        currentLangCode = lang;

        // Actualizar el atributo 'lang' de la etiqueta <html> para accesibilidad y CSS
        document.documentElement.lang = lang;

        // Guardar el idioma seleccionado en localStorage para persistencia
        localStorage.setItem('preferredLanguage', lang);

        // Actualizar el texto del botón toggle de idioma
        const toggleButtonTextSpan = document.getElementById('language-toggle-text');
        if (toggleButtonTextSpan) {
            // Mostrar el código del *otro* idioma (al que se cambiará al hacer clic)
            const nextLangDisplay = lang === 'es' ? 'EN' : 'ES';
            toggleButtonTextSpan.textContent = nextLangDisplay;
            console.log(`[i18n] Texto del botón toggle actualizado a: ${nextLangDisplay}`); // Log
        } else {
            console.warn("[i18n] Elemento #language-toggle-text no encontrado.");
        }

    } catch (error) {
        console.error("Error al establecer el idioma:", error);
        // Aquí se podría mostrar un mensaje de error más visible al usuario si falla
    }
}

/**
 * Obtiene el código del idioma preferido actual.
 * Prioriza: 1. localStorage, 2. Idioma del navegador, 3. 'es' por defecto.
 * @returns {string} Código del idioma ('es' o 'en').
 */
export function getCurrentLanguage() {
    // 1. Intentar obtener del localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
        return savedLang;
    }

    // 2. Intentar obtener del navegador (solo la parte del idioma, ej: 'es' de 'es-MX')
    // Usar optional chaining por si navigator o language no existen
    const browserLang = navigator?.language?.split('-')[0];
    if (browserLang && (browserLang === 'es' || browserLang === 'en')) {
        return browserLang;
    }

    // 3. Devolver 'es' como idioma por defecto si los anteriores fallan
    return 'es';
}

/**
 * Obtiene una cadena de texto traducida según la clave proporcionada.
 * Permite reemplazar placeholders en la cadena traducida.
 * @param {string} key - La clave de la cadena de traducción (ej. "welcome_title").
 * @param {object} [replacements={}] - Un objeto opcional con pares clave-valor para reemplazar placeholders.
 * Ej: { username: "Player1" } para reemplazar "{username}".
 * @returns {string} La cadena traducida con los reemplazos hechos, o la clave original si no se encuentra la traducción.
 */
export function getTranslation(key, replacements = {}) {
    // Obtener la cadena del objeto cargado, o usar la clave como fallback
    let translatedString = currentLanguageStrings.hasOwnProperty(key) ? currentLanguageStrings[key] : key;

    // Si no es un string (podría ser null o undefined si la clave existe pero está vacía), devolver la clave
    if (typeof translatedString !== 'string') {
        // console.warn(`[i18n] Clave '${key}' encontrada pero no es un string.`);
        return key;
    }

    // Reemplazar placeholders como {variable} en la cadena traducida
    try {
        for (const placeholder in replacements) {
            // Crear una expresión regular global para reemplazar todas las ocurrencias
            const regex = new RegExp(`{${placeholder}}`, 'g');
            // Usar una función de reemplazo para manejar valores que no sean string
            translatedString = translatedString.replace(regex, (match) => {
                 // Convertir el valor de reemplazo a string, o devolver el placeholder original si el valor es null/undefined
                 return String(replacements[placeholder] ?? match);
            });
        }
    } catch (e) {
        // Capturar errores durante el reemplazo (ej. si translatedString se vuelve inválido)
        console.error(`[i18n] Error reemplazando placeholder en clave '${key}':`, e);
        return key; // Devolver la clave original en caso de error
    }

    // Si después de todo, la cadena es igual a la clave, podría significar que no se encontró traducción
    // (o que la traducción es idéntica a la clave, lo cual es posible).
    // Devolvemos la cadena resultante. Si es la clave, el código que llama puede detectarlo si necesita.
    return translatedString;
}
