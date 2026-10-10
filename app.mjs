import { compareCatalogs, parseCatalog } from './core.mjs';

const $ = id => document.getElementById(id);
const demoSource = { app: { title: 'Welcome, {name}', save: 'Save', items: '{count} items' }, errors: { offline: 'You are offline', retry: 'Try again' } };
const demoTarget = { app: { title: 'Добро пожаловать, {user}', save: 'Сохранить', items: '' }, errors: { retry: 'Попробовать снова', outdated: 'Эта строка есть только в переводе' } };
let source = null; let target = null; let findings = [];

function notify(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
function safe(value) { if (value === null || value === undefined) return '—'; return typeof value === 'string' ? value : JSON.stringify(value); }
function download(filename, text, type) { const url = URL.createObjectURL(new Blob([text], { type })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

async function loadFile(input, kind) {
  const file = input.files?.[0]; if (!file) return;
  try {
    const parsed = parseCatalog(await file.text(), file.name);
    if (kind === 'source') { source = parsed; $('source-name').textContent = file.name; }
    else { target = parsed; $('target-name').textContent = file.name; }
    $('compare').disabled = !(source && target);
    if (source && target) runCompare();
  } catch (error) { notify(error.message); }
  input.value = '';
}

function runCompare() {
  if (!source || !target) return;
  try {
    findings = compareCatalogs(source, target);
    $('results').hidden = false;
    const errors = findings.filter(row => row.severity === 'error').length;
    const warnings = findings.filter(row => row.severity === 'warning').length;
    const notices = findings.filter(row => row.severity === 'notice').length;
    $('errors').textContent = errors; $('warnings').textContent = warnings; $('notices').textContent = notices;
    $('summary-title').textContent = errors ? 'Нужно проверить перевод' : warnings ? 'Есть замечания' : 'Структура каталогов совпадает';
    $('summary-copy').textContent = `${source.entries.size} исходных ключей · ${target.entries.size} целевых · ${findings.length} находок`;
    render();
  } catch (error) { notify(error.message); }
}

function render() {
  const query = $('search').value.trim().toLocaleLowerCase(); const filter = $('filter').value;
  const shown = findings.filter(row => (!query || row.key.toLocaleLowerCase().includes(query) || row.message.toLocaleLowerCase().includes(query)) && (filter === 'all' || row.severity === filter));
  $('rows').replaceChildren(...shown.map(row => {
    const tr = document.createElement('tr');
    const badge = document.createElement('span'); badge.className = `badge ${row.severity}`; badge.textContent = row.severity === 'error' ? 'Ошибка' : row.severity === 'warning' ? 'Пусто' : 'Лишний';
    const tdBadge = document.createElement('td'); tdBadge.append(badge);
    const tdKey = document.createElement('td'); const code = document.createElement('code'); code.textContent = row.key; tdKey.append(code);
    const tdMessage = document.createElement('td'); tdMessage.textContent = row.message;
    const tdSource = document.createElement('td'); tdSource.textContent = safe(row.source); tdSource.className = 'value';
    const tdTarget = document.createElement('td'); tdTarget.textContent = safe(row.target); tdTarget.className = 'value';
    tr.append(tdBadge, tdKey, tdMessage, tdSource, tdTarget); return tr;
  }));
  $('empty').hidden = shown.length !== 0;
}

$('source-file').addEventListener('change', event => loadFile(event.target, 'source'));
$('target-file').addEventListener('change', event => loadFile(event.target, 'target'));
$('compare').addEventListener('click', runCompare);
$('search').addEventListener('input', render); $('filter').addEventListener('change', render);
$('demo').addEventListener('click', () => {
  source = parseCatalog(JSON.stringify(demoSource), 'en.json'); target = parseCatalog(JSON.stringify(demoTarget), 'ru.json');
  $('source-name').textContent = 'en.json · пример'; $('target-name').textContent = 'ru.json · пример'; $('compare').disabled = false; runCompare();
});
$('export-json').addEventListener('click', () => download('localelens-report.json', JSON.stringify({ source: source?.filename, target: target?.filename, checkedKeys: source?.entries.size ?? 0, findings }, null, 2), 'application/json'));
$('export-csv').addEventListener('click', () => {
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = ['severity,code,key,message,source,target', ...findings.map(row => [row.severity, row.code, row.key, row.message, row.source, row.target].map(quote).join(','))].join('\r\n');
  download('localelens-report.csv', `\uFEFF${csv}`, 'text/csv;charset=utf-8');
});
