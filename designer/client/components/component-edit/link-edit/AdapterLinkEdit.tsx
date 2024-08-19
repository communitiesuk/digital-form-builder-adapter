import LinkEdit from "../../../../../digital-form-builder/designer/client/link-edit";
import {i18n} from "../../../../../digital-form-builder/designer/client/i18n";
import React from "react";
import {AdapterSelectConditions} from "../../../conditions/AdapterSelectConditions";


export class AdapterLinkEdit extends LinkEdit {

    render() {
        const {data, edge} = this.props;
        const {pages} = data;
        const {selectedCondition} = this.state;
        return (
            <form onSubmit={(e) => this.onSubmit(e)} autoComplete="off">
                <div className="govuk-form-group">
                    <label className="govuk-label govuk-label--s" htmlFor="link-source">
                        From
                    </label>
                    <select
                        value={edge.source}
                        className="govuk-select"
                        id="link-source"
                        name="link-source"
                        disabled
                    >
                        <option/>
                        {pages.map((page) => (
                            <option key={page.path} value={page.path}>
                                {page.title}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="govuk-form-group">
                    <label className="govuk-label govuk-label--s" htmlFor="link-target">
                        To
                    </label>
                    <select
                        value={edge.target}
                        className="govuk-select"
                        id="link-target"
                        name="link-target"
                        disabled
                    >
                        <option/>
                        {pages.map((page) => (
                            <option key={page.path} value={page.path}>
                                {page.title}
                            </option>
                        ))}
                    </select>
                </div>
                <AdapterSelectConditions
                    path={edge.source}
                    //@ts-ignore
                    selectedCondition={selectedCondition}
                    conditionsChange={this.conditionSelected}
                    noFieldsHintText={i18n("addLink.noFieldsAvailable")}
                />
                <button className="govuk-button" type="submit">
                    Save
                </button>
                &nbsp;
                <button
                    className="govuk-button"
                    type="button"
                    onClick={this.onClickDelete}
                >
                    Delete
                </button>
            </form>
        );
    }
}
