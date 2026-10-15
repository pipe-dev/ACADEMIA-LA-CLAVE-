# Sistema de 50 Insignias de Canto Reales y Verificables (AfinApp)

## 1. Visión y Objetivos
- Reducción del sistema de logros de 200 a **50 insignias reales**.
- **Cero absoluto:** Reinicio limpio del progreso de insignias eliminando medallas infladas o falsas.
- **100% Medible en la App:** Cada una de las 50 insignias está vinculada a variables y eventos reales de la aplicación (lecciones, XP, racha, minutos, afinador, flappy vocal, ritmo, estabilidad, tesitura, evaluación).
- **Control de Notificaciones:** Prevención de spam de toasts/popups al progresar.

---

## 2. Distribución y Definición de las 50 Insignias

### 🟢 10 Fáciles (Introductorias / Primeros Pasos)
1. `badge_1`: **Primer Tono Afinado** (Cat: Afinador) — Afinar 1 nota en el Afinador Vocal. (maxProgress: 1)
2. `badge_2`: **Oído Explorador** (Cat: Afinador) — Escuchar 5 notas en el Teclado Vocal. (maxProgress: 5)
3. `badge_3`: **Calibración Vocal** (Cat: Herramientas) — Completar el test de Tesitura / Rango Vocal. (maxProgress: 1)
4. `badge_4`: **Primera Lección** (Cat: Academia) — Completar la primera lección de la Academia. (maxProgress: 1)
5. `badge_5`: **Respiración Consciente** (Cat: Herramientas) — Completar 1 sesión completa de Respiración (3 ciclos). (maxProgress: 1)
6. `badge_6`: **Primeros 100 XP** (Cat: Maestría) — Acumular 100 XP. (maxProgress: 100)
7. `badge_7`: **Racha Inicial (3 Días)** (Cat: Racha) — Mantener una racha de 3 días consecutivos. (maxProgress: 3)
8. `badge_8`: **Primer Desafío** (Cat: Afinador) — Superar el Nivel 1 del modo Niveles en el Afinador. (maxProgress: 1)
9. `badge_9`: **Diagnóstico Vocal** (Cat: Herramientas) — Realizar 1 prueba en la Evaluación de Voz de 15 segundos. (maxProgress: 1)
10. `badge_10`: **Vuelo Inicial** (Cat: Academia) — Obtener 5 puntos en Flappy Vocal (Unidad 4). (maxProgress: 5)

### 🟡 20 Medias (Desarrollo y Consistencia Técnica)
11. `badge_11`: **Combo x3 de Afinación** (Cat: Afinador) — Lograr un combo de 3 notas afinadas consecutivas. (maxProgress: 3)
12. `badge_12`: **Zona Segura** (Cat: Afinador) — Completar los 4 niveles de Calentamiento del Afinador. (maxProgress: 4)
13. `badge_13`: **Nivel Fácil Dominado** (Cat: Afinador) — Completar los 6 niveles de dificultad Fácil. (maxProgress: 6)
14. `badge_14`: **Semana Impecable** (Cat: Racha) — Racha de 7 días consecutivos. (maxProgress: 7)
15. `badge_15`: **Hábito de 14 Días** (Cat: Racha) — Racha de 14 días consecutivos. (maxProgress: 14)
16. `badge_16`: **500 XP Acumulados** (Cat: Maestría) — Acumular 500 XP. (maxProgress: 500)
17. `badge_17`: **1,000 XP Acumulados** (Cat: Maestría) — Acumular 1,000 XP. (maxProgress: 1000)
18. `badge_18`: **Graduado de Unidad 1** (Cat: Academia) — Completar todas las lecciones de la Unidad 1. (maxProgress: 1)
19. `badge_19`: **Graduado de Unidad 2** (Cat: Academia) — Completar todas las lecciones de la Unidad 2. (maxProgress: 1)
20. `badge_20`: **Pulso Firme** (Cat: Ritmo) — Completar 3 lecciones de ritmo/batería en la Unidad 3. (maxProgress: 3)
21. `badge_21`: **Vocalista Nivel 5** (Cat: Maestría) — Alcanzar el Nivel 5 de usuario. (maxProgress: 5)
22. `badge_22`: **Media Hora de Voz** (Cat: Práctica) — Acumular 30 minutos de práctica en la app. (maxProgress: 30)
23. `badge_23`: **Hora Dorada** (Cat: Práctica) — Acumular 60 minutos de práctica en la app. (maxProgress: 60)
24. `badge_24`: **Voz Estable** (Cat: Herramientas) — Mantener la afinación estable por 5 segundos en Estabilidad Vocal. (maxProgress: 5)
25. `badge_25`: **Duelo Rápido Ganado** (Cat: Herramientas) — Ganar 1 ronda de Duelo Rápido. (maxProgress: 1)
26. `badge_26`: **Vuelo Firme (Flappy 15)** (Cat: Academia) — Lograr 15 puntos en Flappy Vocal. (maxProgress: 15)
27. `badge_27`: **Evaluación 2 Estrellas** (Cat: Herramientas) — Lograr al menos 2 estrellas en la Evaluación Vocal. (maxProgress: 2)
28. `badge_28`: **10 Lecciones Completadas** (Cat: Academia) — Completar 10 lecciones en la Academia. (maxProgress: 10)
29. `badge_29`: **Karaoke Inaugural** (Cat: Práctica) — Completar 1 canción completa en Práctica/Karaoke. (maxProgress: 1)
30. `badge_30`: **Precisión Media en Afinador** (Cat: Afinador) — Superar al menos 1 nivel en dificultad Media. (maxProgress: 1)

