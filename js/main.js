/* ============================================================
   San Andreas Birthday Mission — main.js
   Handles all screen transitions and interactions.
   ============================================================ */

(function () {
  'use strict';

  const screens = {
    intro:   document.getElementById('screen-intro'),
    gta:     document.getElementById('screen-gta'),
    cookies: document.getElementById('screen-cookies'),
    dossier: document.getElementById('screen-dossier'),
    final:   document.getElementById('screen-final'),
  };

  /** Show a screen by id, fading out all others. */
  function showScreen(id) {
    Object.entries(screens).forEach(([key, el]) => {
      if (key === id) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  /** Fade out a screen then activate the next one. */
  function transitionTo(nextId, fadeDelay = 1000) {
    const current = Object.values(screens).find(s => s.classList.contains('active'));
    if (current) current.classList.add('fade-out');
    setTimeout(() => {
      if (current) current.classList.remove('fade-out');
      showScreen(nextId);
    }, fadeDelay);
  }

  /* ============================================================
     SCREEN 1 — Video Prologue
     ============================================================ */
  const introVideo   = document.getElementById('intro-video');
  const startBtn     = document.getElementById('start-btn');
  const introOverlay  = document.getElementById('intro-overlay');
  const introFallback = document.getElementById('intro-fallback');

  // Set neon city background for GTA interface screen
  document.getElementById('gta-bg').style.backgroundImage =
    "url('https://images.pexels.com/photos/17195067/pexels-photo-17195067.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400')";

  // Check if the video file exists / can play; if not, show fallback.
  introVideo.addEventListener('error', () => {
    introVideo.style.display = 'none';
    introFallback.classList.remove('hidden');
    introFallback.classList.add('flex');
  });

  // If video never loads (src missing), the 'error' event fires.
  // Also handle the case where it loads but is empty.
  introVideo.addEventListener('loadeddata', () => {
    introFallback.classList.add('hidden');
    introFallback.classList.remove('flex');
  });

  startBtn.addEventListener('click', function handleStart() {
    startBtn.style.display = 'none';
    introVideo.muted = false;
    const playPromise = introVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Video playing with sound — wait for 'ended'.
      }).catch(() => {
        // Sound playback blocked — try muted, or skip if video is missing.
        if (introVideo.error || introVideo.readyState === 0) {
          transitionTo('gta');
        } else {
          introVideo.muted = true;
          introVideo.play().catch(() => transitionTo('gta'));
        }
      });
    } else {
      transitionTo('gta');
    }
  });

  introVideo.addEventListener('ended', () => {
    transitionTo('gta');
  });

  /* ============================================================
     SCREEN 2 — GTA Interface (Triad Dialog)
     ============================================================ */
  const dialogText    = document.getElementById('dialog-text');
  const dialogChoices  = document.getElementById('dialog-choices');

  const dialogMessage =
    'Босс говорит, 43 года — солидный ранг в Синдикате. ' +
    'Он желает тебе стальных нервов, идеальных дедлайнов и бесконечного запаса юаней.';

  let gtaScreenActivated = false;

  function runTypewriter(text, target, speed, onDone) {
    target.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    cursor.textContent = '\u00A0';
    target.appendChild(cursor);

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        cursor.remove();
        target.appendChild(document.createTextNode(text[i]));
        target.appendChild(cursor);
        i++;
      } else {
        clearInterval(interval);
        cursor.remove();
        if (onDone) onDone();
      }
    }, speed);
  }

  // Activate typewriter when the GTA screen becomes visible.
  const gtaObserver = new MutationObserver(() => {
    if (screens.gta.classList.contains('active') && !gtaScreenActivated) {
      gtaScreenActivated = true;
      runTypewriter(dialogMessage, dialogText, 35, () => {
        dialogChoices.classList.remove('hidden');
        dialogChoices.classList.add('flex');
        dialogChoices.classList.add('flex-col');
      });
    }
  });
  gtaObserver.observe(screens.gta, { attributes: true, attributeFilter: ['class'] });

  dialogChoices.addEventListener('click', (e) => {
    const btn = e.target.closest('.gta-menu-btn');
    if (!btn) return;
    const choice = btn.dataset.choice;
    const gtaDialog = document.getElementById('gta-dialog');

    // Quick acknowledgment line, then transition.
    dialogChoices.classList.add('hidden');
    const ack = document.createElement('p');
    ack.className = 'font-oswald text-saYellow text-base mt-2';
    ack.textContent = choice === 'respect'
      ? 'Босс удовлетворён. Респект принят.'
      : 'Босс усмехается. Двойная ставка одобрена.';
    ack.style.animation = 'fade-in 0.4s ease both';
    dialogText.parentElement.appendChild(ack);

    setTimeout(() => transitionTo('cookies'), 1800);
  });

  /* ============================================================
     SCREEN 3 — Fortune Cookies
     ============================================================ */
  const cookieCards = document.querySelectorAll('.cookie-card');
  const cookiesNext = document.getElementById('cookies-next');
  let openedCount = 0;

  cookieCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('opened')) return;
      card.classList.add('opened');
      const msg = card.querySelector('.cookie-message');
      msg.classList.remove('hidden');
      const visual = card.querySelector('.cookie-visual');
      // Hide visual after crack animation
      setTimeout(() => { visual.style.display = 'none'; }, 400);
      openedCount++;
      if (openedCount === 3) {
        setTimeout(() => {
          cookiesNext.classList.remove('hidden');
          cookiesNext.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 600);
      }
    });
  });

  cookiesNext.addEventListener('click', () => {
    transitionTo('dossier');
  });

  /* ============================================================
     SCREEN 4 — Dossier / Loading
     ============================================================ */
  const loadingFill = document.getElementById('loading-fill');
  const loadingPct  = document.getElementById('loading-pct');
  const loadingText = document.getElementById('loading-text');
  const dossierSlider = document.getElementById('dossier-slider');

  const loadingMessages = [
    'Loading translation matrices...',
    'Decrypting Triad archives...',
    'Compiling HSK 43 data...',
    'Syncing dossier photos...',
    'Mission ready.',
  ];

  let dossierActivated = false;

  function runLoading() {
    if (dossierActivated) return;
    dossierActivated = true;

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 8 + 2;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        loadingFill.style.width = '100%';
        loadingPct.textContent = '100%';
        loadingText.textContent = loadingMessages[loadingMessages.length - 1];
        setTimeout(() => transitionTo('final'), 1200);
        return;
      }
      loadingFill.style.width = pct + '%';
      loadingPct.textContent = Math.floor(pct) + '%';
      const msgIndex = Math.min(
        Math.floor((pct / 100) * (loadingMessages.length - 1)),
        loadingMessages.length - 2
      );
      loadingText.textContent = loadingMessages[msgIndex];
    }, 180);
  }

  const dossierObserver = new MutationObserver(() => {
    if (screens.dossier.classList.contains('active')) {
      runLoading();
    }
  });
  dossierObserver.observe(screens.dossier, { attributes: true, attributeFilter: ['class'] });

  // Auto-scroll slider subtly
  let scrollDir = 1;
  setInterval(() => {
    if (!screens.dossier.classList.contains('active')) return;
    const track = dossierSlider.querySelector('.dossier-track');
    track.scrollBy({ left: 2 * scrollDir, behavior: 'auto' });
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 5) scrollDir = -1;
    if (track.scrollLeft <= 5) scrollDir = 1;
  }, 40);

  /* ============================================================
     SCREEN 5 — Final Mission
     ============================================================ */
  const finishBtn = document.getElementById('finish-btn');
  const missionPassed = document.getElementById('mission-passed');

  finishBtn.addEventListener('click', () => {
    missionPassed.classList.remove('hidden');
    missionPassed.classList.add('flex');
    fireConfetti();
  });

  function fireConfetti() {
    // Big burst from center
    confetti({
      particleCount: 200,
      spread: 360,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#F8B800', '#FF7A00', '#5FB15A', '#ffffff', '#FFD700'],
    });

    // Side cannons
    const end = Date.now() + 4000;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#F8B800', '#FF7A00', '#5FB15A'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#F8B800', '#FF7A00', '#5FB15A'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Periodic top bursts for a few seconds
    let bursts = 0;
    const burstInterval = setInterval(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        startVelocity: 35,
        origin: { x: Math.random(), y: 0 },
        colors: ['#F8B800', '#FF7A00', '#5FB15A', '#ffffff'],
      });
      bursts++;
      if (bursts >= 5) clearInterval(burstInterval);
    }, 700);
  }

  /* ============================================================
     Init
     ============================================================ */
  showScreen('intro');
})();
