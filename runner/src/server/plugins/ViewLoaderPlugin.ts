import path from "path";
import resolve from "resolve";
import pluginViews from "../../../../digital-form-builder/runner/src/server/plugins/views";

const basedir = path.join(process.cwd(), "..");
const xGovFormsPath = path.resolve(__dirname, "../../../../");

pluginViews.options.path = [
    /**
     * Array of directories to check for nunjucks templates.
     */
    `${path.join(__dirname, "..", "views")}`,
    `${path.join(__dirname, "engine", "views")}`,
    `${path.join(xGovFormsPath, "digital-form-builder/runner/src/server/views")}`,
    `${path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views")}`,
    `${path.dirname(resolve.sync("govuk-frontend", {basedir}))}`,
    `${path.dirname(resolve.sync("govuk-frontend", {basedir}))}/components`,
    `${path.dirname(resolve.sync("hmpo-components"))}/components`,
]

export const ViewLoaderPlugin: any = pluginViews
