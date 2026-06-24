// ============================================================
// SH04 — Commentaire Wolton
// Two modes: hyper-résumé + active recall (cloze deletion)
// ============================================================

// ---------- Résumé toggle ----------
const resumeToggle = document.getElementById('resumeToggle');
resumeToggle.addEventListener('click', () => {
  const on = resumeToggle.getAttribute('aria-pressed') !== 'true';
  resumeToggle.setAttribute('aria-pressed', String(on));
  document.body.classList.toggle('resume', on);
});

// ---------- Active recall (cloze) ----------
const TERMS = [
  ['Claude Shannon et Warren Weaver', 'author'],
  ['Hartmut Rosa', 'author'],
  ['Régis Debray', 'author'],
  ['Stuart Hall', 'author'],
  ['Marshall McLuhan', 'author'],
  ['Eli Pariser', 'author'],
  ['Shannon et Weaver', 'author'],
  ['transmission et interaction ne sont pas synonymes de communication', 'concept'],
  ["Informer n'est pas communiquer", 'concept'],
  ['encodage et du décodage', 'concept'],
  ['solitudes interactives', 'concept'],
  ['village global', 'concept'],
  ['bulles de filtre', 'concept'],
  ['bulle de filtre', 'concept'],
  ['paranoïa de la réception', 'concept'],
  ['accélération', 'concept'],
  ['médiologie', 'concept'],
  ['printemps arabes', 'example'],
  ['Covid-19', 'example'],
  ['TikTok', 'example'],
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let clozeBuilt = false;
const buildCloze = () => {
  if (clozeBuilt) return;
  clozeBuilt = true;
  const catOf = new Map(TERMS.map((t) => [t[0], t[1]]));
  const sorted = TERMS.map((t) => t[0]).sort((a, b) => b.length - a.length);
  const re = new RegExp(sorted.map(escapeRe).join('|'), 'g');

  document.querySelectorAll('.resume li').forEach((host) => {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        let p = n.parentNode;
        while (p && p !== host) {
          if (p.classList && p.classList.contains('cloze')) return NodeFilter.FILTER_REJECT;
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

const learnToggle = document.getElementById('learnToggle');
learnToggle.addEventListener('click', () => {
  const on = learnToggle.getAttribute('aria-pressed') !== 'true';
  learnToggle.setAttribute('aria-pressed', String(on));
  document.body.classList.toggle('learning', on);
  if (on) buildCloze();
  allCloze().forEach((s) => (s.dataset.hidden = on ? 'true' : 'false'));
});

// individual reveal / re-hide
document.addEventListener('click', (e) => {
  const c = e.target.closest('.cloze');
  if (!c || learnToggle.getAttribute('aria-pressed') !== 'true') return;
  c.dataset.hidden = c.dataset.hidden === 'true' ? 'false' : 'true';
});
