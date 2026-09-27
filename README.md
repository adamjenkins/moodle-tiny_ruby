Ruby (furigana) for TinyMCE
===========================

A TinyMCE editor plugin for Moodle that works with the
[Ruby (furigana) filter](https://github.com/adamjenkins/moodle-filter_ruby)
(`filter_ruby`). It adds two tools to the editor:

- **Furigana** (toolbar and Insert menu) adds, changes and removes the
  filter's inline furigana markup through a dialog. Select 漢字, press the
  button, type かんじ, and the text becomes `{漢字|かんじ}`, which the filter
  shows as furigana. With the cursor inside existing markup, the same button
  edits it or removes it.
- **Furigana word list** (toolbar and Tools menu) collects every furigana entry
  in the text and formats it as a filter word list (`漢字=かんじ`, one per
  line), ready to copy and paste into a course word list. That way the readings
  of one text apply everywhere in the course. Teachers who can manage the
  course's filters also get a link straight to the course word list.

Requirements
------------

- Moodle 4.5 to 5.3.
- The Ruby (furigana) filter, `filter_ruby`, which this plugin depends on.

Settings
--------

*Site administration → Plugins → Text editors → TinyMCE editor → Ruby (furigana)*

- **Markup syntax**: whether the dialog writes new furigana as `{漢字|かんじ}`
  (the default) or as `｜漢字《かんじ》`. The filter reads both forms. The
  dialog edits both too, and keeps the form an entry already has.

The capability `tiny/ruby:use` controls both tools. It is allowed for every
authenticated user by default, the same as core TinyMCE plugins.

How the word list is built
--------------------------

- Furigana is collected from both inline syntaxes, and from `<ruby>` HTML
  already in the text. Per-character ruby such as 東(とう)京(きょう) is joined
  into one word, 東京=とうきょう.
- Text the filter does not touch is skipped, the same way the filter skips it:
  `code`, `pre` and `class="nolink"` regions.
- Each word is listed once, in the order it first appears. If a word appears
  with different readings, the last one is kept, the same way a later line wins
  in the filter's list, and the others are noted in a `#` comment above it.
- An entry with an empty reading, such as `{金|}`, is listed as `金=`. In the
  filter that means "leave this word alone".
- Anything the filter's word list would reject is written as a `#` comment
  instead of an entry, so the paste always saves. That is a word longer than
  32 characters, a word containing `=`, or a word starting with `#`.
- The list is editable in the dialog before you copy it. On a site served over
  plain HTTP the browser's clipboard API is not available, so the dialog falls
  back to selecting the text for Ctrl+C / ⌘C.

Privacy
-------

The plugin stores no personal data.

License
-------

GNU GPL v3 or later. See `LICENSE`.
