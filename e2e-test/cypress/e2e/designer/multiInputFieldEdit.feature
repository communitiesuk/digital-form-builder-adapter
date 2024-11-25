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

  Scenario: Test multi input field edit component with radio button with a new list
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Radiofield"
    And I add child components
      | component   | title                  | options | additional | listItem                                                                                                                                   | name       |
      | RadiosField | This is a radios field | {}      | false      | {"listName": "Risk Level", "items": [{"name":"Risk Level 01", "value":"risk_value_01"},{"name":"Risk Level 02", "value":"risk_value_02"}]} | radiofield |
    And I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component   | title                  | components                                                    |
      | RadiosField | This is a radios field | {"items":[{"name":"Risk Level 01"},{"name":"Risk Level 02"}]} |

  Scenario: Test multi input field edit component and adding Text Field with all additional configs
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Textfield"
    * I add table title "This is a table title"
    And I add child components
      | component | title                | options                                             | additional | listItem | name      |
      | TextField | This is a text field | {"min": "1", "max": "5", "words":"2", "length":"2"} | true       |          | textfield |
    And I need to verify the configurations in given component
      | component | title                | options                                             | additional | listItem | name      |
      | TextField | This is a text field | {"min": "1", "max": "5", "words":"2", "length":"2"} | true       |          | textfield |
    * I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component | title                | components |
      | TextField | This is a text field |            |

  Scenario: Test multi input field edit component and adding number field with additional configurations
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Numberfield"
    * I add table title "This is a table title"
    And I add child components
      | component   | title                  | options                                | additional | listItem | name        |
      | NumberField | This is a number field | {"min": "1", "prefix": "£", "max":"2"} | true       |          | numberfield |
    And I need to verify the configurations in given component
      | component   | title                  | options                                | additional | listItem | name        |
      | NumberField | This is a number field | {"min": "1", "prefix": "£", "max":"2"} | true       |          | numberfield |
    * I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component   | title                  | components |
      | NumberField | This is a number field |            |


  Scenario: Test multi input field edit component and adding radio field with existing list
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Radiofield"
    * I add table title "This is a table title"
    And I add child components
      | component   | title                  | options | additional | listItem     | name       |
      | RadiosField | This is a radios field | {}      | false      | Types of egg | radiofield |
    And I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component   | title                  | components                                                                                    |
      | RadiosField | This is a radios field | {"items":[{"name":"sunny-side up"},{"name":"over-easy"},{"name":"scrambled"},{"name":"raw"}]} |

  Scenario: Test multi input field edit component and adding date parts field
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Datepartsfield"
    * I add table title "This is a table title"
    And I add child components
      | component      | title                | options                                        | additional | listItem | name           |
      | DatePartsField | This is a date field | {"maxDaysInPast": "1", "maxDaysInFuture": "5"} | true       |          | datepartsfield |
    And I need to verify the configurations in given component
      | component      | title                | options                                        | additional | listItem | name           |
      | DatePartsField | This is a date field | {"maxDaysInPast": "1", "maxDaysInFuture": "5"} | true       |          | datepartsfield |
    * I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component      | title                | components                                                       |
      | DatePartsField | This is a date field | {"items": [{"name": "Day"},{"name": "Month"}, {"name": "Year"}]} |

  Scenario: Test multi input field edit component and adding uk address field
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "UkAddressField"
    * I add table title "This is a table title"
    And I add child components
      | component      | title                   | options | additional | listItem | name         |
      | UkAddressField | This is a address field | {}      | false      |          | addressfield |
    And I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component      | title                   | components                                                                                                                                                                                  |
      | UkAddressField | This is a address field | {"items": [{"name": "Address line 1"},{"name": "Address line 2 (optional)"}, {"name": "Town or city"}, {"name": "County (optional)"}, {"name": "County (optional)"}, {"name": "Postcode"}]} |

  Scenario: Test multi input field edit component and adding WebsiteField,YesNoField,MonthYearField,MultilineTextField
    And I continue create a component
      | page       | component         | title                   |
      | First page | Multi Input Field | Which eggs do you like? |
    And I add table title name "Websitefield"
    * I add table title name "YesorNofield"
    * I add table title name "MonthYearfield"
    * I add table title name "MultilineTextField"
    * I add table title "This is a table title"
    And I add child components
      | component          | title                     | options | additional | listItem | name           |
      | WebsiteField       | This is a website field   | {}      | false      |          | websitefield   |
      | YesNoField         | This is a yes no field    | {}      | false      |          | yesnofield     |
      | MonthYearField     | This is a month field     | {}      | false      |          | monthfield     |
      | MultilineTextField | This is a multiline field | {}      | false      |          | multilinefield |
    And I save component
    And I preview the page "First page" without href
    Then I see following components in the page
      | component          | title                     | components                                      |
      | WebsiteField       | This is a website field   |                                                 |
      | YesNoField         | This is a yes no field    |                                                 |
      | MonthYearField     | This is a month field     | {"items": [{"name": "Month"},{"name": "Year"}]} |
      | MultilineTextField | This is a multiline field |                                                 |
