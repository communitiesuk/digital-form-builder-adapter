# Form Builder Runner API Description

## Application Status

These API's control the form data status:

| Method   | URL                                      | Description                                                                                                                                                                      |
|----------| ---------------------------------------- |----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GET`    | `/{id}/status`                             | When form data filled and came to the summary page and confirm to complete the form this will trigger to save the content in application-store and then re directed to task list |


## Form Publish

These API's control the form publish and retrival:

| Method | URL                                      | Description                                                                                                                                                                         |
|--------| ---------------------------------------- |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GET`  | `/{id}`                             | Get given form definition from the forms pre loaded forms array and send the view this happens on the start of the forms                                                            |
| `GET`  | `/{id}/{path*}`                             | Get given form definition from the forms pre loaded forms array and send the view with the data taken from the application-store and this happens after the start page of the forms |
| `POST` | `/{id}/{path*}`                             | Get given form definition from the forms pre loaded forms array and send the view with the data taken from the application-store and this happens after the start page of the forms |
| `POST` | `/published`                             | Designer endpoint to get already created form names and file names                                                                                                                  |
| `GET`  | `/published/{id}`                             | Designer endpont to get form definiton to show the designer menu                                                                                                                    |
| `POST` | `/publish`                             | Designer publish a new form configuration                                                                                                                                           |

## Public asserts api

These API's control the form publish and retrival:

| Method | URL                                     | Description                                                                                                                        |
|--------| --------------------------------------- |------------------------------------------------------------------------------------------------------------------------------------|
| `GET`  | `/assets/{path*}`                            | Get data from static (java script external libraries) build CSS files from external and other external libraries from node modules |
| `GET`  | `/help/privacy`                            | Privacy data get endpoint                                                                                                          |
| `GET`  | `/help/cookies`                            | Cookie management and policy endpoint                                                                                              |
| `POST` | `/help/cookies`                            | Cookie management and policy endpoint                                                                                              |
| `GET`  | `/help/terms-and-conditions`                             | Terms and conditions endpoint                                                                                                      |
| `GET`  | `/help/accessibility-statement`                            | Accessibility endpoint                                                                                                             |
| `GET`  | `/clear-session`                            | Clear session endpoint                                                                                                             |
| `GET`  | `/timeout`                            | Timeout application                                                                                                                |


## Manage Session api

These API's control the form publish and retrival:

| Method | URL                                     | Description                                                                                                                                                          |
|--------| --------------------------------------- |----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GET`  | `/session/{token}`                            | Get JWT token that created using the below POST request and validate the session after thet send the request to get forms data endpoint to render the form with data |
| `POST` | `/session/{formId}`                            | Create forms session and send the form data into application store to create a JWT token that going to hold the forms data if available                              |

## Manage Session api

These API's control the form publish and retrival:

| Method | URL                                    | Description                      |
|--------| -------------------------------------- |----------------------------------|
| `GET`  | `/health-check`                            | Get health related data endpoint |

## How to Register new API in Runner


1. Create the specific Register type script class and inherit RegisterApi and override all the methods in it
2. into the server object register your api endpoints and if you have additional things to send into this register method use Options object in it
