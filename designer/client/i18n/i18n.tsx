import i18next, {InitOptions} from "i18next";
import Backend from "i18next-http-backend";
import enCommonTranslations from "./translations/en.translation.json";
import upperFirst from "lodash/upperFirst";

const interpolationFormats = {
    capitalise: (value) => upperFirst(value),
};


const ADAPTER_SETTINGS: InitOptions = {
    lng: "en",
    fallbackLng: "en",
    debug: false,
    interpolation: {
        escapeValue: false,
        format: function (value, format, lng) {
            // @ts-ignore
            return interpolationFormats[format]?.(value) ?? value;
        },
    },
    resources: {
        en: {
            translation: enCommonTranslations,
        },
    },
    backend: {
        loadPath: "/assets/adapter/translations/{{lng}}.{{ns}}.json",
    },
};

export const adapterInitI18n = (i18n: typeof i18next = i18next, settings = ADAPTER_SETTINGS): void => {
    i18n.use(Backend).init(settings);
};
