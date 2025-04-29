// js/config.js
// ==================================================
// Archivo de Configuración para IP Sprint
// Contiene todas las constantes y parámetros
// que controlan el comportamiento del juego.
// ==================================================

/** Constantes de configuración del juego */

// --- Configuración General del Juego ---
// Define cuántas preguntas se harán en cada ronda/partida.
export const TOTAL_QUESTIONS_PER_GAME = 10;

// Define cuántos puntos se otorgan por cada respuesta correcta.
// (Simplificado: ahora es un valor fijo para todas las preguntas).
export const POINTS_PER_QUESTION = 10;

// Calcula la puntuación máxima posible en una ronda (puntuación perfecta).
// Útil para calcular porcentajes y verificar rondas perfectas.
export const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION; // Será 100 si son 10 preguntas de 10 puntos

// --- Configuración del Temporizador ---
// Define la duración del temporizador (en segundos) para diferentes niveles/modos.
// Esto permite ajustar la dificultad del tiempo.
export const TIMER_DURATION_BY_LEVEL = {
    'Entry': {
        // 'standard': null, // Entry standard (★) no usa timer, se podría definir como null o no incluirlo.
        'mastery': 15     // Entry mastery (👑) tiene 15 segundos por pregunta.
    },
    'Associate': {
        'standard': 25     // Nivel Associate (siempre usa timer) tiene 25 segundos.
        // 'mastery': 25    // Podríamos añadir un modo mastery si fuera necesario.
    },
    'Professional': {
        'standard': 30     // Ejemplo para el futuro: Nivel Professional tendría 30 segundos.
    },
    // Valor por defecto si por alguna razón no se encuentra una configuración específica
    // para el nivel/modo actual. Ayuda a prevenir errores.
    'default': 20
};

// --- Reglas de Desbloqueo de Niveles ---
// Define el porcentaje mínimo de puntuación necesario en una ronda del Nivel Associate
// para que cuente dentro de la racha requerida para desbloquear el Nivel Professional.
export const MIN_SCORE_PERCENT_FOR_STREAK = 90; // Requiere 90% o más.

// Nota importante: La regla para desbloquear el Nivel Associate (jugando Entry)
// sigue requiriendo rondas perfectas (100%). Esta lógica se maneja en `game.js`.

// --- Configuración de Almacenamiento Local (LocalStorage) ---
// Define cuántas entradas de usuario (con sus mejores puntuaciones por nivel)
// se mostrarán como máximo en la tabla de "Mejores Puntuaciones".
export const MAX_HIGH_SCORES = 10;

// Define la clave (nombre) que se usará en localStorage para guardar los datos
// generales de todos los usuarios (niveles desbloqueados, rachas de progreso).
export const USER_DATA_KEY = 'ipSprintUserData';

// Define la clave que se usará en localStorage para guardar la estructura
// de las puntuaciones más altas por usuario y por nivel/modo.
export const HIGH_SCORES_KEY = 'ipSprintHighScores';

// --- Definición de Niveles ---
// Array que define los nombres de los niveles y su orden de progresión.
export const LEVELS = ['Entry', 'Associate', 'Professional'];
