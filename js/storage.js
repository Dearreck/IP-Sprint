// js/storage.js
import { MAX_HIGH_SCORES, USER_DATA_KEY, HIGH_SCORES_KEY } from './config.js';

/** Obtiene todos los datos de usuario de localStorage */
export function getAllUserData() {
    try {
        return JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {};
    } catch (error) {
        console.error("Error al parsear UserData:", error);
        return {};
    }
}

/** Obtiene los datos de un usuario específico o valores por defecto */
export function getUserData(username) {
    const allUserData = getAllUserData();
    const defaultData = { unlockedLevels: ['Entry'], entryPerfectStreak: 0, associatePerfectStreak: 0 };
    if (allUserData[username]) {
        return { ...defaultData, ...allUserData[username] };
    } else {
        return defaultData;
    }
}

/** Guarda los datos actualizados de un usuario específico */
export function saveUserData(username, userData) {
    if (!username || !userData) return;
    const allUserData = getAllUserData();
    allUserData[username] = userData;
    try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
    } catch (error) {
        console.error("Error al guardar UserData:", error);
    }
}

/**
 * Guarda/Actualiza la puntuación más alta de un usuario para un nivel y modo específicos.
 * @param {string} name - Nombre del usuario.
 * @param {number} score - Puntuación obtenida.
 * @param {string} level - Nivel jugado.
 * @param {string} mode - Modo jugado ('standard', 'mastery').
 */
export function saveHighScore(name, score, level, mode) { // Añadido parámetro mode
    if (!name || score === undefined || !level || !mode) return;
    try {
        // Carga la estructura completa de puntuaciones: { username: { levelMode: score, ... }, ... }
        const allHighScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || {};

        // Crea la entrada para el usuario si no existe
        if (!allHighScores[name]) {
            allHighScores[name] = {};
        }

        // Crea la clave combinada para nivel y modo
        // Para Entry, diferencia entre standard y mastery. Para otros, usa 'standard' por defecto.
        const levelModeKey = (level === 'Entry') ? `${level}-${mode}` : `${level}-standard`;

        // Actualiza la puntuación solo si es mayor que la existente para ese nivel/modo
        if (!allHighScores[name][levelModeKey] || score > allHighScores[name][levelModeKey]) {
            allHighScores[name][levelModeKey] = score;
        }

        // Guarda la estructura completa actualizada
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(allHighScores));

    } catch (error) {
        console.error("Error en saveHighScore:", error);
    }
}

/**
 * Carga las puntuaciones altas por usuario y nivel/modo.
 * Devuelve un array de objetos de usuario ordenado por la puntuación más alta alcanzada en cualquier nivel.
 * @returns {Array<object>} Array [{ name: string, scores: { levelMode: score, ... } }, ...]
 */
export function loadHighScores() {
    try {
        const allHighScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || {};
        const scoresArray = [];

        // Convertir el objeto en un array de usuarios con sus puntuaciones
        for (const name in allHighScores) {
            if (allHighScores.hasOwnProperty(name)) {
                // Calcular la puntuación máxima de este usuario para ordenar
                let maxScore = 0;
                for (const levelModeKey in allHighScores[name]) {
                    if (allHighScores[name][levelModeKey] > maxScore) {
                        maxScore = allHighScores[name][levelModeKey];
                    }
                }
                scoresArray.push({
                    name: name,
                    scores: allHighScores[name], // Objeto con { levelMode: score, ... }
                    maxScore: maxScore // Guardar para ordenar
                });
            }
        }

        // Ordenar usuarios por su puntuación máxima descendente
        scoresArray.sort((a, b) => b.maxScore - a.maxScore);

        // Limitar al número máximo de usuarios a mostrar y quitar maxScore temporal
        return scoresArray.slice(0, MAX_HIGH_SCORES).map(user => ({
            name: user.name,
            scores: user.scores
        }));

    } catch (error) {
        console.error("Error en loadHighScores:", error);
        return []; // Devuelve array vacío en caso de error
    }
}
