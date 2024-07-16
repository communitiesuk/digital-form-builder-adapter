export type ConfigureEnginePluginType = (formFileName?: string, formFilePath?: string) => {
    plugin: any;
    options: {
        modelOptions: {
            relativeTo: string;
            previewMode: any;
        };
        configs: {
            configuration: any;
            id: string;
        }[];
        previewMode: boolean;
    };
};