### 🔴 20 Difíciles (Maestría y Alta Exigencia)
31. `badge_31`: **Combo Maestro x5** (Cat: Afinador) — Lograr un combo de 5 notas afinadas seguidas. (maxProgress: 5)
32. `badge_32`: **Nivel Medio Dominado** (Cat: Afinador) — Completar los 8 niveles de dificultad Media. (maxProgress: 8)
33. `badge_33`: **Nivel Difícil Conquistado** (Cat: Afinador) — Superar los 10 niveles en dificultad Difícil. (maxProgress: 10)
34. `badge_34`: **Maestro de Afinación** (Cat: Afinador) — Superar los 14 niveles en dificultad Maestro (±10¢). (maxProgress: 14)
35. `badge_35`: **Mes Ininterrumpido** (Cat: Racha) — Racha de 30 días consecutivos. (maxProgress: 30)
36. `badge_36`: **Constancia de Hierro (60 Días)** (Cat: Racha) — Racha de 60 días consecutivos. (maxProgress: 60)
37. `badge_37`: **2,500 XP Acumulados** (Cat: Maestría) — Acumular 2,500 XP. (maxProgress: 2500)
38. `badge_38`: **5,000 XP de Élite** (Cat: Maestría) — Acumular 5,000 XP. (maxProgress: 5000)
39. `badge_39`: **Vocalista Nivel 10** (Cat: Maestría) — Alcanzar el Nivel 10. (maxProgress: 10)
40. `badge_40`: **Vocalista Nivel 20** (Cat: Maestría) — Alcanzar el Nivel 20. (maxProgress: 20)
41. `badge_41`: **Graduado de Unidad 3** (Cat: Ritmo) — Superar todas las pruebas rítmicas de la Unidad 3. (maxProgress: 1)
42. `badge_42`: **Trofeo Flappy Vocal** (Cat: Academia) — Superar 30 obstáculos en Flappy Vocal y ganar el trofeo. (maxProgress: 30)
43. `badge_43`: **3 Horas de Vuelo Vocal** (Cat: Práctica) — Acumular 180 minutos de práctica en la app. (maxProgress: 180)
44. `badge_44`: **Estabilidad Perfecta** (Cat: Herramientas) — Mantener la afinación estable por 10 segundos continuos. (maxProgress: 10)
45. `badge_45`: **Evaluación 3 Estrellas (Oro)** (Cat: Herramientas) — Lograr 3 estrellas doradas en Evaluación de Voz. (maxProgress: 3)
46. `badge_46`: **25 Lecciones Superadas** (Cat: Academia) — Completar 25 lecciones en la Academia. (maxProgress: 25)
47. `badge_47`: **Todas las Unidades Desbloqueadas** (Cat: Academia) — Superar los exámenes de las 4 unidades. (maxProgress: 4)
48. `badge_48`: **Repertorio Afinador** (Cat: Afinador) — Afinar 100 notas acumuladas en el Afinador. (maxProgress: 100)
49. `badge_49`: **Cantante de Escenario** (Cat: Práctica) — Cantar 5 canciones completas en Karaoke. (maxProgress: 5)
50. `badge_50`: **Leyenda Suprema de La Clave** (Cat: Maestría) — Nivel 15+, Racha 30d+, 4 Unidades completadas. (maxProgress: 1)

---

## 3. Plan de Implementación
1. `src/data/badgesData.ts`: Reemplazar `generate200SingingBadges()` por `ALL_50_SINGING_BADGES` con los 50 objetos tipados con id, title, description, category, iconName, maxProgress, unlocked: false. Exportar `ALL_50_SINGING_BADGES` como `ALL_50_SINGING_BADGES` y mantener alias para compatibilidad.
2. `src/utils/badgeHelper.ts`: Reemplazar la lógica de evaluación para que calcule el progreso real de cada una de las 50 medallas basándose en las estadísticas existentes (`stats.xp`, `stats.level`, `stats.streak`, `stats.lessonsCompleted`, `stats.practiceMinutes`, progreso de afinador en `localStorage`, `stats.vocalRangeData`, etc.).
3. `src/components/main-app/useGlobalGameState.ts`: Migrar la clave de persistencia de usuario a `laclave_user_stats_v6`. Limpiar la lista previa de 175 medallas viejas para iniciar en cero absoluto (0 / 50).
4. `src/components/ProgresoView.tsx` y `ProgresoBadgesSection.tsx`: Actualizar para mostrar el total de 50 medallas y badges filtrables.
5. `src/data/academyData.ts`: Actualizar `DEFAULT_BADGES` e `INITIAL_USER_STATS` para apuntar a las 50 medallas.
