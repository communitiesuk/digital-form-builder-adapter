import React, {useContext, useState} from "react";
import {
    SortableContainer,
    SortableElement,
    arrayMove,
} from "react-sortable-hoc";
import {AdapterComponent} from "../../AdapterComponent";
import {DataContext} from "../../../../digital-form-builder/designer/client/context";
import {findPage} from "../../../../digital-form-builder/designer/client/data";
import {AdapterComponentTypes} from "@communitiesuk/model";
import {PageLinkage} from "../../../../digital-form-builder/designer/client/components/PageLinkage";
import {i18n} from "../../../../digital-form-builder/designer/client/i18n";
import {Flyout} from "../../../../digital-form-builder/designer/client/components/Flyout";
import {PageEdit} from "../../../../digital-form-builder/designer/client/page-edit";
import {ComponentContextProvider} from "../../../../digital-form-builder/designer/client/reducers/component";
import AdapterComponentCreate from "../ComponentCreate/AdapterComponentCreate";


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
    const {data, save} = useContext(DataContext);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [isCreatingComponent, setIsCreatingComponent] = useState(false);

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
                    <PageEdit page={page} onEdit={onEditEnd}/>
                </Flyout>
            )}

            {isCreatingComponent && (
                <Flyout show={true} onHide={setIsCreatingComponent}>
                    <ComponentContextProvider>
                        <AdapterComponentCreate renderInForm={true} toggleAddComponent={() => {
                            setIsCreatingComponent(false);
                        }} page={page}/>
                    </ComponentContextProvider>
                </Flyout>
            )}
        </div>
    );
};