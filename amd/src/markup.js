// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * The filter_ruby rules that tiny_ruby must follow, and nothing else.
 *
 * Every rule here is copied from filter_ruby, which is the authority. The
 * suite's RELATIONS.md lists each one with its source line; change them only
 * together with the filter. This module imports nothing, so its pure functions
 * can be unit tested outside Moodle.
 *
 * @module      tiny_ruby/markup
 * @copyright   2026 Adam Jenkins <adam@wisecat.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export const SYNTAX_BRACES = 'braces';
export const SYNTAX_AOZORA = 'aozora';

// R1: filter_ruby annotator::INLINE_PATTERN, translated to a JavaScript regex.
const INLINE_PATTERN = /\{([^{}|]+)\|([^{}|]*)\}|｜([^｜《》]+)《([^《》]*)》/gu;

// Characters a field may not contain, per syntax. A line break is never valid:
// both are single-line fields.
const DELIMITERS = {
    [SYNTAX_BRACES]: /[{}|\r\n]/u,
    [SYNTAX_AOZORA]: /[｜《》\r\n]/u,
};

// R7: filter_ruby wordlist::KANA_PATTERN. From PCRE2 10.40, PHP's \p{Hiragana} is the
// Script_Extensions property (so 、「」゛ and half-width kana count), and with /u its \s is
// Unicode white space plus U+180E. Calibrated against PHP 8.4 / PCRE2 10.46 on 2026-09-26:
// identical on U+0000-U+3200, U+FE00-U+FFFF and the kana supplements.
const KANA_PATTERN = /^[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}ー・\p{White_Space}\u180E]+$/u;

// R10: the filter only starts a dictionary lookup at a Han character (annotator.php
// HAN_PATTERN), so a list word that does not start with one can never match. PCRE2's
// \p{Han} is Script_Extensions too; Unicode versions may differ for the newest CJK
// extension characters.
const STARTS_WITH_KANJI = /^\p{Script_Extensions=Han}/u;

// R6: filter_ruby wordlist::MAX_WORD_LENGTH, in characters.
export const MAX_WORD_LENGTH = 32;

// R4: filter_ruby annotator::SKIP_ELEMENTS and NOLINK_CLASS.
const SKIP_ELEMENTS = new Set(['ruby', 'rt', 'rp', 'code', 'pre', 'script', 'style', 'textarea', 'nolink']);
const NOLINK_CLASS = 'nolink';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * The English comment lines used when no translated labels are given.
 *
 * @type {object}
 */
export const DEFAULT_LABELS = {
    header: (parts) => parts.join(', '),
    conflict: (word, reading) => `${word}: also ${reading === '' ? '(no furigana)' : reading} in this text`,
    toolong: (word) => `skipped (longer than ${MAX_WORD_LENGTH} characters): ${word}`,
    separator: (word) => `skipped (contains = or ＝): ${word}`,
    comment: (word) => `skipped (starts with #): ${word}`,
    linebreak: (word) => `skipped (contains a line break): ${word}`,
    notkanji: (word) => `skipped (does not start with a kanji): ${word}`,
};

/**
 * Return a known syntax name, falling back to braces.
 *
 * @param {string} value
 * @returns {string}
 */
export const normaliseSyntax = (value) => (value === SYNTAX_AOZORA ? SYNTAX_AOZORA : SYNTAX_BRACES);

/**
 * Find every inline markup in a string of text.
 *
 * @param {string} text Text between two tags, as the filter sees it.
 * @returns {Array<{start: number, end: number, base: string, reading: string, syntax: string}>}
 *          Offsets are UTF-16 indexes into text; end is exclusive.
 */
export const findAll = (text) => {
    const found = [];
    for (const m of text.matchAll(INLINE_PATTERN)) {
        const braces = m[1] !== undefined;
        found.push({
            start: m.index,
            end: m.index + m[0].length,
            base: braces ? m[1] : m[3],
            reading: braces ? m[2] : m[4],
            syntax: braces ? SYNTAX_BRACES : SYNTAX_AOZORA,
        });
    }
    return found;
};

/**
 * Find the markup that wholly contains a caret or selection.
 *
 * Both edges are inclusive, so a caret just before the opening delimiter or just
 * after the closing one counts as inside. Between two adjacent markups the first wins.
 *
 * @param {string} text
 * @param {number} from Selection start offset.
 * @param {number} to Selection end offset.
 * @returns {object|null} A match as returned by findAll(), or null.
 */
export const findRange = (text, from, to) =>
    findAll(text).find((m) => m.start <= from && to <= m.end) || null;

/**
 * Write inline markup.
 *
 * @param {string} base
 * @param {string} reading
 * @param {string} syntax
 * @returns {string}
 */
export const build = (base, reading, syntax) => (normaliseSyntax(syntax) === SYNTAX_AOZORA
    ? `｜${base}《${reading}》`
    : `{${base}|${reading}}`);

/**
 * Check dialog input against what the filter will accept.
 *
 * @param {string} base
 * @param {string} reading
 * @param {string} syntax
 * @returns {{errors: object, warnings: object}} errors.base is 'required' or
 *          'delimiter', errors.reading is 'delimiter', warnings.reading is 'notkana'.
 */
export const validate = (base, reading, syntax) => {
    const delimiters = DELIMITERS[normaliseSyntax(syntax)];
    const errors = {};
    const warnings = {};
    if (base.trim() === '') {
        errors.base = 'required';
    } else if (delimiters.test(base)) {
        errors.base = 'delimiter';
    }
    if (delimiters.test(reading)) {
        errors.reading = 'delimiter';
    } else if (reading !== '' && !KANA_PATTERN.test(reading)) {
        warnings.reading = 'notkana';
    }
    return {errors, warnings};
};

