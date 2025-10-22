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
    configs: { Key: string; DisplayName: string; LastModified: string; LastPublished: string }[];
    loading?: boolean;

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
            const configs = await formConfigurationApi.loadConfigurations();
            // Sort by last modified date, most recent first
            const sortedConfigs = configs.sort((a, b) =>
                new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime()
            );
            this.setState({
                loading: false,
                configs: sortedConfigs,
            });
        } catch (error) {
            logger.error("ViewFundForms componentDidMount", error);
            this.setState({ loading: false });
        }
    }

    selectForm = async (form) => {
        try {
            // Always go directly to edit the form from Pre-Award API
            this.props.history.push(`/designer/${form}`);
        } catch (e) {
            logger.error("ChooseExisting", e);
        }
    };

    goBack = (event) => {
        event.preventDefault();
        this.props.history.goBack();
    };

    formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    previewDraft = async (formKey: string) => {
        try {
            const response = await fetch(`/api/${formKey}/preview-draft`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                window.open(data.url, "_blank", "noopener,noreferrer");
            } else {
                console.error('Failed to preview draft form');
            }
        } catch (error) {
            console.error("Error previewing draft form:", error);
        }
    };

    previewPublished = async (formKey: string) => {
        try {
            const response = await fetch(`/api/${formKey}/preview-published`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                window.open(data.url, "_blank", "noopener,noreferrer");
            } else {
                console.error('Failed to preview published form');
            }
        } catch (error) {
            console.error("Error previewing published form:", error);
        }
    };

    publishForm = async (formKey: string) => {
        try {
            const response = await fetch(`/api/${formKey}/publish`, {
                method: 'PUT',
            });

            if (response.ok) {
                // Refresh the forms list to show updated publish status
                const configs = await formConfigurationApi.loadConfigurations();
                const sortedConfigs = configs.sort((a, b) =>
                    new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime()
                );
                this.setState({ configs: sortedConfigs });
            } else {
                console.error('Failed to publish form');
            }
        } catch (error) {
            console.error("Error publishing form:", error);
        }
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
                    {form.DisplayName}
                </td>
                <td className="govuk-table__cell">
                    {form.Key}
                </td>
                <td className="govuk-table__cell">
                    <a
                        className="govuk-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            this.selectForm(form.Key);
                        }}
                    >
                        Edit
                    </a>
                </td>
                <td className="govuk-table__cell">
                    <a
                        className="govuk-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            this.previewDraft(form.Key);
                        }}
                    >
                        Preview
                    </a>
                </td>
                <td className="govuk-table__cell">
                    <a
                        className="govuk-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            this.publishForm(form.Key);
                        }}
                    >
                        Publish
                    </a>
                </td>
                <td className="govuk-table__cell">
                    {this.formatDateTime(form.LastModified)}
                </td>
                <td className="govuk-table__cell">
                    {this.formatDateTime(form.LastPublished)}  // This should be "-" if never published
                </td>
                <td className="govuk-table__cell">
                    <a  // This should be disabled if never published
                        className="govuk-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            this.previewPublished(form.Key);
                        }}
                    >
                        Preview
                    </a>
                </td>
            </tr>
        ));

        return (
            <div className="new-config">
                <div>
                    <BackLink onClick={this.goBack} href="#">
                        {i18n("Back to previous page")}
                    </BackLink>

                    <h1 className="govuk-heading-l">
                        {i18n("landingPage.existing.select")}
                    </h1>

                    <div className="govuk-grid-row form-grid">
                        <div className="govuk-grid-column-full">
                            <table className="govuk-table">
                                <thead className="govuk-table__head">
                                <tr className="govuk-table__row">
                                    <th scope="col" className="govuk-table__header">
                                        Display name
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        URL path
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        Edit draft
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        Preview draft
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        Publish draft
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        Last updated (UTC)
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        Last published (UTC)
                                    </th>
                                    <th scope="col" className="govuk-table__header">
                                        Preview published
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="govuk-table__body">
                                {hasEditableForms ? (
                                    <>{formTable}</>
                                ) : (
                                    <tr className="govuk-table__row">
                                        <td className="govuk-table__cell table__cell__noborder" colSpan={8}>
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
