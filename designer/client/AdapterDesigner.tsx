import React, {Component} from "react";
import {Prompt} from "react-router-dom";
import {DesignerApi} from "../../digital-form-builder/designer/client/api/designerApi";
import FeatureFlagProvider from "../../digital-form-builder/designer/client/context/FeatureFlagContext";
import {DataContext, FlyoutContext} from "../../digital-form-builder/designer/client/context";
import {i18n} from "../../digital-form-builder/designer/client/i18n";
import {Menu} from "../../digital-form-builder/designer/client/components/Menu";
import {AdapterVisualisation} from "./components/Visualization";
import {AdapterFormDefinition} from "@communitiesuk/model";
import {AdapterDataContext} from "./context/AdapterDataContext";

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
    page?: any;
    updatedAt?: any;
    downloadedAt?: any;
}

export default class AdapterDesigner extends Component<Props, State> {
    state = {loading: true, flyoutCount: 0};

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

    save = async (toUpdate, callback = () => {
    }) => {
        try {
            await this.designerApi.save(this.id, toUpdate);
            // @ts-ignore
            this.setState({data: toUpdate, updatedAt: new Date().toLocaleTimeString(), error: undefined,}, callback());
            return toUpdate;
        } catch (e) {
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
        this.designerApi.fetchData(id).then((data) => {
            this.setState({loading: false, data});
        });
    }

    render() {
        //@ts-ignore
        const {flyoutCount, data, loading, error} = this.state;
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
        return (
            <FeatureFlagProvider>
                <AdapterDataContext.Provider value={dataContextProviderValue}>
                    <DataContext.Provider value={dataContextProviderValue}>
                        <FlyoutContext.Provider value={flyoutContextProviderValue}>
                            <div id="designer">
                                <Prompt when={!error} message={`${i18n("leaveDesigner")}`}/>
                                <Menu id={this.id} updateDownloadedAt={this.updateDownloadedAt}
                                      updatePersona={this.updatePersona}/>
                                <AdapterVisualisation downloadedAt={this.state.downloadedAt}
                                                      updatedAt={this.state.updatedAt} persona={this.state.persona}
                                                      id={this.id} previewUrl={previewUrl}/>
                            </div>
                        </FlyoutContext.Provider>
                    </DataContext.Provider>
                </AdapterDataContext.Provider>
            </FeatureFlagProvider>
        );
    }
}
