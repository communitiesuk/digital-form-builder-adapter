import React, {Component} from "react";
import {Prompt} from "react-router-dom";
import {DesignerApi} from "../../digital-form-builder/designer/client/api/designerApi";
import FeatureFlagProvider from "../../digital-form-builder/designer/client/context/FeatureFlagContext";
import {DataContext, FlyoutContext} from "../../digital-form-builder/designer/client/context";
import {i18n} from "../../digital-form-builder/designer/client/i18n";
import {AdapterVisualisation} from "./components/Visualization";
import {AdapterFormDefinition} from "@communitiesuk/model";
import {AdapterDataContext} from "./context/AdapterDataContext";
import AdapterMenu from "./components/menu/AdapterMenu";

interface Props {
    match?: any;
    location?: any;
    history?: any;
}

interface State {
    id?: any;
    flyoutCount?: number;
    loading?: boolean;
    error?: string; // not using as of now
    newConfig?: boolean; // TODO - is this required?
    data?: AdapterFormDefinition;
    displayName?: string;
    page?: any;
    updatedAt?: any;
    downloadedAt?: any;
}

export default class AdapterDesigner extends Component<Props, State> {
    state: State = {loading: true, flyoutCount: 0};

    designerApi = new DesignerApi();

    get id() {
        return this.props.match?.params?.id;
    }

    updateDownloadedAt = (time) => {
        this.setState({downloadedAt: time});
    };

    incrementFlyoutCounter = (callback = () => {
    }) => {
        let currentCount = this.state.flyoutCount;
        // @ts-ignore
        this.setState({flyoutCount: ++currentCount}, callback());
    };

    decrementFlyoutCounter = (callback = () => {
    }) => {
        let currentCount = this.state.flyoutCount;
        // @ts-ignore
        this.setState({flyoutCount: --currentCount}, callback());
    };

    save = async (toUpdate, displayName?: string, callback = () => {
    }) => {
        try {
            const displayNameToUse = displayName || this.state.displayName;
            
            const payload = {
                ...toUpdate,
                name: displayNameToUse
            };
            
            await this.designerApi.save(this.id, payload);
            
            this.setState({
                data: toUpdate,
                displayName: displayNameToUse,
                updatedAt: new Date().toLocaleTimeString(),
                error: undefined,
            }, callback());
            
            return toUpdate;
        } catch (e) {
            //@ts-ignore
            this.setState({error: e.message});
            this.props.history.push({
                pathname: "/save-error",
                state: {id: this.id},
            });
        }
    };

    updatePageContext = (page) => {
        this.setState({page});
    };

    componentDidMount() {
        const id = this.props.match?.params?.id;
        this.setState({id});
        this.designerApi.fetchData(id).then((response) => {
            this.setState({
                loading: false, 
                data: response.draft_json,
                displayName: response.display_name
            });
        });
    }

    render() {
        //@ts-ignore
        const {flyoutCount, data, loading, error, displayName} = this.state;
        //@ts-ignore
        const {previewUrl} = window;
        if (loading) {
            return <p>Loading ...</p>;
        }

        const flyoutContextProviderValue = {
            count: flyoutCount,
            increment: this.incrementFlyoutCounter,
            decrement: this.decrementFlyoutCounter,
        };
        const dataContextProviderValue = {data, save: this.save};
        const adapterDataContextProviderValue = {data, save: this.save, displayName};
        return (
            <FeatureFlagProvider>
                <AdapterDataContext.Provider value={adapterDataContextProviderValue}>
                    <DataContext.Provider value={dataContextProviderValue}>
                        <FlyoutContext.Provider value={flyoutContextProviderValue}>
                            <div id="designer">
                                <Prompt when={!error} message={`${i18n("leaveDesigner")}`}
                                    //@ts-ignore
                                /><AdapterMenu id={this.id} updateDownloadedAt={this.updateDownloadedAt}
                                //@ts-ignore
                                               updatePersona={this.updatePersona}/>
                                <AdapterVisualisation downloadedAt={
                                    //@ts-ignore
                                    this.state.downloadedAt}
                                                      updatedAt={
                                                          //@ts-ignore
                                                          this.state.updatedAt} persona={this.state.persona}
                                                      id={this.id} previewUrl={previewUrl}/>
                            </div>
                        </FlyoutContext.Provider>
                    </DataContext.Provider>
                </AdapterDataContext.Provider>
            </FeatureFlagProvider>
        );
    }
}
