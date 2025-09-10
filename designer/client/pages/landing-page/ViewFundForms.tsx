import React, {Component} from "react";
import * as formConfigurationApi from "../../../../digital-form-builder/designer/client/load-form-configurations";
import {withRouter} from "react-router-dom";
import {BackLink} from "../../../../digital-form-builder/designer/client/components/BackLink";
import "../../../../digital-form-builder/designer/client/pages/LandingPage/LandingPage.scss";
import logger from "../../../../digital-form-builder/designer/client/plugins/logger";
import {i18n} from "../../i18n";

type Props = {
    history: any;
};

type State = {
    configs: { Key: string; DisplayName: string }[];
    loading?: boolean;
    usePreAwardApi?: boolean;
};

export class ViewFundForms extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            configs: [],
            loading: true,
        };
    }

    async componentDidMount() {
        try {
            // Check if Pre-Award API is enabled
            const featureResponse = await window.fetch("/feature-toggles");
            const features = await featureResponse.json();
            const usePreAwardApi = features.usePreAwardApi || false;

            const configs = await formConfigurationApi.loadConfigurations();
            
            this.setState({
                loading: false,
                configs,
                usePreAwardApi,
            });
        } catch (error) {
            logger.error("ViewFundForms componentDidMount", error);
            this.setState({ loading: false });
        }
    }

    selectForm = async (form) => {
        try {
            if (this.state.usePreAwardApi) {
                // With Pre-Award API, go directly to edit the draft
                this.props.history.push(`/designer/${form}`);
            } else {
                // Original behavior - clone the form
                const response = await window.fetch("/api/new", {
                    method: "POST",
                    body: JSON.stringify({
                        selected: {Key: form},
                        name: "",
                    }),
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                });
                const responseJson = await response.json();
                this.props.history.push(`/designer/${responseJson.id}`);
            }
        } catch (e) {
            logger.error("ChooseExisting", e);
        }
    };

    goBack = (event) => {
        event.preventDefault();
        this.props.history.goBack();
    };

    render() {
        const configs = this.state.configs || [];
        const hasEditableForms = configs.length > 0;
        if (this.state.loading) {
            return <p>Loading ...</p>;
        }

        const formTable = configs.map((form) => (
            <tr className="govuk-table__row" key={form.Key}>
                <td className="govuk-table__cell">
                    <a
                        className="govuk-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            this.selectForm(form.Key);
                        }}
                    >
                        {form.DisplayName}
                    </a>
                </td>
                <td className="govuk-table__cell">
                    {form.Key}
                </td>
            </tr>
        ));

        return (
            <div className="new-config">
                <div>
                    <BackLink onClick={this.goBack}>
                        {i18n("Back to previous page")}
                    </BackLink>

                    <h1 className="govuk-heading-l">
                        {i18n("landingPage.existing.select")}
                    </h1>

                    <div className="govuk-grid-row form-grid">
                        <div className="govuk-grid-column-two-thirds">
                            <table className="govuk-table">
                                <thead className="govuk-table__head">
                                <tr className="govuk-table__row">
                                    <th scope="col" className="govuk-table__header">
                                        Form name
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        File name
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="govuk-table__body">
                                {hasEditableForms ? (
                                    <>{formTable}</>
                                ) : (
                                    <tr className="govuk-table__row">
                                        <td className="govuk-table__cell table__cell__noborder">
                                            {i18n("landingPage.existing.noforms")}
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(ViewFundForms);
