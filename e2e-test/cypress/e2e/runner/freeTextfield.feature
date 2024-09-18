Feature: Rich Text Field

  Background:
    Given loading overridden form json "free-text-field" and it exists

  Scenario: Testing if free text field error message if required
    And I navigate to the "free-text-field" form
    And I continue
    And I continue
    Then I see the error "Free Text Field test max 10 is required" for "Free Text Field test max 10" component

  Scenario: Testing if free text field error message for more than given words
    And I navigate to the "free-text-field" form
    And I continue
    When I enter "this is an free text foeld as r sdf sdf sdf sdf sdf sdf sdf sd sds fsd fs sdf sdf sdf sdf sdf sdfs dfs dfsd fsdfsd sdf sdf sd" into the TinyMCE editor "freeTextField"
    Then I checked for any errors "You have 21 words too many" exists for TinyMCE editor
    And I continue
    Then I see the error "Free Text Field test max 10 must be 10 words or fewer" for "Free Text Field test max 10" component

  Scenario: Testing if free text field is non optional and adding text
    And I navigate to the "free-text-field" form
    And I continue
    When I enter "this is an free text field" into the TinyMCE editor "freeTextField"
    And I continue
    Then I see a summary list with the values
      | title                       | value                      |
      | Free Text Field test max 10 | this is an free text field |
    When I submit the form adapter
    Then I see "Application complete"

  Scenario: Testing if free text field is non optional and adding formatted text
    And I navigate to the "free-text-field" form
    And I continue
    When I enter "<ul><li>item 1</li><li>item 2</li></ul>" into the TinyMCE editor "freeTextField"
    And I continue
    Then I see a summary list with the values
      | title                       | value                                   |
      | Free Text Field test max 10 | <ul><li>item 1</li><li>item 2</li></ul> |
    When I submit the form adapter
    Then I see "Application complete"

