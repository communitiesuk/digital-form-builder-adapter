Feature: Date validation

  Background:
    Given the form "date" exists

  Scenario: Errors appear for missing date parts
    When I navigate to the "date" form
    When I enter the day "25" for "maxFiveDaysInFuture"
    And I continue
    Then I see the error "Enter a date at most 5 days in the future must include a month" for component "Enter a date at most 5 days in the future"
    When I enter the month "12" for "maxFiveDaysInFuture"
    And I continue
    Then I see the error "Enter a date at most 5 days in the future must include a year" for component "Enter a date at most 5 days in the future"
    When I enter the year "2000" for "maxFiveDaysInFuture"
    And I continue
    Then I don't see "Enter a date at most 5 days in the future must include a year"

  Scenario: Errors appear for invalid date parts
    When I navigate to the "date" form
    When I enter the day "50" for "maxFiveDaysInFuture"
    When I enter the month "30" for "maxFiveDaysInFuture"
    When I enter the year "1" for "maxFiveDaysInFuture"
    And I continue
    Then I see the date parts with error "Day must be between 1 and 31"
    Then I see the date parts with error "Month must be between 1 and 12"
    Then I see the date parts with error "Year must be 1000 or higher"


  Scenario: Errors appear for max days in future and max days in past
    When I navigate to the "date" form
    When I enter a date 30 days in the future for "maxFiveDaysInFuture"
    When I enter a date 30 days in the past for "maxFiveDaysInPast"
    And I continue
    Then I see the date parts with a error string "Enter a date at most 5 days in the future must be the same as or before" for "maxFiveDaysInFuture"
    Then I see the date parts with a error string "Enter a date at most 5 days in the past must be the same as or after" for "maxFiveDaysInPast"
