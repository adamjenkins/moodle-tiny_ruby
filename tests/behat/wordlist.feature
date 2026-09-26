@editor @editor_tiny @tiny @tiny_ruby @javascript
Feature: Copy the text's furigana as a filter word list
  In order to reuse the readings of one text across the whole course
  As a teacher
  I need every furigana entry in the editor collected as a filter_ruby word list

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Taro      | Teacher  | teacher1@example.com |
    And the following "courses" exist:
      | fullname   | shortname |
      | Japanese 1 | JPN1      |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | JPN1   | editingteacher |
    And the following "activities" exist:
      | activity | course | name   | content            | contentformat |
      | page     | JPN1   | Lesson | <p>placeholder</p> | 1             |
    And the "ruby" filter is "on"

  Scenario: Every kind of entry is collected, deduplicated and commented
    # Covered: both inline syntaxes, a conflict (last wins), a suppression, HTML ruby with
    # formatting inside its base, pretty-printed per-character ruby, ruby with no reading
    # (ignored, not a suppression), the filter's skip zones (code, pre, class nolink), a word
    # longer than the filter's 32-character limit, and a word not starting with a kanji.
    # No <rb>: TinyMCE's schema has no rb element and unwraps it (review 2026-09-26).
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>{漢字|かんじ}と｜勉強《べんきょう》。{生|なま}と{生|せい}。{金|}。{漢字|かんじ}</p><p><ruby><strong>日本</strong><rt>にほん</rt></ruby>と<ruby> 東<rt>とう</rt> 京<rt>きょう</rt> </ruby>と<ruby>無読</ruby></p><p><code>{無視|むし}</code><span class=\"nolink\">{除外|じょがい}</span>{あああああああああああああああああああああああああああああああああ|あ}{お茶|おちゃ}</p><pre>{前|まえ}</pre>"
    When I click on the "Furigana word list" button for the "Page content" TinyMCE editor
    Then I should see "Entries: 6. Conflicts: 1. Skipped: 2." in the "Furigana word list" "dialogue"
    And the furigana word list for "Page content" should be:
      """
      漢字=かんじ
      勉強=べんきょう
      # 生: also なま in this text
      生=せい
      金=
      日本=にほん
      東京=とうきょう
      # skipped (longer than 32 characters): あああああああああああああああああああああああああああああああああ
      # skipped (does not start with a kanji): お茶
      """
    And "Open the course word list" "link" should exist in the "Furigana word list" "dialogue"
    When I click on "Copy" "button" in the "Furigana word list" "dialogue"
    Then I should see "The word list was copied to the clipboard." in the "Furigana word list" "dialogue"

  Scenario: Text without furigana gives an empty list
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢字を勉強します。</p>"
    When I click on the "Tools > Furigana word list" menu item for the "Page content" TinyMCE editor
    Then I should see "No furigana found in this text." in the "Furigana word list" "dialogue"
    And the ".modal.show [data-action='copy']" "css_element" should be disabled
