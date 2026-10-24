import test from 'node:test';
import assert from 'node:assert/strict';
import { compareCatalogs, parseCatalog, toCsv } from './core.mjs';

const catalog = (value, name) => parseCatalog(JSON.stringify(value), name);

test('flattens nested JSON keys into stable dotted paths', () => {
  const parsed = catalog({ menu: { file: 'File', count: 3 } }, 'en.json');
  assert.equal(parsed.entries.get('menu.file'), 'File');
  assert.equal(parsed.entries.get('menu.count'), 3);
});

test('rejects collisions between dotted literal keys and flattened nested keys', () => {
  assert.throws(
    () => catalog({ 'menu.file': 'Literal', menu: { file: 'Nested' } }, 'en.json'),
    /неоднозначный ключ.*menu\.file/,
  );
});

test('ignores ARB locale and description metadata', () => {
  const parsed = catalog({ '@@locale': 'en', title: 'Title', '@title': { description: 'Page heading' } });
  assert.deepEqual([...parsed.entries.keys()], ['title']);
});

test('reports missing, extra and empty target keys', () => {
  const result = compareCatalogs(catalog({ a: 'A', b: 'B' }), catalog({ a: ' ', c: 'C' }));
  assert.deepEqual(result.map(row => row.code), ['empty', 'missing', 'extra']);
});

test('matches named and printf placeholders independent of order', () => {
  const result = compareCatalogs(catalog({ msg: '{name}: %s, %(count)d' }), catalog({ msg: '%(count)d — %s ({name})' }));
  assert.equal(result.length, 0);
});

test('finds placeholder and type mismatches', () => {
  const result = compareCatalogs(catalog({ msg: 'Hello {name}', count: 'one' }), catalog({ msg: 'Привет', count: 1 }));
  assert.deepEqual(result.map(row => row.code), ['type', 'placeholder']);
});

test('distinguishes null and array JSON value types', () => {
  const result = compareCatalogs(catalog({ list: [], nil: null }), catalog({ list: null, nil: [] }));
  assert.deepEqual(result.map(({ key, code }) => [key, code]), [['list', 'type'], ['nil', 'type']]);
});

test('rejects malformed JSON, array roots and oversize input', () => {
  assert.throws(() => parseCatalog('{', 'bad.json'), /Некорректный JSON/);
  assert.throws(() => parseCatalog('[]'), /JSON-объект/);
  assert.throws(() => parseCatalog(' '.repeat(10 * 1024 * 1024 + 1)), /10 МБ/);
});

test('CSV quotes commas, quotes and newlines safely', () => {
  const csv = toCsv([{ severity: 'error', code: 'missing', key: 'a,b', message: 'say "hi"', source: 'one\ntwo', target: null }]);
  assert.match(csv, /"a,b","say ""hi""","one\ntwo",""/);
});
