import LinkCreate from "../../../../../digital-form-builder/designer/client/link-create";
import ErrorSummary from "../../../../../digital-form-builder/designer/client/error-summary";
import {i18n} from "../../../../../digital-form-builder/designer/client/i18n";
import classNames from "classnames";
import React from "react";
import {ErrorMessage} from "../../../../../digital-form-builder/designer/client/components/ErrorMessage";
import {AdapterSelectConditions} from "../../../conditions/AdapterSelectConditions";


export class AdapterLinkCreate extends LinkCreate {

    render() {
        const {data} = this.context;
        const {pages} = data;
        const {from, errors} = this.state;
        let hasValidationErrors = Object.keys(errors).length > 0;

        return (
            <>
                {hasValidationErrors && (
                    <ErrorSummary errorList={Object.values(errors)}/>
                )}
                <div className="govuk-hint">{i18n("addLink.hint1")}</div>
                <div className="govuk-hint">{i18n("addLink.hint2")}</div>
                <form onSubmit={(e) => this.onSubmit(e)} autoComplete="off">
                    <div
                        className={classNames({
                            "govuk-form-group": true,
                            "govuk-form-group--error": errors?.from,
                        })}
                    >
                        <label className="govuk-label govuk-label--s" htmlFor="link-source">
                            From
                        </label>
                        {errors?.from && (
                            <ErrorMessage>{errors?.from.children}</ErrorMessage>
                        )}
                        <select
                            className={classNames({
                                "govuk-select": true,
                                "govuk-input--error": errors?.from,
                            })}
                            id="link-source"
                            data-testid="link-source"
                            name="path"
                            onChange={(e) => this.storeValue(e, "from")}
                        >
                            <option/>
                            {pages.map((page) => (
                                <option
                                    key={page.path}
                                    value={page.path}
                                    data-testid="link-source-option"
                                >
                                    {page.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div
                        className={classNames({
                            "govuk-form-group": true,
                            "govuk-form-group--error": errors?.to,
                        })}
                    >
                        <label className="govuk-label govuk-label--s" htmlFor="link-target">
                            To
                        </label>
                        {errors?.to && <ErrorMessage>{errors?.to.children}</ErrorMessage>}
                        <select
                            className={classNames({
                                "govuk-select": true,
                                "govuk-input--error": errors?.to,
                            })}
                            id="link-target"
                            data-testid="link-target"
                            name="page"
                            onChange={(e) => this.storeValue(e, "to")}
                        >
                            <option/>
                            {pages.map((page) => (
                                <option
                                    key={page.path}
                                    value={page.path}
                                    data-testid="link-target-option"
                                >
                                    {page.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {from && from.trim() !== "" && (
                        //@ts-ignore
                        <AdapterSelectConditions
                            path={from}
                            conditionsChange={this.conditionSelected}
                            noFieldsHintText={i18n("addLink.noFieldsAvailable")}
                        />
                    )}

                    <button className="govuk-button" type="submit">
                        Save
                    </button>
                </form>
            </>
        );
    }
}
