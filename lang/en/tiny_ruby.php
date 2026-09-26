<?php
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
 * English strings.
 *
 * @package    tiny_ruby
 * @copyright  2026 Adam Jenkins <adam@wisecat.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['base'] = 'Word';
$string['buttontitle'] = 'Furigana';
$string['copied'] = 'The word list was copied to the clipboard.';
$string['copy'] = 'Copy';
$string['copymanual'] = 'The browser did not allow copying. The list is selected: press Ctrl+C (⌘C on a Mac) to copy it.';
$string['error_delimiter_aozora'] = 'This cannot contain ｜, 《, 》 or a line break.';
$string['error_delimiter_braces'] = 'This cannot contain {, }, | or a line break.';
$string['error_multiline'] = 'The selected text spans more than one line. Select text within a single line to add furigana.';
$string['error_required'] = 'Enter the word to show furigana for.';
$string['formattinglost'] = 'The selected text contains formatting, which will be removed.';
$string['list_conflict'] = '{$a->word}: also {$a->reading} in this text';
$string['list_nofurigana'] = '(no furigana)';
$string['list_skip_comment'] = 'skipped (starts with #): {$a}';
$string['list_skip_linebreak'] = 'skipped (contains a line break): {$a}';
$string['list_skip_notkanji'] = 'skipped (does not start with a kanji): {$a}';
$string['list_skip_separator'] = 'skipped (contains = or ＝): {$a}';
$string['list_skip_toolong'] = 'skipped (longer than {$a->max} characters): {$a->word}';
$string['listbuttontitle'] = 'Furigana word list';
$string['listempty'] = 'No furigana found in this text.';
$string['listintro'] = 'Paste this list into a course word list of the Ruby (furigana) filter. You can edit it here before copying.';
$string['listlabel'] = 'Word list';
$string['listsummary'] = 'Entries: {$a->entries}. Conflicts: {$a->conflicts}. Skipped: {$a->skipped}.';
$string['openwordlist'] = 'Open the course word list';
$string['pluginname'] = 'Ruby (furigana)';
$string['privacy:metadata'] = 'The Ruby (furigana) plugin for TinyMCE does not store any personal data.';
$string['reading'] = 'Reading';
$string['reading_help'] = 'Leave empty to show no furigana for this word.';
$string['remove'] = 'Remove furigana';
$string['ruby:use'] = 'Use the Ruby (furigana) editor tools';
$string['save'] = 'Save';
$string['syntax'] = 'Markup syntax';
$string['syntax_aozora'] = '｜漢字《かんじ》';
$string['syntax_braces'] = '{漢字|かんじ}';
$string['syntax_desc'] = 'How the Furigana dialog writes new furigana. The Ruby (furigana) filter reads both forms, and the dialog edits both, keeping the form an entry already has.';
$string['warning_notkana'] = 'This reading is not all kana. It will still be shown, but a course word list will warn about it.';
$string['warning_skipzone'] = 'The filter does not show furigana here (in code, preformatted text, existing ruby or a no-link area), so this markup will appear as typed.';
