const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function harness({ tts = true } = {}) {
  let now = 0, nextId = 0;
  const timers = new Map(), spoken = [], audios = [], events = {}, windowEvents = {};
  const synth = { speaking: false, pending: false, paused: false,
    getVoices: () => [{ name: 'English', lang: 'en-US' }], addEventListener() {}, resume() {},
    speak(u) { spoken.push(u); this.pending = true; },
    cancel() { this.speaking = this.pending = false; },
  };
  class Audio {
    constructor(src) { this.src = src; this.paused = false; audios.push(this); }
    play() { return new Promise((resolve, reject) => { this.reject = reject; }); }
    pause() { this.paused = true; }
    setAttribute() {}
  }
  const context = vm.createContext({
    window: { ...(tts ? { speechSynthesis: synth } : {}), addEventListener: (name, fn) => windowEvents[name] = fn },
    document: { hidden: false, addEventListener: (name, fn) => events[name] = fn },
    speechSynthesis: synth, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, Audio,
    fetch: async () => ({ ok: true, json: async () => ({ A: 'a.mp3', B: 'b.mp3' }) }),
    setTimeout: (fn, delay = 0) => { const id = ++nextId; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  vm.runInContext(fs.readFileSync('js/audio.js', 'utf8') + '\nglobalThis.Sound = Sound;', context);
  function advance(ms) {
    const end = now + ms; let limit = 2000;
    for (;;) {
      const entry = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      assert.ok(limit-- > 0, 'timer loop');
      now = entry[1].at; timers.delete(entry[0]); entry[1].fn();
    }
    now = end;
  }
  function start(u = spoken.at(-1)) { synth.pending = false; synth.speaking = true; u.onstart?.(); }
  function end(u = spoken.at(-1)) { synth.speaking = false; synth.pending = false; u.onend?.(); advance(0); }
  return { sound: context.Sound, spoken, audios, advance, start, end, synth, events, context, timers };
}

test('cold start and a slowly spoken sentence do not advance or cancel early', () => {
  const h = harness(); h.sound.speakSeq(['A!', 'Apple!']);
  h.advance(4500); assert.equal(h.spoken.length, 1);
  h.start(); h.advance(9000); assert.equal(h.spoken.length, 1);
  h.end(); h.advance(200); assert.equal(h.spoken[1].text, 'Apple!');
});
test('character animation starts on actual speech start and never after cancellation', () => {
  const h = harness(), starts = [];
  h.sound.speak('B', { onStart: line => starts.push(line) });
  h.advance(3000); assert.deepEqual(starts, []);
  const event = h.spoken[0].onstart; h.start(); event();
  assert.deepEqual(starts, ['B']);
  h.sound.stop(); event(); assert.deepEqual(starts, ['B']);
});
test('completion happens exactly once; normal sentences do not require cancel', () => {
  const h = harness(); let done = 0;
  h.sound.speakSeq(['A', 'B'], 200, {}, () => done++);
  h.start(); const late = h.spoken[0].onend; h.end(); late(); h.advance(200);
  h.start(); h.end(); h.advance(60000);
  assert.equal(done, 1); assert.deepEqual(h.spoken.map(u => u.text), ['A', 'B']);
});
test('replay invalidates old callbacks, timers and sequence completion', () => {
  const h = harness(); let done = 0;
  h.sound.speakSeq(['old', 'stale'], 200, {}, () => done++);
  const late = h.spoken[0].onend;
  h.sound.speak('new'); late(); h.start(); h.end(); h.advance(60000);
  assert.equal(done, 0); assert.deepEqual(h.spoken.map(u => u.text), ['old', 'new']);
});
test('now:false appends after the complete active sequence', () => {
  const h = harness(); h.sound.speakSeq(['A', 'B']); h.sound.speak('C', { now: false });
  h.start(); h.end(); h.advance(200); h.start(); h.end(); h.start(); h.end();
  assert.deepEqual(h.spoken.map(u => u.text), ['A', 'B', 'C']);
});
test('Mandarin instructions and English spelling keep separate voices and share the ordered queue', () => {
  const h = harness();
  h.synth.getVoices = () => [{ name: 'Samantha', lang: 'en-US', localService: true }, { name: 'Chinese', lang: 'zh-CN', localService: true }];
  h.sound.guide('听一听，再拼一拼。'); h.sound.speak('bee', { now: false });
  assert.equal(h.spoken[0].lang, 'zh-CN'); assert.equal(h.spoken[0].voice.lang, 'zh-CN');
  h.start(); h.end();
  assert.equal(h.spoken[1].lang, 'en-US'); assert.equal(h.spoken[1].voice.lang, 'en-US');
  h.start(); h.end();
  h.sound.guide('再试一次。'); const stale = h.spoken[2].onend;
  h.sound.stop(); stale(); h.advance(60000); assert.equal(h.spoken.length, 3);
});
test('rapid spelling preserves every repeated letter and completes after the whole word', () => {
  const h = harness(); let done = 0;
  h.sound.speak('egg');
  for (const ch of 'EGG') h.sound.speak(ch, { now: false });
  h.sound.speak('egg', { now: false, onDone: () => done++ });
  for (let i = 0; i < 5; i++) { h.start(); h.end(); }
  assert.deepEqual(h.spoken.map(u => u.text), ['egg', 'E', 'G', 'G', 'egg']); assert.equal(done, 1);
});
test('repeated care feedback is coalesced without interrupting active speech', () => {
  const h = harness(); h.sound.speak('Hello');
  for (let i = 0; i < 10; i++) h.sound.speak('Thank you!', { now: false, dedupe: true });
  h.start(); h.end(); h.start(); h.end(); assert.equal(h.spoken.length, 2);
});
test('unexpected mid-sentence interruption retries the full line instead of skipping it', () => {
  const h = harness(); h.sound.speakSeq(['Find the letter', 'B']); h.start();
  h.spoken[0].onerror({ error: 'interrupted' }); h.advance(150);
  assert.deepEqual(h.spoken.map(u => u.text), ['Find the letter', 'Find the letter']);
  h.start(); h.end(); h.advance(200); assert.equal(h.spoken.at(-1).text, 'B');
});
test('one-reading prompts finish without another reading after interruption or backgrounding', () => {
  const h = harness(); let done = 0;
  h.sound.speak('bee', { once: true, onDone: () => done++ }); h.start();
  h.spoken[0].onerror({ error: 'interrupted' }); h.advance(500);
  assert.equal(done, 1);
  h.sound.speak('water', { once: true, onDone: () => done++ }); h.start();
  h.context.document.hidden = true; h.events.visibilitychange();
  h.context.document.hidden = false; h.events.visibilitychange(); h.advance(500);
  assert.equal(done, 2);
  assert.deepEqual(h.spoken.map(u => u.text), ['bee', 'water']);
});
test('start timeout retries once and then allows the game to continue', () => {
  const h = harness(); let done = 0;
  h.sound.speak('test', { onDone: () => done++ }); h.advance(17000);
  assert.equal(h.spoken.length, 2); assert.equal(done, 1);
});
test('stop during recovery cannot resurrect an utterance', () => {
  const h = harness(); h.sound.speak('test'); h.advance(8050); h.sound.stop(); h.advance(60000);
  assert.equal(h.spoken.length, 1); assert.equal(h.timers.size, 0);
});
test('mute finishes visual narration without speaking; navigation cancels even that callback', () => {
  const h = harness(); let done = 0;
  h.sound.speak('test', { onDone: () => done++ }); h.sound.setMuted(true); h.advance(0);
  assert.equal(done, 1);
  h.sound.speak('silent', { onDone: () => done++ }); h.sound.stop(); h.advance(0);
  assert.equal(done, 1); assert.equal(h.spoken.length, 1);
});
test('a device without TTS still completes exercise callbacks', () => {
  const h = harness({ tts: false }); let done = 0;
  h.sound.speakSeq(['hello'], 200, {}, () => done++); h.advance(0); assert.equal(done, 1);
});
test('recordings stop on mute/replay and stale play rejection cannot start TTS', async () => {
  const h = harness(); await h.sound.probeSounds();
  h.sound.letterIntro({ L: 'A', word: 'Apple' });
  h.sound.letterIntro({ L: 'B', word: 'Bear' });
  assert.equal(h.audios[0].paused, true);
  h.audios[0].reject(new Error('late failure')); await Promise.resolve();
  assert.equal(h.spoken.length, 0);
  h.sound.setMuted(true); assert.equal(h.audios[1].paused, true);
});
test('a recording that never starts falls back once to speech', async () => {
  const h = harness(); await h.sound.probeSounds();
  h.sound.letterIntro({ L: 'A', word: 'Apple' }); h.advance(8000);
  assert.equal(h.audios[0].paused, true);
  assert.deepEqual(h.spoken.map(u => u.text), ['A!']);
  h.audios[0].reject(new Error('late')); await Promise.resolve();
  assert.equal(h.spoken.length, 1);
});
test('backgrounding suspends the sequence and foregrounding resumes; route stop discards it', () => {
  const h = harness(); h.sound.speakSeq(['A', 'B']); h.start();
  h.context.document.hidden = true; h.events.visibilitychange(); h.advance(60000);
  assert.equal(h.spoken.length, 1);
  h.context.document.hidden = false; h.events.visibilitychange();
  assert.equal(h.spoken.at(-1).text, 'A');
  h.context.document.hidden = true; h.events.visibilitychange(); h.sound.stop();
  h.context.document.hidden = false; h.events.visibilitychange(); assert.equal(h.spoken.length, 2);
});

test('farm reads do not persist or schedule cloud writes, mutations do', () => {
  let writes = 0, schedules = 0;
  const context = vm.createContext({ window: { addEventListener() {} }, localStorage: { getItem() { return null; }, setItem() { writes++; } },
    setTimeout() { schedules++; }, clearTimeout() {}, ABC: { letters: [] } });
  vm.runInContext(fs.readFileSync('js/storage.js', 'utf8') + '\nglobalThis.Store = Store;', context);
  context.Store.bind('test', { letters: {} }, true); writes = schedules = 0;
  for (let i = 0; i < 1000; i++) context.Store.farm();
  assert.equal(writes, 0); assert.equal(schedules, 0);
  context.Store.farm(f => f.coins++); assert.equal(writes, 1); assert.equal(schedules, 1);
});
test('animal recordings match the species, age and care action', () => {
  const h = harness();
  const calls = { chick: ['chick', 'hen'], cat: ['kitten', 'cat'], dog: ['puppy', 'dog'],
    bee: ['bee', 'bee'], fish: ['fish', 'fish'], cow: ['calf', 'cow'], sheep: ['lamb', 'sheep'] };
  const expectClip = clip => assert.equal(h.audios.at(-1).src, 'sounds/farm-v1/' + clip + '.mp3');
  for (const [type, clips] of Object.entries(calls)) for (const adult of [false, true]) {
    h.sound.voice(type, 'touch', { adult });
    expectClip(clips[Number(adult)]);
    h.sound.voice(type, 'pet', { adult });
    expectClip(type === 'cat' ? 'purr' : clips[Number(adult)]);
    for (const action of ['food', 'water']) {
      h.sound.voice(type, action, { adult });
      expectClip(type + '-' + (adult ? 'adult' : 'young') + '-' + action);
    }
  }
  h.sound.voice('hen'); expectClip('hen');
  assert.deepEqual(h.spoken, []);
});

test('animal recordings stop on replay, mute, background and navigation', async () => {
  const h = harness();
  h.sound.voice('cat', 'pet');
  const purr = h.audios.at(-1), staleEnd = purr.onended;
  h.sound.voice('dog');
  const bark = h.audios.at(-1);
  assert.equal(purr.paused, true);
  purr.reject(new Error('late cancellation')); await Promise.resolve(); staleEnd();
  assert.equal(bark.paused, false);
  bark.onended();
  assert.equal(h.sound.activeAnimalSounds, 0);

  h.sound.voice('bee'); h.sound.setMuted(true);
  assert.equal(h.audios.at(-1).paused, true);
  const count = h.audios.length;
  h.sound.voice('fish'); assert.equal(h.audios.length, count);
  h.sound.setMuted(false); h.sound.voice('fish');
  h.context.document.hidden = true; h.events.visibilitychange();
  assert.equal(h.audios.at(-1).paused, true);
  assert.equal(h.sound.activeAnimalSounds, 0);
  h.context.document.hidden = false; h.events.visibilitychange();
  h.sound.voice('chick'); h.sound.stop();
  assert.equal(h.audios.at(-1).paused, true);
  assert.equal(h.sound.activeAnimalSounds, 0);
  assert.deepEqual(h.spoken, []);
});
