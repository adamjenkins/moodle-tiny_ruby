# Changelog

All notable changes to the Ruby (furigana) TinyMCE plugin (tiny_ruby) are
documented here. Entries are ordered newest-first.

---

## [0.1.0] - 2026-09-27

### Added

- `tiny_ruby\plugininfo`, with two buttons and menu items and the configuration
  `syntax` and `wordlisturl`, gated by the `tiny/ruby:use` capability.
- `amd/src/markup.js`: the only home of the rules copied from `filter_ruby`.
  That covers the inline pattern, skip zones, word-list format, the 32-character
  limit, the kana test and the rule that a word must start with a kanji. The
  suite's `RELATIONS.md` lists each with its source.
- The Furigana edit dialog and the word-list dialog, with in-dialog copy
  feedback and a clipboard fallback for non-secure (HTTP) sites.
- Admin setting `tiny_ruby/syntax` (`braces` by default, or `aozora`).
- PHPUnit tests for the configuration and privacy provider. Behat features for
  editing, the word list, and a contract suite that runs the real filter.
- GitHub Actions moodle-plugin-ci workflow for MOODLE_502_STABLE (PHP 8.3 with
  MariaDB 10.11, PHP 8.4 with PostgreSQL 16), installing filter_ruby first.
