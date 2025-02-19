import React, {useContext, useRef} from "react";
import {whichMigrations} from "@xgovformbuilder/model";
import {DataContext} from "../../../../digital-form-builder/designer/client/context";
import logger from "../../../../digital-form-builder/designer/client/plugins/logger";

export function migrate(form) {
    const {version = 0} = form;
    const migrationList = whichMigrations(version);
    try {
        let migratedJson = {...form};
        migrationList.forEach((migration) => {
            migratedJson = migration(migratedJson);
        });
        return migratedJson;
    } catch (e) {
        logger.error("SubMenu", "failed to migrate json");
    }
}

type Props = {
    id?: string;
    updateDownloadedAt?: (string) => void;
};

export function SubMenu({id, updateDownloadedAt}: Props) {
    const {data, save} = useContext(DataContext);
    const fileInput = useRef<HTMLInputElement>(null);

    const onClickUpload = () => {
        fileInput.current!.click();
    };

    const onClickDownload = (e) => {
        e.preventDefault();

        data.pages.forEach(page => {
            if (page.components) {
                page.components.forEach(component => {
                    // @ts-ignore
                    delete component.tempSubComponent;
                    // @ts-ignore
                    delete component.pageOptions;
                })
            }
        })

        const encodedData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        updateDownloadedAt?.(new Date().toLocaleTimeString());
        const link = document.createElement("a");
        link.download = `${id}.json`;
        link.href = `data:${encodedData}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const onFileUpload = (e) => {
        const file = e.target.files.item(0);
        const reader = new window.FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            //@ts-ignore
            const content = JSON.parse(evt.target.result);
            const migrated = migrate(content);
            save(migrated);
        };
    };

    return (
        <div className="menu__row">
            <a href="/app" className="govuk-link submenu__link">
                Create new form
            </a>
            <button
                className="govuk-body govuk-link submenu__link"
                onClick={onClickUpload}
            >
                Import saved form
            </button>
            <button
                className="govuk-body govuk-link submenu__link"
                onClick={onClickDownload}
                id={"download-btn"}
            >
                Download form
            </button>
            <input
                ref={fileInput}
                type="file"
                hidden
                onChange={onFileUpload}
                aria-label="Import saved form"
            />
            <a href="/app/choose-existing" className="govuk-link submenu__link">
                Existing forms
            </a>
        </div>
    );
}
