# Changes

## Unreleased

- Declare Moodle 5.3 support.

## v0.1.0 (2026092700)

- Initial version, a companion to the Ruby (furigana) filter (`filter_ruby`).
- **Furigana** dialog (toolbar and Insert menu): adds, changes and removes the
  filter's inline markup, `{漢字|かんじ}` or `｜漢字《かんじ》`. It fills in the
  selection or the markup under the cursor, keeps the syntax an entry already
  has, and checks the input against the filter's own pattern.
- **Furigana word list** dialog (toolbar and Tools menu): collects every
  furigana entry in the text, including existing `<ruby>` HTML, as a filter word
  list ready to paste into a course word list. Entries the filter could never
  use are written as comments instead. For teachers who can manage the course's
  filters, it links to the course word list.
- Admin setting for the syntax the dialog writes.
- Requires Moodle 4.5 or later and `filter_ruby`. Continuous integration tests
  Moodle 5.2 (PHP 8.3 and 8.4, MariaDB and PostgreSQL).
