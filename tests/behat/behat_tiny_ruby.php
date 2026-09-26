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

use Behat\Gherkin\Node\PyStringNode;
use Behat\Mink\Exception\ExpectationException;

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.
require_once(__DIR__ . '/../../../../tests/behat/editor_tiny_helpers.php');
require_once(__DIR__ . '/../../../../../../behat/behat_base.php');

/**
 * Steps for tiny_ruby: exact caret and selection placement, and the word list.
 *
 * @package    tiny_ruby
 * @category   test
 * @copyright  2026 Adam Jenkins <adam@wisecat.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_tiny_ruby extends behat_base {
    use editor_tiny_helpers;

    /** @var string The word list read by the last "I store the furigana word list" step. */
    protected static $storedlist = '';

    /**
     * Select part of a text node in the editor: the given text, from an offset, for a length.
     *
     * The first text node containing the text is used. Offsets count UTF-16 code units, as
     * DOM ranges do; all the scenarios use BMP characters, where that is one per character.
     *
     * @param string $text Text to find in a single text node.
     * @param int $from Offset within the found text where the selection starts.
     * @param int $length Selection length; 0 places a caret.
     * @param string $locator The editor field.
     */
    protected function select_text_range(string $text, int $from, int $length, string $locator): void {
        $this->require_tiny_tags();
        $editorid = $this->get_textarea_for_locator($locator)->getAttribute('id');
        $needle = json_encode($text);
        $found = $this->evaluate_javascript_for_editor($editorid, <<<EOF
            const needle = {$needle};
            const doc = instance.getDoc();
            const walker = doc.createTreeWalker(instance.getBody(), NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                const at = node.data.indexOf(needle);
                if (at !== -1) {
                    const rng = doc.createRange();
                    rng.setStart(node, at + {$from});
                    rng.setEnd(node, at + {$from} + {$length});
                    instance.focus();
                    instance.selection.setRng(rng);
                    resolve(true);
                    return;
                }
            }
            resolve(false);
            EOF);
        if (!$found) {
            throw new ExpectationException("Text '{$text}' not found in one text node of '{$locator}'", $this->getSession());
        }
    }

    /**
     * Select exactly the given text in the editor.
     *
     * @Given /^I select the text "(?P<text_string>(?:[^"]|\\")*)" in the "(?P<locator_string>(?:[^"]|\\")*)" TinyMCE editor$/
     * @param string $text
     * @param string $locator
     */
    public function i_select_the_text(string $text, string $locator): void {
        $this->select_text_range($text, 0, mb_strlen($text), $locator);
    }

    /**
     * Put a collapsed caret right after the given text in the editor.
     *
     * @Given /^I place the caret after "(?P<text_string>(?:[^"]|\\")*)" in the "(?P<locator_string>(?:[^"]|\\")*)" TinyMCE editor$/
     * @param string $text
     * @param string $locator
     */
    public function i_place_the_caret_after(string $text, string $locator): void {
        $this->select_text_range($text, mb_strlen($text), 0, $locator);
    }

    /**
     * Select from the start of one text to the end of another, across elements.
     *
     * @Given I select from :from to :to in the :locator TinyMCE editor
     * @param string $from Text whose start begins the selection.
     * @param string $to Text whose end ends the selection.
     * @param string $locator The editor field.
     */
    public function i_select_from_to(string $from, string $to, string $locator): void {
        $this->require_tiny_tags();
        $editorid = $this->get_textarea_for_locator($locator)->getAttribute('id');
        $fromjs = json_encode($from);
        $tojs = json_encode($to);
        $found = $this->evaluate_javascript_for_editor($editorid, <<<EOF
            const find = (needle) => {
                const walker = instance.getDoc().createTreeWalker(instance.getBody(), NodeFilter.SHOW_TEXT);
                let node;
                while ((node = walker.nextNode())) {
                    const at = node.data.indexOf(needle);
                    if (at !== -1) {
                        return [node, at];
                    }
                }
                return null;
            };
            const start = find({$fromjs});
            const end = find({$tojs});
            if (!start || !end) {
                resolve(false);
                return;
            }
            const rng = instance.getDoc().createRange();
            rng.setStart(start[0], start[1]);
            rng.setEnd(end[0], end[1] + {$tojs}.length);
            instance.focus();
            instance.selection.setRng(rng);
            resolve(true);
            EOF);
        if (!$found) {
            throw new ExpectationException("Text '{$from}' or '{$to}' not found in '{$locator}'", $this->getSession());
        }
    }

    /**
     * Read the word list dialog's textarea.
     *
     * @return string
     */
    protected function get_word_list(): string {
        return (string) $this->evaluate_script(
            "return document.querySelector('.modal.show [data-region=\"list\"]').value;"
        );
    }

    /**
     * Assert the word list, with its dated header line checked by shape only.
     *
     * The header is "# <field label> — <page title>, <YYYY-MM-DD>"; the title and date vary.
     *
     * @Then /^the furigana word list for "(?P<label_string>(?:[^"]|\\")*)" should be:$/
     * @param string $label The field label expected at the start of the header.
     * @param PyStringNode $expected The lines after the header.
     */
    public function the_furigana_word_list_should_be(string $label, PyStringNode $expected): void {
        $lines = explode("\n", $this->get_word_list());
        $header = array_shift($lines);
        $pattern = '/^# ' . preg_quote($label, '/') . ' — .+, \d{4}-\d{2}-\d{2}$/u';
        if (!preg_match($pattern, $header)) {
            throw new ExpectationException("Unexpected word list header: '{$header}'", $this->getSession());
        }
        $actual = implode("\n", $lines);
        if ($actual !== $expected->getRaw()) {
            throw new ExpectationException("Word list was:\n{$actual}", $this->getSession());
        }
    }

    /**
     * Remember the word list dialog's text for a later paste.
     *
     * @When I store the furigana word list
     */
    public function i_store_the_furigana_word_list(): void {
        self::$storedlist = $this->get_word_list();
        if (self::$storedlist === '') {
            throw new ExpectationException('The word list is empty', $this->getSession());
        }
    }

    /**
     * Paste the stored word list into a form field, as an author would.
     *
     * @When /^I set the field "(?P<field_string>(?:[^"]|\\")*)" to the stored furigana word list$/
     * @param string $field
     */
    public function i_set_the_field_to_the_stored_word_list(string $field): void {
        $this->execute('behat_forms::i_set_the_field_to', [$field, self::$storedlist]);
    }
}
