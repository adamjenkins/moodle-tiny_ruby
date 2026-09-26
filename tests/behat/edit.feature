@editor @editor_tiny @tiny @tiny_ruby @javascript
Feature: Edit furigana markup with the Furigana dialog
  In order to add readings without typing the filter's markup by hand
  As a teacher
  I need a dialog that inserts, changes and removes inline furigana

  # Note: the pipe of the braces syntax is written plainly in step arguments; only a Gherkin
  # table cell would need it escaped. Selection and caret steps are in behat_tiny_ruby.php.

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
      | activity | course | name   | content        | contentformat |
      | page     | JPN1   | Lesson | <p>placeholder</p> | 1         |

  Scenario: Selected text becomes the word and the markup replaces it
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢字を勉強します。</p>"
    When I select the text "漢字" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then the field "Word" matches value "漢字"
    And I should not see "Remove furigana"
    And I set the field "Reading" to "かんじ"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は{漢字|かんじ}を勉強します。</p>"
    # TinyMCE leaves the caret in the paragraph element after an insert; it still touches the markup.
    When I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then the field "Reading" matches value "かんじ"
    And I should see "Remove furigana"
    And I click on "Cancel" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は{漢字|かんじ}を勉強します。</p>"

  Scenario: With nothing selected the markup is inserted at the caret
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢字を</p>"
    When I place the caret after "今日は" in the "Page content" TinyMCE editor
    And I click on the "Insert > Furigana" menu item for the "Page content" TinyMCE editor
    Then the field "Word" matches value ""
    And the ".modal.show [data-action='save']" "css_element" should be disabled
    # Focus starts in Word: typing without clicking a field first must land there.
    And I type "勉強"
    And the field "Word" matches value "勉強"
    And I set the field "Reading" to "べんきょう"
    # Enter saves.
    And I press enter
    Then the field "Page content" matches value "<p>今日は{勉強|べんきょう}漢字を</p>"

  Scenario: The admin setting chooses the syntax of new markup
    Given the following config values are set as admin:
      | syntax | aozora | tiny_ruby |
    And I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢字を</p>"
    When I select the text "漢字" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    And I set the field "Reading" to "かんじ"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は｜漢字《かんじ》を</p>"

  Scenario: Existing braces markup is edited in place, from a caret inside it
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は{漢字|かな}を</p>"
    When I place the caret after "{漢" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then the field "Word" matches value "漢字"
    And the field "Reading" matches value "かな"
    And I set the field "Reading" to "かんじ"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は{漢字|かんじ}を</p>"

  Scenario: Editing keeps the syntax the markup already has
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は｜漢字《かな》を</p>"
    When I place the caret after "今日は" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then the field "Reading" matches value "かな"
    And I set the field "Reading" to "かんじ"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は｜漢字《かんじ》を</p>"

  Scenario: Remove replaces the markup with its word
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は{漢字|かんじ}を</p>"
    When I place the caret after "かん" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    And I click on "Remove furigana" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は漢字を</p>"

  Scenario: Delimiters are refused, a non-kana reading is only a warning, and text is escaped
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は</p>"
    When I place the caret after "今日は" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    And I set the field "Word" to "漢|字"
    Then I should see "This cannot contain {, }, | or a line break."
    And the ".modal.show [data-action='save']" "css_element" should be disabled
    And I set the field "Word" to "漢字"
    And I set the field "Reading" to "<b>"
    Then I should see "This reading is not all kana."
    And the ".modal.show [data-action='save']" "css_element" should be enabled
    And I click on "Save" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は{漢字|&lt;b&gt;}</p>"

  Scenario: Remove works on Aozora markup too
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は｜漢字《かんじ》を</p>"
    When I place the caret after "今日は｜漢" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    And I click on "Remove furigana" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は漢字を</p>"

  Scenario: A formatted selection is flagged, and an empty reading writes a suppression
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は<strong>漢字</strong>を</p>"
    When I select the "strong" element in position "0" of the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then I should see "The selected text contains formatting, which will be removed." in the "Furigana" "dialogue"
    And I should see "Leave empty to show no furigana for this word." in the "Furigana" "dialogue"
    And the field "Word" matches value "漢字"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    Then the field "Page content" matches value "<p>今日は{漢字|}を</p>"

  Scenario: A selection across paragraphs cannot become one word
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢</p><p>字を</p>"
    When I select from "漢" to "字" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then I should see "The selected text spans more than one line." in the "Furigana" "dialogue"
    And the ".modal.show [data-action='save']" "css_element" should be disabled

  Scenario: Markup where the filter does not render it gets a warning
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>例: <code>漢字</code></p>"
    When I select the text "漢字" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    Then I should see "The filter does not show furigana here" in the "Furigana" "dialogue"
