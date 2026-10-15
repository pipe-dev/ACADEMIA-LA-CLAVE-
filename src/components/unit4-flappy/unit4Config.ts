// src/components/unit4-flappy/unit4Config.ts

export const RECORD_KEY = 'laclave_unit4_flappy_record';

// ---- Física (escala por alto de pantalla, deltaTime) ----
export const G = (h: number) => h * 1.5; // gravedad px/s²
export const FLAP = (h: number) => -h * 0.6; // impulso al aletear px/s
export const MAX_FALL = (h: number) => h * 1.0; // tope de caída
export const FLAP_ROT = 0.45;
export const FLAP_HOLD = 0.65;
export const BIRD_R = (h: number) => h * 0.042;
export const BIRD_X = (w: number) => w * 0.4;
export const FLOOR_H = (h: number) => h * 0.13;
export const FLOAT_AMP = (h: number) => h * 0.03;
export const floorY = (h: number) => h - FLOOR_H(h);

// ---- Dificultad progresiva ----
export const BASE_INTERVAL = 1.5; // separación clásica ~0.55 ancho de pantalla
export const BASE_CROSS_TIME = 2.7; // cruce más lento: más fácil con la voz
export const MIN_INTERVAL = 0.85;
export const PROGRESS_EVERY = 5;
export const SPEED_MULT = 1.05;
export const INTERVAL_STEP = 0.05;
export const SPAWN_MARGIN = 60;

// ---- Tubos clásicos Flappy (verde estilo Mario) ----
export const PIPE_BODY_W = (h: number) => h * 0.082;
export const PIPE_CAP_W = (h: number) => PIPE_BODY_W(h) * 1.2;
export const PIPE_CAP_H = (h: number) => h * 0.045;

// ---- Meta de nivel: pedestal con trofeo (se choca ahí) ----
export const MILESTONE_SCORE = 5;
export const PEDESTAL_W = (h: number) => h * 0.16;
export const PEDESTAL_H = (h: number) => h * 0.6; // tubería alta con boca abierta arriba

// ---- Cinemática de victoria (aturdido → entra al hueco → sale el trofeo) ----
export const SHAKE_DUR = 1.0; // sacudida del pato aturdido (s)
export const FLY_DUR = 1.35; // vuelo autónomo hasta el hueco (s)
export const ENTER_DUR = 0.55; // entrar y desaparecer en el hueco (s)
export const TROPHY_DUR = 0.9; // el trofeo sale del hueco superior (s)
export const SHOW_DUR = 1.0; // el trofeo se queda 1s arriba, sobre la boca
export const CENTER_DUR = 1.6; // viaje del trofeo hacia el centro de la pantalla (s)
export const CENTER_SCALE = 1.35; // cuánto crece al llegar al centro
export const CENTER_Y = (h: number) => h * 0.42; // altura final del trofeo

// ---- Meteorito que golpea al pato tras rebasar la tubería dorada ----
export const METEOR_DELAY = 3.0; // segundos desde rebasar la tubería dorada
export const METEOR_FALL = 2.2; // velocidad de caída (× h px/s, muy fuerte)
export const METEOR_R = (h: number) => h * 0.045; // radio del meteorito
// Tras el impacto el pato cae al piso y queda aturdido viendo estrellas
// (igual que al chocar con la tubería) antes de levantarse y volver.
export const DOWN_FALL = 0.35; // caída al piso (s)
export const DOWN_DUR = 1.5; // aturdido en el piso (s)
// Vuelta del pato a la tubería dorada: el mundo se desplaza hacia atrás
// (× la velocidad normal) mientras la cámara sigue al pato, hasta que la
// boca de la tubería vuelve a quedar justo sobre él.
export const RETURN_SPEED_MULT = 1.9;

// ---- Tonalidades de arbustos ----
export const BUSH_TONES = ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#65a30d'];
