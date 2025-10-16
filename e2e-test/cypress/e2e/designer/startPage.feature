Feature: Start Page
  As a form designer
  I want to give my form a unique name
  So that I can edit it at a later date

  Background:
    Given publish the form into runner "test"

  Scenario: Starting a form without entering a name displays an error
    Given I am on the new mhclg configuration page
    When I try to create a new form without entering a form name in new UI
    Then I am alerted to the error "Display name is required"
    And I am alerted to the error "URL path is required"

  Scenario: Creating a form with a name that already exists displays an error
    Given I am on the new mhclg configuration page
    And I enter "test" for "Display name"
    And I submit the form with the button title "Create"
    When I am on the new mhclg configuration page
    And I enter "test" for "Display name"
    And I submit the form with the button title "Create"
    Then I am alerted to the error "A form with this URL path already exists"


  Scenario: Create new form, go back to previous page
    Given I am on the form designer start page
    When I choose "Open an existing form"
    And I submit the form with the button title "Next"
    * I open Back to previous page
    Then I see "Design and prototype forms"

  Scenario: Open an existing form
    Given I am on the form designer start page
    When I choose "Open an existing form"
    And I submit the form with the button title "Next"
    And I force open the link "test" in new UI
    Then I see the h3 heading "First"
