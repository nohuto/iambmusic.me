import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '../dist');
const headersFile = path.join(dist, '_headers');
const inlineScript =
  /<script(?![^>]*\ssrc=)(?![^>]*\stype="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/g;
const inlineStyle = /<style[^>]*>([\s\S]*?)<\/style>/g;
const hash = (text) =>
  `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

const scripts = new Set();
const styles = new Set();
for (const file of await readdir(dist, { recursive: true })) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(path.join(dist, file), 'utf8');
  for (const [, body] of html.matchAll(inlineScript))
    if (body) scripts.add(hash(body));
  for (const [, body] of html.matchAll(inlineStyle)) styles.add(hash(body));
}

const headers = await readFile(headersFile, 'utf8');
const scriptSrc = /(Content-Security-Policy:.*\bscript-src [^;]*)/;
const styleSrc = /(Content-Security-Policy:.*\bstyle-src [^;]*)/;
if (!scriptSrc.test(headers) || !styleSrc.test(headers))
  throw new Error('Missing Content-Security-Policy');
await writeFile(
  headersFile,
  headers
    .replace(scriptSrc, `$1 ${[...scripts].join(' ')}`)
    .replace(styleSrc, `$1 ${[...styles].join(' ')}`),
);
