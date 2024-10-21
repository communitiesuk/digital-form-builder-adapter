import Boom from "boom";
import fs from "fs";
import path from "path";

export type Localization = {
    en: any
    cy: any
}

export class TranslationLoaderService {
    async getTranslations() {
        // translations that need for the component level will be loaded from this service
        let translationEn = undefined
        let translationCy = undefined
        try {
            const filePathCy = path.join(__dirname, '../../../../locales', `cy.json`);
            const filePathEn = path.join(__dirname, '../../../../locales', `en.json`);
            // @ts-ignore
            const dataCy = await fs.readFileSync(filePathCy, 'utf8');
            const dataEn = await fs.readFileSync(filePathEn, 'utf8');
            translationEn = JSON.parse(dataEn);
            translationCy = JSON.parse(dataCy);
            const translations: Localization = {
                en: translationEn,
                cy: translationCy,
            }
            return translations;
        } catch (err) {
            console.error(`Error reading translations`, err);
            throw Boom.internal("Cannot read translations from the local folder")
        }
    }
}
