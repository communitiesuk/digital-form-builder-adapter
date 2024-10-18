import Boom from "boom";
import fs from "fs";
import path from "path";

export type Localization = {
    en: any
    cy: any
}

export class TranslationLoaderService {

    translations: Localization = {
        en: undefined,
        cy: undefined
    };

    constructor() {
        // translations that need for the component level will be loaded from this service
        let translationEn = undefined
        let translationCy = undefined
        try {
            const filePathCy = path.join(__dirname, '../../locales', `cy.json`);
            const filePathEn = path.join(__dirname, '../../locales', `en.json`);
            // @ts-ignore
            const dataCy = fs.readFileSync(filePathCy, 'utf8');
            const dataEn = fs.readFileSync(filePathEn, 'utf8');
            translationEn = JSON.parse(dataEn);
            translationCy = JSON.parse(dataCy);
            //@ts-ignore
            this.translations = {
                en: translationEn,
                cy: translationCy,
            }
            console.log("Loading the translations (cy) and (en)")
        } catch (err) {
            console.error(`Error reading translations`, err);
            throw Boom.internal("Cannot read translations from the local folder")
        }
    }

    getTranslations() {
        return this.translations;
    }
}
