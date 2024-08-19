import React, {useContext} from "react";
import {AdapterDataContext} from "../../context/AdapterDataContext";
import {useMenuItem} from "../../../../digital-form-builder/designer/client/components/Menu/useMenuItem";
import {Tabs, useTabs} from "../../../../digital-form-builder/designer/client/components/Menu/useTabs";
import {i18n} from "../../i18n";
import {Flyout} from "../../../../digital-form-builder/designer/client/components/Flyout";
import {FormDetails} from "../../../../digital-form-builder/designer/client/components/FormDetails";
import {AdapterPageCreate} from "../../AdapterPageCreate";
import {AdapterLinkCreate} from "../component-create/links/AdapterLinkCreate";
import SectionsEdit from "../../../../digital-form-builder/designer/client/section/sections-edit";
import ConditionsEdit from "../../../../digital-form-builder/designer/client/conditions/ConditionsEdit";
import {
    ListsEditorContextProvider
} from "../../../../digital-form-builder/designer/client/reducers/list/listsEditorReducer";
import {ListContextProvider} from "../../../../digital-form-builder/designer/client/reducers/listReducer";
import ListsEdit from "../../../../digital-form-builder/designer/client/list/ListsEdit";
import OutputsEdit from "../../../../digital-form-builder/designer/client/outputs/outputs-edit";
import {FeeEdit} from "../../../../digital-form-builder/designer/client/components/Fee/FeeEdit";
import DeclarationEdit from "../../../../digital-form-builder/designer/client/declaration-edit";
import {
    DataPrettyPrint
} from "../../../../digital-form-builder/designer/client/components/DataPrettyPrint/DataPrettyPrint";
import {SubMenu} from "../../../../digital-form-builder/designer/client/components/Menu/SubMenu";

type Props = {
    updateDownloadedAt?: (string) => void;
    id: string;
};

