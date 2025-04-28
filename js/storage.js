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
        // Merge defaults to ensure all keys exist
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

/** Guarda la puntuación alta, manteniendo solo las N mejores y una por usuario */
export function saveHighScore(name, score) {
    if (!name || score === undefined) return;
    try {
        const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
        const newScore = { name, score };
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score); // Ordenar descendente

        // Filtrar para obtener la mejor puntuación por usuario único
        const uniqueUserScores = [];
        const userNames = new Set();
        for (const scoreEntry of highScores) {
            if (!userNames.has(scoreEntry.name)) {
                uniqueUserScores.push(scoreEntry);
                userNames.add(scoreEntry.name);
            }
        }

        // Mantener solo las N mejores puntuaciones únicas
        const finalScores = uniqueUserScores.slice(0, MAX_HIGH_SCORES);
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(finalScores));
    } catch (error) {
        console.error("Error en saveHighScore:", error);
    }
}

/** Carga las N mejores puntuaciones altas para mostrar */
export function loadHighScores() {
    try {
        const highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
        // Ordenar por si acaso no estuvieran ordenadas en storage
        highScores.sort((a, b) => b.score - a.score);
        return highScores.slice(0, MAX_HIGH_SCORES); // Devuelve solo las N mejores
    } catch (error) {
        console.error("Error en loadHighScores:", error);
        return []; // Devuelve array vacío en caso de error
    }
}
