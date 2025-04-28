// js/config.js

/** Constantes de configuración del juego */

// Configuración General del Juego
export const TOTAL_QUESTIONS_PER_GAME = 10; // Número de preguntas por ronda
export const POINTS_PER_QUESTION = 10;    // Puntos ganados por respuesta correcta
export const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION; // Puntuación para ronda perfecta
export const QUESTION_TIMER_DURATION = 15;  // Segundos por pregunta en modo timer/mastery

// Almacenamiento Local (LocalStorage Keys)
export const MAX_HIGH_SCORES = 10;          // Máximo número de puntuaciones altas a guardar
export const USER_DATA_KEY = 'ipSprintUserData'; // Clave para datos de usuario (niveles, rachas)
export const HIGH_SCORES_KEY = 'ipSprintHighScores'; // Clave para tabla global de puntuaciones

// Niveles del Juego
export const LEVELS = ['Entry', 'Associate', 'Professional']; // Orden de niveles
