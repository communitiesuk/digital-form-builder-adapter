Feature: Multi Input Field Edit
  As a user
  I want to add, delete and edit multi input field

  Background: Create a list
    Given I am on the new configuration page
    And I enter the form name "smoke-tests-list-components"
    When I submit the form with the button title "Next"
    When I open "Lists"
    And I open the link "Add a new list"
    * I enter "Types of egg" for "List title"
    * I add the list items
      | text          | help                   | value     |
      | sunny-side up | fried but not flipped  | sunny     |
      | over-easy     | fried and flipped over | over-easy |
      | scrambled     |                        | scrambled |
      | raw           |                        | raw       |
    * I save the list
    * I close the flyout


  Scenario: Test multi input field edit component and adding child components
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Textfield"
    * I add table title name "Numberfield"
    * I add table title name "Radiofield"
    * I add table title name "Datepartsfield"
    * I add table title name "Websitefield"
    * I add table title name "YesorNofield"
    * I add table title name "MonthYearfield"
    * I add table title "This is a table title"
    And I add child components
      | component      | title                   | options                                             | additional | listItem     | name           |
      | TextField      | This is a text field    | {"min": "1", "max": "5", "words":"2", "length":"2"} | true       |              | textfield      |
      | NumberField    | This is a number field  | {"min": "1", "prefix": "£", "max":"2"}              | true       |              | numberfield    |
      | RadiosField    | This is a radios field  | {}                                                  | false      | Types of egg | radiofield     |
      | DatePartsField | This is a date field    | {"maxDaysInPast": "1", "maxDaysInFuture": "5"}      | true       |              | datepartsfield |
      | WebsiteField   | This is a website field | {}                                                  | false      |              | websitefield   |
      | YesNoField     | This is a yes no field  | {}                                                  | false      |              | yesnofield     |
      | MonthYearField | This is a month field   | {}                                                  | false      |              | monthfield     |
      | UkAddressField | This is a address field | {}                                                  | false      |              | addressfield   |
    And I save component
    And I preview the page "First page"
    Then I see following components in the page
      | component      | title                   |
      | TextField      | This is a text field    |
      | NumberField    | This is a number field  |
      | RadiosField    | This is a radios field  |
      | DatePartsField | This is a date field    |
      | WebsiteField   | This is a website field |
      | YesNoField     | This is a yes no field  |
      | MonthYearField | This is a month field   |
      | UkAddressField | This is a address field |
