/* 声音引擎：
 * 1) 语音 = 浏览器 Web Speech API（优先本机英语语音；离线能力取决于设备语音包）
 * 2) 音效 = WebAudio 现场合成（点击/答对/答错/星星/胜利）
 * 3) 农场使用本地动物录音和动作拟音；字母录音由 sounds/manifest.json 单独登记
 */
const Sound = (() => {
  const hasTTS = 'speechSynthesis' in window;
  let ctx = null;          // AudioContext，惰性创建（必须在用户手势里）
  let muted = false;
  let voice = null;
  let soundManifest = null; // { "A": "a.mp3", ... }，来自 sounds/manifest.json
  let animalPlayback = null;
  const animalClipBuffers = new Map();
  function releaseAnimalMedia(playback) {
    clearTimeout(playback.startTimer);
    const audio = playback.audio;
    if (!audio) return;
    playback.audio = null;
    audio.onplaying = audio.onended = audio.onerror = null;
    audio.pause();
  }
  function stopAnimals() {
    const playback = animalPlayback;
    if (!playback) return;
    animalPlayback = null;
    releaseAnimalMedia(playback);
    if (playback.source) {
      playback.source.onended = null;
      playback.source.stop();
      playback.source.disconnect();
    }
  }

  // 儿童友好、吐字清晰的语音优先
  const PREFERRED = ['Google US English', 'Aria', 'Jenny', 'Samantha', 'Emma', 'Zira', 'Libby', 'Michelle', 'Female'];

  function pickVoice(lang = 'en-US') {
    if (!hasTTS) return null;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return null;
    const prefix = lang.split('-')[0].toLowerCase();
    const en = vs.filter(v => v.lang.toLowerCase().startsWith(prefix));
    const local = en.filter(v => v.localService);
    const pool = local.length ? local : en;
    for (const name of PREFERRED) {
      const hit = pool.find(v => v.name.includes(name));
      if (hit) return hit;
    }
    return pool.find(v => v.lang.toLowerCase() === lang.toLowerCase()) || pool[0];
  }

  const DEFAULT_RATE = 0.8;
  let initialized = false;
  let generation = 0;
  let current = null; // Strong reference: some engines lose callbacks if utterances are collected.
  let recording = null;
  let queue = [];
  let suspendedJobs = [];
  const timers = new Set();

  function later(fn, ms) {
    const token = generation;
    const id = setTimeout(() => { timers.delete(id); if (token === generation) fn(); }, ms);
    timers.add(id);
    return id;
  }
  function resumeAudio() {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  function init() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    resumeAudio();
    if (!initialized && hasTTS) {
      initialized = true;
      speechSynthesis.addEventListener('voiceschanged', () => { voice = pickVoice(); });
      voice = pickVoice();
    }
    if (hasTTS && speechSynthesis.paused) speechSynthesis.resume();
  }

  function stop() {
    stopAnimals();
    generation++;
    timers.forEach(clearTimeout); timers.clear();
    queue = [];
    suspendedJobs = [];
    if (current && current.utterance) {
      current.utterance.onstart = current.utterance.onend = current.utterance.onerror = null;
    }
    current = null;
    if (recording) {
      recording.onended = recording.onerror = recording.onplaying = null;
      recording.pause(); recording = null;
    }
    try { if (hasTTS) speechSynthesis.cancel(); } catch (e) {}
  }

  function speak(text, opts = {}) {
    speakSeq([String(text)], 0, opts, opts.onDone);
  }
  // Spoken instructions use Mandarin; letters and vocabulary keep their English voice.
  function guide(text, opts = {}) { speak(text, { ...opts, lang: 'zh-CN' }); }

  // One owned queue for individual words and sequences. Normal transitions never cancel speech.
  function speakSeq(lines, gap = 200, opts = {}, onDone = null) {
    const key = lines.join('\n');
    if (opts.dedupe && [current, ...queue].some(job => job && job.key === key)) return;
    if (opts.now !== false) stop();
    queue.push({ key, lines: lines.map(String).filter(Boolean), index: 0, gap, opts, onDone });
    if (!current) pump();
  }

  function pump() {
    if (current || !queue.length) return;
    const job = queue.shift();
    current = job;
    const token = generation;
    const valid = () => token === generation && current === job;
    const finish = () => {
      if (!valid()) return;
      current = null;
      if (job.onDone) job.onDone();
      if (token === generation) pump();
    };
    const next = () => {
      if (!valid()) return;
      if (muted || !hasTTS || job.index >= job.lines.length) { later(finish, 0); return; }
      playLine(job.lines[job.index++], 0);
    };
    const playLine = (text, attempt) => {
      if (!valid()) return;
      let settled = false, started = false, startTimer, endTimer;
      const u = new SpeechSynthesisUtterance(text);
      job.utterance = u;
      u.lang = job.opts.lang || 'en-US';
      voice = voice || pickVoice();
      const selectedVoice = u.lang === 'en-US' ? voice : pickVoice(u.lang);
      if (selectedVoice) u.voice = selectedVoice;
      u.rate = job.opts.rate ?? DEFAULT_RATE;
      u.pitch = job.opts.pitch ?? 1.05;
      const clean = () => {
        clearTimeout(startTimer); clearTimeout(endTimer);
        timers.delete(startTimer); timers.delete(endTimer);
        u.onstart = u.onend = u.onerror = null;
      };
      const settle = () => {
        if (settled || !valid()) return;
        settled = true; clean();
        later(next, job.index < job.lines.length ? job.gap : 0);
      };
      const retry = (engineError = false) => {
        if (settled || !valid()) return;
        settled = true; clean();
        try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) {}
        if (attempt === 0 && (!started || (engineError && !job.opts.once))) later(() => playLine(text, 1), 150);
        else later(next, job.gap);
      };
      u.onstart = () => {
        if (!valid() || settled || started) return;
        started = true;
        if (job.opts.onStart) job.opts.onStart(text);
        clearTimeout(startTimer); timers.delete(startTimer);
        // This deadline begins at actual audio start, never at queue submission.
        endTimer = later(() => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) settle();
          else endTimer = later(retry, 20000); // bounded recovery for a truly stuck engine
        }, Math.max(12000, text.length * 400 / u.rate));
      };
      u.onend = settle;
      // Longer instructions can recover from interruptions. A word card uses one reading.
      u.onerror = () => retry(true);
      startTimer = later(() => {
        // Some engines omit onstart but do speak. Give those utterances time to finish.
        if (speechSynthesis.speaking) u.onstart();
        else retry();
      }, 8000);
      try {
        if (speechSynthesis.paused) speechSynthesis.resume();
        speechSynthesis.speak(u);
      } catch (e) { retry(); }
    };
    next();
  }

  // ---- WebAudio 合成音效 ----
  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  // 白噪声爆破（气球/泡泡/蛋壳音效共用底料）
  function noiseBurst(dur, cutoff, vol, delay = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t0);
  }

  const SFX = {
    tap:     () => tone(660, 0, 0.08, 'sine', 0.10),
    correct: () => { tone(523.25, 0, 0.12, 'triangle', 0.20); tone(659.25, 0.10, 0.12, 'triangle', 0.20); tone(783.99, 0.20, 0.24, 'triangle', 0.20); },
    wrong:   () => { tone(330, 0, 0.15, 'sine', 0.08); tone(262, 0.16, 0.20, 'sine', 0.08); }, // 轻柔的"哎哟"，不吓人
    star:    () => { tone(1174.7, 0, 0.10, 'sine', 0.14); tone(1567.9, 0.08, 0.16, 'sine', 0.12); },
    win:     () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.13, i === 3 ? 0.5 : 0.13, 'triangle', 0.20)); },
    pop:     () => { noiseBurst(0.09, 1400, 0.5); tone(500, 0, 0.10, 'sine', 0.16); tone(220, 0.03, 0.12, 'triangle', 0.14); },
    bubble:  () => { noiseBurst(0.06, 2600, 0.35); tone(392, 0, 0.06, 'sine', 0.14); tone(660, 0.05, 0.09, 'sine', 0.14); }, // 水润的"啵"
    crack:   () => { noiseBurst(0.035, 3200, 0.5); noiseBurst(0.045, 2800, 0.45, 0.09); tone(1046, 0.02, 0.04, 'square', 0.05); }, // 咔、咔两声脆响
    munch:   () => { [0, 0.12, 0.24, 0.36].forEach((s, i) => { noiseBurst(0.05, 650, 0.28, s); tone(130 + i * 12, s, 0.05, 'triangle', 0.12); }); }, // 吧唧吧唧
    drink:   () => { [520, 430, 360, 300].forEach((f, i) => blip(f, f * 0.8, i * 0.11, 0.09, 'sine', 0.14, 900)); },               // 咕嘟咕嘟
    milk:    () => { [0.15, 0.6, 1.05, 1.5].forEach(t => { noiseBurst(.095, 2100, .15, t); blip(550, 280, t, .15, 'sine', .09); }); },
    shear:   () => { [.2, .54, .88, 1.22, 1.56].forEach(t => { noiseBurst(.045, 3600, .13, t); tone(760, t, .06, 'triangle', .04); }); },
  };

  function sfx(name) {
    resumeAudio();
    if (SFX[name]) SFX[name]();
  }

  function blip(freqStart, freqEnd, start, dur, type = 'sine', vol = 0.18, lp = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqStart, t0);
    if (freqEnd && freqEnd !== freqStart) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  const ANIMAL_CALLS = {
    chick: ['chick', 'hen'],
    cat: ['kitten', 'cat'],
    dog: ['puppy', 'dog'],
    bee: ['bee', 'bee'],
    fish: ['fish', 'fish'],
    cow: ['calf', 'cow'],
    sheep: ['lamb', 'sheep'],
  };

  async function playBackupAnimalClip(clip, playback, started) {
    const encoded = typeof FARM_CALL_RECORDINGS === 'undefined' ? null : FARM_CALL_RECORDINGS[clip];
    if (!encoded || !ctx) throw new Error('Animal recording unavailable');
    let buffer = animalClipBuffers.get(clip);
    if (!buffer) {
      const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
      buffer = await new Promise((resolve, reject) => ctx.decodeAudioData(bytes.buffer, resolve, reject));
      animalClipBuffers.set(clip, buffer);
    }
    if (animalPlayback !== playback || muted || document.hidden) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      source.disconnect();
      if (animalPlayback === playback) animalPlayback = null;
    };
    source.start();
    playback.source = source;
    started();
  }

  function animalVoice(type, action = 'touch', { adult = type === 'hen', onStart } = {}) {
    stopAnimals();
    const species = type === 'hen' ? 'chick' : type;
    if (muted || !Object.prototype.hasOwnProperty.call(ANIMAL_CALLS, species) || document.hidden) return;
    let call = ANIMAL_CALLS[species][adult ? 1 : 0];
    if (species === 'cat' && action === 'pet') call = 'purr';
    const age = adult ? 'adult' : 'young';
    const care = action === 'food' || action === 'water';
    const clip = care ? species + '-' + age + '-' + action : call;
    const backup = care && (species === 'cow' || species === 'sheep') ? clip : call;

    // The gesture unlocks both media playback and the Web Audio backup.
    init();
    const playback = animalPlayback = { audio: null, source: null, startTimer: null, usingBackup: false };
    let started = false;
    const notifyStart = () => {
      if (animalPlayback !== playback || started) return;
      started = true;
      onStart?.();
    };
    const finish = () => { if (animalPlayback === playback) stopAnimals(); };
    const fallback = () => {
      if (animalPlayback !== playback || playback.usingBackup) return;
      playback.usingBackup = true;
      releaseAnimalMedia(playback);
      playBackupAnimalClip(backup, playback, notifyStart).catch(finish);
    };
    try {
      const audio = playback.audio = new Audio('sounds/farm-v1/' + clip + '.mp3');
      audio.setAttribute('playsinline', '');
      audio.onplaying = () => { clearTimeout(playback.startTimer); notifyStart(); };
      audio.onended = finish;
      audio.onerror = fallback;
      playback.startTimer = setTimeout(fallback, 1200);
      audio.play()?.catch(fallback);
    } catch (e) { fallback(); }
  }

  // 启动时探测 sounds/manifest.json（file:// 下 fetch 受限时自动跳过，不影响使用）
  async function probeSounds() {
    try {
      const r = await fetch('sounds/manifest.json');
      if (r.ok) soundManifest = await r.json();
    } catch (e) { /* 无录音文件时全部回退到 TTS */ }
  }

  // 字母介绍："A!" → "A is for Apple!"（有真人录音则优先）
  function letterIntro(it) {
    stop();
    const file = soundManifest && soundManifest[it.L];
    if (file && !muted) {
      const token = generation;
      try {
        const audio = new Audio('sounds/' + file);
        recording = audio;
        let loadTimer;
        const clearLoad = () => { clearTimeout(loadTimer); timers.delete(loadTimer); };
        const fallback = () => {
          if (token !== generation || recording !== audio) return;
          clearLoad();
          audio.onended = audio.onerror = audio.onplaying = null;
          audio.pause(); recording = null;
          ttsIntro(it);
        };
        audio.onended = () => { clearLoad(); if (recording === audio) recording = null; };
        audio.onplaying = clearLoad;
        audio.onerror = fallback;
        loadTimer = later(fallback, 8000);
        audio.play().catch(fallback);
        return;
      } catch (e) {}
    }
    ttsIntro(it);
  }
  function ttsIntro(it) { speakSeq([it.L + '!', it.L + ' is for ' + it.word + '!']); }

  function setMuted(m) {
    muted = !!m;
    if (muted) {
      // Let an active exercise finish its visual narration flow in silent mode.
      const callbacks = [current, ...queue].filter(Boolean).map(job => job.onDone).filter(Boolean);
      stop();
      callbacks.forEach(fn => later(fn, 0));
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const singleReading = current?.opts.once ? current : null;
      const jobs = [current, ...queue].filter(job => job && job !== singleReading).map(job => ({
        ...job, lines: job.lines.slice(Math.max(0, job.index - (job === current ? 1 : 0))), index: 0,
      }));
      stop(); suspendedJobs = jobs;
      singleReading?.onDone?.();
    } else {
      resumeAudio();
      queue.push(...suspendedJobs); suspendedJobs = [];
      pump();
    }
  });
  window.addEventListener('pagehide', stop);

  return { init, speak, guide, speakSeq, stop, stopAnimals, sfx, voice: animalVoice, setMuted, letterIntro, probeSounds,
           get activeAnimalSounds() { return animalPlayback ? 1 : 0; },
           get muted() { return muted; } };
})();
