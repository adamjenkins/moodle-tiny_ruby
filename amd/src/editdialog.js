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
 * The Furigana dialog: insert, change or remove one piece of inline markup.
 *
 * @module      tiny_ruby/editdialog
 * @copyright   2026 Adam Jenkins <adam@wisecat.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Modal from 'core/modal';
import ModalEvents from 'core/modal_events';
import Notification from 'core/notification';
import {getStrings} from 'core/str';
import {component} from 'tiny_ruby/common';
import {build, findRange, isSkipZone, validate} from 'tiny_ruby/markup';
import {getSyntax} from 'tiny_ruby/options';

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

// The dialog open for each editor, or OPENING while it is being built: a second click
// must not open another. Tracked by whether the dialog is still in the page, not by
// ModalEvents.destroyed: core/modal's destroy() removes the root, and with it every
// handler bound there, before it triggers that event (modal.js destroy(), 4.5 and 5.2).
const OPENING = Symbol('opening');
const openDialogs = new WeakMap();

class EditModal extends Modal {
    static TYPE = 'tiny_ruby/editdialog';
    static TEMPLATE = 'tiny_ruby/editdialog';

    registerEventListeners() {
        super.registerEventListeners();
        this.registerCloseOnCancel();
    }

    configure(modalConfig) {
        modalConfig.show = true;
        modalConfig.removeOnClose = true;
        super.configure(modalConfig);
    }
}
EditModal.registerModalType();

/**
 * The run of adjacent text nodes around a text node: the text between two tags,
 * which is what the filter matches markup in.
 *
 * @param {Text} node
 * @returns {Text[]}
 */
const textRun = (node) => {
    let first = node;
    while (first.previousSibling && first.previousSibling.nodeType === TEXT_NODE) {
        first = first.previousSibling;
    }
    const nodes = [];
    for (let n = first; n && n.nodeType === TEXT_NODE; n = n.nextSibling) {
        nodes.push(n);
    }
    return nodes;
};

/**
 * Offset of a point in a text run, counted from the start of the run.
 *
 * @param {Text[]} nodes
 * @param {Text} node
 * @param {number} offset
 * @returns {number}
 */
const runOffset = (nodes, node, offset) => {
    let total = 0;
    for (const n of nodes) {
        if (n === node) {
            return total + offset;
        }
        total += n.length;
    }
    return total;
};

/**
 * The node and offset of a run offset.
 *
 * @param {Text[]} nodes
 * @param {number} offset
 * @returns {Array} [Text, number]
 */
const runPoint = (nodes, offset) => {
    let rest = offset;
    for (const n of nodes) {
        if (rest <= n.length) {
            return [n, rest];
        }
        rest -= n.length;
    }
    const last = nodes[nodes.length - 1];
    return [last, last.length];
};

/**
 * Express a range boundary as a point in a text node.
 *
 * TinyMCE often leaves the caret in the element, between children, e.g. right after
 * text it has just inserted. The text node before the point is preferred, so a caret
 * just after markup still counts as touching it.
 *
 * @param {Node} container
 * @param {number} offset
 * @returns {Array|null} [Text, number], or null when no text node touches the point.
 */
const textPoint = (container, offset) => {
    if (container.nodeType === TEXT_NODE) {
        return [container, offset];
    }
    const before = container.childNodes[offset - 1];
    if (before && before.nodeType === TEXT_NODE) {
        return [before, before.length];
    }
    const after = container.childNodes[offset];
    if (after && after.nodeType === TEXT_NODE) {
        return [after, 0];
    }
    return null;
};

/**
 * Find the markup the caret or selection is in.
 *
 * @param {Range} rng
 * @returns {{nodes: Text[], match: object}|null}
 */
const locate = (rng) => {
    const start = textPoint(rng.startContainer, rng.startOffset);
    const end = rng.collapsed ? start : textPoint(rng.endContainer, rng.endOffset);
    if (start === null || end === null) {
        return null;
    }
    const nodes = textRun(start[0]);
    if (!nodes.includes(end[0])) {
        return null;
    }
    const text = nodes.map((n) => n.data).join('');
    const match = findRange(text, runOffset(nodes, ...start), runOffset(nodes, ...end));
    return match ? {nodes, match} : null;
};

/**
 * Whether a range sits where the filter renders no markup (code, pre, class nolink, ruby...).
 *
 * @param {Range} rng
 * @param {Element} body The editor body, where the search stops.
 * @returns {boolean}
 */
