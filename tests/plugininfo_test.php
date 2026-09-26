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

/**
 * Tests for the configuration tiny_ruby passes to the editor.
 *
 * @package    tiny_ruby
 * @category   test
 * @copyright  2026 Adam Jenkins <adam@wisecat.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(plugininfo::class)]
final class plugininfo_test extends \advanced_testcase {
    /**
     * Get the configuration for a context as the current user.
     *
     * @param \context $context
     * @return array
     */
    private function config(\context $context): array {
        return plugininfo::get_plugin_configuration_for_context($context, [], []);
    }

    /**
     * The syntax setting defaults to braces, and an unknown stored value falls back to braces.
     */
    public function test_syntax(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $context = \context_system::instance();

        $this->assertSame('braces', $this->config($context)['syntax']);

        set_config('syntax', 'aozora', 'tiny_ruby');
        $this->assertSame('aozora', $this->config($context)['syntax']);

        set_config('syntax', 'nonsense', 'tiny_ruby');
        $this->assertSame('braces', $this->config($context)['syntax']);
    }

    /**
     * An editing teacher gets the course word-list link, from a course or a module context.
     */
    public function test_wordlisturl_for_teacher(): void {
        global $DB;
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $page = $generator->create_module('page', ['course' => $course->id]);
        $teacher = $generator->create_and_enrol($course, 'editingteacher');
        $this->setUser($teacher);
        filter_set_global_state('ruby', TEXTFILTER_ON);

        $coursecontext = \context_course::instance($course->id);
        $expected = (new \moodle_url('/filter/manage.php', [
            'contextid' => $coursecontext->id,
            'filter' => 'ruby',
        ]))->out(false);

        $this->assertSame($expected, $this->config($coursecontext)['wordlisturl']);
        $this->assertSame($expected, $this->config(\context_module::instance($page->cmid))['wordlisturl']);

        // It is moodle/filter:manage specifically that grants the link, not the teacher role.
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);
        assign_capability('moodle/filter:manage', CAP_PROHIBIT, $roleid, $coursecontext->id, true);
        accesslib_clear_all_caches_for_unit_testing();
        $this->assertSame('', $this->config($coursecontext)['wordlisturl']);
        $this->assertSame('', $this->config(\context_module::instance($page->cmid))['wordlisturl']);
    }

    /**
     * A filter that is off by default but available still gets the link: the teacher can turn it on.
     */
    public function test_wordlisturl_filter_off_but_available(): void {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $teacher = $generator->create_and_enrol($course, 'editingteacher');
        $this->setUser($teacher);
        filter_set_global_state('ruby', TEXTFILTER_OFF);

        $this->assertNotSame('', $this->config(\context_course::instance($course->id))['wordlisturl']);
    }

    /**
     * No link without moodle/filter:manage, outside a course, on the front page, or with the filter disabled.
     */
    public function test_wordlisturl_absent(): void {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_and_enrol($course, 'student');
        $coursecontext = \context_course::instance($course->id);
        filter_set_global_state('ruby', TEXTFILTER_ON);

        $this->setUser($student);
        $this->assertSame('', $this->config($coursecontext)['wordlisturl']);

        $this->setAdminUser();
        $this->assertNotSame('', $this->config($coursecontext)['wordlisturl']);
        $this->assertSame('', $this->config(\context_system::instance())['wordlisturl']);
        $this->assertSame('', $this->config(\context_user::instance(get_admin()->id))['wordlisturl']);
        $this->assertSame('', $this->config(\context_course::instance(SITEID))['wordlisturl']);

        filter_set_global_state('ruby', TEXTFILTER_DISABLED);
        $this->assertSame('', $this->config($coursecontext)['wordlisturl']);
    }

    /**
     * The plugin is enabled only with tiny/ruby:use.
     */
    public function test_is_enabled(): void {
        global $DB;
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_and_enrol($course, 'student');
        $coursecontext = \context_course::instance($course->id);
        $this->setUser($student);

        $this->assertTrue(plugininfo::is_enabled($coursecontext, [], []));

        $roleid = $DB->get_field('role', 'id', ['shortname' => 'user'], MUST_EXIST);
        assign_capability('tiny/ruby:use', CAP_PROHIBIT, $roleid, \context_system::instance()->id, true);
        accesslib_clear_all_caches_for_unit_testing();
        $this->assertFalse(plugininfo::is_enabled($coursecontext, [], []));
    }
}
