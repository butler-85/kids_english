/* Zoo admissions and activities share the current child's farm wallet. */
const Zoo = (() => {
  const ANIMALS = {
    elephant: { name: '大象', english: 'Elephant', food: '干草', feedIcon: '🌾', performance: '大象喷泉', acts: ['长鼻吸水', '喷出弧形水柱', '彩虹水幕'], prices: { admit: 360, feed: 12, show: 24 } },
    giraffe: { name: '长颈鹿', english: 'Giraffe', food: '树叶', feedIcon: '🍃', performance: '草原巡游', acts: ['探头张望', '轻步走过草地', '低头谢幕'], prices: { admit: 520, feed: 16, show: 32 } },
    monkey: { name: '猴子', english: 'Monkey', food: '香蕉', feedIcon: '🍌', performance: '林间荡秋千', acts: ['攀上树枝', '抓住藤蔓摆荡', '坐回树枝挥手'], prices: { admit: 360, feed: 20, show: 40 } },
    panda: { name: '熊猫', english: 'Panda', food: '竹叶', feedIcon: '🎋', performance: '竹林翻滚', acts: ['抱起竹枝', '圆滚滚地翻身', '坐稳挥爪'], prices: { admit: 840, feed: 22, show: 46 } },
    penguin: { name: '企鹅', english: 'Penguin', food: '小鱼', feedIcon: '🐟', performance: '冰坡滑行', acts: ['摇摇摆摆上场', '趴下滑过冰坡', '跳起展开翅膀'], prices: { admit: 480, feed: 24, show: 52 } },
    parrot: { name: '鹦鹉', english: 'Parrot', food: '果仁', feedIcon: '🌰', performance: '彩环飞行', acts: ['站在枝头展翅', '飞过彩色圆环', '落回枝头'], prices: { admit: 540, feed: 26, show: 58 } },
    kangaroo: { name: '袋鼠', english: 'Kangaroo', food: '嫩草', feedIcon: '🌿', performance: '草地三连跳', acts: ['蹲低准备', '越过三丛草', '站稳摆尾'], prices: { admit: 1200, feed: 28, show: 64 } },
    snake: { name: '蛇', english: 'Snake', food: '鸟蛋', feedIcon: '🥚', performance: '岩石探险', acts: ['从草丛里探头', '蜿蜒滑过岩石', '盘起身子吐信'], prices: { admit: 680, feed: 32, show: 72 } },
    lion: { name: '狮子', english: 'Lion', performance: '狮王登台', acts: ['踏上岩台', '伏身伸懒腰', '抬头抖动鬃毛'], prices: { admit: 1520, feed: 36, show: 80 } },
  };
  const LION_PREY = [
    { id: 'rabbit', name: '兔子', icon: '🐇' },
    { id: 'chicken', name: '小鸡', icon: '🐤' },
  ];
  const PHASES = [{ id: 'intro', at: 0 }, { id: 'middle', at: 8 }, { id: 'finale', at: 20 }];
  const FEED_DURATION = 4000;
  const HUNT_DURATION = 5500;
  const SHOW_DURATION = 30;
  const animalIds = Object.keys(ANIMALS);
  const coins = amount => `<span class="zoo-coins"><span class="coin-icon" aria-hidden="true">●</span> ${amount}<small>金币</small></span>`;
  const owns = (farm, id) => farm.zoo?.[id] === true;
  const root = () => document.getElementById('zoo-body');
  let selected, confirming, activity, message, show;
  let preyIndex = 0;
  const currentPrey = () => selected === 'lion' ? LION_PREY[preyIndex] : null;
  const feedDuration = prey => prey ? HUNT_DURATION : FEED_DURATION;

  function enter() {
    const farm = Store.farm();
    selected = animalIds.find(id => owns(farm, id)) || animalIds[0];
    confirming = false;
    activity = '';
    message = '';
    const page = root();
    page.innerHTML = `<header class="zoo-header"><h1>动物园</h1><div id="zoo-wallet" aria-live="polite"></div></header>
      <div class="zoo-layout">
        <div id="zoo-animals" class="zoo-animals" role="group" aria-label="选择动物"></div>
        <div class="zoo-exhibit">
          <section id="zoo-resident" class="zoo-resident" aria-labelledby="zoo-resident-name"></section>
          <p id="zoo-feedback" class="zoo-feedback" role="status"></p>
        </div>
      </div>
      <button class="zoo-farm-link" data-zoo-action="farm"><span aria-hidden="true">← 🏡</span> 回农场</button>`;
    page.onclick = onClick;
    page.onkeydown = event => {
      if (['Enter', ' '].includes(event.key) && event.target.closest('[data-zoo-action="pet"]')) {
        event.preventDefault(); greet();
      }
    };
    page.onpointermove = lookAround;
    page.onpointerleave = resetLook;
    page.onpointerdown = event => {
      if (event.target.closest('[data-zoo-action="pet"]')) root().querySelector('.zoo-stage').dataset.held = 'true';
    };
    page.onpointerup = page.onpointercancel = releaseHold;
    document.addEventListener('visibilitychange', visibilityChanged);
    render();
  }
  function leave() {
    stopShow();
    activity = '';
    confirming = false;
    root().onclick = null;
    root().onkeydown = root().onpointermove = root().onpointerleave = null;
    root().onpointerdown = root().onpointerup = root().onpointercancel = null;
    document.removeEventListener('visibilitychange', visibilityChanged);
  }

  function actionButton(action, icon, label, cost, balance, detail = '') {
    const short = cost - balance;
    return `<button class="zoo-paid" data-zoo-action="${action}" ${short > 0 || activity ? 'disabled' : ''}>
      <span aria-hidden="true" class="zoo-action-icon">${icon}</span><span>${label}</span>
      ${coins(cost)}${short > 0 ? '<small>还差 ' + short + ' 金币</small>' : detail ? '<small>' + detail + '</small>' : ''}
    </button>`;
  }
  function controls(animal, resident, balance, prey) {
    if (resident) {
      const feedLabel = prey ? '看狮子追' + prey.name : '喂' + animal.food;
      return actionButton('feed', prey?.icon || animal.feedIcon, feedLabel, animal.prices.feed, balance) +
        actionButton('show', '🎟️', '看表演', animal.prices.show, balance, animal.performance + ' · ' + SHOW_DURATION + ' 秒');
    }
    if (confirming) {
      return `<button class="zoo-cancel" data-zoo-action="cancel">取消</button>
        ${actionButton('confirm', '🏡', '确认引入', animal.prices.admit, balance)}`;
    }
    return actionButton('admit', '🏡', '引入' + animal.name, animal.prices.admit, balance);
  }
  function render(settle = false) {
    const page = root(), farm = Store.farm(), animal = ANIMALS[selected], resident = owns(farm, selected);
    const previous = page.querySelector('.zoo-roam');
    const previousPose = settle && previous ? getComputedStyle(previous).transform : 'none';
    const prey = currentPrey();
    const feeding = activity === 'feed';
    page.querySelector('#zoo-wallet').innerHTML = coins(farm.coins);
    page.querySelector('#zoo-animals').innerHTML = animalIds.map(id => {
      const item = ANIMALS[id];
      const admitted = owns(farm, id);
      return `<button data-zoo-animal="${id}" aria-pressed="${id === selected}" ${activity ? 'disabled' : ''}
        aria-label="${item.name}，${admitted ? '已入住' : '待引入'}">${ZooArt.thumbnail(id)}<b>${item.name}</b>
        <small>${admitted ? '已入住' : coins(item.prices.admit)}</small></button>`;
    }).join('');
    page.querySelector('#zoo-resident').innerHTML = `<div class="zoo-resident-header">
      <h2 id="zoo-resident-name">${animal.name} <span lang="en">${animal.english}</span></h2>
      <button class="zoo-listen" data-zoo-action="listen" aria-label="听${animal.name}的英文名称">🔊</button>
    </div>
    <div class="zoo-stage" data-animal="${selected}" data-unlocked="${resident}" data-activity="${activity}" ${feeding ? `style="--zoo-feed-time: ${feedDuration(prey)}ms"` : ''}>
      ${ZooArt.scene(selected, feeding ? prey?.id : undefined, { unlocked: resident, interactive: resident && !activity, label: animal.name })}
      ${resident && !activity ? '<span class="zoo-touch-cue" aria-hidden="true">👆</span>' : ''}
    </div>
    ${activity === 'show' ? `<div class="zoo-timeline">
      <div class="zoo-timeline-label"><b id="zoo-show-act" role="status"></b><span id="zoo-show-time" aria-hidden="true">0 / ${SHOW_DURATION} 秒</span></div>
      <progress id="zoo-show-progress" aria-label="表演进度（秒）" max="${SHOW_DURATION}" value="0"></progress>
      <div class="zoo-show-acts" aria-hidden="true">${animal.acts.map((act, i) => `<span data-act="${i}">${act}</span>`).join('')}</div>
    </div>` : ''}
    <div class="zoo-actions">${controls(animal, resident, farm.coins, prey)}</div>`;
    page.querySelector('#zoo-feedback').textContent = message;
    visibilityChanged();
    if (previousPose !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      page.querySelector('.zoo-roam').animate([{ transform: previousPose }, { transform: 'none' }], { duration: 600, easing: 'ease-out' });
    }
  }
  function visibilityChanged() {
    root()?.querySelector('.zoo-stage')?.classList.toggle('zoo-paused', document.hidden);
  }
  function releaseHold() {
    const stage = root().querySelector('.zoo-stage');
    if (stage) delete stage.dataset.held;
  }
  function resetLook() {
    const stage = root().querySelector('.zoo-stage');
    stage?.style.setProperty('--look-x', '0px'); stage?.style.setProperty('--look-y', '0px');
    releaseHold();
  }
  function lookAround(event) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stage = event.target.closest('.zoo-stage');
    if (!stage || stage.dataset.unlocked !== 'true') { resetLook(); return; }
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--look-x', ((event.clientX - bounds.left) / bounds.width * 2 - 1) * 5 + 'px');
    stage.style.setProperty('--look-y', ((event.clientY - bounds.top) / bounds.height * 2 - 1) * 3 + 'px');
  }
  function greet() {
    const stage = root().querySelector('.zoo-stage');
    if (!stage || activity || !owns(Store.farm(), selected) || stage.dataset.petting) return;
    stage.dataset.petting = 'true';
    Sound.sfx('tap');
    App.after(() => { if (stage.isConnected) delete stage.dataset.petting; }, 2200);
  }
  function focusAction(action) {
    root().querySelector(`[data-zoo-action="${action}"]:not(:disabled)`)?.focus({ preventScroll: true });
  }
  function charge(farm, id, action) {
    const price = ANIMALS[id].prices[action];
    const resident = owns(farm, id);
    if (!price || farm.coins < price || (action === 'admit' ? resident : !resident)) return false;
    farm.coins -= price;
    if (action === 'admit') (farm.zoo ||= {})[id] = true;
    return true;
  }
  function pay(action) {
    let accepted;
    Store.farm(farm => { accepted = charge(farm, selected, action); });
    if (!accepted) return;
    const animal = ANIMALS[selected];
    confirming = false;
    if (action === 'admit') {
      message = animal.name + '入住啦！';
      render();
      focusAction('feed');
      Sound.speak(animal.english);
      return;
    }
    activity = action;
    const prey = currentPrey();
    message = action === 'feed' ? (prey ? '狮子在追' + prey.name : animal.name + '在吃' + animal.food) : '';
    render(true);
    Sound.stop();
    if (action === 'show') startShow(animal);
    else App.after(() => {
      if (prey) preyIndex = (preyIndex + 1) % LION_PREY.length;
      finishActivity(action, prey ? '狮子抓住' + prey.name + '啦！' : animal.name + '吃完啦！');
    }, feedDuration(prey));
  }
  function finishActivity(action, text) {
    const button = root().querySelector(`[data-zoo-action="${action}"]`);
    const restoreFocus = document.activeElement === document.body || document.activeElement === button;
    activity = '';
    message = text;
    render();
    if (restoreFocus) focusAction(action);
  }
  function stopShow() {
    if (!show) return;
    clearInterval(show.timer);
    document.removeEventListener('visibilitychange', updateShow);
    show = null;
  }
  function startShow(animal) {
    const page = root();
    show = {
      animal, elapsed: 0, lastTick: performance.now(), active: !document.hidden, phase: -1,
      stage: page.querySelector('.zoo-stage'), progress: page.querySelector('#zoo-show-progress'),
      timeLabel: page.querySelector('#zoo-show-time'), actLabel: page.querySelector('#zoo-show-act'),
      labels: [...page.querySelectorAll('[data-act]')],
      timer: setInterval(updateShow, 125),
    };
    document.addEventListener('visibilitychange', updateShow);
    updateShow();
  }
  function updateShow() {
    if (!show) return;
    const now = performance.now();
    if (show.active) show.elapsed += now - show.lastTick;
    show.lastTick = now;
    show.active = !document.hidden;
    show.stage.classList.toggle('zoo-paused', !show.active);
    const seconds = show.elapsed / 1000;
    if (seconds >= SHOW_DURATION) {
      stopShow();
      finishActivity('show', '表演结束');
      return;
    }
    show.progress.value = seconds;
    show.timeLabel.textContent = Math.floor(seconds) + ' / ' + SHOW_DURATION + ' 秒';
    let phase = show.phase;
    while (phase + 1 < PHASES.length && seconds >= PHASES[phase + 1].at) phase++;
    if (phase === show.phase) return;
    show.phase = phase;
    show.stage.dataset.phase = PHASES[phase].id;
    show.actLabel.textContent = show.animal.acts[phase];
    show.labels.forEach((label, index) => label.classList.toggle('current', phase === index));
  }
  function onClick(event) {
    const button = event.target.closest('button, [data-zoo-action="pet"]');
    if (!button || button.disabled) return;
    const id = button.dataset.zooAnimal, action = button.dataset.zooAction;
    if (action === 'farm') { App.show('farm'); return; }
    if (action === 'listen') { Sound.speak(ANIMALS[selected].english); return; }
    if (activity) return;
    if (action === 'pet') { greet(); return; }
    if (id) {
      selected = id; confirming = false; message = '';
      render();
      root().querySelector(`[data-zoo-animal="${id}"]`).focus({ preventScroll: true });
    } else if (action === 'admit' || action === 'cancel') {
      confirming = action === 'admit';
      message = confirming ? '把' + ANIMALS[selected].name + '带回动物园？' : '';
      render();
      focusAction(confirming ? 'cancel' : 'admit');
    } else if (action === 'confirm' && confirming) pay('admit');
    else if (action === 'feed' || action === 'show') pay(action);
  }
  return { enter, leave };
})();
