// ============================================================
// SH04 — Commentaire Wolton
// Variant switcher + learning mode (active recall + spaced repetition)
// ============================================================

// ---------- Variant tabs ----------
const tabs = Array.from(document.querySelectorAll('.variant-tab'));
const panels = Array.from(document.querySelectorAll('.commentaire'));

const showVariant = (id) => {
  const target = panels.find((p) => p.id === id) ? id : 'v1';
  panels.forEach((panel) => {
    const active = panel.id === target;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  tabs.forEach((tab) => {
    const active = tab.dataset.variant === target;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  if (history.replaceState) history.replaceState(null, '', `#${target}`);
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    showVariant(tab.dataset.variant);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

showVariant(window.location.hash.replace('#', '') || 'v1');

const printBtn = document.getElementById('printBtn');
if (printBtn) printBtn.addEventListener('click', () => window.print());

// ============================================================
// Learning mode — active recall via cloze deletion
// ============================================================
const TERMS = [
  ['Claude Shannon et Warren Weaver', 'author'],
  ['Hartmut Rosa', 'author'],
  ['Régis Debray', 'author'],
  ['Stuart Hall', 'author'],
  ['Marshall McLuhan', 'author'],
  ['Eli Pariser', 'author'],
  ['Paul Watzlawick', 'author'],
  ['Gérald Bronner', 'author'],
  ['transmission et interaction ne sont pas synonymes de communication', 'concept'],
  ['on ne peut pas ne pas communiquer', 'concept'],
  ["communiquer, c'est cohabiter", 'concept'],
  ['La Démocratie des crédules', 'concept'],
  ["Informer n'est pas communiquer", 'concept'],
  ['encodage et du décodage', 'concept'],
  ['solitudes interactives', 'concept'],
  ['village global', 'concept'],
  ['bulles de filtre', 'concept'],
  ['bulle de filtre', 'concept'],
  ['marché cognitif', 'concept'],
  ['infobésité', 'concept'],
  ['accélération', 'concept'],
  ['printemps arabes', 'example'],
  ['fact-checking', 'example'],
  ['Covid-19', 'example'],
  ['TikTok', 'example'],
  ['DeepL', 'example'],
  ['diplomatie', 'example'],
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let clozeBuilt = false;
const buildCloze = () => {
  if (clozeBuilt) return;
  clozeBuilt = true;

  const catOf = new Map(TERMS.map((t) => [t[0], t[1]]));
  const sorted = TERMS.map((t) => t[0]).sort((a, b) => b.length - a.length);
  const re = new RegExp(sorted.map(escapeRe).join('|'), 'g');

  document.querySelectorAll('.commentaire:not(.method-panel) .para').forEach((para) => {
    const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        let p = n.parentNode;
        while (p && p !== para) {
          if (p.classList && (p.classList.contains('axe-tag') || p.classList.contains('cloze')))
            return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const text = node.nodeValue;
      re.lastIndex = 0;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const span = document.createElement('span');
        span.className = 'cloze';
        span.dataset.cat = catOf.get(m[0]) || 'concept';
        span.dataset.hidden = 'false';
        span.title = 'Cliquer pour révéler / masquer';
        span.textContent = m[0];
        frag.appendChild(span);
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });
};

const allCloze = () => Array.from(document.querySelectorAll('.cloze'));
const activeCats = () =>
  Array.from(document.querySelectorAll('.learn-bar .chip[data-cat].is-on')).map((c) => c.dataset.cat);

const hideByCats = () => {
  const cats = activeCats();
  allCloze().forEach((s) => {
    s.dataset.hidden = cats.includes(s.dataset.cat) ? 'true' : 'false';
  });
};

const learnToggle = document.getElementById('learnToggle');
const learnBar = document.getElementById('learnBar');

const setLearning = (on) => {
  document.body.classList.toggle('learning', on);
  learnBar.hidden = !on;
  learnToggle.setAttribute('aria-pressed', String(on));
  learnToggle.textContent = on ? 'Quitter l’apprentissage' : 'Mode apprentissage';
  if (on) {
    buildCloze();
    hideByCats();
  } else {
    allCloze().forEach((s) => (s.dataset.hidden = 'false'));
  }
};

learnToggle.addEventListener('click', () =>
  setLearning(!document.body.classList.contains('learning'))
);

// individual cloze click
document.addEventListener('click', (e) => {
  const c = e.target.closest('.cloze');
  if (!c || !document.body.classList.contains('learning')) return;
  c.dataset.hidden = c.dataset.hidden === 'true' ? 'false' : 'true';
});

// category chips
document.querySelectorAll('.learn-bar .chip[data-cat]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const on = !chip.classList.contains('is-on');
    chip.classList.toggle('is-on', on);
    chip.setAttribute('aria-pressed', String(on));
    const cat = chip.dataset.cat;
    allCloze().forEach((s) => {
      if (s.dataset.cat === cat) s.dataset.hidden = on ? 'true' : 'false';
    });
  });
});

const revealAllBtn = document.getElementById('revealAll');
const hideAllBtn = document.getElementById('hideAll');
if (revealAllBtn) revealAllBtn.addEventListener('click', () =>
  allCloze().forEach((s) => (s.dataset.hidden = 'false'))
);
if (hideAllBtn) hideAllBtn.addEventListener('click', hideByCats);

// ============================================================
// Flashcards — Leitner spaced repetition
// ============================================================
const DECK = [
  { id: 'c1', meta: 'Citation', q: 'La citation commentée — auteur et œuvre ?', a: 'Dominique Wolton, <em>Informer n’est pas communiquer</em> (CNRS Éditions, 2009).' },
  { id: 'c2', meta: 'Introduction', q: 'La problématique du devoir ?', a: 'La circulation rapide de l’information produit-elle de la compréhension, ou la communication suppose-t-elle un travail relationnel que la technique seule ne peut accomplir ?' },
  { id: 'c3', meta: 'Axe 1 · Vitesse', q: 'L’auteur de l’« accélération » ?', a: 'Hartmut Rosa.' },
  { id: 'c4', meta: 'Axe 1 · Vitesse', q: 'L’exemple de la vitesse de surface ?', a: 'Le défilement infini de TikTok.' },
  { id: 'c5', meta: 'Axe 1 · Vitesse', q: 'Pourquoi la vitesse ne fait pas comprendre ?', a: 'Elle court-circuite le temps de la réflexion : interactivité de surface, malentendus.' },
  { id: 'c6', meta: 'Axe 2 · Information', q: 'Le modèle technique de la transmission ?', a: 'Shannon et Weaver — théorie mathématique : un signal en bits, indifférent au sens.' },
  { id: 'c7', meta: 'Axe 2 · Information', q: 'La formule de Wolton juste après la citation ?', a: '« Transmission et interaction ne sont pas synonymes de communication. »' },
  { id: 'c8', meta: 'Axe 2 · Information', q: 'L’auteur du récepteur actif (encodage / décodage) ?', a: 'Stuart Hall.' },
  { id: 'c9', meta: 'Axe 2 · Information', q: 'L’exemple « information ≠ communication » ?', a: 'L’info sur le vaccin Covid : reçue, recodée ou rejetée selon les milieux.' },
  { id: 'c10', meta: 'Axe 3 · Illusion technique', q: 'Le mythe critiqué par Wolton ?', a: 'Le « village global » de McLuhan.' },
  { id: 'c11', meta: 'Axe 3 · Illusion technique', q: 'L’expression de Wolton sur l’hyperconnexion ?', a: 'Les « solitudes interactives ».' },
  { id: 'c12', meta: 'Axe 3 · Illusion technique', q: 'L’auteur des « bulles de filtre » ?', a: 'Eli Pariser.' },
  { id: 'c13', meta: 'Axe 3 · Illusion technique', q: 'L’exemple d’un réseau qui divise ?', a: 'Les « printemps arabes » retombés en polarisation.' },
  { id: 'c14', meta: 'Axe 4 · Cohabitation', q: 'La formule de Wolton sur la communication ?', a: '« Communiquer, c’est cohabiter. »' },
  { id: 'c15', meta: 'Axe 4 · Cohabitation', q: 'Qui a posé « on ne peut pas ne pas communiquer » ?', a: 'Watzlawick (École de Palo Alto).' },
  { id: 'c16', meta: 'Axe 4 · Cohabitation', q: 'L’exemple du travail de compréhension ?', a: 'La diplomatie ; la traduction (DeepL traduit les mots, pas les cultures).' },
  { id: 'c17', meta: 'Axe 5 · Quantité / qualité', q: 'L’auteur du « marché cognitif » et des infox ?', a: 'Gérald Bronner (<em>La Démocratie des crédules</em>).' },
  { id: 'c18', meta: 'Axe 5 · Quantité / qualité', q: 'Le terme pour la surcharge d’information ?', a: 'L’« infobésité ».' },
  { id: 'c19', meta: 'Axe 5 · Quantité / qualité', q: 'L’exemple de la quantité qui désinforme ?', a: 'L’infodémie du Covid : les rumeurs vont plus vite que leurs démentis.' },
  { id: 'c20', meta: 'Axe 5 · Quantité / qualité', q: 'La solution de Wolton ?', a: 'Ralentir, vérifier, réhabiliter les médiateurs (journalistes, profs) ; fact-checking.' },
  { id: 'c21', meta: 'Conclusion', q: 'Le dépassement de la conclusion ?', a: 'La technique n’est pas l’ennemie : bien employée (vérification, médiation), elle sert la compréhension. Ni technophobie ni techno-béatitude.' },
  { id: 'c22', meta: 'Conclusion', q: 'L’ouverture de la conclusion ?', a: 'Les IA génératives qui simulent la compréhension : que devient le « risque de l’autre » ?' },
];

const STORE_KEY = 'sh04-leitner-v1';
const loadBoxes = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
};
const saveBoxes = (b) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(b)); } catch (e) { /* file:// */ }
};
let boxes = loadBoxes();
const boxOf = (id) => boxes[id] || 1;

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const overlay = document.getElementById('flashOverlay');
const elMeta = document.getElementById('flashMeta');
const elQ = document.getElementById('flashQ');
const elA = document.getElementById('flashA');
const elProgress = document.getElementById('flashProgress');
const ctrlReveal = document.getElementById('flashReveal');
const ctrlGrade = document.getElementById('flashGrade');

