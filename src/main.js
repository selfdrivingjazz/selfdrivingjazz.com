const skins = [
  { id: '01-solar-score', name: 'Solar Score' },
  { id: '02-drift-interface', name: 'Drift Interface' },
  { id: '03-vector-instrument', name: 'Vector Instrument' },
  { id: '04-night-register', name: 'Night Register' },
  { id: '05-architectural-swing', name: 'Architectural Swing' },
  { id: '06-liquid-orchestra', name: 'Liquid Orchestra' },
];

const stage = document.querySelector('#stage');
const select = document.querySelector('#skin-select');
const title = document.querySelector('#title');
const position = document.querySelector('#position');
const directLink = document.querySelector('#direct-link');

for (const skin of skins) {
  const option = document.createElement('option');
  option.value = skin.id;
  option.textContent = skin.name;
  select.append(option);
}

const requested = new URLSearchParams(location.search).get('skin');
let activeIndex = Math.max(0, skins.findIndex(({ id }) => id === requested));

function show(index, replace = false) {
  activeIndex = (index + skins.length) % skins.length;
  const skin = skins[activeIndex];
  const source = `./skins/${skin.id}/index.html`;

  stage.src = source;
  stage.title = `Self-Driving Jazz prototype: ${skin.name}`;
  select.value = skin.id;
  title.textContent = skin.name;
  position.textContent = `${String(activeIndex + 1).padStart(2, '0')}/${String(skins.length).padStart(2, '0')}`;
  directLink.href = source;

  const url = new URL(location.href);
  url.searchParams.set('skin', skin.id);
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
}

select.addEventListener('change', () => show(skins.findIndex(({ id }) => id === select.value)));
document.querySelector('#previous').addEventListener('click', () => show(activeIndex - 1));
document.querySelector('#next').addEventListener('click', () => show(activeIndex + 1));
window.addEventListener('popstate', () => {
  const id = new URLSearchParams(location.search).get('skin');
  show(Math.max(0, skins.findIndex((skin) => skin.id === id)), true);
});
window.addEventListener('keydown', (event) => {
  if (event.target.matches('select, button, a')) return;
  if (event.key === 'ArrowLeft') show(activeIndex - 1);
  if (event.key === 'ArrowRight') show(activeIndex + 1);
});

show(activeIndex, true);
