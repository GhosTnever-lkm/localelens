const MAX_BYTES = 10 * 1024 * 1024;

export function parseCatalog(text, filename = 'catalog.json') {
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('Файл больше лимита 10 МБ.');
  let value;
  try { value = JSON.parse(text); }
  catch (error) { throw new Error(`Некорректный JSON в ${filename}: ${error.message}`); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${filename}: ожидается JSON-объект в корне.`);
  const entries = new Map();
  const walk = (node, prefix = '') => {
    for (const [key, child] of Object.entries(node)) {
      if (prefix === '' && (key === '@@locale' || key.startsWith('@'))) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === 'object' && !Array.isArray(child)) walk(child, path);
      else {
        if (entries.has(path)) throw new Error(`${filename}: неоднозначный ключ после разворачивания: ${path}`);
        entries.set(path, child);
      }
    }
  };
  walk(value);
  return { filename, entries };
}

function placeholders(value) {
  if (typeof value !== 'string') return [];
  const found = [];
  const patterns = [
    /\{\s*([A-Za-z_$][\w$.-]*)\s*(?:,\s*(?:plural|select|selectordinal)\b[^}]*)?\}/g,
    /%\(([A-Za-z_][\w.-]*)\)[#0 +\-]*(?:\d+|\*)?(?:\.(?:\d+|\*))?[a-zA-Z]/g,
    /%(?:\d+\$)?[#0 +\-]*(?:\d+|\*)?(?:\.(?:\d+|\*))?[sdif]/g
  ];
  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) found.push(match[1] ? `{${match[1]}}` : match[0]);
  }
  return found.sort();
}

function sameList(a, b) { return a.length === b.length && a.every((value, index) => value === b[index]); }

export function compareCatalogs(source, target) {
  const findings = [];
  for (const key of source.entries.keys()) {
    if (!target.entries.has(key)) {
      findings.push({ key, code: 'missing', severity: 'error', source: source.entries.get(key), target: null, message: 'Ключ отсутствует в целевом каталоге' });
      continue;
    }
    const left = source.entries.get(key); const right = target.entries.get(key);
    if (typeof left !== typeof right) {
      findings.push({ key, code: 'type', severity: 'error', source: left, target: right, message: 'Тип значения отличается от исходного' });
    } else if (typeof right === 'string' && right.trim() === '') {
      findings.push({ key, code: 'empty', severity: 'warning', source: left, target: right, message: 'Перевод пустой или состоит из пробелов' });
    } else if (typeof left === 'string' && typeof right === 'string') {
      const a = placeholders(left); const b = placeholders(right);
      if (!sameList(a, b)) findings.push({ key, code: 'placeholder', severity: 'error', source: left, target: right, expected: a, actual: b, message: `Плейсхолдеры отличаются: ожидаются ${a.join(', ') || 'нет'}, найдены ${b.join(', ') || 'нет'}` });
    }
  }
  for (const key of target.entries.keys()) if (!source.entries.has(key)) findings.push({ key, code: 'extra', severity: 'notice', source: null, target: target.entries.get(key), message: 'Ключ есть только в целевом каталоге' });
  return findings.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }) || a.code.localeCompare(b.code));
}

export function toCsv(rows) {
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return ['severity,code,key,message,source,target', ...rows.map(row => [row.severity, row.code, row.key, row.message, row.source, row.target].map(quote).join(','))].join('\r\n');
}
