@edit-conditions
Feature: Edit Conditions
  As a user
  I want to edit conditions for components
  So that components behave correctly

  Scenario: Create a condition using Edit Conditions
    Given I am on the new mhclg configuration page
    And I enter the form name "smoke-tests-edit-conditions" in new UI
    When I submit the mhclg form with the button title "Create"
    * I create a component
      | page       | component  | title            | name | hideTitle | optional | additional |
      | First page | Date parts | Date of purchase |      |           |          |            |
    * I open "Conditions"
    * I open the link "Add condition"
    * I enter "smoke condition" for "Display name"
    * I select "Date of purchase" for the field with the name "cond-field"
    * I select "is after" for the field with the name "cond-operator"
    * I enter "25" for "Day"
    * I enter "12" for "Month"
    * I enter "2022" for "Year"
    * I add the condition
    * I save the condition
    Then I see the condition "Smoke condition" in new UI


  Scenario: Create a condition using Edit Conditions
    Given I am on the new mhclg configuration page
    When I enter the form name "smoke-tests-edit-conditions" in new UI
    And I submit the form with the button title "Create"
    * I create a component for new UI
      | page       | component | title                  | name | hideTitle | optional | additional |
      | First page | YesNo     | Do you have a receipt? |      |           |          |            |
    * I open "Conditions" in new UI
    * I open the link "Add condition" for new UI
    * I enter "smoke condition" for "Display name"
    * I select "Do you have a receipt?" for the field with the name "cond-field" in new UI
    * I select "is" for the field with the name "cond-operator" in new UI
    * I select "Yes" for the field with the name "cond-value" in new UI
    * I add the condition in new UI
    * I save the condition in new UI
    * I close the flyout in new UI
    * I select the page link with test id "first-page-second-page" in new UI
    * I select the condition "smoke condition" in new UI
    * I save my link in new UI
    Then I see the condition "smoke condition" in new UI
