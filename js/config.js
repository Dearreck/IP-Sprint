// js/config.js

/** Constantes de configuración del juego */

// Juego
export const TOTAL_QUESTIONS_PER_GAME = 10;
export const POINTS_PER_QUESTION = 10;
export const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION;
export const QUESTION_TIMER_DURATION = 15; // Segundos por pregunta en modo timer

// Almacenamiento Local
export const MAX_HIGH_SCORES = 10; // Máximo de puntuaciones a guardar
export const USER_DATA_KEY = 'ipSprintUserData'; // Clave para datos de usuario (niveles, rachas)
export const HIGH_SCORES_KEY = 'ipSprintHighScores'; // Clave para tabla de puntuaciones

// Niveles (podríamos usar un objeto para más detalle si crece)
export const LEVELS = ['Entry', 'Associate', 'Professional'];