let session = [];
let idx = 0;

const masteredCount = () => DECK.filter((c) => boxOf(c.id) >= 4).length;

const renderProgress = () => {
  const m = masteredCount();
  const pct = Math.round((m / DECK.length) * 100);
  elProgress.innerHTML =
    `<div class="bar"><span style="width:${pct}%"></span></div>` +
    `<span>Carte ${Math.min(idx + 1, session.length)} / ${session.length}` +
    ` · maîtrisées ${m}/${DECK.length} (boîte 4-5)</span>`;
};

const renderCard = () => {
  if (idx >= session.length) {
    elMeta.textContent = 'Tour terminé';
    elQ.textContent = `Tu as révisé ${session.length} cartes — ${masteredCount()}/${DECK.length} maîtrisées.`;
    elA.hidden = true;
    ctrlReveal.hidden = true;
    ctrlGrade.hidden = true;
    elProgress.innerHTML += '';
    ctrlReveal.hidden = false;
    ctrlReveal.innerHTML = '<button class="flash-btn flash-btn--wide" id="btnRestart" type="button">Recommencer un tour</button>';
    document.getElementById('btnRestart').addEventListener('click', startSession);
    renderProgress();
    return;
  }
  const card = session[idx];
  elMeta.textContent = card.meta;
  elQ.textContent = card.q;
  elA.innerHTML = card.a;
  elA.hidden = true;
  ctrlReveal.hidden = false;
  ctrlReveal.innerHTML = '<button class="flash-btn flash-btn--wide" id="btnShow" type="button">Montrer la réponse <span class="kbd">Espace</span></button>';
  document.getElementById('btnShow').addEventListener('click', reveal);
  ctrlGrade.hidden = true;
  renderProgress();
};

