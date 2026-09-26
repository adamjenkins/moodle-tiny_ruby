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

namespace tiny_ruby;

use context;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;
use editor_tiny\plugin_with_menuitems;
use moodle_url;

/**
 * Tiny Ruby plugin info.
 *
 * @package    tiny_ruby
 * @copyright  2026 Adam Jenkins <adam@wisecat.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements plugin_with_buttons, plugin_with_configuration, plugin_with_menuitems {
    /** @var string Inline markup written as {漢字|かんじ}. */
    const SYNTAX_BRACES = 'braces';

    /** @var string Inline markup written as ｜漢字《かんじ》. */
    const SYNTAX_AOZORA = 'aozora';

    /**
     * Whether the plugin is enabled for this editor instance.
     *
     * @param context $context The context the editor is used in
     * @param array $options The editor options
     * @param array $fpoptions The file picker options
     * @param editor|null $editor The editor instance
     * @return bool
     */
    public static function is_enabled(context $context, array $options, array $fpoptions, ?editor $editor = null): bool {
        return has_capability('tiny/ruby:use', $context);
    }

    /**
     * Get the buttons this plugin provides.
     *
     * @return array
     */
    public static function get_available_buttons(): array {
        return ['tiny_ruby/tiny_ruby', 'tiny_ruby/tiny_ruby_list'];
    }

    /**
     * Get the menu items this plugin provides.
     *
     * @return array
     */
    public static function get_available_menuitems(): array {
        return ['tiny_ruby/tiny_ruby', 'tiny_ruby/tiny_ruby_list'];
    }

    /**
     * Get the configuration passed to the editor.
     *
     * @param context $context The context the editor is used in
     * @param array $options The editor options
     * @param array $fpoptions The file picker options
     * @param editor|null $editor The editor instance
     * @return array
     */
    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): array {
        $syntax = get_config('tiny_ruby', 'syntax');
        return [
            'syntax' => $syntax === self::SYNTAX_AOZORA ? self::SYNTAX_AOZORA : self::SYNTAX_BRACES,
            'wordlisturl' => self::word_list_url($context),
        ];
    }

    /**
     * The course word-list settings page for the course around a context, if the user may use it.
     *
     * The link needs a real course (not the front page), moodle/filter:manage there, and
     * filter_ruby available there: /filter/manage.php checks the first two itself and throws
     * when a filter is not available in the context.
     *
     * @param context $context The context the editor is used in
     * @return string The URL, or '' when there is no page to link to.
     */
    private static function word_list_url(context $context): string {
        $coursecontext = $context->get_course_context(false);
        if (!$coursecontext || $coursecontext->instanceid == SITEID) {
            return '';
        }
        if (!has_capability('moodle/filter:manage', $coursecontext)) {
            return '';
        }
        // One small query per editor for users with filter:manage. Accepted (review 2026-09-26):
        // a request-static cache would outlive a filter state change within one PHPUnit test.
        if (!array_key_exists('ruby', filter_get_available_in_context($coursecontext))) {
            return '';
        }
        return (new moodle_url('/filter/manage.php', ['contextid' => $coursecontext->id, 'filter' => 'ruby']))->out(false);
    }
}
