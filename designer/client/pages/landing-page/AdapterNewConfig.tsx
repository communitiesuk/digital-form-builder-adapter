import React, { Component, MouseEvent } from "react";
import * as formConfigurationApi from "../../../../digital-form-builder/designer/client/load-form-configurations";
import { withRouter } from "react-router-dom";
import { BackLink } from "../../../../digital-form-builder/designer/client/components/BackLink";
import { i18n } from "../../i18n";
import "../../../../digital-form-builder/designer/client/pages/LandingPage/LandingPage.scss";
import { isEmpty } from "../../../../digital-form-builder/designer/client/helpers";
import { Input } from "@govuk-jsx/input";
import ErrorSummary from "../../../../digital-form-builder/designer/client/error-summary";

type Props = {
  history: any;
};

type State = {
  configs: { Key: string; DisplayName: string }[];
  displayName: string;
  urlPath: string;
  errors?: any;
  loading?: boolean;
  urlPathTouched: boolean; // Track if user manually edited URL path
};

const parseUrlPath = (name: string) => {
  let slug = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
  // Trim leading and trailing hyphens without regex
  while (slug.startsWith('-')) slug = slug.slice(1);
  while (slug.endsWith('-')) slug = slug.slice(0, -1);
  return slug;
};

export class AdapterNewConfig extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      configs: [],
      displayName: "",
      urlPath: "",
      errors: {},
      loading: true,
      urlPathTouched: false,
    };
  }

  componentDidMount() {
    formConfigurationApi.loadConfigurations().then((configs) => {
      this.setState({
        configs,
        loading: false,
      });
    });
  }

  validate = () => {
    const { displayName, urlPath, configs } = this.state;

    const errors: any = {};
    let hasErrors = false;

    // Validate display name
    if (isEmpty(displayName)) {
      errors.displayName = {
        href: "#displayName",
        children: i18n("Display name is required"),
      };
      hasErrors = true;
    }

    // Validate URL path
    if (isEmpty(urlPath)) {
      errors.urlPath = {
        href: "#urlPath",
        children: i18n("URL path is required"),
      };
      hasErrors = true;
    } else if (!urlPath.match(/^[a-zA-Z0-9_-]+$/)) { //NOSONAR
      errors.urlPath = {
        href: "#urlPath",
        children: i18n("URL path should only contain letters, numbers, hyphens and underscores"),
      };
      hasErrors = true;
    } else {
      // Check if URL path already exists
      const alreadyExists = configs.find((config) => {
        const fileName = config.Key.toLowerCase().replace(".json", "");
        return fileName === urlPath.toLowerCase();
      });

      if (alreadyExists) {
        errors.urlPath = {
          href: "#urlPath",
          children: i18n("A form with this URL path already exists"),
        };
        hasErrors = true;
      }
    }

    return { errors, hasErrors };
  };

  handleErrors = (errors) => {
    return this.setState({
      errors,
    });
  };

  handleResponse = async (res) => {
    if (!res.ok) {
      const text = await res.text();
      return this.handleErrors({
        general: {
          href: "#displayName",
          children: i18n(text),
        },
      });
    }
    return res.json();
  };

  onSubmit = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { displayName, urlPath } = this.state;

    const { errors, hasErrors } = this.validate();

    if (hasErrors) {
      return this.handleErrors(errors);
    } else {
      this.handleErrors({});
    }

    const newResponse = await globalThis
      .fetch("/api/new", {
      method: "POST",
      body: JSON.stringify({
        displayName: displayName.trim(),
        urlPath: urlPath.trim(),
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      })
      .then((res) => this.handleResponse(res));
    
    this.props.history.push(`designer/${newResponse.id}`);
  };

  onDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ displayName: value });

    // Auto-generate URL path only if user hasn't manually edited it
    if (!this.state.urlPathTouched) {
      this.setState({ urlPath: parseUrlPath(value) });
    }
  };

  onUrlPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
      urlPath: e.target.value,
      urlPathTouched: true, // Mark as manually edited
    });
  };

  goBack = (event) => {
    event.preventDefault();
    this.props.history.goBack();
  };

  render() {
    const { displayName, urlPath, errors } = this.state;

    if (this.state.loading) {
      return <p>Loading ...</p>;
    }

    const hasErrors = errors && Object.keys(errors).length > 0;

    return (
      <div className="new-config">
        <div>
          <BackLink onClick={this.goBack} href="#">
            {i18n("Back to previous page")}
          </BackLink>

          {hasErrors && (
            <ErrorSummary
              titleChildren="There is a problem"
              errorList={Object.values(errors)}
            />
          )}

          <h1 className="govuk-heading-l">
            {i18n("Create a new form")}
          </h1>

          <Input
            id="displayName"
            name="displayName"
            label={{
              className: "govuk-label--s",
              children: [i18n("Display name")],
            }}
            hint={{
              children: [i18n("Enter the display name for your form")],
            }}
            value={displayName || ""}
            onChange={this.onDisplayNameChange}
            errorMessage={
              errors?.displayName ? { children: errors.displayName.children } : undefined
            }
          />

          <Input
            id="urlPath"
            name="urlPath"
            label={{
              className: "govuk-label--s",
              children: [i18n("URL path")],
            }}
            hint={{
              children: [i18n("Enter the URL path for your form")],
            }}
            value={urlPath || ""}
            onChange={this.onUrlPathChange}
            errorMessage={
              errors?.urlPath ? { children: errors.urlPath.children } : undefined
            }
          />

          <button
            className="govuk-button govuk-button--start"
            onClick={this.onSubmit}
          >
            {i18n("Create")}
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(AdapterNewConfig);
