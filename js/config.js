// js/config.js
// ==================================================
// Archivo de Configuración para IP Sprint
// Contiene todas las constantes y parámetros
// que controlan el comportamiento del juego.
// ==================================================

/** Constantes de configuración del juego */

// --- Configuración General del Juego ---
export const TOTAL_QUESTIONS_PER_GAME = 10;
export const POINTS_PER_QUESTION = 10;
export const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION;

// --- Configuración del Temporizador ---
export const TIMER_DURATION_BY_LEVEL = {
    // --- Añadido Essential (sin timer) ---
    'Essential': {
        'standard': null
    },
    'Entry': {
        // 'standard': null, // Modo standard sin timer
        'mastery': 15     // Modo mastery con timer
    },
    'Associate': {
        'standard': 25
    },
    'Professional': {
        'standard': 30
    },
    'Expert': { // Añadido para futuro
        'standard': 35
    },
    'default': 20
};

// --- Reglas de Desbloqueo de Niveles ---
export const MIN_SCORE_PERCENT_FOR_STREAK = 90; // Para Associate -> Professional

// --- Configuración de Almacenamiento Local (LocalStorage) ---
export const MAX_HIGH_SCORES = 10;
export const USER_DATA_KEY = 'ipSprintUserData';
export const HIGH_SCORES_KEY = 'ipSprintHighScores';

// --- Definición de Niveles (ASEGÚRATE QUE ESTÉ ASÍ) ---
// Array que define los nombres de los niveles y su orden de progresión.
export const LEVELS = ['Essential', 'Entry', 'Associate', 'Professional', 'Expert']; // Essential al principio

