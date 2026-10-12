import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const context = vm.createContext({ Intl });
const toolDirectory = new URL('../public/tools/long-form-reader/', import.meta.url);
const html = readFileSync(new URL('index.html', toolDirectory), 'utf8');
const core = html.match(/<script id="reader-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(core, 'The shipped HTML must contain the text-processing script');
vm.runInContext(core, context);
const { parse, analyze, sentences, words } = context.ReaderCore;

test('ships as one HTML file with inline styles and executable inline scripts', () => {
  assert.deepEqual(readdirSync(toolDirectory), ['index.html']);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["']stylesheet["']/i);
  assert.match(html, /<style id="reader-styles">/);
  const app = html.match(/<script id="reader-app">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(app, 'The shipped HTML must contain the app script');
  new vm.Script(app);
});

test('imports headings, paragraphs, ordered lists, quotes and code in reading order', () => {
  const doc = parse('# Essay\r\n\r\nIntro line\r\ncontinued.\r\n\r\n## Argument\r\n\r\n3. First claim.\r\n   More context.\r\n4. Next claim.\r\n\r\n> Quoted words.\r\n> More words.\r\n\r\n```js\r\nconst x = 1;\r\n```');
  assert.equal(doc.title, 'Essay');
  assert.equal(doc.sections.length, 2);
  assert.equal(doc.sections[0].blocks[0].text, 'Intro line continued.');
  const blocks = doc.sections[1].blocks;
  assert.equal(blocks[0].ordered, true);
  assert.equal(blocks[0].start, 3);
  assert.equal(blocks[0].items[0], 'First claim. More context.');
  assert.equal(blocks[1].text, 'Quoted words. More words.');
  assert.equal(blocks[2].text, 'const x = 1;');
});

test('keeps imported HTML inert and preserves Unicode prose', () => {
  const text = 'ଓଡ଼ିଆ ଭାଷାରେ ପଢ଼ନ୍ତୁ। <script>alert(1)</script> & words.';
  assert.equal(parse(text).sections[0].blocks[0].text, text);
  assert.equal(words('ଓଡ଼ିଆ ଭାଷାରେ ପଢ଼ନ୍ତୁ').length, 3);
  assert.equal(sentences(text).join(''), text);
});

test('excerpts consist only of original sentences and indices match mixed content', () => {
  const section = parse('Opening sentence. Another sentence.\n\n- List context. Key sentence.\n- Next item.\n\n```\nnot prose\n```\n\n> Last sentence.').sections[0];
  const result = analyze(section);
  assert.equal(result.all.length, 6);
  assert.ok(result.selected.has(0));
  assert.equal(result.excerpt, result.all.filter((_, i) => result.selected.has(i)).slice(0, 2).join(' ').trim());
  for (const i of result.selected) assert.ok(i >= 0 && i < result.all.length);
});

test('handles plain text, supplied titles, empty sections and unfinished fences', () => {
  assert.equal(parse('Only one paragraph.').title, 'Untitled reading');
  assert.equal(parse('# Original\n\nText.', 'My title').title, 'My title');
  assert.equal(parse('## Empty\n\n## Next\n\nWords.').sections.length, 2);
  assert.equal(parse('```\nunfinished').sections[0].blocks[0].text, 'unfinished');
  assert.equal(analyze(parse('```\ncode\n```').sections[0]).excerpt, '');
});

test('sentence fallback preserves punctuation and all original characters', () => {
  const fallback = vm.createContext({ Intl: {} });
  vm.runInContext(core, fallback);
  const text = 'First sentence! Then a question? ଏହା ଓଡ଼ିଆ। Last without punctuation';
  assert.equal(fallback.ReaderCore.sentences(text).join(''), text);
});
