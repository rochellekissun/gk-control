(() => {
  'use strict';
  const DATA_KEY = 'saintsPitch.workspace.v2';
  const CONFIG_KEY = 'saintsPitch.cloudConfig.v1';
  const SESSION_KEY = 'saintsPitch.cloudSession.v1';
  const emptyData = () => ({ profile: {}, logs: [], recovery: [], plans: [], goals: [] });
  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);
  const navItems = [
    ['dashboard', '⌂', 'Dashboard'], ['plan', '▦', 'Weekly plan'], ['training', '◈', 'Training'],
    ['positions', '◎', 'Position finder'], ['nutrition', '◌', 'Meal ideas'], ['recovery', '＋', 'Recovery'],
    ['progress', '▤', 'Progress log'], ['goals', '◇', 'Goals'], ['profile', '○', 'Profile'], ['account', '↗', 'Account']
  ];
  let data = readData();
  let cloudConfig = readJson(CONFIG_KEY, null);
  let session = readJson(SESSION_KEY, null);
  let generatedTraining = null;
  let generatedMeal = null;

  function readJson(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  }
  function readData() {
    const current = readJson(DATA_KEY, null);
    if (current) return { ...emptyData(), ...current };
    const old = readJson('saintsPitch.local.v1', null);
    if (!old) return emptyData();
    return { ...emptyData(), ...old };
  }
  function saveLocal() {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    $('#saveStatus').textContent = session?.user ? 'Saved on this device · cloud copy available' : 'Saved on this device';
  }
  function showMessage(text, kind = '') {
    const box = $('#message'); box.textContent = text; box.className = `message ${kind}`; box.hidden = false;
    window.clearTimeout(showMessage.timer); showMessage.timer = window.setTimeout(() => { box.hidden = true; }, 6500);
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function dayName(value) { return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(`${value}T12:00:00`)); }

  function makeNav(container) {
    container.innerHTML = navItems.map(([id, icon, label]) => `<button class="nav-link${id === 'dashboard' ? ' active' : ''}" data-page="${id}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('');
  }
  makeNav($('#sideNav')); makeNav($('#mobileNav'));
  const pages = [...document.querySelectorAll('.page')];
  function go(id) {
    pages.forEach((page) => page.classList.toggle('active', page.id === id));
    document.querySelectorAll('[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === id));
    $('#pageTitle').textContent = navItems.find((item) => item[0] === id)?.[2] || 'Dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'progress') renderLogs();
    if (id === 'recovery') renderRecovery();
    if (id === 'goals') renderGoals();
    if (id === 'plan') renderPlan();
    if (id === 'dashboard') renderDashboard();
    if (id === 'account') renderAccount();
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (button) go(button.dataset.page);
  });
  $('#today').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  $('#logDate').value = localDate();
  $('#planDay').value = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date());

  const toolCards = [
    ['plan', '▦', 'Weekly plan', 'Map out training, matches and recovery.'],
    ['training', '◈', 'Training generator', 'Shape a session around your role and focus.'],
    ['positions', '◎', 'Position finder', 'Explore roles that fit your preferences.'],
    ['nutrition', '◌', 'Meal ideas', 'Get flexible ideas shaped by your preferences.'],
    ['recovery', '＋', 'Recovery check-in', 'Reflect on energy, sleep and readiness.'],
    ['goals', '◇', 'Development goals', 'Keep your next step clear and measurable.']
  ];
  $('#quickTools').innerHTML = toolCards.map(([id, icon, title, copy]) => `<article class="card tool-card" data-page="${id}"><div class="tool-icon">${icon}</div><h3>${title}</h3><p>${copy}</p></article>`).join('');

  function renderDashboard() {
    const logs = data.logs || [];
    const weekStart = Date.now() - 7 * 864e5;
    $('#statSessions').textContent = logs.filter((item) => item.type === 'Training').length;
    $('#statWeek').textContent = logs.filter((item) => new Date(`${item.date}T23:59:59`).getTime() >= weekStart).length;
    $('#statPosition').textContent = data.profile.position || '—';
    $('#statGoals').textContent = (data.goals || []).filter((goal) => !goal.done).length;
    const upcoming = (data.plans || []).filter((item) => !item.done).slice(0, 4);
    $('#dashboardPlan').innerHTML = upcoming.length ? upcoming.map((item) => `<div class="plan-item"><span class="plan-day">${escapeHtml(item.day)}</span><div><strong>${escapeHtml(item.focus)}</strong><p>${escapeHtml(item.minutes)} min${item.notes ? ` · ${escapeHtml(item.notes)}` : ''}</p></div><span class="goal-state">Planned</span></div>`).join('') : '<div class="empty">Nothing planned yet. Add a session to get started.</div>';
  }
  function renderPlan() {
    const items = [...(data.plans || [])].sort((a, b) => weekdays.indexOf(a.day) - weekdays.indexOf(b.day));
    $('#planList').innerHTML = items.length ? items.map((item) => `<article class="plan-item"><span class="plan-day">${escapeHtml(item.day)}</span><div><strong>${escapeHtml(item.focus)}</strong><p>${escapeHtml(item.minutes)} min${item.notes ? ` · ${escapeHtml(item.notes)}` : ''}</p></div><div class="plan-actions actions"><button class="button small secondary" data-complete-plan="${item.id}" ${item.done ? 'disabled' : ''}>${item.done ? 'Logged' : 'Mark done'}</button><button class="button small secondary" data-remove-plan="${item.id}">Remove</button></div></article>`).join('') : '<div class="empty-state">No sessions planned yet. Add one above.</div>';
  }
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  $('#addPlan').onclick = () => {
    data.plans.unshift({ id: crypto.randomUUID(), day: $('#planDay').value, focus: $('#planFocus').value, minutes: Number($('#planMinutes').value) || 0, notes: $('#planNotes').value.trim(), done: false });
    $('#planNotes').value = ''; saveLocal(); renderPlan(); renderDashboard(); showMessage('Added to your week.', 'success');
  };
  $('#clearPlan').onclick = () => {
    if (!data.plans.length) return;
    if (confirm('Clear this week’s planned sessions? Completed entries in your progress log will stay.')) { data.plans = []; saveLocal(); renderPlan(); renderDashboard(); }
  };
  document.addEventListener('click', (event) => {
    const complete = event.target.closest('[data-complete-plan]');
    const remove = event.target.closest('[data-remove-plan]');
    if (complete) {
      const item = data.plans.find((plan) => plan.id === complete.dataset.completePlan);
      if (item && !item.done) { item.done = true; data.logs.unshift({ id: crypto.randomUUID(), type: 'Training', date: new Date().toISOString().slice(0, 10), duration: item.minutes, feeling: 'Steady', note: `${item.focus} · ${item.day} plan` }); saveLocal(); renderPlan(); renderDashboard(); }
    }
    if (remove) { data.plans = data.plans.filter((plan) => plan.id !== remove.dataset.removePlan); saveLocal(); renderPlan(); renderDashboard(); }
  });

  const positionMatches = {
    hands: { name: 'Goalkeeper', text: 'You enjoy organising play, reading danger and using your hands. Try exploring goalkeeping alongside other roles.' },
    defend: { name: 'Centre back · Full back', text: 'You may enjoy reading danger, protecting space and helping the team build from the back.' },
    pass: { name: 'Centre midfielder', text: 'You like connecting the team. Central midfield gives lots of chances to scan, receive and move play on.' },
    create: { name: 'Winger · Attacking midfielder', text: 'You enjoy creating chances and expressing yourself. Try roles where you can receive, combine and attack space.' },
    finish: { name: 'Striker · Second striker', text: 'You like arriving near goal and finishing moves. Explore how different forward roles find space.' }
  };
  $('#generatePosition').onclick = () => {
    const pick = positionMatches[$('#pref1').value];
    const extras = { calm: 'Calm decision-making can help in roles that organise play.', fast: 'Energy and quick movement can suit wide or pressing roles.', strong: 'Enjoying physical contests can be useful in defensive and forward roles.', creative: 'Inventive play can shine in wide and attacking positions.', aware: 'Reading play early can help in central and defensive roles.' };
    $('#positionResult').innerHTML = `<div class="result"><p class="eyebrow">ROLES TO TRY</p><h3>${escapeHtml(pick.name)}</h3><p>${escapeHtml(pick.text)} ${escapeHtml(extras[$('#pref2').value])}</p><p class="muted">Fit also depends on your team, coaching and what you enjoy. Try different roles in a safe, supported setting.</p></div>`;
  };

  const drillLibrary = {
    'Ball mastery': ['Easy warm-up with comfortable movement', 'Practise gentle touches using both feet', 'Add controlled turns or sole rolls at your own pace', 'Cooldown and note one thing that felt easier'],
    'Passing and first touch': ['Warm up with light touches', 'Practise receiving and returning against a safe target', 'Alternate feet and focus on a relaxed first touch', 'Finish with a short reflection'],
    'Speed and agility': ['Start with a gradual warm-up', 'Practise low-volume footwork at a comfortable pace', 'Use planned changes of direction with full rest', 'Cool down and record how it felt'],
    'Strength and movement': ['Use only exercises already cleared for you', 'Move slowly through a comfortable range', 'Focus on control and breathing', 'Stop if pain or unusual symptoms occur'],
    'Position-specific skills': ['Review clips or diagrams for your role', 'Choose one common game situation to study', 'Write down a scanning or communication cue', 'Reflect on one decision to practise with your coach'],
    'Match awareness': ['Watch a short match segment', 'Pause before key moments and predict what happens next', 'Track your position and the space around you', 'Write one question for your next team session'],
    'Recovery / light day': ['Choose rest or an easy walk if comfortable', 'Try relaxed breathing and gentle mobility only if it feels good', 'Drink water and eat regular meals', 'Prioritise sleep and check in tomorrow']
  };
  const positionDrills = {
    Goalkeeper: ['Set position and balance', 'Angles and starting positions', 'Communication and scanning'],
    'Centre back': ['Body shape when defending', 'Scanning before the ball arrives', 'Passing choices under pressure'],
    'Full back': ['Receiving near the sideline', 'Defensive recovery decisions', 'Supporting wide attacks'],
    'Centre midfielder': ['Scanning before receiving', 'Playing forward when space opens', 'Supporting the next pass'],
    'Attacking midfielder': ['Finding pockets of space', 'Receiving on the half-turn', 'Choosing when to combine or run'],
    Winger: ['Receiving wide and assessing options', 'Timing a run into space', 'Choosing a cross, pass or carry'],
    Striker: ['Finding space between defenders', 'Checking away then moving to receive', 'Recognising when to link or attack the box']
  };
  $('#generateTraining').onclick = () => {
    const position = $('#trainPosition').value, focus = $('#trainFocus').value, minutes = Number($('#trainMinutes').value), cleared = $('#trainingCleared').checked;
    let steps = [...(drillLibrary[focus] || drillLibrary['Ball mastery'])];
    if (focus === 'Position-specific skills') steps = [...(positionDrills[position] || drillLibrary[focus])];
    if (!cleared && !['Match awareness', 'Recovery / light day'].includes(focus)) steps = ['Review a short coaching resource about this focus', 'Sketch or write down three decisions you might make in a game', 'Finish with a reflection and a question for your coach'];
    const blocks = [Math.round(minutes * .18), Math.round(minutes * .27), Math.round(minutes * .35), Math.round(minutes * .2)];
    generatedTraining = { position, focus, minutes, steps, cleared };
    $('#trainingResult').innerHTML = `<div class="result"><span class="pill">${escapeHtml(position)}</span><span class="pill">${escapeHtml(focus)}</span><span class="pill">${minutes} min</span><h3>${cleared ? 'Your session outline' : 'Planning-only session'}</h3><ul>${steps.map((step, index) => `<li><strong>${blocks[index]} min</strong> — ${escapeHtml(step)}</li>`).join('')}</ul>${$('#trainNotes').value ? `<p><strong>Work around:</strong> ${escapeHtml($('#trainNotes').value)}</p>` : ''}<p class="muted">${cleared ? 'Follow your clinician’s limits. Stop if pain or unusual symptoms appear.' : 'No movement drills are included. Get clinician clearance before movement-based training.'}</p></div>`;
    $('#saveTraining').hidden = false;
  };
  $('#saveTraining').onclick = () => {
    if (!generatedTraining) return;
    data.logs.unshift({ id: crypto.randomUUID(), type: 'Training', date: new Date().toISOString().slice(0, 10), duration: generatedTraining.minutes, feeling: 'Planned', note: `${generatedTraining.position}: ${generatedTraining.focus} session planned` });
    saveLocal(); renderLogs(); renderDashboard(); showMessage('Session saved to your progress log.', 'success');
  };

  const meals = [
    { type: 'Breakfast', name: 'Oats with banana and cinnamon', tags: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree'], cost: 'low', ingredients: ['oats', 'banana', 'cinnamon', 'milk or fortified alternative'], allergens: ['oats', 'milk'], diets: ['vegan', 'vegetarian', 'dairyfree'], note: 'Choose certified gluten-free oats if needed.' },
    { type: 'Breakfast', name: 'Egg on toast with fruit', tags: ['vegetarian'], cost: 'low', ingredients: ['egg', 'bread', 'fruit'], allergens: ['egg', 'wheat'], diets: ['vegetarian'], note: 'Swap bread for an option that suits your needs.' },
    { type: 'Breakfast', name: 'Yoghurt with oats and seasonal fruit', tags: ['vegetarian', 'glutenfree'], cost: 'low', ingredients: ['yoghurt', 'oats', 'fruit'], allergens: ['milk', 'oats'], diets: ['vegetarian'], note: 'Use a suitable alternative if needed.' },
    { type: 'Lunch', name: 'Bean and rice bowl with vegetables', tags: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree', 'halal'], cost: 'low', ingredients: ['beans', 'rice', 'vegetables'], allergens: [], diets: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree', 'halal'], note: 'Use plain ingredients and check sauces.' },
    { type: 'Lunch', name: 'Tuna or chickpea sandwich with salad', tags: ['vegetarian'], cost: 'low', ingredients: ['tuna or chickpeas', 'bread', 'salad'], allergens: ['fish', 'wheat'], diets: ['vegetarian'], note: 'Choose chickpeas for a plant-based option.' },
    { type: 'Lunch', name: 'Lentil curry with rice', tags: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree', 'halal'], cost: 'low', ingredients: ['lentils', 'rice', 'vegetables', 'spices'], allergens: [], diets: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree', 'halal'], note: 'Check spice mixes and sauces.' },
    { type: 'Dinner', name: 'Lentil pasta with tomato sauce', tags: ['vegan', 'vegetarian', 'dairyfree'], cost: 'low', ingredients: ['lentils', 'pasta', 'tomato'], allergens: ['wheat'], diets: ['vegan', 'vegetarian', 'dairyfree'], note: 'Choose a suitable pasta if avoiding gluten.' },
    { type: 'Dinner', name: 'Chicken or tofu with rice and vegetables', tags: ['vegetarian', 'halal', 'glutenfree', 'dairyfree'], cost: 'any', ingredients: ['chicken or tofu', 'rice', 'vegetables'], allergens: ['soy'], diets: ['vegetarian', 'halal', 'glutenfree', 'dairyfree'], note: 'Check preparation and any marinades.' },
    { type: 'Dinner', name: 'Bean chilli with potatoes or rice', tags: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree', 'halal'], cost: 'low', ingredients: ['beans', 'tomato', 'potatoes or rice', 'spices'], allergens: [], diets: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree', 'halal'], note: 'Check seasoning and sauces.' },
    { type: 'Snack', name: 'Fruit with yoghurt', tags: ['vegetarian', 'glutenfree'], cost: 'low', ingredients: ['fruit', 'yoghurt'], allergens: ['milk'], diets: ['vegetarian'], note: 'Choose a suitable alternative if needed.' },
    { type: 'Snack', name: 'Toast with a spread you tolerate', tags: ['vegan', 'vegetarian', 'dairyfree'], cost: 'low', ingredients: ['bread', 'spread'], allergens: ['wheat'], diets: ['vegan', 'vegetarian', 'dairyfree'], note: 'Check the spread and bread labels.' },
    { type: 'Snack', name: 'A small handful of seeds with fruit', tags: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree'], cost: 'any', ingredients: ['seeds', 'fruit'], allergens: ['seeds'], diets: ['vegan', 'vegetarian', 'dairyfree', 'glutenfree'], note: 'Avoid seeds if they are not suitable for you.' }
  ];
  $('#generateMeal').onclick = () => {
    const type = $('#mealType').value, budget = $('#mealBudget').value, style = $('#dietStyle').value;
    const avoid = $('#avoidFoods').value.toLowerCase().split(',').map((item) => item.trim()).filter(Boolean);
    let options = meals.filter((meal) => meal.type === type && (style === 'any' || meal.diets.includes(style)) && (budget !== 'low' || meal.cost === 'low'));
    options = options.filter((meal) => !avoid.some((food) => meal.name.toLowerCase().includes(food) || meal.ingredients.some((ingredient) => ingredient.toLowerCase().includes(food)) || meal.allergens.some((allergen) => allergen.includes(food) || food.includes(allergen))));
    generatedMeal = options.length ? options[Math.floor(Math.random() * options.length)] : null;
    $('#mealResult').innerHTML = generatedMeal ? `<div class="result"><span class="pill">${escapeHtml(type)}</span><span class="pill">${budget === 'low' ? 'Budget friendly' : 'Flexible'}</span><h3>${escapeHtml(generatedMeal.name)}</h3><p><strong>Ingredients to consider:</strong> ${escapeHtml(generatedMeal.ingredients.join(', '))}</p><p>${escapeHtml(generatedMeal.note)}</p><p class="muted">${style === 'halal' ? 'Halal-friendly idea only; check certification, preparation and every ingredient.' : 'Check every ingredient, label and cross-contact risk. This suggestion cannot guarantee allergy safety.'}</p></div>` : '<div class="result"><h3>No matching idea found</h3><p>Try another preference or avoid list. For allergies, verify ingredients and cross-contact with a qualified professional or food provider.</p></div>';
    $('#saveMeal').hidden = !generatedMeal;
  };
  $('#saveMeal').onclick = () => {
    if (!generatedMeal) return;
    data.logs.unshift({ id: crypto.randomUUID(), type: 'Reflection', date: new Date().toISOString().slice(0, 10), duration: '', feeling: 'Steady', note: `Meal idea saved: ${generatedMeal.name}` }); saveLocal(); renderLogs(); showMessage('Meal idea saved to your progress log.', 'success');
  };

  function renderRecovery() {
    const records = data.recovery || [];
    $('#recoveryList').innerHTML = records.length ? `<div class="recovery-list">${records.slice(0, 8).map((item) => `<article class="recovery-item"><strong>${escapeHtml(item.date)}</strong><small>Sleep ${escapeHtml(item.sleep)} · Energy ${escapeHtml(item.energy)} · Soreness ${escapeHtml(item.soreness)} · Pain ${escapeHtml(item.pain)}</small>${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}</article>`).join('')}</div>` : '<div class="empty">No check-ins saved yet.</div>';
  }
  $('#saveRecovery').onclick = () => {
    data.recovery.unshift({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), sleep: $('#sleep').value, energy: $('#energy').value, soreness: $('#soreness').value, pain: $('#pain').value, notes: $('#recoveryNotes').value.trim() });
    $('#recoveryNotes').value = ''; saveLocal(); renderRecovery(); renderDashboard(); showMessage('Check-in saved on this device.', 'success');
  };

  function renderLogs() {
    const records = data.logs || [];
    $('#progressSummary').textContent = `${records.length} ${records.length === 1 ? 'entry' : 'entries'} saved`;
    $('#logList').className = records.length ? 'log-list' : 'empty';
    $('#logList').innerHTML = records.length ? records.slice(0, 30).map((item) => `<article class="log-item"><strong>${escapeHtml(item.type)} · ${escapeHtml(item.date)}</strong><small>${escapeHtml(item.feeling || '')}${item.duration ? ` · ${escapeHtml(item.duration)} min` : ''}</small><p>${escapeHtml(item.note)}</p><button class="button small secondary" data-delete-log="${item.id}">Remove entry</button></article>`).join('') : 'No entries yet.';
  }
  $('#saveLog').onclick = () => {
    const note = $('#logNote').value.trim();
    if (!note) { showMessage('Add a short note before saving.', 'error'); return; }
    data.logs.unshift({ id: crypto.randomUUID(), type: $('#logType').value, date: $('#logDate').value, duration: $('#logDuration').value, feeling: $('#logFeeling').value, note });
    $('#logNote').value = ''; $('#logDuration').value = ''; saveLocal(); renderLogs(); renderDashboard(); showMessage('Progress entry saved.', 'success');
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-log]');
    if (!button) return;
    data.logs = data.logs.filter((item) => item.id !== button.dataset.deleteLog); saveLocal(); renderLogs(); renderDashboard();
  });
  $('#exportData').onclick = () => {
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); link.download = 'saints-pitch-data.json'; link.click(); URL.revokeObjectURL(link.href);
  };
  $('#importData').onchange = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || typeof imported !== 'object' || !Array.isArray(imported.logs) || !Array.isArray(imported.recovery)) throw new Error('That file does not look like a SAINTS PITCH backup.');
      if (!confirm('Replace the records on this device with this backup? Export your current data first if you need to keep it.')) return;
      data = { ...emptyData(), ...imported }; saveLocal(); renderProfile(); renderDashboard(); renderPlan(); renderGoals(); renderLogs(); renderRecovery(); showMessage('Backup imported on this device.', 'success');
    } catch (error) { showMessage(error.message || 'The backup could not be opened.', 'error'); }
    finally { event.target.value = ''; }
  };

  function renderGoals() {
    const goals = data.goals || [];
    $('#goalList').innerHTML = goals.length ? goals.map((goal) => `<article class="card goal-card"><span class="eyebrow">${escapeHtml(goal.area)} · ${goal.done ? 'COMPLETE' : 'IN PROGRESS'}</span><h3>${escapeHtml(goal.title)}</h3>${goal.measure ? `<p>${escapeHtml(goal.measure)}</p>` : ''}${goal.date ? `<small class="muted">Review ${escapeHtml(goal.date)}</small>` : ''}<div class="actions"><button class="button small secondary" data-toggle-goal="${goal.id}">${goal.done ? 'Reopen' : 'Mark complete'}</button><button class="button small secondary" data-delete-goal="${goal.id}">Remove</button></div></article>`).join('') : '<div class="empty-state">No goals yet. Add a small, clear next step above.</div>';
  }
  $('#addGoal').onclick = () => {
    const title = $('#goalTitle').value.trim(); if (!title) { showMessage('Add a goal first.', 'error'); return; }
    data.goals.unshift({ id: crypto.randomUUID(), title, area: $('#goalArea').value, date: $('#goalDate').value, measure: $('#goalMeasure').value.trim(), done: false });
    $('#goalTitle').value = ''; $('#goalDate').value = ''; $('#goalMeasure').value = ''; saveLocal(); renderGoals(); renderDashboard(); showMessage('Goal added.', 'success');
  };
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-toggle-goal]'), remove = event.target.closest('[data-delete-goal]');
    if (toggle) { const goal = data.goals.find((item) => item.id === toggle.dataset.toggleGoal); if (goal) goal.done = !goal.done; saveLocal(); renderGoals(); renderDashboard(); }
    if (remove) { data.goals = data.goals.filter((item) => item.id !== remove.dataset.deleteGoal); saveLocal(); renderGoals(); renderDashboard(); }
  });

  $('#saveProfile').onclick = () => {
    data.profile = { name: $('#displayName').value.trim(), position: $('#profilePosition').value, level: $('#profileLevel').value, availability: $('#availability').value, goals: $('#profileGoals').value.trim() };
    saveLocal(); $('#trainPosition').value = data.profile.position || 'Goalkeeper'; renderDashboard(); showMessage('Profile saved.', 'success');
  };
  function renderProfile() {
    const profile = data.profile || {};
    $('#displayName').value = profile.name || ''; $('#profilePosition').value = profile.position || ''; $('#profileLevel').value = profile.level || ''; $('#availability').value = profile.availability || '1–2 days'; $('#profileGoals').value = profile.goals || ''; $('#trainPosition').value = profile.position || 'Goalkeeper';
  }
  $('#clearData').onclick = () => {
    if (!confirm('Clear all SAINTS PITCH records saved in this browser? This will not delete a cloud copy. Export first if you want a backup.')) return;
    data = emptyData(); saveLocal(); renderProfile(); renderDashboard(); renderPlan(); renderGoals(); renderLogs(); renderRecovery(); showMessage('This device’s records have been cleared.', 'success');
  };

  function readHashSession() {
    const params = new URLSearchParams(location.hash.slice(1));
    const access_token = params.get('access_token');
    if (!access_token) return false;
    session = { access_token, refresh_token: params.get('refresh_token'), token_type: params.get('token_type') || 'bearer', expires_at: Date.now() + Number(params.get('expires_in') || 3600) * 1000, user: null };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session)); history.replaceState(null, '', `${location.pathname}${location.search}#account`); return true;
  }
  function configReady() { return Boolean(cloudConfig?.url && cloudConfig?.key); }
  function renderAccount() {
    $('#projectUrl').value = cloudConfig?.url || ''; $('#anonKey').value = cloudConfig?.key || '';
    $('#authArea').hidden = !configReady(); $('#signOut').hidden = !session?.access_token;
    $('#syncCloud').hidden = !session?.access_token; $('#restoreCloud').hidden = !session?.access_token;
    $('#accountHeading').textContent = session?.user?.email || (configReady() ? 'Your private account' : 'Connect cloud storage');
    $('#accountCopy').textContent = configReady() ? 'Use your personal account to back up and restore your development records.' : 'Account sign-up, sign-in, password reset and private sync need a Supabase project. Add its project URL and public anon key below. Never enter a service-role key.';
  }
  function cleanUrl(value) { return String(value || '').trim().replace(/\/$/, ''); }
  $('#saveConfig').onclick = () => {
    const url = cleanUrl($('#projectUrl').value), key = $('#anonKey').value.trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !key) { showMessage('Enter a valid Supabase project URL and its public anon key.', 'error'); return; }
    cloudConfig = { url, key }; localStorage.setItem(CONFIG_KEY, JSON.stringify(cloudConfig)); renderAccount(); showMessage('Connection saved in this browser. Sign in or create your account.', 'success');
  };
  $('#forgetConfig').onclick = () => {
    if (!confirm('Disconnect this browser from the Supabase project? This does not delete your account or cloud records.')) return;
    cloudConfig = null; localStorage.removeItem(CONFIG_KEY); renderAccount(); showMessage('Cloud connection removed from this browser.', 'success');
  };
  async function authFetch(endpoint, options = {}) {
    if (!configReady()) throw new Error('Connect a Supabase project first.');
    const response = await fetch(`${cloudConfig.url}/auth/v1/${endpoint}`, { ...options, headers: { apikey: cloudConfig.key, 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.msg || body.message || body.error_description || 'The account request could not be completed.');
    return body;
  }
  async function restFetch(path, options = {}) {
    await refreshSessionIfNeeded();
    const response = await fetch(`${cloudConfig.url}/rest/v1/${path}`, { ...options, headers: { apikey: cloudConfig.key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || body.hint || 'Private data request failed. Check the database setup guide.'); }
    return response.status === 204 ? null : response.json().catch(() => null);
  }
  async function refreshSessionIfNeeded() {
    if (!session?.refresh_token) throw new Error('Sign in to your account first.');
    if (session.expires_at && session.expires_at > Date.now() + 60000) return;
    const renewed = await authFetch('token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
    session = { ...renewed, expires_at: Date.now() + Number(renewed.expires_in || 3600) * 1000 }; localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  async function fetchUserIfMissing() {
    if (session?.user) return;
    const response = await fetch(`${cloudConfig.url}/auth/v1/user`, { headers: { apikey: cloudConfig.key, Authorization: `Bearer ${session.access_token}` } });
    if (!response.ok) throw new Error('Your saved sign-in has expired. Please sign in again.');
    session.user = await response.json(); localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  async function withAuth(action) {
    try { await action(); }
    catch (error) { showMessage(error.message || 'Something went wrong. Please try again.', 'error'); }
  }
  $('#signUp').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    const result = await authFetch('signup', { method: 'POST', body: JSON.stringify({ email: $('#authEmail').value.trim(), password: $('#authPassword').value }) });
    if (result.access_token) { session = { ...result, expires_at: Date.now() + Number(result.expires_in || 3600) * 1000 }; localStorage.setItem(SESSION_KEY, JSON.stringify(session)); await fetchUserIfMissing(); }
    renderAccount(); showMessage(result.access_token ? 'Account created and signed in.' : 'Check your email to confirm your account, then sign in.', 'success');
  }); };
  $('#signIn').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    const result = await authFetch('token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: $('#authEmail').value.trim(), password: $('#authPassword').value }) });
    session = { ...result, expires_at: Date.now() + Number(result.expires_in || 3600) * 1000 }; localStorage.setItem(SESSION_KEY, JSON.stringify(session)); await fetchUserIfMissing(); renderAccount(); showMessage('You’re signed in. Your records remain on this device until you save a cloud copy.', 'success');
  }); };
  $('#forgotPassword').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    const email = $('#authEmail').value.trim(); if (!email) throw new Error('Enter your email address first.');
    await authFetch('recover', { method: 'POST', body: JSON.stringify({ email, redirect_to: `${location.origin}${location.pathname}#account` }) });
    showMessage('If an account exists for that email, a password reset link will arrive shortly.', 'success');
  }); };
  $('#signOut').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    if (session?.access_token) await authFetch('logout', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
    session = null; localStorage.removeItem(SESSION_KEY); renderAccount(); $('#saveStatus').textContent = 'Saved on this device'; showMessage('Signed out. Your local records are unchanged.', 'success');
  }); };
  $('#updatePassword').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    if (!session?.access_token) throw new Error('Open the password reset link in this browser again.');
    const password = $('#newPassword').value; if (password.length < 8) throw new Error('Use at least 8 characters.');
    const response = await fetch(`${cloudConfig.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: cloudConfig.key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (!response.ok) throw new Error('Password could not be updated. Open a fresh reset link and try again.');
    $('#passwordUpdate').hidden = true; showMessage('Password updated.', 'success');
  }); };
  $('#syncCloud').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    await fetchUserIfMissing();
    await restFetch('player_data?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: session.user.id, data, updated_at: new Date().toISOString() }) });
    showMessage('Private cloud copy saved to your account.', 'success');
  }); };
  $('#restoreCloud').onclick = (event) => { event.preventDefault(); withAuth(async () => {
    await fetchUserIfMissing();
    const rows = await restFetch(`player_data?select=data&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
    if (!rows?.length || !rows[0].data) throw new Error('No cloud copy found for this account yet.');
    if (!confirm('Replace the records on this device with your cloud copy? Export the current device data first if you need it.')) return;
    data = { ...emptyData(), ...rows[0].data }; saveLocal(); renderProfile(); renderDashboard(); renderPlan(); renderGoals(); renderLogs(); renderRecovery(); showMessage('Cloud records restored to this device.', 'success');
  }); };
  if (readHashSession()) $('#passwordUpdate').hidden = false;

  renderProfile(); renderDashboard(); renderPlan(); renderGoals(); renderLogs(); renderRecovery(); renderAccount();
})();
