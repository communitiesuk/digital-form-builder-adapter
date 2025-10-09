import React, { Component, ChangeEvent, ContextType, FormEvent } from "react";
import { FormConfiguration, FormDefinition } from "@xgovformbuilder/model";
import isFunction from "lodash/isFunction";

import { validateTitle, hasValidationErrors } from "../../../../digital-form-builder/designer/client/validations";
import ErrorSummary from "../../../../digital-form-builder/designer/client/error-summary";
import { i18n } from "../../../../digital-form-builder/designer/client/i18n";
import { FormDetailsTitle } from "../../../../digital-form-builder/designer/client/components/FormDetails/FormDetailsTitle";
import { FormDetailsFeedback } from "../../../../digital-form-builder/designer/client/components/FormDetails/FormDetailsFeedback";
import { FormDetailsPhaseBanner } from "../../../../digital-form-builder/designer/client/components/FormDetails/FormDetailsPhaseBanner";
import "../../../../digital-form-builder/designer/client/components/FormDetails/FormDetails.scss";
import logger from "../../../../digital-form-builder/designer/client/plugins/logger";
import { AdapterDataContext } from "../../context/AdapterDataContext";

type PhaseBanner = Exclude<FormDefinition["phaseBanner"], undefined>;
type Phase = PhaseBanner["phase"];

interface Props {
  onCreate?: (saved: boolean) => void;
}

interface State {
  title: string;
  phase: Phase;
  feedbackForm: boolean;
  formConfigurations: FormConfiguration[];
  selectedFeedbackForm?: string;
  errors: any;
}

export class AdapterFormDetails extends Component<Props, State> {
  public static readonly contextType = AdapterDataContext;
  context!: ContextType<typeof AdapterDataContext>;
  isUnmounting = false;

  constructor(props) {
    super(props);
    const { data, displayName } = this.context;
    const selectedFeedbackForm = data.feedback?.url?.substring(1) ?? "";
    this.state = {
      title: displayName || "",
      feedbackForm: data.feedback?.feedbackForm ?? false,
      formConfigurations: [],
      selectedFeedbackForm,
      phase: data.phaseBanner?.phase,
      errors: {},
    };
  }

  onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = this.validate();

    if (hasValidationErrors(validationErrors)) return;

    const { data, save } = this.context;
    const {
      title,
      feedbackForm = false,
      selectedFeedbackForm,
      phase,
    } = this.state;
    const { phaseBanner = {} } = data;
    const { onCreate } = this.props;

    let copy: FormDefinition = { ...data };
    copy.feedback = {
      feedbackForm,
      url: selectedFeedbackForm ? `/${selectedFeedbackForm}` : "",
    };

    copy.phaseBanner = {
      ...phaseBanner,
      phase,
    };

    try {
      const saved = await save(copy, title);
      if (isFunction(onCreate)) {
        onCreate(saved);
      }
    } catch (err) {
      logger.error("AdapterFormDetails", err);
    }
  };

  validate = () => {
    const { title } = this.state;
    const errors = validateTitle("form-title", title);
    this.setState({ errors });
    return errors;
  };

  onSelectFeedbackForm = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedFeedbackForm = event.target.value;
    this.setState({ selectedFeedbackForm });
  };

  handleIsFeedbackFormRadio = (event: ChangeEvent<HTMLSelectElement>) => {
    const isFeedbackForm = event.target.value === "true";
    logger.info("AdapterFormDetails", "handle is feedback");

    if (isFeedbackForm) {
      this.setState({ feedbackForm: true, selectedFeedbackForm: undefined });
    } else {
      this.setState({ feedbackForm: false });
    }
  };

  handlePhaseBannerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const phase = event.target.value as Phase;
    this.setState({ phase: phase || undefined });
  };

  handleTitleInputBlur = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ title: event.target.value });
  };

  render() {
    const {
      title,
      phase,
      feedbackForm,
      selectedFeedbackForm,
      formConfigurations,
      errors,
    } = this.state;

    return (
      <>
        {Object.keys(errors).length > 0 && (
          <ErrorSummary errorList={Object.values(errors)} />
        )}
        <form onSubmit={this.onSubmit} autoComplete="off">
          <FormDetailsTitle
            title={title}
            errors={errors}
            handleTitleInputBlur={this.handleTitleInputBlur}
          />
          <FormDetailsPhaseBanner
            phase={phase}
            handlePhaseBannerChange={this.handlePhaseBannerChange}
          />
          <FormDetailsFeedback
            feedbackForm={feedbackForm}
            selectedFeedbackForm={selectedFeedbackForm}
            formConfigurations={formConfigurations}
            handleIsFeedbackFormRadio={this.handleIsFeedbackFormRadio}
            onSelectFeedbackForm={this.onSelectFeedbackForm}
          />
          <button type="submit" className="govuk-button">
            {i18n("Save")}
          </button>
        </form>
      </>
    );
  }
}