/**
 * Turn one entry into a word-list line, or say why it must be skipped.
 *
 * @param {string} word Already trimmed.
 * @param {string} reading Already trimmed.
 * @returns {{line: string}|{skip: string}} skip is 'linebreak', 'toolong', 'separator',
 *          'comment' or 'notkanji'.
 */
export const wordListLine = (word, reading) => {
    if (/[\r\n]/u.test(word) || /[\r\n]/u.test(reading)) {
        return {skip: 'linebreak'};
    }
    if ([...word].length > MAX_WORD_LENGTH) {
        return {skip: 'toolong'};
    }
    if (word.includes('=') || word.includes('＝')) {
        return {skip: 'separator'};
    }
    if (word.startsWith('#')) {
        return {skip: 'comment'};
    }
    if (!STARTS_WITH_KANJI.test(word)) {
        return {skip: 'notkanji'};
    }
    return {line: `${word}=${reading}`};
};

/**
 * Flatten line breaks so a value cannot escape its comment line.
 *
 * @param {string} value
 * @returns {string}
 */
const oneLine = (value) => String(value).replace(/\s*[\r\n]+\s*/gu, ' ').trim();

/**
 * Format collected entries as a filter_ruby word list.
 *
 * Entries keep the order of first appearance. When a word appears with several
 * readings the last one wins, as a later line wins in the filter's list, and
 * each other reading is noted in a comment above it.
 *
 * @param {Array<{word: string, reading: string}>} entries In document order.
 * @param {{fieldLabel: string, pageTitle: string, date: string}} meta For the header comment.
 * @param {object} labels Comment texts; see DEFAULT_LABELS.
 * @returns {{text: string, entries: number, conflicts: number, skipped: number}}
 */
export const formatWordList = (entries, meta, labels = DEFAULT_LABELS) => {
    const words = new Map();
    for (const entry of entries) {
        const word = entry.word.trim();
        const reading = entry.reading.trim();
        if (word === '') {
            continue;
        }
        if (!words.has(word)) {
            words.set(word, []);
        }
        const readings = words.get(word);
        const at = readings.indexOf(reading);
        if (at !== -1) {
            readings.splice(at, 1);
        }
        readings.push(reading);
    }
    if (words.size === 0) {
        return {text: '', entries: 0, conflicts: 0, skipped: 0};
    }

    const head = [oneLine(meta.fieldLabel), oneLine(meta.pageTitle)].filter((part) => part !== '').join(' — ');
    const lines = ['# ' + oneLine(labels.header([head, meta.date].filter((part) => part !== '')))];
    let count = 0;
    let conflicts = 0;
    let skipped = 0;
    for (const [word, readings] of words) {
        const reading = readings[readings.length - 1];
        const result = wordListLine(word, reading);
        if (result.skip) {
            lines.push('# ' + oneLine(labels[result.skip](word)));
            skipped++;
            continue;
        }
        for (const other of readings.slice(0, -1)) {
            lines.push('# ' + oneLine(labels.conflict(word, other)));
        }
        if (readings.length > 1) {
            conflicts++;
        }
        lines.push(result.line);
        count++;
    }
    return {text: lines.join('\n'), entries: count, conflicts, skipped};
};

/**
 * Whether the filter leaves an element's contents alone (R4), so markup in it is never rendered.
 *
 * @param {Element} element
 * @returns {boolean}
 */
export const isSkipZone = (element) => SKIP_ELEMENTS.has(element.nodeName.toLowerCase())
    || (element.classList !== undefined && element.classList.contains(NOLINK_CLASS));

/**
 * Read an HTML ruby element as one entry.
 *
 * The base is the text outside rt and rp; the reading is every rt joined, so
 * per-character ruby reads as one word. Each text piece is trimmed, so the white
 * space of pretty-printed HTML does not end up inside the word. Complex ruby (rtc),
 * and ruby with no reading at all, are not read: an empty reading in the list would
 * mean "suppress", which such HTML never asked for.
 *
 * @param {Element} ruby
 * @returns {{word: string, reading: string}|null}
 */
const rubyEntry = (ruby) => {
    if (ruby.querySelector('rtc') !== null) {
        return null;
    }
    let word = '';
    let reading = '';
    const walk = (node) => {
        for (const child of node.childNodes) {
            if (child.nodeType === TEXT_NODE) {
                word += child.data.trim();
            } else if (child.nodeType === ELEMENT_NODE) {
                const name = child.nodeName.toLowerCase();
                if (name === 'rt') {
                    reading += child.textContent.trim();
                } else if (name !== 'rp') {
                    walk(child);
                }
            }
        }
    };
    walk(ruby);
    return reading === '' ? null : {word, reading};
};

/**
 * Collect every ruby entry in a parsed document body, in document order.
 *
 * Inline markup is read from text outside the filter's skip zones (R3, R4), and
 * HTML ruby elements are read as entries too.
 *
 * @param {Node} root Usually DOMParser(...).body.
 * @returns {Array<{word: string, reading: string}>}
 */
export const collectEntries = (root) => {
    const entries = [];
    const walk = (node) => {
        for (const child of node.childNodes) {
            if (child.nodeType === TEXT_NODE) {
                for (const m of findAll(child.data)) {
                    entries.push({word: m.base, reading: m.reading});
                }
            } else if (child.nodeType === ELEMENT_NODE) {
                if (child.nodeName.toLowerCase() === 'ruby') {
                    const entry = rubyEntry(child);
                    if (entry !== null) {
                        entries.push(entry);
                    }
                } else if (!isSkipZone(child)) {
                    walk(child);
                }
            }
        }
    };
    walk(root);
    return entries;
};
