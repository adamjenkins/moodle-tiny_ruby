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
 * The Furigana word list dialog: every ruby entry in the text, as a filter_ruby word list.
 *
 * @module      tiny_ruby/listdialog
 * @copyright   2026 Adam Jenkins <adam@wisecat.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Modal from 'core/modal';
import {getString, getStrings} from 'core/str';
import {component} from 'tiny_ruby/common';
import {collectEntries, formatWordList, MAX_WORD_LENGTH} from 'tiny_ruby/markup';
import {getWordListUrl} from 'tiny_ruby/options';

// The dialog open for each editor, or OPENING while it is being built: a second click
// must not open another. Tracked by whether the dialog is still in the page, not by
// ModalEvents.destroyed: core/modal's destroy() removes the root, and with it every
// handler bound there, before it triggers that event (modal.js destroy(), 4.5 and 5.2).
const OPENING = Symbol('opening');
const openDialogs = new WeakMap();

class ListModal extends Modal {
    static TYPE = 'tiny_ruby/listdialog';
    static TEMPLATE = 'tiny_ruby/listdialog';

    registerEventListeners() {
        super.registerEventListeners();
        this.registerCloseOnCancel();
    }

    configure(modalConfig) {
        modalConfig.show = true;
        modalConfig.removeOnClose = true;
        modalConfig.large = true;
        super.configure(modalConfig);
    }
}
ListModal.registerModalType();

// Stand-ins substituted after translation, so a translated comment can put the
// word and reading wherever its language needs them.
const WORD = '%%tiny_ruby_word%%';
const READING = '%%tiny_ruby_reading%%';

/**
 * Build a function filling the stand-ins of a translated string.
 *
 * @param {string} template
 * @returns {Function} (word, reading) => string
 */
const filler = (template) => (word, reading = '') =>
    template.replace(/%%tiny_ruby_(word|reading)%%/g, (token, which) => (which === 'word' ? word : reading));

/**
 * The translated comment lines for formatWordList().
 *
 * @returns {Promise<object>}
 */
const getLabels = async() => {
    const [conflict, nofurigana, toolong, separator, comment, linebreak, notkanji] = await getStrings([
        {key: 'list_conflict', component, param: {word: WORD, reading: READING}},
        {key: 'list_nofurigana', component},
        {key: 'list_skip_toolong', component, param: {word: WORD, max: MAX_WORD_LENGTH}},
        {key: 'list_skip_separator', component, param: WORD},
        {key: 'list_skip_comment', component, param: WORD},
        {key: 'list_skip_linebreak', component, param: WORD},
        {key: 'list_skip_notkanji', component, param: WORD},
    ]);
    const conflictLine = filler(conflict);
    return {
        header: (parts) => parts.join(', '),
        conflict: (word, reading) => conflictLine(word, reading === '' ? nofurigana : reading),
        toolong: filler(toolong),
        separator: filler(separator),
        comment: filler(comment),
        linebreak: filler(linebreak),
        notkanji: filler(notkanji),
    };
};

/**
 * Today's local date as YYYY-MM-DD.
 *
 * @returns {string}
 */
const today = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Copy text to the clipboard, falling back to the selection when the page is
 * not a secure context (navigator.clipboard exists only there).
 *
 * @param {HTMLTextAreaElement} textarea
 * @returns {Promise<boolean>} Whether the text was copied.
 */
const copy = async(textarea) => {
    if (window.isSecureContext && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(textarea.value);
            return true;
        } catch (e) {
            // Denied: fall back to the selection below.
        }
    }
    textarea.focus();
    textarea.select();
    try {
        return document.execCommand('copy');
    } catch (e) {
        return false;
    }
};

/**
 * Open the word list dialog for the editor's whole text.
 *
 * @param {TinyMCE} editor
 * @returns {Promise<void>}
 */
export const openListDialog = async(editor) => {
    const current = openDialogs.get(editor);
    if (current === OPENING || (current && current.getRoot()[0].isConnected)) {
        return;
    }
    openDialogs.set(editor, OPENING);
    try {
        openDialogs.set(editor, await showDialog(editor));
    } catch (e) {
        openDialogs.delete(editor);
        throw e;
    }
};

/**
 * Build and wire the dialog.
 *
 * @param {TinyMCE} editor
 * @returns {Promise<Modal>}
 */
const showDialog = async(editor) => {
    const body = new DOMParser().parseFromString(editor.getContent(), 'text/html').body;
    const label = document.querySelector(`label[for="${editor.id}"]`);
    const meta = {
        fieldLabel: label ? label.textContent : '',
        pageTitle: document.title,
        date: today(),
    };
    const result = formatWordList(collectEntries(body), meta, await getLabels());
    const summary = await getString('listsummary', component, result);

    const modal = await ListModal.create({
        templateContext: {
            elementid: `${editor.id}_tiny_ruby`,
            hasentries: result.text !== '',
            text: result.text,
            summary,
            wordlisturl: getWordListUrl(editor),
        },
    });
    const root = modal.getRoot()[0];
    const button = root.querySelector('[data-action="copy"]');
    if (!button || button.disabled) {
        return modal;
    }
    button.addEventListener('click', async(e) => {
        e.preventDefault();
        const textarea = root.querySelector('[data-region="list"]');
        const message = root.querySelector('[data-region="message"]');
        // Reported inside the dialog: a core/toast would sit behind the modal on Boost 5.x
        // (.toast-wrapper z-index 1051 < $zindex-modal 1055).
        const copied = await copy(textarea);
        message.textContent = await getString(copied ? 'copied' : 'copymanual', component);
        message.classList.toggle('text-success', copied);
    });
    return modal;
};
