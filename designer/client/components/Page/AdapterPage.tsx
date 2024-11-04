import React, {useContext, useState} from "react";
import {
    SortableContainer,
    SortableElement,
    arrayMove,
} from "react-sortable-hoc";
import {findPage} from "../../../../digital-form-builder/designer/client/data";
import {AdapterComponentTypes} from "@communitiesuk/model";
import {PageLinkage} from "../../../../digital-form-builder/designer/client/components/PageLinkage";
import {i18n} from "../../../../digital-form-builder/designer/client/i18n";
import {Flyout} from "../../../../digital-form-builder/designer/client/components/Flyout";
import {AdapterComponent} from "../AdapterComponent";
import {AdapterDataContext} from "../../context/AdapterDataContext";
import {AdapterComponentContextProvider} from "../../reducers/component/AdapterComponentReducer";
import AdapterComponentCreate from "../component-create/AdapterComponentCreate";
import {AdapterPageEdit} from "../component-edit/AdapterPageEdit";


const SortableItem = SortableElement(({index, page, component, data}) => (
    <div className="component-item">
        <AdapterComponent key={index} page={page} component={component} data={data}/>
    </div>
));

const SortableList = SortableContainer(({page = {}, data}) => {
    //@ts-ignore
    const {components = []} = page;
    return (
        <div className="component-list">
            {components.map((component, index) => (
                <SortableItem
                    key={index}
                    index={index}
                    page={page}
                    component={component}
                    data={data}
                />
            ))}
        </div>
    );
});

export const AdapterPage = ({page, previewUrl, id, layout}) => {
    const {data, save} = useContext(AdapterDataContext);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [isCreatingComponent, setIsCreatingComponent] = useState(false);

    if (data.pages) {
        const multiInputPages = data.pages.filter(page =>
            // @ts-ignore
            page.components.some(component => component.type === 'MultiInputField')
        );
        multiInputPages.forEach(page => {
            // @ts-ignore
            const multiInputFields = page.components.filter(component => component.type === 'MultiInputField');
            //@ts-ignore
            if (multiInputFields && multiInputFields[0] && multiInputFields[0].pageOptions) {
                //@ts-ignore
                page.options = multiInputFields[0].pageOptions;
                //@ts-ignore
                page.options.customText.samePageTitle = multiInputFields[0].pageOptions.customText.samePageTitle;
                multiInputFields.forEach(component => {
                    //@ts-ignore
                    delete component.pageOptions
                })
                page.controller = "RepeatingFieldPageController"
                save(data)
            }

            //@ts-ignore
            if (multiInputFields && multiInputFields[0] && !multiInputFields[0].pageOptions) {
                //@ts-ignore
                multiInputFields[0].pageOptions = {
                    // @ts-ignore
                    summaryDisplayMode: {
                        // @ts-ignore
                        samePage: page.options.summaryDisplayMode ? page.options.summaryDisplayMode.samePage : true,
                        // @ts-ignore
                        separatePage: page.options.summaryDisplayMode ? page.options.summaryDisplayMode.separatePage : false,
                        // @ts-ignore
                        hideRowTitles: page.options.summaryDisplayMode ? page.options.summaryDisplayMode.hideRowTitles : false
                    },
                    customText: {
                        //@ts-ignore
                        samePageTitle: page.options.customText.samePageTitle ? page.options.customText.samePageTitle : "",
                    }
                }
                save(data)
            }
        })
        if (multiInputPages.length <= 0) {
            data.pages.forEach(page => {
                if (page.controller === "RepeatingFieldPageController") {
                    // @ts-ignore
                    delete page.controller;
                    // @ts-ignore
                    delete page.options.summaryDisplayMode;
                    // @ts-ignore
                    delete page.options.customText;
                    save(data)
                }
            })
        }
    }

    const onSortEnd = ({oldIndex, newIndex}) => {
        const copy = {...data};
        const [copyPage, index] = findPage(data, page.path);
        copyPage.components = arrayMove(copyPage.components!, oldIndex, newIndex);
        copy.pages[index] = copyPage;
        save(copy);
    };

    const onEditEnd = () => {
        setIsEditingPage(false);
    };

    const section = data.sections?.find(
        (section) => section.name === page.section
    );

    const formComponents =
        page?.components?.filter(
            (comp) =>
                AdapterComponentTypes.find((type) => type.name === comp.type)?.subType ===
                "field"
        ) ?? [];

    let pageTitle =
        page.title ||
        (formComponents.length === 1 && page.components[0] === formComponents[0]
            ? formComponents[0].title
            : page.title);

    return (
        <div id={page.path} title={page.path} className={"page"} style={layout}>
            <div className="page__heading">
                <h3>
                    {section && <span>{section.title}</span>}
                    {page.title}
                </h3>
                <PageLinkage page={page} layout={layout}/>
            </div>

            <SortableList
                page={page}
                data={data}
                pressDelay={90}
                onSortEnd={onSortEnd}
                lockAxis="y"
                helperClass="dragging"
                lockToContainerEdges
            />

            <div className="page__actions">
                <button
                    title={i18n("Edit page")}
                    onClick={(_e) => setIsEditingPage(true)}
                >
                    {i18n("Edit page")}
                </button>
                <button
                    title={i18n("Create component")}
                    onClick={(_e) => setIsCreatingComponent(true)}
                >
                    {i18n("Create component")}
                </button>
                <a
                    title={i18n("Preview page")}
                    href={new URL(`${id}${page.path}`, previewUrl).toString()}
                    target="_blank"
                    rel="noreferrer"
                >
                    {i18n("Preview")}{" "}
                    <span className="govuk-visually-hidden">{pageTitle}</span>
                </a>
            </div>
            {isEditingPage && (
                <Flyout title="Edit Page" onHide={setIsEditingPage}>
                    Inside the Page Edit
                    <AdapterPageEdit page={page} onEdit={onEditEnd}/>
                </Flyout>
            )}

            {isCreatingComponent && (
                <Flyout show={true} onHide={setIsCreatingComponent}>
                    <AdapterComponentContextProvider>
                        <AdapterComponentCreate renderInForm={true} toggleAddComponent={() => {
                            setIsCreatingComponent(false);
                        }} page={page}/>
                    </AdapterComponentContextProvider>
                </Flyout>
            )}
        </div>
    );
};
