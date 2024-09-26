Feature: Multi Input Field

  Background:
    Given loading overridden form json "multi-input-field" and it exists

  Scenario: Testing if multi input field is a mandatory field to be updated
    And I navigate to the "multi-input-field" form with session identifier "045a5791-1d76-45e6-a926-7d4ff26b4112"
    And I continue
    And I continue
    Then I see the error "Test multi input field 1 is required" for "Test multi input field 1" component
