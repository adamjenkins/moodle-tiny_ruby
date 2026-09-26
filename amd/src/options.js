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
 * Tiny Ruby options passed from plugininfo::get_plugin_configuration_for_context().
 *
 * @module      tiny_ruby/options
 * @copyright   2026 Adam Jenkins <adam@wisecat.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getPluginOptionName} from 'editor_tiny/options';
import {pluginName} from 'tiny_ruby/common';
import {normaliseSyntax} from 'tiny_ruby/markup';

const syntaxName = getPluginOptionName(pluginName, 'syntax');
const wordListUrlName = getPluginOptionName(pluginName, 'wordlisturl');

/**
 * Register the options.
 *
 * @param {TinyMCE} editor
 */
export const register = (editor) => {
    editor.options.register(syntaxName, {processor: 'string', "default": 'braces'});
    editor.options.register(wordListUrlName, {processor: 'string', "default": ''});
};

/**
 * The syntax new furigana is written in.
 *
 * @param {TinyMCE} editor
 * @returns {string} 'braces' or 'aozora'
 */
export const getSyntax = (editor) => normaliseSyntax(editor.options.get(syntaxName));

/**
 * The course word-list settings URL, or '' when there is none for this user.
 *
 * @param {TinyMCE} editor
 * @returns {string}
 */
export const getWordListUrl = (editor) => editor.options.get(wordListUrlName);
