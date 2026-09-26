@editor @editor_tiny @tiny @tiny_ruby @filter_ruby @javascript
Feature: What tiny_ruby writes is what filter_ruby reads
  In order to trust the editor tools
  As a teacher
  I need the markup and the word list they produce to work in the real filter

  # These scenarios are the enforcement of dev-docs/ruby/RELATIONS.md: they run the real
  # filter_ruby, so a change on either side that breaks the contract fails here.

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Taro      | Teacher  | teacher1@example.com |
      | student1 | Hanako    | Student  | student1@example.com |
    And the following "courses" exist:
      | fullname   | shortname |
      | Japanese 1 | JPN1      |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | JPN1   | editingteacher |
      | student1 | JPN1   | student        |
    And the following "activities" exist:
      | activity | course | name    | content                | contentformat |
      | page     | JPN1   | Lesson  | <p>placeholder</p>     | 1             |
      | page     | JPN1   | Reading | <p>昨日も漢字を読んだ</p> | 1             |
    And the "ruby" filter is "on"
    # Pin the tier dictionaries off, so a rendered reading can only come from what tiny_ruby wrote.
    And the following config values are set as admin:
      | tier_elementary | 0 | filter_ruby |
      | tier_jhs        | 0 | filter_ruby |
      | tier_shs        | 0 | filter_ruby |
      | tier_university | 0 | filter_ruby |

  Scenario: Markup inserted with the dialog is rendered by the filter
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢字を</p>"
    And I select the text "漢字" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    And I set the field "Reading" to "かんじ"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    And I press "Save and display"
    Then "//ruby[contains(concat(' ', normalize-space(@class), ' '), ' filter_ruby ')][contains(., '漢字')]/rt[normalize-space(.) = 'かんじ']" "xpath_element" should exist
    And I should not see "{漢字|かんじ}"

  Scenario: The copied word list pastes into the course word list without problems
    Given I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>{漢字|かんじ}と{昨日|きのう}。{生|なま}{生|せい}{金|}{お茶|おちゃ}{漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢漢|かん}<code>{無視|むし}</code></p>"
    And I click on the "Furigana word list" button for the "Page content" TinyMCE editor
    And I store the furigana word list
    # The link opens a new tab, so check where it points rather than following it.
    And "//a[contains(@href, '/filter/manage.php?contextid=') and contains(@href, 'filter=ruby') and @target='_blank']" "xpath_element" should exist in the "Furigana word list" "dialogue"
    And I click on "Close" "button" in the "Furigana word list" "dialogue"
    And I press "Cancel"
    When I am on the "JPN1" "course" page
    And I navigate to "Filters" in current page administration
    And I click on the "Settings" link in the table row containing "Ruby (furigana)"
    And I set the field "Word list" to the stored furigana word list
    And I press "Save changes"
    Then I should not see "Each line must read"
    And I should not see "Put one word on each line"
    And I should not see "The line has still been saved"
    And I click on the "Settings" link in the table row containing "Ruby (furigana)"
    # Read the saved list back out of the form (not the redirect), as filter_ruby's own feature does.
    And "//textarea[contains(., '漢字=かんじ') and contains(., '昨日=きのう') and contains(., '金=')]" "xpath_element" should exist
    And "//textarea[contains(., '# skipped (does not start with a kanji): お茶') and contains(., '# skipped (longer than 32 characters)')]" "xpath_element" should exist
    And "//textarea[contains(., '無視')]" "xpath_element" should not exist
    When I am on the "Reading" "page activity" page logged in as "student1"
    Then "//ruby[contains(concat(' ', normalize-space(@class), ' '), ' filter_ruby ')][contains(., '漢字')]/rt[normalize-space(.) = 'かんじ']" "xpath_element" should exist
    And "//ruby[contains(concat(' ', normalize-space(@class), ' '), ' filter_ruby ')][contains(., '昨日')]/rt[normalize-space(.) = 'きのう']" "xpath_element" should exist

  Scenario: Aozora markup inserted with the dialog is rendered by the filter
    Given the following config values are set as admin:
      | syntax | aozora | tiny_ruby |
    And I am on the "Lesson" "page activity editing" page logged in as "teacher1"
    And I set the field "Page content" to "<p>今日は漢字を</p>"
    And I select the text "漢字" in the "Page content" TinyMCE editor
    And I click on the "Furigana" button for the "Page content" TinyMCE editor
    And I set the field "Reading" to "かんじ"
    And I click on "Save" "button" in the "Furigana" "dialogue"
    And I press "Save and display"
    Then "//ruby[contains(concat(' ', normalize-space(@class), ' '), ' filter_ruby ')][contains(., '漢字')]/rt[normalize-space(.) = 'かんじ']" "xpath_element" should exist
    And I should not see "｜漢字《かんじ》"
