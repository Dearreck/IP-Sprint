// js/config.js

/** Constantes de configuración del juego */

// Configuración General del Juego
export const TOTAL_QUESTIONS_PER_GAME = 10; // Número de preguntas por ronda
export const POINTS_PER_QUESTION = 10;    // Puntos ganados por respuesta correcta (AHORA FIJO)
export const PERFECT_SCORE = TOTAL_QUESTIONS_PER_GAME * POINTS_PER_QUESTION; // Puntuación máxima posible (100)
export const QUESTION_TIMER_DURATION = 15;  // Segundos por pregunta (para niveles/modos con timer)

// Umbral de puntuación para contar en racha de desbloqueo de NIVEL PROFESSIONAL
export const MIN_SCORE_PERCENT_FOR_STREAK = 90; // Requiere 90% o más en Associate para desbloquear Pro

// Nota: Desbloquear Associate sigue requiriendo 100% (lógica en game.js)

// Almacenamiento Local (LocalStorage Keys)
export const MAX_HIGH_SCORES = 10;          // Máximo número de usuarios a mostrar en puntuaciones altas
export const USER_DATA_KEY = 'ipSprintUserData'; // Clave para datos de usuario (niveles, rachas)
export const HIGH_SCORES_KEY = 'ipSprintHighScores'; // Clave para tabla de puntuaciones por nivel/modo

// Niveles del Juego
export const LEVELS = ['Entry', 'Associate', 'Professional']; // Orden de niveles