const reveal = () => {
  if (idx >= session.length) return;
  elA.hidden = false;
  ctrlReveal.hidden = true;
  ctrlGrade.hidden = false;
};

const grade = (known) => {
  const card = session[idx];
  boxes[card.id] = known ? Math.min(boxOf(card.id) + 1, 5) : 1;
  saveBoxes(boxes);
  idx += 1;
  renderCard();
};

const startSession = () => {
  session = shuffle(DECK).sort((a, b) => boxOf(a.id) - boxOf(b.id));
  idx = 0;
  renderCard();
};

const openCards = () => {
  overlay.hidden = false;
  startSession();
};
const closeCards = () => { overlay.hidden = true; };

document.getElementById('openCards').addEventListener('click', openCards);
document.getElementById('flashClose').addEventListener('click', closeCards);
document.getElementById('btnYes').addEventListener('click', () => grade(true));
document.getElementById('btnNo').addEventListener('click', () => grade(false));
document.getElementById('flashReset').addEventListener('click', () => {
  boxes = {};
  saveBoxes(boxes);
  startSession();
});

overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCards(); });

document.addEventListener('keydown', (e) => {
  if (overlay.hidden) return;
  if (e.key === 'Escape') return closeCards();
  if (e.key === ' ' && !ctrlReveal.hidden) { e.preventDefault(); reveal(); }
  else if (e.key === '1' && !ctrlGrade.hidden) grade(false);
  else if (e.key === '2' && !ctrlGrade.hidden) grade(true);
});