const inSkipZone = (rng, body) => {
    for (let n = rng.commonAncestorContainer; n && n !== body; n = n.parentNode) {
        if (n.nodeType === ELEMENT_NODE && isSkipZone(n)) {
            return true;
        }
    }
    return false;
};

/**
 * Replace a range with plain text as one undo step.
 *
 * @param {TinyMCE} editor
 * @param {Range} rng
 * @param {string} text
 */
const replace = (editor, rng, text) => {
    editor.focus();
    editor.undoManager.transact(() => {
        editor.selection.setRng(rng);
        // Not selection.setContent(): deprecated from TinyMCE 8 (Moodle 5.2).
        editor.insertContent(editor.dom.encode(text));
    });
};

/**
 * Open the Furigana dialog for the editor's current caret or selection.
 *
 * @param {TinyMCE} editor
 * @returns {Promise<void>}
 */
export const openEditDialog = async(editor) => {
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
    const saved = editor.selection.getRng().cloneRange();
    const target = locate(saved);
    const syntax = target ? target.match.syntax : getSyntax(editor);

    let base = '';
    let reading = '';
    let formattinglost = false;
    let multiline = false;
    if (target) {
        base = target.match.base;
        reading = target.match.reading;
    } else if (!editor.selection.isCollapsed()) {
        // A text input drops line breaks silently, so detect them here: a selection over
        // several lines or paragraphs cannot become one word.
        const text = editor.selection.getContent({format: 'text'}).replace(/^[\r\n]+|[\r\n]+$/g, '');
        multiline = /[\r\n]/.test(text);
        base = text.replace(/[\r\n]+/g, ' ');
        formattinglost = /<[a-z]/i.test(editor.selection.getContent());
    }

    const [required, delimiter, notkana] = await getStrings([
        {key: 'error_required', component},
        {key: `error_delimiter_${syntax}`, component},
        {key: 'warning_notkana', component},
    ]);
    const messages = {required, delimiter, notkana};

    const modal = await EditModal.create({
        templateContext: {
            elementid: `${editor.id}_tiny_ruby`,
            base,
            reading,
            isediting: target !== null,
            formattinglost,
            multiline,
            skipzone: inSkipZone(saved, editor.getBody()),
        },
    });
    const root = modal.getRoot()[0];
    const field = (name) => root.querySelector(`[data-field="${name}"]`);
    const save = root.querySelector('[data-action="save"]');

    const check = () => {
        const result = validate(field('base').value, field('reading').value, syntax);
        for (const name of ['base', 'reading']) {
            const error = result.errors[name];
            field(name).classList.toggle('is-invalid', error !== undefined);
            field(name).setAttribute('aria-invalid', error !== undefined ? 'true' : 'false');
            root.querySelector(`[data-feedback="${name}"]`).textContent = error ? messages[error] : '';
        }
        const warning = root.querySelector('[data-warning="reading"]');
        warning.textContent = result.warnings.reading ? messages.notkana : '';
        warning.hidden = !result.warnings.reading;
        save.disabled = multiline || Object.keys(result.errors).length > 0;
        return save.disabled === false;
    };

    const commit = (text) => {
        let rng = saved;
        if (target) {
            rng = editor.dom.createRng();
            rng.setStart(...runPoint(target.nodes, target.match.start));
            rng.setEnd(...runPoint(target.nodes, target.match.end));
        }
        modal.destroy();
        try {
            replace(editor, rng, text);
        } catch (e) {
            Notification.exception(e);
        }
    };

    field('base').addEventListener('input', check);
    field('reading').addEventListener('input', check);
    root.querySelector('form').addEventListener('keydown', (e) => {
        // Enter saves, except the Enter that commits a Japanese IME conversion.
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            save.click();
        }
    });
    save.addEventListener('click', (e) => {
        e.preventDefault();
        if (check()) {
            commit(build(field('base').value, field('reading').value, syntax));
        }
    });
    const remove = root.querySelector('[data-action="remove"]');
    if (remove) {
        remove.addEventListener('click', (e) => {
            e.preventDefault();
            commit(target.match.base);
        });
    }

    // Show problems with prefilled text at once, but not "required" on an empty new dialog.
    if (base !== '' || reading !== '') {
        check();
    } else {
        save.disabled = true;
    }
    // The modal moves focus to itself once shown, which happens after this code runs, so
    // focus the field on the shown event rather than now.
    const first = base === '' ? field('base') : field('reading');
    modal.getRoot().on(ModalEvents.shown, () => first.focus());
    return modal;
};
