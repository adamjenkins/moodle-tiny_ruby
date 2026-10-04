# Changelog

All notable changes to the Ruby (furigana) TinyMCE plugin (tiny_ruby) are
documented here. Entries are ordered newest-first.

---

## [0.1.2] - 2026-10-04

### Added

- `.camp/listing.yml`, the plugin's listing content on the camp registry (camp-registry.org), and
  a camp release workflow (`.github/workflows/camp-release.yml`) that publishes each tagged
  release there.

### Changed

- Maturity is now Beta (`MATURITY_BETA`); it was Alpha.
- composer.json requires `moodle/moodle` `^4.5 || ^5.0` instead of `>=4.5 <5.4`: the explicit
  upper cap is dropped so later Moodle 5.x releases are not excluded.
- CI tests `MOODLE_503_STABLE` (PHP 8.3–8.4, PostgreSQL 17, MariaDB 11.4) instead of Moodle
  `main`, now that Moodle 5.3 is released.

## [0.1.1] - 2026-09-27

### Added

- `composer.json` (package `adamjenkins/moodle-tiny_ruby`, type `moodle-tiny`),
  for installation from Packagist. It requires `adamjenkins/moodle-filter_ruby`
  `^1.0`, matching the `filter_ruby` dependency in `version.php`.

### Changed

- Declare Moodle 5.3 support (`$plugin->supported` is now `[405, 503]`).
- Continuous integration also runs Moodle `main` (5.3beta), non-blocking.

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
