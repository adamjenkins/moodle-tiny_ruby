# Changes

## v0.1.2 (2026100400)

- The plugin's maturity is now Beta (it was Alpha).
- composer.json now requires `moodle/moodle` `^4.5 || ^5.0` rather than `>=4.5 <5.4`, so later
  Moodle 5.x releases are no longer excluded.
- Releases are now also published to the camp plugin registry (camp-registry.org), with the
  plugin's listing text kept in `.camp/listing.yml`.
- Continuous integration now tests against the released Moodle 5.3 (`MOODLE_503_STABLE`) instead
  of Moodle's development branch.
