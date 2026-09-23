# Rediseño del Modal de Racha (Header)

## 1. Contexto y Problema
El modal de racha en `Header.tsx` mostraba dos botones genéricos:
- "🔥 Ver Llama"
- "✨ ¡Confeti!"

Se reemplazan por un flujo motivacional inteligente basado en `isStreakLitToday()`.

## 2. Especificación
- **Estado 1: Racha no encendida hoy**
  - Banner: *"Tu fuego vocal aún no se ha encendido hoy"*
  - Botón Principal: `🔥 Encender Fuego de Hoy (+50 XP)`
  - Botón Secundario: `🎤 Cantar para Asegurar Racha`
- **Estado 2: Racha encendida hoy**
  - Badge verde: `✓ ¡Racha protegida hoy! Llevas {streak} días encendidos`
  - Botón Principal: `🎤 Seguir Cantando en Karaoke`

## 3. Componentes Modificados
- `src/components/Header.tsx`
- `src/components/MainApp.tsx`
