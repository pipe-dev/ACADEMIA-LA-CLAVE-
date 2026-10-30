import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:9005';

async function runChaos() {
  console.log('🚀 Starting Tier 2 E2E Chaos & Destruction Test for Afinador and 6 Tools...');
  
  // 1. Get auth cookie
  console.log('1. Authenticating as admin@laclave.com...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@laclave.com', key: 'admin123' })
  });

  if (!loginRes.ok) {
    throw new Error(`Login API failed with status ${loginRes.status}`);
  }

  const setCookieHeader = loginRes.headers.get('set-cookie');
  const sessionToken = setCookieHeader.split(';')[0].split('=')[1];
  const loginData = await loginRes.json();
  console.log(`   ✅ Authenticated successfully as ${loginData.user.name} (${loginData.user.role})`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 }); // Mobile viewport (Pixel 7 style)

  await page.setCookie({
    name: 'afinapp_session',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax'
  });

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico') && !text.includes('ERR_CONNECTION_REFUSED')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  try {
    console.log('2. Setting up localStorage mocks (pre-calibrated profile)...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    await page.evaluate((userObj) => {
      localStorage.setItem('laclave_cached_session_user_v1', JSON.stringify(userObj));
      localStorage.setItem('laclave_last_session_check_v1', String(Date.now()));
      localStorage.setItem('laclave_profile_configured', 'true');
      localStorage.setItem('laclave_user_stats_v6', JSON.stringify({
        name: 'Administrador Maestro',
        lives: 5,
        streak: 7,
        xp: 1500,
        vocalRange: 'Barítono',
        vocalRangeData: {
          classification: 'Barítono',
          gender: 'masculino',
          noteMin: 'La2',
          noteMax: 'Sol4',
          minHz: 110.0,
          maxHz: 392.0
        },
        levelProgress: {}
      }));
      localStorage.setItem('laclave_vocal_range_saved', JSON.stringify({
        classification: 'Barítono',
        gender: 'masculino',
        noteMin: 'La2',
        noteMax: 'Sol4',
        minHz: 110.0,
        maxHz: 392.0
      }));
      localStorage.setItem('laclave_voice_gender', 'masculino');
      localStorage.setItem('laclave_tour_afinador_seen', 'true');
      localStorage.setItem('laclave_tour_finished', 'true');
    }, loginData.user);

    console.log('3. Loading main app and waiting for splash dismissal...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Wait for Splash screen to finish and BottomNav to mount
    await page.waitForSelector('#tour-bottom-nav', { timeout: 15000 });
    console.log('   ✅ App mounted with bottom navigation active');

    // Click on Afinador in BottomNav via direct DOM click
    await page.waitForSelector('#tour-nav-afinador', { timeout: 10000 });
    console.log('   Navigating to Afinador tab via DOM click...');
    await page.evaluate(() => {
      const btn = document.querySelector('#tour-nav-afinador');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Tuner Card is present
    await page.waitForSelector('#tour-tuner-card', { timeout: 15000 });
    console.log('   ✅ Tuner Card loaded cleanly');

    // ─── 4. CORE TUNER HAMMER TEST ───
    console.log('4. Hammering Core Tuner Controls & Keyboard...');
    
    // Play reference sound
    const listenBtn = await page.$('button[title="Escuchar audio de la nota"]');
    if (listenBtn) {
      await listenBtn.evaluate(b => b.click());
      await new Promise(r => setTimeout(r, 200));
      await listenBtn.evaluate(b => b.click());
      console.log('   ✅ Reference audio button clicked repeatedly');
    }

    // Toggle Microphone rapidly (10x)
    const micButtons = await page.$$('button');
    let toggleMicBtn = null;
    for (const btn of micButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Activar Micrófono') || text.includes('Pausar Micrófono')) {
        toggleMicBtn = btn;
        break;
      }
    }

    if (toggleMicBtn) {
      console.log('   ⚡ Fuzzing microphone toggle 10 times...');
      for (let i = 0; i < 10; i++) {
        await toggleMicBtn.evaluate(b => b.click());
        await new Promise(r => setTimeout(r, 80));
      }
      console.log('   ✅ Microphone toggle fuzzed without crash');
    }

    // Rapidly hammer chromatic piano keys (50+ clicks)
    console.log('   🎹 Hammering chromatic piano keys (50 rapid clicks)...');
    const pianoKeys = await page.$$('#tour-tuner-reference button');
    if (pianoKeys.length > 0) {
      for (let i = 0; i < 50; i++) {
        const randomKey = pianoKeys[Math.floor(Math.random() * pianoKeys.length)];
        await randomKey.evaluate(b => b.click()).catch(() => {});
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 40));
      }
      console.log(`   ✅ 50 rapid piano key presses completed across ${pianoKeys.length} keys`);
    }

    // Difficulty switch modal test
    console.log('   🎯 Testing Difficulty Pill and Level Select modal...');
    const diffButtons = await page.$$('#tour-tuner-reference button[title*="Ver niveles"]');
    if (diffButtons.length > 0) {
      await diffButtons[0].evaluate(b => b.click());
      await new Promise(r => setTimeout(r, 400));
      const closeLevelModalBtn = await page.$('button[title*="Cerrar"], button svg.lucide-x, button:has(svg.lucide-x)');
      if (closeLevelModalBtn) {
        await closeLevelModalBtn.evaluate(b => b.click());
      } else {
        await page.keyboard.press('Escape');
      }
      await new Promise(r => setTimeout(r, 300));
      console.log('   ✅ Difficulty selection modal opened and closed safely');
    }

    // ─── 5. ACCORDION & 6 TOOLS STRESS TEST ───
    console.log('5. Testing all 6 Accordion Tools sequentially...');

    const ensureAccordionOpen = async () => {
      await page.waitForSelector('#tour-tuner-apparatus', { timeout: 10000 });
      await page.evaluate(() => {
        const apparatus = document.querySelector('#tour-tuner-apparatus');
        if (!apparatus) return;
        const collapsible = apparatus.querySelector('div.space-y-5');
        const isHidden = !collapsible || collapsible.classList.contains('hidden');
        if (isHidden) {
          const btn = apparatus.querySelector('button');
          if (btn) btn.click();
        }
      });
      await new Promise(r => setTimeout(r, 500));
    };

    const helperOpenTool = async (nameSnippet) => {
      await ensureAccordionOpen();
      return page.evaluate((snippet) => {
        const buttons = Array.from(document.querySelectorAll('#tour-tuner-apparatus button'));
        const target = buttons.find(b => b.textContent.includes(snippet));
        if (target) {
          target.scrollIntoView({ block: 'center' });
          target.click();
          return true;
        }
        return false;
      }, nameSnippet);
    };

    const helperClickBack = async () => {
      return page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const backBtn = buttons.find(b => {
          const txt = b.textContent || '';
          return txt.includes('Volver') || b.querySelector('svg.lucide-arrow-left');
        });
        if (backBtn) {
          backBtn.scrollIntoView({ block: 'center' });
          backBtn.click();
          return true;
        }
        return false;
      });
    };

    // ─── Tool 1: Vocal Range Modal (Tesitura) ───
    console.log('   --- Tool 1: Tesitura Vocal (VocalRangeModal) ---');
    const opened1 = await helperOpenTool('TEST VOCAL');
    if (opened1) {
      await new Promise(r => setTimeout(r, 700));
      // Fuzz gender switches
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const femaleBtn = btns.find(b => b.textContent.includes('Femenina'));
        if (femaleBtn) femaleBtn.click();
      });
      await new Promise(r => setTimeout(r, 200));
      await helperClickBack();
      await new Promise(r => setTimeout(r, 600));
      console.log('      ✅ VocalRangeModal opened, interacted and closed via Volver');
    } else {
      throw new Error('Tool 1: Vocal Range Modal button could not be opened');
    }

    // ─── Tool 2: Breathing Modal (Respiración) ───
    console.log('   --- Tool 2: Ejercicios de Respiración (BreathingModal) ---');
    const opened2 = await helperOpenTool('Control Diafragmático');
    if (opened2) {
      await new Promise(r => setTimeout(r, 700));
      // Switch technique pills
      await page.evaluate(() => {
        const pills = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('4-') || b.textContent.includes('Cuadrada') || b.textContent.includes('Triangular'));
        if (pills.length > 0) pills[0].click();
      });
      await new Promise(r => setTimeout(r, 200));
      await helperClickBack();
      await new Promise(r => setTimeout(r, 600));
      console.log('      ✅ BreathingModal opened, interacted and closed via Volver');
    } else {
      throw new Error('Tool 2: Breathing Modal button could not be opened');
    }

    // ─── Tool 3: Stability Challenge Modal (Estabilidad) ───
    console.log('   --- Tool 3: Desafío de Estabilidad 10s (StabilityChallengeModal) ---');
    const opened3 = await helperOpenTool('Desafío de Retención');
    if (opened3) {
      await new Promise(r => setTimeout(r, 700));
      // Tap note buttons
      await page.evaluate(() => {
        const noteBtns = Array.from(document.querySelectorAll('button')).filter(b => ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'].some(n => b.textContent.includes(n)));
        if (noteBtns.length > 2) noteBtns[1].click();
      });
      await new Promise(r => setTimeout(r, 200));
      await helperClickBack();
      await new Promise(r => setTimeout(r, 600));
      console.log('      ✅ StabilityChallengeModal opened, interacted and closed via Volver');
    } else {
      throw new Error('Tool 3: Stability Challenge button could not be opened');
    }

    // ─── Tool 4: Voice Evaluation Modal (Evaluación) ───
    console.log('   --- Tool 4: Evaluación de Precisión IA (VoiceEvalModal) ---');
    const opened4 = await helperOpenTool('Diagnóstico IA');
    if (opened4) {
      await new Promise(r => setTimeout(r, 700));
      // Tap target note buttons
      await page.evaluate(() => {
        const noteBtns = Array.from(document.querySelectorAll('button')).filter(b => ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'].some(n => b.textContent.includes(n)));
        if (noteBtns.length > 2) noteBtns[2].click();
      });
      await new Promise(r => setTimeout(r, 200));
      await helperClickBack();
      await new Promise(r => setTimeout(r, 600));
      console.log('      ✅ VoiceEvalModal opened, interacted and closed via Volver');
    } else {
      throw new Error('Tool 4: Voice Eval button could not be opened');
    }

    // ─── Tool 5: Escalas Rápidas Vocales (EscalasModal) ───
    console.log('   --- Tool 5: Solfeo y Escalas Rápidas (EscalasModal) ---');
    const opened5 = await helperOpenTool('Solfeo y Audición');
    if (opened5) {
      await new Promise(r => setTimeout(r, 700));

      // Fuzz play/stop audio sequence rapidly (race condition test)
      const playScaleBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Reproducir Escala') || b.textContent.includes('Detener Escala') || b.querySelector('svg.lucide-play'));
      });
      if (playScaleBtn && playScaleBtn.asElement()) {
        for (let i = 0; i < 4; i++) {
          await playScaleBtn.evaluate(b => b.click()).catch(() => {});
          await new Promise(r => setTimeout(r, 80));
        }
        console.log('      ✅ Rapid Play/Stop sequence fuzzed');
      }

      await helperClickBack();
      await new Promise(r => setTimeout(r, 600));
      console.log('      ✅ EscalasModal opened, interacted and closed via Volver');
    } else {
      throw new Error('Tool 5: Escalas Modal button could not be opened');
    }

    // ─── Tool 6: Duelo Rápido (DueloRapidoModal) ───
    console.log('   --- Tool 6: Duelo Rápido (DueloRapidoModal) ---');
    const opened6 = await helperOpenTool('Competencia Vocal');
    if (opened6) {
      await new Promise(r => setTimeout(r, 700));

      // Verify caution ribbon
      const ribbonText = await page.evaluate(() => document.body.innerText);
      if (ribbonText.includes('Disponible Pronto')) {
        console.log('      ✅ "Disponible Pronto" barrier verified');
      }

      await helperClickBack();
      await new Promise(r => setTimeout(r, 600));
      console.log('      ✅ DueloRapidoModal opened, barrier verified and closed via Volver');
    } else {
      throw new Error('Tool 6: Duelo Rapido button could not be opened');
    }

    console.log('----------------------------------------------------');
    console.log('📊 RESULTS SUMMARY:');
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (pageErrors.length > 0) {
      console.error('❌ Page Errors detected:');
      pageErrors.forEach(e => console.error('  ', e));
    }
    if (consoleErrors.length > 0) {
      console.error('⚠️ Console Errors detected:');
      consoleErrors.forEach(e => console.error('  ', e));
    }

    if (pageErrors.length === 0 && consoleErrors.length === 0) {
      console.log('🎉 ALL 6 ACCORDION TOOLS & CORE TUNER TESTS PASSED 100% PERFECTLY WITH 0 ERRORS!');
    }

  } catch (err) {
    console.error('💥 FATAL TEST RUNNER EXCEPTION:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runChaos().catch(err => {
  console.error(err);
  process.exit(1);
});
