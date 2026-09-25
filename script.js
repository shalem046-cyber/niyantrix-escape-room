(() => {
  const state = {
    started: false,
    time: 16 * 60,
    interval: null,
    mistakes: 0,
    hints: 0,
    fragments: [],
    solved: new Set(),
    missionId: '',
    teamName: 'UNNAMED',
    finalAttempts: 0,
    orderKey: [],
    loginAttempts: 0,
    wrongClicks: 0,
    creatorUnlocked: false,
  };

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const screens = ['landing', 'board', 'moduleView', 'finalView', 'successView', 'failView'];

  function show(id) {
    screens.forEach(name => document.getElementById(name).classList.toggle('active', name === id));
  }

  function missionToken() {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function makeMissionId() {
    return `NODE-${missionToken()}-${Math.floor(10 + Math.random() * 90)}`;
  }

  function renderTimer() {
    const safeTime = Math.max(0, state.time);
    const m = String(Math.floor(safeTime / 60)).padStart(2, '0');
    const s = String(safeTime % 60).padStart(2, '0');
    $('#timer').textContent = `${m}:${s}`;
    $('#timer').style.color = state.time <= 60 ? 'var(--red)' : 'var(--cyan)';
  }

  function startTimer() {
    clearInterval(state.interval);
    state.interval = setInterval(() => {
      if (!state.started) return;
      state.time -= 1;
      renderTimer();
      if (state.time <= 0) {
        state.time = 0;
        renderTimer();
        failGame();
      }
    }, 1000);
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2100);
  }

  function showReaction(message = 'WRONG BUTTON 😭') {
    const modal = $('#reactionModal');
    if (!modal) return;
    $('#reactionText').textContent = message;
    const img = $('#reactionImage');
    const fallback = $('#reactionFallback');
    if (img) {
      img.onerror = () => {
        img.style.display = 'none';
        fallback.classList.add('show');
      };
      img.style.display = 'block';
      fallback.classList.remove('show');
      img.src = state.wrongClicks % 2 === 0
        ? 'assets/memes/reaction-2.jpg'
        : 'assets/memes/reaction-1.jpg';
    }
    modal.classList.remove('hidden');
    clearTimeout(showReaction._t);
    showReaction._t = setTimeout(() => modal.classList.add('hidden'), 1150);
  }

  function spawnFakeButtons() {
    const box = $('#fakeButtons');
    if (!box) return;
    const labels = ['VERIFY','CONTINUE','I AM HUMAN','CONFIRM','OVERRIDE','PROCEED','TRUST ME','ACCESS','VALIDATE','UNLOCK'];
    const count = Math.min(3 + Math.max(0, state.loginAttempts - 1) * 2, 10);
    box.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fake-auth-btn';
      btn.textContent = labels[i];
      btn.addEventListener('click', () => {
        state.wrongClicks += 1;
        $('#wrongClickCounter').textContent = `WRONG CLICKS: ${state.wrongClicks} · ATTEMPTS: ${state.loginAttempts}`;
        btn.classList.add('wrong-hit');
        glitch();
        showReaction(state.wrongClicks > 4 ? 'YOU KEEP CLICKING THE TRAPS. 😭' : 'WRONG BUTTON 😭');
        toast('FALSE CONTROL DETECTED');
        setTimeout(() => btn.remove(), 260);
      });
      box.appendChild(btn);
    }
  }

  function attemptLogin() {
    const id = $('#loginId').value.trim().toUpperCase();
    const key = $('#accessKey').value.trim().toUpperCase();
    state.loginAttempts += 1;

    if (id === 'ARCHITECT' && key === 'PX//7F-ACCESS') {
      state.creatorUnlocked = true;
      $('#loginSession').textContent = 'GRANTED';
      $('#loginSession').className = 'cyan';
      $('#bootStatus').textContent = 'SESSION: GRANTED';
      $('#loginMessage').innerHTML = '<strong>CREATOR ACCESS</strong> · ACCESS GRANTED ✓';
      $('#fakeButtons').innerHTML = '';
      $('#enterBtn').textContent = 'ENTER RECOVERY MODE';
      $('#enterBtn').classList.remove('dodging');
      $('#wrongClickCounter').textContent = `CREATOR AUTHENTICATED · ATTEMPTS: ${state.loginAttempts}`;
      setTimeout(launchMission, 520);
      return;
    }

    $('#loginSession').textContent = 'REJECTED';
    $('#loginSession').className = 'danger';
    $('#bootStatus').textContent = 'ACCESS DENIED';
    $('#loginMessage').textContent =
      state.loginAttempts === 1
        ? 'Credentials rejected. The interface has become less cooperative.'
        : state.loginAttempts === 2
          ? 'Incorrect. There are now several buttons. Only one of them is useful.'
          : 'Authentication failure. Stop trusting the obvious controls.';
    spawnFakeButtons();
    if (state.loginAttempts >= 2) $('#enterBtn').classList.add('dodging');
    glitch();
    toast(state.loginAttempts === 1 ? 'ACCESS DENIED' : 'SYSTEM: NICE TRY.');
  }

  function glitch() {
    $('#glitchFlash').classList.remove('active');
    void $('#glitchFlash').offsetWidth;
    $('#glitchFlash').classList.add('active');
    document.body.classList.add('corrupted');
    setTimeout(() => document.body.classList.remove('corrupted'), 520);
  }

  function mistake(message = 'Signal rejected.') {
    if (!state.started) return;
    state.mistakes += 1;
    $('#mistakeCount').textContent = `${state.mistakes} error${state.mistakes === 1 ? '' : 's'}`;
    state.time = Math.max(0, state.time - 12);
    glitch();
    toast(`${message} -12 sec`);
    renderTimer();
    if (state.time <= 0) failGame();
  }

  function addFragment(word, position, source) {
    if (state.fragments.some(f => f.word === word)) return;
    state.fragments.push({ word, position, source });
    state.fragments.sort((a, b) => a.position - b.position);
    $('#fragmentCount').textContent = `${state.fragments.length} / 5`;
    $('#fragments').innerHTML = state.fragments.map(f =>
      `<span class="fragment"><span class="pos">P${f.position}</span>${f.word}</span>`
    ).join('');
    if (state.fragments.length === 5) {
      $('#finalBtn').classList.remove('disabled');
      $('#finalBtn').textContent = 'FINAL TERMINAL — UNLOCKED';
      $('#nodeStatus').textContent = 'READY';
      $('#pathStatus').textContent = 'RECOVERED';
      $('#integrityStatus').textContent = '100%';
    }
  }

  function markSolved(name) {
    state.solved.add(name);
    const card = document.querySelector(`[data-module="${name}"]`);
    if (card) {
      const status = card.querySelector('.status');
      status.textContent = 'RECOVERED';
      status.classList.remove('locked');
      status.classList.add('done');
    }
  }

  function bindSubmit(mod, name) {
    const submit = $('#submit');
    if (!submit) return;

    if (state.solved.has(name)) {
      submit.disabled = true;
      const feedback = $('#feedback');
      if (feedback) {
        feedback.className = 'feedback ok';
        feedback.textContent = 'MODULE ALREADY RECOVERED. Evidence secured.';
      }
      return;
    }

    submit.addEventListener('click', () => {
      if (!state.started || state.solved.has(name)) return;

      const solved = mod.check();
      if (solved) {
        const feedback = $('#feedback');
        if (feedback) {
          feedback.className = 'feedback ok';
          feedback.textContent = 'RECOVERY ACCEPTED. Fragment secured.';
        }
        submit.disabled = true;
        setTimeout(() => {
          if (state.started) show('board');
        }, 600);
      } else {
        const feedback = $('#feedback');
        if (feedback) {
          feedback.className = 'feedback bad';
          feedback.textContent = 'RECOVERY REJECTED. Re-check the evidence.';
        }
      }
    });
  }

  const modules = {
    signal: {
      title: 'SIG//11 · SIGNAL DRIFT',
      html: () => `
        <p class="puzzle-copy">Three telemetry channels should follow the same six-step timing pattern. One packet is corrupt.</p>
        <div class="code-box">
          CH-A :: 2 · 4 · 8 · 16 · 32 · 64<br>
          CH-B :: 3 · 6 · 12 · 24 · 48 · 96<br>
          CH-C :: 5 · 10 · 20 · 40 · 80 · 150<br><br>
          NODE RULE: Each next value is the previous value × 2.
        </div>
        <p class="puzzle-copy">The last CH-C value is wrong. What should the node have reported? Enter the corrected value.</p>
        <div class="puzzle-row"><input id="answer" class="code-input" placeholder="CORRECT VALUE" inputmode="numeric"><button id="submit" class="primary-btn">VERIFY</button></div>
        <div id="feedback" class="feedback"></div>`,
      check: () => {
        const v = $('#answer').value.trim();
        if (v === '160') {
          addFragment('LOOK', 1, 'signal');
          markSolved('signal');
          return true;
        }
        mistake('Telemetry correction failed.');
        return false;
      },
    },

    trace: {
      title: 'SRC//04 · SOURCE TRACE',
      html: () => `
        <p class="puzzle-copy">The visual page is only one layer. The browser loaded more than it displays.</p>
        <div class="code-box">INVESTIGATOR NOTE<br><br>Do not search the visible screen for this answer.<br>Inspect the document source and look for a recovery comment.</div>
        <p class="puzzle-copy">The hidden source clue contains a recovery fragment and a position number. Enter the fragment.</p>
        <div class="puzzle-row"><input id="answer" class="code-input" placeholder="SOURCE FRAGMENT" autocomplete="off"><button id="submit" class="primary-btn">RECOVER</button></div>
        <div id="feedback" class="feedback"></div>`,
      check: () => {
        const v = $('#answer').value.trim().toUpperCase();
        if (v === 'BEYOND') {
          addFragment('BEYOND', 2, 'trace');
          markSolved('trace');
          return true;
        }
        mistake('Source trace mismatch.');
        return false;
      },
    },

    decode: {
      title: 'BIN//23 · DEAD PACKET',
      html: () => `
        <p class="puzzle-copy">A captured packet survived the crash. It is encoded as Base64, not binary.</p>
        <div class="packet-box">VEhF</div>
        <p class="puzzle-copy">Use the encoding clue above. Decode the packet and enter the result in uppercase.</p>
        <div class="toggle-row" aria-label="Encoding choices">
          <button class="toggle" data-choice="HEX">HEX</button>
          <button class="toggle active" data-choice="BASE64">BASE64</button>
          <button class="toggle" data-choice="ASCII">ASCII</button>
        </div>
        <div class="puzzle-row" style="margin-top:16px"><input id="answer" class="code-input" placeholder="DECODED WORD" autocomplete="off"><button id="submit" class="primary-btn">DECODE</button></div>
        <div id="feedback" class="feedback"></div>`,
      setup: () => {
        $$('.toggle').forEach(btn => btn.addEventListener('click', () => {
          $$('.toggle').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }));
      },
      check: () => {
        const choice = $('.toggle.active')?.dataset.choice;
        const v = $('#answer').value.trim().toUpperCase();
        if (choice === 'BASE64' && v === 'THE') {
          addFragment('THE', 3, 'decode');
          markSolved('decode');
          return true;
        }
        // This module is intentionally designed to punish blind guessing.
        mistake('Wrong encoding or decoded packet.');
        return false;
      },
    },

    logic: {
      title: 'LOG//08 · LOGIC GATE',
      html: () => `
        <p class="puzzle-copy">The relay opens only when the final 3-bit state is correct. Calculate the gate output from left to right.</p>
        <div class="logic-grid">
          <div class="logic-node"><span>A</span><strong>1</strong></div>
          <div class="logic-node"><span>B</span><strong>0</strong></div>
          <div class="logic-node"><span>C</span><strong>1</strong></div>
          <div class="logic-node"><span>G1 = A XOR B</span><strong>?</strong></div>
          <div class="logic-node"><span>G2 = G1 AND C</span><strong>?</strong></div>
          <div class="logic-node"><span>RELAY = NOT G2</span><strong>?</strong></div>
        </div>
        <p class="puzzle-copy">Work it through carefully: XOR → AND → NOT. Enter the relay bit: 1 or 0.</p>
        <div class="puzzle-row"><input id="answer" class="code-input" placeholder="0 OR 1" inputmode="numeric"><button id="submit" class="primary-btn">TEST RELAY</button></div>
        <div id="feedback" class="feedback"></div>`,
      check: () => {
        const v = $('#answer').value.trim();
        const g1 = 1 ^ 0;
        const g2 = g1 & 1;
        const relay = g2 ^ 1;

        if (v === String(relay)) {
          addFragment('BROKEN', 4, 'logic');
          markSolved('logic');
          return true;
        }

        mistake('Relay logic rejected.');
        return false;
      },
    },

    route: {
      title: 'NET//31 · ROUTE TABLE',
      html: () => `
        <p class="puzzle-copy">Select nodes in the only order that satisfies every network rule.</p>
        <ul class="route-rules">
          <li>1. NODE-C must appear before NODE-A.</li>
          <li>2. NODE-B must be immediately after NODE-E.</li>
          <li>3. NODE-D cannot be first.</li>
          <li>4. NODE-C is the only node with no prerequisite, so the route starts with C.</li>
          <li>5. NODE-A must appear before NODE-D.</li>
        </ul>
        <div class="route-board" id="routeBoard">
          <button class="route-node" data-node="A">NODE-A<small>sensor hub</small></button>
          <button class="route-node" data-node="B">NODE-B<small>uplink</small></button>
          <button class="route-node" data-node="C">NODE-C<small>gateway</small></button>
          <button class="route-node" data-node="D">NODE-D<small>monitor</small></button>
          <button class="route-node" data-node="E">NODE-E<small>relay</small></button>
        </div>
        <div class="code-box">Selected route: <span id="routePreview">—</span></div>
        <div class="puzzle-row"><button id="clearRoute" class="back-btn">CLEAR</button><button id="submit" class="primary-btn">VERIFY ROUTE</button></div>
        <div id="feedback" class="feedback"></div>`,
      setup: () => {
        const selected = [];
        const preview = $('#routePreview');
        $$('.route-node').forEach(btn => btn.addEventListener('click', () => {
          const node = btn.dataset.node;
          if (selected.includes(node)) return;
          selected.push(node);
          btn.classList.add('selected');
          preview.textContent = selected.join(' → ');
        }));
        $('#clearRoute').addEventListener('click', () => {
          selected.length = 0;
          $$('.route-node').forEach(b => b.classList.remove('selected'));
          preview.textContent = '—';
        });
        $('#routeBoard').dataset.selected = JSON.stringify(selected);
        window.__activeRoute = selected;
      },
      check: () => {
        const route = window.__activeRoute || [];
        const index = node => route.indexOf(node);

        const correct =
          route.length === 5 &&
          new Set(route).size === 5 &&
          route[0] === 'C' &&
          index('C') < index('A') &&
          index('B') === index('E') + 1 &&
          index('D') !== 0 &&
          index('A') > index('B') &&
          index('A') < index('D');

        if (correct) {
          addFragment('PAGE', 5, 'route');
          markSolved('route');
          return true;
        }
        mistake('Route violates one or more constraints.');
        return false;
      },
    },
  };

  function openModule(name) {
    const mod = modules[name];
    if (!mod) return;
    $('#moduleTitle').innerHTML = `<span class="eyebrow">TECHNICAL MODULE</span><strong>${mod.title}</strong>`;
    $('#moduleContent').innerHTML = mod.html();
    window.__activeRoute = [];
    if (mod.setup) mod.setup();
    bindSubmit(mod, name);
    show('moduleView');
  }

  function failGame() {
    clearInterval(state.interval);
    state.interval = null;
    state.started = false;
    $('#hintPanel').classList.add('hidden');
    show('failView');
  }

  function resetBoard() {
    state.time = 16 * 60;
    state.mistakes = 0;
    state.hints = 0;
    state.fragments = [];
    state.solved = new Set();
    state.missionId = makeMissionId();
    state.finalAttempts = 0;
    $('#missionId').textContent = state.missionId;
    $('#fragments').innerHTML = '';
    $('#fragmentCount').textContent = '0 / 5';
    $('#mistakeCount').textContent = '0 errors';
    $('#finalBtn').classList.add('disabled');
    $('#finalBtn').textContent = 'FINAL TERMINAL — LOCKED';
    $('#nodeStatus').textContent = 'UNSTABLE';
    $('#pathStatus').textContent = 'UNKNOWN';
    $('#integrityStatus').textContent = '63%';
    $$('.status').forEach(s => { s.textContent = 'UNREAD'; s.className = 'status locked'; });
    document.body.classList.remove('corrupted');
    renderTimer();
  }

  function launchMission() {
    state.started = true;
    state.teamName = ($('#teamName').value.trim() || 'UNNAMED').slice(0, 18).toUpperCase();
    $('#teamStatus').textContent = state.teamName;
    resetBoard();
    show('board');
    startTimer();
  }

  function restart() {
    state.started = true;
    $('#teamName').value = state.teamName === 'UNNAMED' ? '' : state.teamName;
    $('#teamStatus').textContent = state.teamName;
    resetBoard();
    show('board');
    startTimer();
  }

  function requestHint() {
    if (!state.started) return;
    if (state.hints >= 1) {
      toast('The trace buffer is empty. Only one system trace is available.');
      return;
    }
    state.hints += 1;
    state.time = Math.max(0, state.time - 30);
    renderTimer();
    $('#hintText').textContent = `SYSTEM TRACE // ${state.missionId}\n\nThe interface is not the whole page.\n\nUseful route: inspect the document source.\nHidden source note: TRACE = VIEW.\n\nThe final phrase will read as a normal sentence.\nPosition markers on recovered fragments matter.`;
    $('#hintPanel').classList.remove('hidden');
    toast('System trace exposed. -30 sec');
  }

  $('#enterBtn').addEventListener('click', attemptLogin);
  $('#loginId').addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
  $('#accessKey').addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
  $('#closeReaction').addEventListener('click', () => $('#reactionModal').classList.add('hidden'));
  $$('.module-btn').forEach(btn => btn.addEventListener('click', () => openModule(btn.dataset.open)));
  $('#backBtn').addEventListener('click', () => show('board'));
  $('#hintBtn').addEventListener('click', requestHint);
  $('#closeHint').addEventListener('click', () => $('#hintPanel').classList.add('hidden'));

  $('#finalBtn').addEventListener('click', () => {
    if (state.fragments.length < 5) return toast('Final terminal is still locked.');
    $('#finalFragments').innerHTML = state.fragments.map(f =>
      `<div class="fragment"><span class="pos">POSITION ${f.position}</span><strong>${f.word}</strong></div>`
    ).join('');
    $('#finalInput').value = '';
    $('#finalFeedback').textContent = '';
    show('finalView');
  });

  function submitFinal() {
    state.finalAttempts += 1;
    const value = $('#finalInput').value.trim().toUpperCase().replace(/\s+/g, ' ');
    const expected = state.fragments
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(f => f.word)
      .join(' ');
    const feedback = $('#finalFeedback');

    if (value === expected) {
      clearInterval(state.interval);
      state.interval = null;
      state.started = false;
      const elapsed = (16 * 60) - state.time;
      const mins = Math.floor(elapsed / 60);
      const secs = String(elapsed % 60).padStart(2, '0');
      $('#successStats').innerHTML = `
        <span class="stat-chip">TEAM ${state.teamName}</span>
        <span class="stat-chip">TIME ${mins}:${secs}</span>
        <span class="stat-chip">ERRORS ${state.mistakes}</span>
        <span class="stat-chip">HINTS ${state.hints}</span>`;
      $('#successText').textContent = `Mission ${state.missionId} accepted the recovery phrase: ${expected}.`;
      show('successView');
      return;
    }
    mistake('Final authorization rejected.');
    feedback.className = 'feedback bad';
    feedback.textContent = 'The phrase is not yet reconstructed correctly.';
    mistake('Final authorization rejected.');
  }

  $('#submitFinal').addEventListener('click', submitFinal);
  $('#finalInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitFinal();
    }
  });

  $('#restartBtn').addEventListener('click', restart);
  $('#restartFailBtn').addEventListener('click', restart);

  // Hidden secondary interaction: five clicks on the status dot reveal the same trace layer.
  let clicks = 0;
  $('#systemDot').addEventListener('click', () => {
    clicks += 1;
    if (clicks === 5) {
      $('#hintText').textContent = 'SYSTEM TRACE // MANUAL\n\nThe interface is not the whole page.\nInspect the source.\nTRACE = VIEW\n\nRecovered words have position markers.';
      $('#hintPanel').classList.remove('hidden');
      clicks = 0;
    }
  });

  renderTimer();
})();