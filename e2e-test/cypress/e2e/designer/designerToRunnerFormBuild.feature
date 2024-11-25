Feature: Form creation through designer and usage in runner
  As a user
  I wanted to create a form using the designer and need to check the functionality in runner

  Scenario: Test form creation through designer and test it against json config that should have
    Given I am on the new configuration page
    And I enter the form name "risk-form"
    * I submit the form with the button title "Next"
    When I open "Lists"
    And I open the link "Add a new list"
    * I enter "Risk categories" for "List title"
    * I add the list items
      | text                       | help | value                      |
      | Arms length bodies         |      | Arms length bodies         |
      | Commercial                 |      | Commercial                 |
      | Financial                  |      | Financial                  |
      | Governance                 |      | Governance                 |
      | Information and data       |      | Information and data       |
      | Legal                      |      | Legal                      |
      | Local government delivery  |      | Local government delivery  |
      | People                     |      | People                     |
      | Project delivery           |      | Project delivery           |
      | Resilience                 |      | Resilience                 |
      | Security                   |      | Security                   |
      | Strategy                   |      | Strategy                   |
      | Systems and infrastructure |      | Systems and infrastructure |
    * I save the list
    * I close the flyout
    And I am deleting all the pages from the template
      | page        |
      | First page  |
      | Second page |
      | Summary     |
    And I am trying to create "Question page" page "Who owns the overall risk register?"
    * I am trying to create "Question page" page "Are there any risks to the project?"
    * I am trying to create "Question page" page "Add a risk"
    * I am trying to create "Summary page" page "Check your answers"
    And I am creating the links for the page "Who owns the overall risk register" to "Are there any risks to the project"
    * I am creating the links for the page "Are there any risks to the project" to "Check your answers"
    * I am creating the links for the page "Are there any risks to the project" to "Add a risk"
    * I am creating the links for the page "Add a risk" to "Check your answers"
    And I am creating components on the page "Who owns the overall risk register"
      | name   | type      | title                                                     | options | hint |
      | DRTbWG | Paragraph | The person in the organisation who owns the risk register | {}      |      |
      | XuPhkd | Text      | First name                                                | {}      |      |
      | YCNiaS | Text      | Last name                                                 | {}      |      |
    * I am creating components on the page "Are there any risks to the project"
      | name   | type  | title                               | options                   | hint |
      | zPKWcg | YesNo | Are there any risks to the project? | {"exposeToContext": true} |      |
    * I am creating components on the page "Add a risk"
      | name   | type              | title      | options                                                                                                     | hint |
      | mbedie | Multi Input Field | Add a risk | {"hideTitle":true,"columnTitles":["Risks"], "page":{"customText": "Risk", "samePageTableItemName": "risk"}} |      |
    * I am creating the child components in MultiInputField on page "Add a risk"
      | name   | type               | title                                                                   | hint                                                                                                                                                                                                                           | options           | schema |
      | iOTqVG | TextField          | Risk title                                                              |                                                                                                                                                                                                                                | {}                | {}     |
      | snRfai | MultilineTextField | Describe the risk                                                       | `<p class="govuk-hint">Your risk description should include:</p><ul class="govuk-hint"><li>what could go wrong</li><li>what could cause things to go wrong</li><li>what the outcome would be if things did go wrong</li></ul>` | {}                | ""     |
      | RAJIAw | RadiosField        | What is the risk category?                                              |                                                                                                                                                                                                                                | {}                | ""     |
      | TkStln | RadiosField        | What is the current likelihood score?                                   | The chance of the risk becoming a reality.                                                                                                                                                                                     | {}                | ""     |
      | vGlmOe | YesNoField         | Is there a risk to life or serious injury associated with this risk?    |                                                                                                                                                                                                                                | {}                | ""     |
      | qzYkEH | TextField          | Risk owner's first name                                                 |                                                                                                                                                                                                                                | {"required":true} | ""     |
      | QUSrxX | TextField          | Risk owner's last name                                                  |                                                                                                                                                                                                                                | {"required":true} | ""     |
      | PaaxUe | MultilineTextField | What mitigations do you currently have in place?                        | Describe mitigations in place at the moment.                                                                                                                                                                                   | {}                | ""     |
      | LxdKos | MultilineTextField | What mitigations do you have planned?                                   | Describe any planned risk mitigations.                                                                                                                                                                                         | {}                | ""     |
      | kweQfQ | RadiosField        | What is the target impact score?                                        | The risk level following any mitigations.                                                                                                                                                                                      | {}                | ""     |
      | LKRoQI | RadiosField        | What is the target likelihood score?                                    | How likely it is that the mitigations will stop the risk from becoming a reality.                                                                                                                                              | {}                | ""     |
      | KVPOPD | YesNoField         | Are the planned mitigations sufficient to bring the risk within target? |                                                                                                                                                                                                                                | {}                | ""     |
      | IytknB | DatePartsField     | Date to target                                                          |                                                                                                                                                                                                                                | {}                | ""     |
    And I am updating the child components in MultiInputField on page "Add a risk"
    * I am updating the radio field "What is the current likelihood score?" with following list "Current likelihood score"
      | text          | value         |
      | 1 - Very low  | 1 - Very low  |
      | 2 - Low       | 2 - Low       |
      | 3 - Medium    | 3 - Medium    |
      | 4 - High      | 4 - High      |
      | 5 - Very high | 5 - Very high |
    * I am updating the radio field "What is the target impact score?" with following list "Target impact score"
      | text          | value         |
      | 1 - Very low  | 1 - Very low  |
      | 2 - Low       | 2 - Low       |
      | 3 - Medium    | 3 - Medium    |
      | 4 - High      | 4 - High      |
      | 5 - Very high | 5 - Very high |
    * I am updating the radio field "What is the target likelihood score?" with following list "Target likelihood score"
      | text          | value         |
      | 1 - Very low  | 1 - Very low  |
      | 2 - Low       | 2 - Low       |
      | 3 - Medium    | 3 - Medium    |
      | 4 - High      | 4 - High      |
      | 5 - Very high | 5 - Very high |
    * I am updating the radio field "What is the risk category?" with following list "Risk categories"
    * I am complete update the components
    And I am creating the condition "Risk to project" mapping field is "Are there any risks to the project?" and operator "is" check value "Yes"
    * I am adding the condition into the link from "Are there any risks to the project" to "Add a risk" and condition "Risk to project"
    And I am previewing the page "Who owns the overall risk register"
    * I am adding data into following components and save and continue "True"
      | component  | data     | type      |
      | First name | Testing  | TextField |
      | Last name  | Testing2 | TextField |
    * I am adding data into following components and save and continue "True"
      | component                           | data | type       |
      | Are there any risks to the project? | No   | YesNoField |
    And verify last page details "Check your answers"
      | question                            | answer   |
      | First name                          | Testing  |
      | Last name                           | Testing2 |
      | Are there any risks to the project? | No       |
    And change value in the final page and save continue
      | question                            |
      | Are there any risks to the project? |
    * I am adding data into following components and save and continue "True"
      | component                           | data | type       |
      | Are there any risks to the project? | Yes  | YesNoField |
    And I am adding data into following components and save and continue "False"
      | component                                                               | data               | type               |
      | Risk title                                                              | Risk title 01      | TextField          |
      | Describe the risk                                                       | Risk description 1 | MultilineTextField |
      | What is the risk category?                                              | Governance         | RadiosFieldMulti   |
      | What is the current likelihood score?                                   | 2 - Low            | RadiosFieldMulti   |
      | Is there a risk to life or serious injury associated with this risk?    | Yes                | YesNoFieldMulti    |
      | Risk owner's first name                                                 | Firstname 1        | TextField          |
      | Risk owner's last name                                                  | LastName 1         | TextField          |
      | What mitigations do you currently have in place?                        | Mitigations 1      | MultilineTextField |
      | What mitigations do you have planned?                                   | Plan 1             | MultilineTextField |
      | What is the target impact score?                                        | 3 - Medium         | RadiosFieldMulti   |
      | What is the target likelihood score?                                    | 5 - Very high      | RadiosFieldMulti   |
      | Are the planned mitigations sufficient to bring the risk within target? | Yes                | YesNoFieldMulti    |
      | Date to target                                                          | 1991-06-03         | DatePartsField     |
    * I will verify row content in the multi input field table
      | data               |
      | Risk title 01      |
      | Risk description 1 |
      | Governance         |
      | 2 - Low            |
      | Yes                |
      | Firstname 1        |
      | LastName 1         |
      | Mitigations 1      |
      | Plan 1             |
      | 3 - Medium         |
      | 5 - Very high      |
      | Yes                |
      | 3/06/1991          |
    * I click on save and continue
    And verify last page details "Check your answers"
      | question                            | answer                                                                                                                                                             |
      | First name                          | Testing                                                                                                                                                            |
      | Last name                           | Testing2                                                                                                                                                           |
      | Are there any risks to the project? | Yes                                                                                                                                                                |
      | Add a risk                          | Risk title 01 : Risk description 1 : Governance : 2 - Low : Yes : Firstname 1 : LastName 1 : Mitigations 1 : Plan 1 : 3 - Medium : 5 - Very high : Yes : 3/06/1991 |
    * change value in the final page and save continue
      | question   |
      | Add a risk |
    * I will verify row content in the multi input field table
      | data               |
      | Risk title 01      |
      | Risk description 1 |
      | Governance         |
      | 2 - Low            |
      | Yes                |
      | Firstname 1        |
      | LastName 1         |
      | Mitigations 1      |
      | Plan 1             |
      | 3 - Medium         |
      | 5 - Very high      |
      | Yes                |
      | 3/06/1991          |
    * I click on save and continue
    And verify last page details "Check your answers"
      | question                            | answer                                                                                                                                                             |
      | First name                          | Testing                                                                                                                                                            |
      | Last name                           | Testing2                                                                                                                                                           |
      | Are there any risks to the project? | Yes                                                                                                                                                                |
      | Add a risk                          | Risk title 01 : Risk description 1 : Governance : 2 - Low : Yes : Firstname 1 : LastName 1 : Mitigations 1 : Plan 1 : 3 - Medium : 5 - Very high : Yes : 3/06/1991 |
