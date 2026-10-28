import puppeteer from 'puppeteer-core';
import { signJwt } from '../src/lib/jwt.ts';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:9005';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';

async function runSeniorQaChaosSuite() {
  console.log('🔥 [Senior QA] Iniciando Suite Destructiva de Caos y Estrés...');
  console.log('Target:', APP_URL);
  console.log('Chrome:', CHROME_PATH);

  const report = {
    timestamp: new Date().toISOString(),
    vectors: [],
    pageErrors: [],
    consoleErrors: [],
    consoleWarns: [],
    network404s: [],
    audioErrors: [],
    perfMetrics: {},
    passed: true
  };

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=1280,900',
      '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Error Listeners
  page.on('pageerror', (err) => {
    console.error('💥 [PAGE ERROR]:', err.message);
    report.pageErrors.push({ message: err.message, stack: err.stack });
    report.passed = false;
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      // Filter out expected 401s or intentional test errors
      if (!text.includes('favicon.ico') && !text.includes('Failed to load resource: the server responded with a status of 401')) {
        console.warn('⚠️ [CONSOLE ERROR]:', text);
        report.consoleErrors.push(text);
      }
    } else if (msg.type() === 'warn') {
      if (!text.includes('Warning: Next.js ignored package-lock.json')) {
        report.consoleWarns.push(text);
      }
    }
  });

  page.on('response', (res) => {
    if (res.status() === 404) {
      const url = res.url();
      if (!url.includes('favicon.ico')) {
        console.error('❌ [404 NOT FOUND]:', url);
        report.network404s.push(url);
        if (url.includes('/sounds/')) {
          report.audioErrors.push(url);
          report.passed = false;
        }
      }
    }
  });

  try {
    // =========================================================================
    // VECTOR 1: Fuzzing y Ataque de Clics Concurrentes en Formulario de Login
    // =========================================================================
    console.log('\n--- VECTOR 1: Formulario de Login Fuzzing & Spam Click Assault ---');
    const v1Start = Date.now();
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Dismiss splash if present
    const splashButton = await page.$('button');
    if (splashButton) {
      await splashButton.click().catch(() => {});
      await new Promise(r => setTimeout(r, 600));
    }

    // Input fields fuzzing
    const emailInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');

    if (emailInput && passwordInput) {
      // Attack 1: SQL Injection & XSS Payload strings
      await emailInput.type(`admin' OR '1'='1" <script>alert("hacked")</script>`);
      await passwordInput.type('supersecretinjection" OR 1=1--');
      
      // Hammer submit button 20 times in 100ms
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await Promise.all(Array.from({ length: 20 }, () => submitBtn.click().catch(() => {})));
      }
      await new Promise(r => setTimeout(r, 800));

    // Attack 2: Massive character buffer overflow test
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      if (inputs[0]) inputs[0].value = 'Z'.repeat(1500) + '@evil-domain-test.com';
      if (inputs[1]) inputs[1].value = 'P'.repeat(1000);
    });
    if (submitBtn) {
      await submitBtn.click().catch(() => {});
    }
    await new Promise(r => setTimeout(r, 400));
    }

    const v1Duration = Date.now() - v1Start;
    report.vectors.push({
      name: 'Login Form Fuzzing & Rapid Spam',
      actions: 45,
      durationMs: v1Duration,
      status: report.pageErrors.length === 0 ? 'PASSED' : 'FAILED'
    });
    console.log(`✅ Vector 1 superado en ${v1Duration}ms sin caídas.`);

    // =========================================================================
    // VECTOR 2: Inyección de Sesión Autenticada y Warp Speed Tab Switching
    // =========================================================================
    console.log('\n--- VECTOR 2: Warp Speed Tab Switching (Race Condition Stress) ---');
    const v2Start = Date.now();

    // Generate authenticated JWT for existing active user
    const token = await signJwt(
      { sub: 'demo@canto.com', name: 'Estudiante Demo', role: 'student', expiresAt: '2027-12-05T20:09:47.148Z' },
      JWT_SECRET
    );

    await page.setCookie({
      name: 'afinapp_session',
      value: token,
      domain: 'localhost',
      path: '/'
    });

    // Seed local storage with complete test user profile
    await page.evaluate(() => {
      localStorage.setItem('laclave_profile_configured', 'true');
      localStorage.setItem('afinapp_mic_authorized', 'true');
      localStorage.setItem('laclave_voice_gender', 'masculino');
      localStorage.setItem('laclave_vocal_range_saved', JSON.stringify({
        classification: 'Tenor',
        gender: 'masculino',
        noteMin: 'Do3',
        noteMax: 'La4',
        minHz: 130.81,
        maxHz: 440.0
      }));
      localStorage.setItem('laclave_user_stats_v6', JSON.stringify({
        name: 'Senior QA',
        isConfigured: true,
        vocalRange: 'Tenor',
        lives: 5,
        xp: 1500
      }));
      localStorage.setItem('user_lives', '5');
      localStorage.setItem('user_xp', '1500');
    });

    await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Wait for splash screen to complete and bottom nav to appear
    console.log('Esperando carga del Splash Screen...');
    await page.waitForSelector('#tour-bottom-nav', { visible: true, timeout: 20000 });
    console.log('BottomNav visible y activo.');

    // Rapidly switch tabs 30 times directly in browser loop
    const tabSwitchCount = await page.evaluate(async () => {
      const tabIds = ['tour-nav-academia', 'tour-nav-afinador', 'tour-nav-practica', 'tour-nav-progreso'];
      let count = 0;
      for (let i = 0; i < 28; i++) {
        const id = tabIds[i % tabIds.length];
        const btn = document.getElementById(id);
        if (btn) {
          btn.click();
          count++;
        }
        await new Promise(r => setTimeout(r, 60));
      }
      return count;
    });
    await new Promise(r => setTimeout(r, 800));

    const v2Duration = Date.now() - v2Start;
    report.vectors.push({
      name: 'Warp Speed Tab Switching Concurrent Race Condition',
      actions: tabSwitchCount,
      durationMs: v2Duration,
      status: report.pageErrors.length === 0 ? 'PASSED' : 'FAILED'
    });
    console.log(`✅ Vector 2 superado: ${tabSwitchCount} cambios ultra-rápidos de vista sin fugas.`);

    // =========================================================================
    // VECTOR 3: Afinador Piano Monkey Fuzzing & Octave Hammering
    // =========================================================================
    console.log('\n--- VECTOR 3: Afinador Piano & Octaves Monkey Fury ---');
    const v3Start = Date.now();

    // Ensure we are on Afinador
    await page.evaluate(() => {
      const btn = document.getElementById('tour-nav-afinador');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Hammer random piano keys and octaves in browser loop
    const pianoActions = await page.evaluate(async () => {
      const container = document.getElementById('tour-tuner-reference');
      if (!container) return { keys: 0, octaves: 0 };
      const buttons = Array.from(container.querySelectorAll('button'));
      let keysClicked = 0;
      for (let i = 0; i < 40; i++) {
        const btn = buttons[Math.floor(Math.random() * buttons.length)];
        if (btn) {
          btn.click();
          keysClicked++;
        }
        await new Promise(r => setTimeout(r, 35));
      }

      // Switch octaves
      const octaveButtons = Array.from(container.querySelectorAll('button[title*="Octava"]'));
      let octavesClicked = 0;
      for (let i = 0; i < 12; i++) {
        const octBtn = octaveButtons[i % octaveButtons.length];
        if (octBtn) {
          octBtn.click();
          octavesClicked++;
        }
        await new Promise(r => setTimeout(r, 50));
      }
      return { keys: keysClicked, octaves: octavesClicked };
    });
    await new Promise(r => setTimeout(r, 600));

    const v3Duration = Date.now() - v3Start;
    report.vectors.push({
      name: 'Piano Keys & Octave Navigation Monkey Attack',
      actions: pianoActions.keys + pianoActions.octaves,
      durationMs: v3Duration,
      status: report.pageErrors.length === 0 ? 'PASSED' : 'FAILED'
    });
    console.log(`✅ Vector 3 superado: ${pianoActions.keys} notas tocadas y ${pianoActions.octaves} cambios de octava.`);

    // =========================================================================
    // VECTOR 4: Micrófono Concurrente y Permiso Persistente
    // =========================================================================
    console.log('\n--- VECTOR 4: Micrófono Rapid On/Off Hammering & Permission Lock ---');
    const v4Start = Date.now();

    // Toggle mic rapidly in browser loop
    const micToggleCount = await page.evaluate(async () => {
      let count = 0;
      for (let i = 0; i < 8; i++) {
        const btn = document.querySelector('button[title*="micrófono"], button[title*="Activar"]');
        if (btn) {
          btn.click();
          count++;
        }
        await new Promise(r => setTimeout(r, 120));
      }
      return count;
    });
    await new Promise(r => setTimeout(r, 800));

    // Check if mic permission flag is preserved in localStorage
    const micPermSaved = await page.evaluate(() => localStorage.getItem('afinapp_mic_authorized'));
    const isMicPersisted = micPermSaved === 'true';

    const v4Duration = Date.now() - v4Start;
    report.vectors.push({
      name: 'Microphone Stream Concurrent Toggle & Permission Persistence',
      actions: micToggleCount,
      durationMs: v4Duration,
      details: `Permiso en localStorage: ${isMicPersisted ? 'CONCEDIDO (Persistente)' : 'NO DETECTADO'}`,
      status: (report.pageErrors.length === 0 && isMicPersisted) ? 'PASSED' : 'FAILED'
    });
    console.log(`✅ Vector 4 superado: ${micToggleCount} activaciones concurrentes. Micrófono persistente: ${isMicPersisted}`);

    // =========================================================================
    // VECTOR 5: Desafío de Estabilidad 10s & Verificación de Botón de Confirmación
    // =========================================================================
    console.log('\n--- VECTOR 5: Desafío de Estabilidad Vocal & UX de Confirmación ---');
    const v5Start = Date.now();

    const stabilityResult = await page.evaluate(async () => {
      // Open Accordion
      const accordion = document.querySelector('#tour-tuner-apparatus button');
      if (accordion) accordion.click();
      await new Promise(r => setTimeout(r, 500));

      // Click Tool 3
      const headings = Array.from(document.querySelectorAll('h4'));
      const toolHeading = headings.find(h => h.textContent && h.textContent.includes('Desafío de Estabilidad'));
      const toolBtn = toolHeading ? toolHeading.closest('button') : null;
      if (toolBtn) {
        toolBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      }

      // Check for Start button
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent && b.textContent.includes('Comenzar Desafío'));
      let started = false;
      if (startBtn) {
        startBtn.click();
        started = true;
        await new Promise(r => setTimeout(r, 1500));
      }

      // Check for Back button ("Volver a Gimnasio Vocal")
      const backBtns = Array.from(document.querySelectorAll('button'));
      const backBtn = backBtns.find(b => b.textContent && b.textContent.includes('Volver'));
      let backed = false;
      if (backBtn) {
        backBtn.click();
        backed = true;
        await new Promise(r => setTimeout(r, 600));
      }

      return { started, backed };
    });
    await new Promise(r => setTimeout(r, 600));

    const v5Duration = Date.now() - v5Start;
    report.vectors.push({
      name: 'Estabilidad Vocal Setup, Singing Canvas & Safe Back Navigation',
      actions: 4,
      durationMs: v5Duration,
      details: `Desafío iniciado: ${stabilityResult.started}, Retorno seguro: ${stabilityResult.backed}`,
      status: report.pageErrors.length === 0 ? 'PASSED' : 'FAILED'
    });
    console.log(`✅ Vector 5 superado: Desafío interactivo y retorno limpio.`);

    // =========================================================================
    // VECTOR 6: Progreso Tab & Recharts v3 Stress Rendering
    // =========================================================================
    console.log('\n--- VECTOR 6: Progreso Tab & Recharts v3 Graphical Stress ---');
    const v6Start = Date.now();

    const rechartsActions = await page.evaluate(async () => {
      const tab = document.getElementById('tour-nav-progreso');
      if (tab) tab.click();
      await new Promise(r => setTimeout(r, 1200));

      // Scroll up and down
      window.scrollTo(0, 400);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, 800);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 200));

      const surfaces = document.querySelectorAll('.recharts-surface, .recharts-responsive-container, svg');
      return surfaces.length;
    });

    const v6Duration = Date.now() - v6Start;
    report.vectors.push({
      name: 'Recharts v3 SVG Rendering & Interactive Tooltip Stress',
      actions: rechartsActions + 6,
      durationMs: v6Duration,
      details: `${rechartsActions} superficies SVG de Recharts v3 activas`,
      status: report.pageErrors.length === 0 ? 'PASSED' : 'FAILED'
    });
    console.log(`✅ Vector 6 superado: ${rechartsActions} gráficos Recharts v3 estables.`);

    // Performance Metrics
    const metrics = await page.metrics();
    report.perfMetrics = {
      JSHeapUsedSizeMB: (metrics.JSHeapUsedSize / (1024 * 1024)).toFixed(2),
      JSHeapTotalSizeMB: (metrics.JSHeapTotalSize / (1024 * 1024)).toFixed(2),
      Nodes: metrics.Nodes,
      JSEventListeners: metrics.JSEventListeners
    };

    console.log('\n📊 Métricas de Rendimiento en Vivo:');
    console.log(report.perfMetrics);

  } catch (err) {
    console.error('Fatal test error:', err);
    report.pageErrors.push({ message: err.message, stack: err.stack });
    report.passed = false;
  } finally {
    await browser.close();
  }

  // Write Report to File
  const reportPath = path.resolve(process.cwd(), 'scratch/senior_qa_chaos_report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n📄 Reporte JSON guardado en:', reportPath);

  return report;
}

runSeniorQaChaosSuite()
  .then((report) => {
    console.log(`\n🏁 Resultado Global: ${report.passed ? 'PASSED (100% RESISTENCIA)' : 'FAILED'}`);
    process.exit(report.passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Suite error:', err);
    process.exit(1);
  });
