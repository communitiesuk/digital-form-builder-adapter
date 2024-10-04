import i18n from 'hapi-i18n';

export default {
    plugin: i18n,
    options: {
        locales: ['en', 'cy'],  // List of supported languages
        directory: './locales',        // Directory containing the translation JSON files
        defaultLocale: 'en',           // Default language fallback
        stateName: 'language',         // The name of the state cookie or parameter to detect language
        // Disable interpolation so {{ and }} are treated literally
        // updateFiles: false,         // Optional, don't update JSON files on the fly
        objectNotation: true,          // Enable nested JSON access
        // Custom interpolation settings to avoid conflicts with Joi
        interpolation: {
            prefix: '[[',
            suffix: ']]',
            escapeValue: false,         // Optional: Disable automatic escaping
        }
    },
};
