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
 * Tiny Ruby commands: the Furigana and Furigana word list buttons and menu items.
 *
 * @module      tiny_ruby/commands
 * @copyright   2026 Adam Jenkins <adam@wisecat.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getStrings} from 'core/str';
import Notification from 'core/notification';
import {component, buttonName, listButtonName, icon, listIcon} from 'tiny_ruby/common';
import {openEditDialog} from 'tiny_ruby/editdialog';
import {openListDialog} from 'tiny_ruby/listdialog';

// The kanji 漢 with a small reading bar above it, drawn for this plugin.
const ICON_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="7" y="2" width="10" height="2" rx="1" fill="currentColor"/>'
    + '<text x="12" y="21" font-size="14" text-anchor="middle" fill="currentColor">漢</text></svg>';

// Three list lines, each with a small reading bar: a word list.
const LIST_ICON_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
    + '<g fill="currentColor"><rect x="3" y="4" width="4" height="1.5" rx=".75"/><rect x="3" y="6.5" width="18" height="2" rx="1"/>'
    + '<rect x="3" y="11" width="4" height="1.5" rx=".75"/><rect x="3" y="13.5" width="14" height="2" rx="1"/>'
    + '<rect x="3" y="18" width="4" height="1.5" rx=".75"/><rect x="3" y="20.5" width="16" height="2" rx="1"/></g></svg>';

export const getSetup = async() => {
    const [buttonText, listButtonText] = await getStrings([
        {key: 'buttontitle', component},
        {key: 'listbuttontitle', component},
    ]);
    const run = (action, editor) => () => action(editor).catch(Notification.exception);

    return (editor) => {
        editor.ui.registry.addIcon(icon, ICON_SVG);
        editor.ui.registry.addIcon(listIcon, LIST_ICON_SVG);

        editor.ui.registry.addButton(buttonName, {icon, tooltip: buttonText, onAction: run(openEditDialog, editor)});
        editor.ui.registry.addMenuItem(buttonName, {icon, text: buttonText, onAction: run(openEditDialog, editor)});

        editor.ui.registry.addButton(listButtonName, {
            icon: listIcon,
            tooltip: listButtonText,
            onAction: run(openListDialog, editor),
        });
        editor.ui.registry.addMenuItem(listButtonName, {
            icon: listIcon,
            text: listButtonText,
            onAction: run(openListDialog, editor),
        });
    };
};