export default function AdapterMenu({updateDownloadedAt, id}: Props) {
    const {data} = useContext(AdapterDataContext);

    const formDetails = useMenuItem();
    const page = useMenuItem();
    const link = useMenuItem();
    const sections = useMenuItem();
    const conditions = useMenuItem();
    const lists = useMenuItem();
    const outputs = useMenuItem();
    const fees = useMenuItem();
    const summaryBehaviour = useMenuItem();
    const summary = useMenuItem();

    const {selectedTab, handleTabChange} = useTabs();

    return (
        <nav className="menu">
            <div className="menu__row">
                <button data-testid="menu-form-details" onClick={formDetails.show}>
                    {i18n("menu.formDetails")}
                </button>
                <button data-testid="menu-page" onClick={page.show}>
                    {i18n("menu.addPage")}
                </button>
                <button data-testid="menu-links" onClick={link.show}>
                    {i18n("menu.links")}
                </button>
                <button data-testid="menu-sections" onClick={sections.show}>
                    {i18n("menu.sections")}
                </button>
                <button data-testid="menu-conditions" onClick={conditions.show}>
                    {i18n("menu.conditions")}
                </button>
                <button data-testid="menu-lists" onClick={lists.show}>
                    {i18n("menu.lists")}
                </button>
                <button data-testid="menu-outputs" onClick={outputs.show}>
                    {i18n("menu.outputs")}
                </button>
                <button data-testid="menu-fees" onClick={fees.show}>
                    {i18n("menu.fees")}
                </button>
                <button
                    data-testid="menu-summary-behaviour"
                    onClick={summaryBehaviour.show}
                >
                    {i18n("menu.summaryBehaviour")}
                </button>
                <button onClick={summary.show} data-testid="menu-summary">
                    {i18n("menu.summary")}
                </button>
            </div>
            {formDetails.isVisible && (
                //@ts-ignore
                <Flyout title="Form Details" onHide={formDetails.hide}><FormDetails
                    onCreate={() => formDetails.hide()}/>
                </Flyout>
            )}

            {page.isVisible && (
                //@ts-ignore
                <Flyout title="Add Page" onHide={page.hide}><AdapterPageCreate onCreate={() => page.hide()}/>
                </Flyout>
            )}

            {link.isVisible && (
                //@ts-ignore
                <Flyout title={i18n("menu.links")} onHide={link.hide}><AdapterLinkCreate onCreate={() => link.hide()}/>
                </Flyout>
            )}

            {sections.isVisible && (
                //@ts-ignore
                <Flyout title="Edit Sections" onHide={sections.hide}><SectionsEdit/>
                </Flyout>
            )}

            {conditions.isVisible && (
                //@ts-ignore
                <Flyout title={i18n("conditions.addOrEdit")} onHide={conditions.hide} width="large"><ConditionsEdit/>
                </Flyout>
            )}

            {lists.isVisible && (
                //@ts-ignore
                <Flyout title="Edit Lists" onHide={lists.hide} width={""}><ListsEditorContextProvider>
                    <ListContextProvider>
                        <ListsEdit
                            showEditLists={false}/></ListContextProvider>
                </ListsEditorContextProvider>
                </Flyout>
            )}

            {outputs.isVisible && (
                //@ts-ignore
                <Flyout title="Edit Outputs" onHide={outputs.hide} width="xlarge"><OutputsEdit/>
                </Flyout>
            )}

            {fees.isVisible && (
                //@ts-ignore
                <Flyout title="Edit Fees" onHide={fees.hide} width="xlarge"><FeeEdit onEdit={() => fees.hide()}/>
                </Flyout>
            )}

            {summaryBehaviour.isVisible && (
                //@ts-ignore
                <Flyout title="Edit Summary behaviour" onHide={summaryBehaviour.hide} width="xlarge"><DeclarationEdit
                    onCreate={() => summaryBehaviour.hide()}/>
                </Flyout>
            )}

            {summary.isVisible && (
                //@ts-ignore
                <Flyout title="Summary" width="large" onHide={summary.hide}><div
                        className="js-enabled"
                        style={{paddingTop: "3px"}}>
                        <div className="govuk-tabs" data-module="tabs">
                            <h2 className="govuk-tabs__title">Summary</h2>
                            <ul className="govuk-tabs__list">
                                <li className="govuk-tabs__list-item">
                                    <button
                                        className="govuk-tabs__tab"
                                        aria-selected={selectedTab === Tabs.model}
                                        onClick={(e) => handleTabChange(e, Tabs.model)}
                                    >
                                        Data Model
                                    </button>
                                </li>
                                <li className="govuk-tabs__list-item">
                                    <button
                                        className="govuk-tabs__tab"
                                        aria-selected={selectedTab === Tabs.json}
                                        data-testid={"tab-json-button"}
                                        onClick={(e) => handleTabChange(e, Tabs.json)}
                                    >
                                        JSON
                                    </button>
                                </li>
                                <li className="govuk-tabs__list-item">
                                    <button
                                        className="govuk-tabs__tab"
                                        aria-selected={selectedTab === Tabs.summary}
                                        data-testid="tab-summary-button"
                                        onClick={(e) => handleTabChange(e, Tabs.summary)}
                                    >
                                        Summary
                                    </button>
                                </li>
                            </ul>
                            {selectedTab === Tabs.model && (
                                <section className="govuk-tabs__panel" data-testid="tab-model">
                                    <DataPrettyPrint/>
                                </section>
                            )}
                            {selectedTab === Tabs.json && (
                                <section className="govuk-tabs__panel" data-testid="tab-json">
                                    <pre>{JSON.stringify(data, null, 2)}</pre>
                                </section>
                            )}
                            {selectedTab === Tabs.summary && (
                                <section
                                    className="govuk-tabs__panel"
                                    data-testid="tab-summary"
                                >
                  <pre>
                    {JSON.stringify(
                        data.pages.map((page) => page.path),
                        null,
                        2
                    )}
                  </pre>
                                </section>
                            )}
                        </div>
                    </div>
                </Flyout>
            )}

            <SubMenu id={id} updateDownloadedAt={updateDownloadedAt}/>
        </nav>
    );
}
