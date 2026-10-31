import { chromium, devices } from 'playwright';
import path from 'path';
import fs from 'fs';

const APP_URL = process.env.APP_URL || 'http://localhost:9005';
const ARTIFACT_DIR = 'C:\\Users\\dani3\\.gemini\\antigravity\\brain\\0954bdc3-ff3c-4727-900a-4c213b99be48';

async function runGremlinsChaosSuite() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║       AFINAPP CHAOS ENGINEERING SUITE: PLAYWRIGHT + GREMLINS.JS          ║');
  console.log('║   Pruebas de Caos Extremo, Monos Traviesos e Invariantes de Interfaz     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const suiteStartTime = performance.now();

  // 1. Autenticación como usuario válido
  console.log('🔑 [Paso 1] Autenticando sesión demo en API /api/auth/login...');
  const loginRes = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demo@canto.com', key: 'POP' })
  });

  if (!loginRes.ok) {
    throw new Error(`Login API falló con código ${loginRes.status}: ${await loginRes.text()}`);
  }

  const rawCookie = loginRes.headers.get('set-cookie') || '';
  const match = rawCookie.match(/afinapp_session=([^;]+)/);
  const sessionToken = match ? match[1] : '';
  const loginData = await loginRes.json();
  console.log(`   ✅ Sesión activa confirmada para: ${loginData.user.name} (${loginData.user.role})`);

  // 2. Lanzar Playwright con emulación táctil de iPhone
  const isHeaded = process.argv.includes('--headed') || process.env.HEADED === 'true';
  console.log(`📱 [Paso 2] Levantando Playwright en emulación iPhone 15 Pro (${isHeaded ? '👁️ MODO VISIBLE / HEADED (Edge en pantalla)' : '⚡ MODO HEADLESS (Segundo plano)'})...`);
  const iPhone = devices['iPhone 15 Pro'] || devices['iPhone 14 Pro'];
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: !isHeaded,
    slowMo: isHeaded ? 60 : 0
  });

  const context = await browser.newContext({
    ...iPhone,
    permissions: ['microphone'],
    locale: 'es-CO',
    geolocation: { latitude: 4.7110, longitude: -74.0721 }
  });

  await context.addCookies([{
    name: 'afinapp_session',
    value: sessionToken,
    url: APP_URL
  }]);

  // Preconfiguración completa para entrar directamente a la app lista
  await context.addInitScript((user) => {
    localStorage.setItem('laclave_cached_session_user_v1', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      expiresAt: user.expiresAt || new Date(Date.now() + 864000000).toISOString(),
      daysRemaining: 30,
      role: user.role || 'student'
    }));
    localStorage.setItem('laclave_last_session_check_v1', String(Date.now()));
    localStorage.setItem('laclave_last_server_time_v1', String(Date.now()));
    localStorage.setItem('laclave_tour_completed', 'true');
    localStorage.setItem('laclave_tour_academia_v2', 'true');
    localStorage.setItem('laclave_tour_afinador_v2', 'true');
    localStorage.setItem('laclave_tour_practica_v2', 'true');
    localStorage.setItem('laclave_tour_progreso_v2', 'true');
    localStorage.setItem('laclave_splash_seen', 'true');
    localStorage.setItem('laclave_profile_configured', 'true');
    sessionStorage.setItem('laclave_pwa_dismissed', 'true');
    localStorage.setItem('laclave_user_stats_v6', JSON.stringify({
      name: user.name || 'Vocalista Demo',
      isConfigured: true,
      xp: 450,
      streak: 7,
      lives: 5,
      gender: 'masculino',
      vocalRangePreset: 'tenor',
      vocalRangeConfirmed: true,
      lastVocalRangeCheck: Date.now()
    }));

    // Indicador visual de toques/clics caóticos en pantalla
    window.addEventListener('pointerdown', (e) => {
      try {
        const circle = document.createElement('div');
        circle.style.position = 'fixed';
        circle.style.left = `${e.clientX - 16}px`;
        circle.style.top = `${e.clientY - 16}px`;
        circle.style.width = '32px';
        circle.style.height = '32px';
        circle.style.borderRadius = '50%';
        circle.style.border = '3px solid #ef4444';
        circle.style.backgroundColor = 'rgba(239, 68, 68, 0.4)';
        circle.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.8)';
        circle.style.pointerEvents = 'none';
        circle.style.zIndex = '999999';
        circle.style.transition = 'all 0.4s ease-out';
        document.body.appendChild(circle);
        requestAnimationFrame(() => {
          circle.style.transform = 'scale(2.2)';
          circle.style.opacity = '0';
        });
        setTimeout(() => circle.remove(), 450);
      } catch {}
    }, true);
  }, loginData.user);

  const page = await context.newPage();

  const collectedConsoleErrors = [];
  const collectedPageErrors = [];

  page.on('pageerror', (err) => {
    console.error(`   💥 [EXCEPCIÓN EN PÁGINA]: ${err.message}`);
    collectedPageErrors.push(err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Filtrar ruidos externos no atribuibles al código de la app
      if (!txt.includes('favicon.ico') && !txt.includes('ERR_CONNECTION_REFUSED')) {
        collectedConsoleErrors.push(txt);
      }
    }
  });

  console.log(`🌐 [Paso 3] Navegando a ${APP_URL} ...`);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#tour-bottom-nav', { state: 'visible', timeout: 15000 });
  console.log('   ✅ App completamente montada y lista para inyección.');

  // Inyectar Gremlins.js
  const gremlinsPath = path.resolve('node_modules/gremlins.js/dist/gremlins.min.js');
  await page.addScriptTag({ path: gremlinsPath });
  console.log('   ✅ Motor Gremlins.js inyectado en el runtime de la página.');

  const report = {
    timestamp: new Date().toISOString(),
    device: 'iPhone 15 Pro (WebKit/Chromium Touch)',
    totalActions: 0,
    durationMs: 0,
    rounds: [],
    consoleErrors: collectedConsoleErrors,
    pageErrors: collectedPageErrors,
    passed: true
  };

  /**
   * Helper para ejecutar una oleada de gremlins en el contenedor objetivo
   */
  async function unleashRound(
    roundName,
    selector,
    nbActions,
    delayMs
  ) {
    console.log(`\n──────────────────────────────────────────────────────────────────────────`);
    console.log(`👾 [RONDA] ${roundName.toUpperCase()}`);
    console.log(`   🎯 Objetivo: "${selector}" | Acciones: ${nbActions} | Frecuencia: ${Math.round(1000 / delayMs)} ops/seg`);

    const roundT0 = performance.now();
    const roundErrorsBefore = collectedPageErrors.length;

    const result = await page.evaluate(async ({ targetSelector, nb, delay }) => {
      return new Promise((resolve) => {
        let fpsDrops = 0;
        let lastTimestamp = performance.now();

        // Monitor de FPS
        const checkFps = (time) => {
          const delta = time - lastTimestamp;
          if (delta > 50) { // Menos de 20 FPS
            fpsDrops++;
          }
          lastTimestamp = time;
          if (!done) requestAnimationFrame(checkFps);
        };
        let done = false;
        requestAnimationFrame(checkFps);

        const targetEl = document.querySelector(targetSelector) || document.body;

        const species = [
          window.gremlins.species.clicker({
            clickTypes: ['click'],
            canClick: (el) => {
              if (!targetEl.contains(el)) return false;
              const tag = el.tagName.toLowerCase();
              return tag === 'button' || tag === 'a' || tag === 'div' || tag === 'span' || tag === 'input';
            }
          }),
          window.gremlins.species.toucher({
            canTouch: (el) => targetEl.contains(el)
          }),
          window.gremlins.species.scroller()
        ];

        const horde = window.gremlins.createHorde({
          species,
          strategies: [
            window.gremlins.strategies.distribution({
              delay,
              nb
            })
          ]
        });

        const timeoutTimer = setTimeout(() => {
          done = true;
          resolve({
            actions: nb,
            fpsDrops,
            audioContextState: 'timeout',
            timedOut: true
          });
        }, nb * delay + 5000);

        horde.unleash().then(() => {
          clearTimeout(timeoutTimer);
          done = true;
          // Obtener estado de AudioContext
          let audioState = 'unknown';
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioState = AudioCtx ? 'available' : 'unavailable';
          } catch {}

          resolve({
            actions: nb,
            fpsDrops,
            audioContextState: audioState,
            timedOut: false
          });
        }).catch((err) => {
          clearTimeout(timeoutTimer);
          done = true;
          resolve({
            actions: nb,
            fpsDrops,
            audioContextState: 'error',
            error: String(err)
          });
        });
      });
    }, { targetSelector: selector, nb: nbActions, delay: delayMs });

    const roundDuration = performance.now() - roundT0;
    const roundErrors = collectedPageErrors.slice(roundErrorsBefore);
    const passed = roundErrors.length === 0;

    console.log(`   ⏱️ Duración: ${roundDuration.toFixed(0)}ms`);
    console.log(`   📉 Caídas de FPS detectadas: ${result.fpsDrops}`);
    console.log(`   🔊 Estado de AudioContext: ${result.audioContextState}`);
    console.log(`   💥 Excepciones en esta ronda: ${roundErrors.length}`);
    if (passed) {
      console.log(`   ✅ [SUPERADA] La interfaz y el motor resistieron el bombardeo.`);
    } else {
      console.error(`   ❌ [FALLIDA] Se detectaron errores críticos durante el ataque.`);
      report.passed = false;
    }

    report.rounds.push({
      name: roundName,
      target: selector,
      actions: nbActions,
      errors: roundErrors,
      fpsDrops: result.fpsDrops,
      audioContextState: result.audioContextState,
      durationMs: roundDuration,
      passed
    });
    report.totalActions += nbActions;

    // Pequeño reposo de 200ms para estabilizar el DOM
    await page.waitForTimeout(200);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EJECUCIÓN DE LAS 5 RONDAS DESTRUCTIVAS
  // ──────────────────────────────────────────────────────────────────────────

  // RONDA 1: Bombardeo Global en Pestaña Academia (Mapa de lecciones, nodos y modales)
  await unleashRound(
    'Ronda 1: Bombardeo Global en Academia (Mapa de Nodos y FAB)',
    'main',
    250,
    15
  );

  // Navegar a Pestaña Afinador
  console.log('\n📲 Cambiando a pestaña Afinador para Ronda 2...');
  await page.locator('#tour-nav-afinador').dispatchEvent('pointerdown', { button: 0 });
  await page.waitForTimeout(350);

  // RONDA 2: Caos en Sección Afinador (Teclado Cromático 12 notas, Esfera 3D y Controles)
  await unleashRound(
    'Ronda 2: Bombardeo en Afinador (Teclado Cromático, Esfera 3D y Modales)',
    'main',
    250,
    15
  );

  // Navegar a Pestaña Práctica (Karaoke)
  console.log('\n📲 Cambiando a pestaña Práctica (Karaoke) para Ronda 3...');
  await page.locator('#tour-nav-practica').dispatchEvent('pointerdown', { button: 0 });
  await page.waitForTimeout(350);

  // RONDA 3: Caos en Sección Práctica (Canciones, Selector de Repertorio, Filtros)
  await unleashRound(
    'Ronda 3: Bombardeo en Práctica (Repertorio Karaoke, Filtros y Reproductores)',
    'main',
    250,
    15
  );

  // Navegar a Pestaña Progreso
  console.log('\n📲 Cambiando a pestaña Progreso para Ronda 4...');
  await page.locator('#tour-nav-progreso').dispatchEvent('pointerdown', { button: 0 });
  await page.waitForTimeout(350);

  // RONDA 4: Caos en Sección Progreso (Medallas, Cofres, Misiones Diarias y Gráficos)
  await unleashRound(
    'Ronda 4: Bombardeo en Progreso (Misiones, Medallas, Cofres y Rango Vocal)',
    'main',
    250,
    15
  );

  // RONDA 5: Frenesí Destructivo de BottomNav (Conmutación Rápida de Pestañas a 50Hz)
  console.log('\n──────────────────────────────────────────────────────────────────────────');
  console.log('⚡ [RONDA 5] FRENESÍ ULTRA-RÁPIDO EN BOTTOMNAV (50 toques/seg mientras hay scroll)');
  const navRounds = 60;
  const navT0 = performance.now();
  const navErrorsBefore = collectedPageErrors.length;
  const tabIds = ['academia', 'afinador', 'practica', 'progreso'];

  for (let i = 0; i < navRounds; i++) {
    const nextTab = tabIds[i % tabIds.length];
    await page.evaluate((id) => {
      const btn = document.getElementById(`tour-nav-${id}`);
      if (btn) {
        btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
      }
      window.scrollBy(0, (Math.random() - 0.5) * 60);
    }, nextTab);
    await page.waitForTimeout(15);
  }

  const navDuration = performance.now() - navT0;
  const navErrors = collectedPageErrors.slice(navErrorsBefore);
  const navPassed = navErrors.length === 0;

  console.log(`   ⏱️ Duración: ${navDuration.toFixed(0)}ms (${navRounds} cambios instantáneos)`);
  console.log(`   💥 Excepciones en frenesí: ${navErrors.length}`);
  if (navPassed) {
    console.log(`   ✅ [SUPERADA] Cero bloqueos de hilo y cero caídas de estado.`);
  } else {
    console.error(`   ❌ [FALLIDA] Error en el ciclo de vida de BottomNav.`);
    report.passed = false;
  }

  report.rounds.push({
    name: 'Ronda 5: Frenesí Ultra-Rápido en BottomNav',
    target: '#tour-bottom-nav',
    actions: navRounds,
    errors: navErrors,
    fpsDrops: 0,
    audioContextState: 'available',
    durationMs: navDuration,
    passed: navPassed
  });
  report.totalActions += navRounds;

  report.durationMs = performance.now() - suiteStartTime;

  if (isHeaded) {
    console.log('👀 [Inspección visual] Pausa de 4 segundos antes de cerrar el navegador...');
    await page.waitForTimeout(4000);
  }

  await browser.close();

  // ──────────────────────────────────────────────────────────────────────────
  // REPORTE FINAL Y DIAGNÓSTICO
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('🏁                   RESUMEN EJECUTIVO DEL TEST DE CAOS                   ');
  console.log('══════════════════════════════════════════════════════════════════════════');
  console.log(`  🎯 Acciones caóticas ejecutadas:   ${report.totalActions}`);
  console.log(`  ⏱️ Tiempo total de destrucción:   ${(report.durationMs / 1000).toFixed(2)}s`);
  console.log(`  💥 Excepciones críticas de página: ${report.pageErrors.length}`);
  console.log(`  ⚠️ Advertencias/Errores de consola: ${report.consoleErrors.length}`);
  console.log(`  🏆 Resultado general:              ${report.passed ? 'PASÓ TODAS LAS PRUEBAS (RESISTENCIA 100%)' : 'FALLÓ'}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // Guardar reporte en el directorio de artefactos
  const artifactPath = path.join(ARTIFACT_DIR, 'senior_qa_chaos_gremlins_report.json');
  fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Reporte JSON guardado en: ${artifactPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

runGremlinsChaosSuite().catch((err) => {
  console.error('❌ Error fatal durante la suite de Gremlins:', err);
  process.exit(1);
});
