import {When} from "@badeball/cypress-cucumber-preprocessor";

When("the form session will be initiated with the given component type {string} key {string} title {string} answer {string} question {string} and finally form {string} and session {string}", (
  componentType, componentKey, componentTitle, componentAnswer, componentQuestion, formName, session, table) => {
  //     | form | callbackUrl | redirectPath | message | htmlMessage | title | redirectUrl
  const {redirectUrl, ...options} = table.hashes()[0];
  const url = `${Cypress.env("RUNNER_URL")}/session/${formName}`;
  cy.request("POST", url, {
    metadata: {
      form_session_identifier: session
    },
    options: {
      ...options,
      skipSummary: {
        redirectUrl,
      },
    },
    questions: [
      {
        question: componentQuestion,
        fields: [
          {
            key: componentKey,
            title: componentTitle,
            type: componentType,
            answer: componentAnswer,
          },
        ],
        index: 0,
      },
    ],
  }).then((res) => {
    cy.wrap(res.body.token).as("token");
  });
});

When("I go to the initialised session URL with generated token", () => {
  const res = cy.get("@token").then((token) => {
    cy.visit(`${Cypress.env("RUNNER_URL")}/session/${token}`);
  });
});
