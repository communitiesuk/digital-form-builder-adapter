Feature: Client Side File Upload

  Background:
    Given publish the form into runner "client-side-file-upload-single"
    Given publish the form into runner "client-side-file-upload-multi"

  Scenario: Testing if client side file upload field error message if required
    And the form session will be initiated with the given component type "text" key "clientSideFileUploadField1" title "Upload the independent survey of works" answer "" question "Upload the independent survey of works" and finally form "client-side-file-upload-single" and session "045a5791-1d76-45e6-a926-7d4ff26b4115"
      | form                           | redirectPath |
      | client-side-file-upload-single | /            |
    And I go to the initialised session URL with generated token
    And I continue
    And I continue
    Then I see the error "Test Client Side file Upload is required" for "Upload the independent survey of works" component with problem title

  Scenario: Adding a single file into the client side file upload
    And the form session will be initiated with the given component type "text" key "clientSideFileUploadField1" title "Upload the independent survey of works" answer "" question "Upload the independent survey of works" and finally form "client-side-file-upload-single" and session "045a5791-1d76-45e6-a926-7d4ff26b4113"
      | form                           | redirectPath |
      | client-side-file-upload-single | /            |
    And I go to the initialised session URL with generated token
    And I continue
    When I upload the file "passes.png" wait till upload and then save and continue with "true"
    When I submit the form adapter
    Then I see "Application complete"

  Scenario: Adding a multi file into the client side file upload and if one uploaded then error
    And the form session will be initiated with the given component type "text" key "clientSideFileUploadField2" title "Upload the independent survey of works" answer "" question "Upload the independent survey of works" and finally form "client-side-file-upload-multi" and session "045a5791-1d76-45e6-a926-7d4ff26b4119"
      | form                          | redirectPath |
      | client-side-file-upload-multi | /            |
    And I go to the initialised session URL with generated token
    And I continue
    When I upload the file "passes.png" wait till upload and then save and continue with "true"
    Then I see the error "Test Client Side file Upload requires 2 files" for "Upload the independent survey of works" component with problem title



