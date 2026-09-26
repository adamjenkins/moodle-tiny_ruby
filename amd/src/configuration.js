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
 * Tiny Ruby configuration: both buttons in the "content" toolbar group, Furigana in
 * the Insert menu and the word list in the Tools menu. Without configure(), a
 * registered button never appears in the editor.
 *
 * @module      tiny_ruby/configuration
 * @copyright   2026 Adam Jenkins <adam@wisecat.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {buttonName, listButtonName} from 'tiny_ruby/common';
import {addMenubarItem, addToolbarButtons} from 'editor_tiny/utils';

export const configure = (instanceConfig) => {
    let menu = addMenubarItem(instanceConfig.menu, 'insert', buttonName);
    menu = addMenubarItem(menu, 'tools', listButtonName);
    return {
        menu,
        toolbar: addToolbarButtons(instanceConfig.toolbar, 'content', [buttonName, listButtonName]),
    };
};
