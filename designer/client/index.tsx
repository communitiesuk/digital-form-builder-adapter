import React from "react";
import ReactDOM from "react-dom";
import {LandingChoice, NewConfig} from "../../digital-form-builder/designer/client/pages/LandingPage";
import {SaveError} from "../../digital-form-builder/designer/client/pages/ErrorPages";
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import {ViewFundForms} from "./pages/landing-page";
import AdapterDesigner from "./AdapterDesigner";
import {adapterInitI18n} from "./i18n";

adapterInitI18n();

function NoMatch() {
    return <div>404 Not found</div>;
}

export class CustomApp extends React.Component {
    render() {
        return (
            <Router basename="/app">
                <div id="app" style={{overflow: 'auto'}}>
                    <Switch>
                        <Route path="/designer/:id" component={AdapterDesigner}/>
                        <Route path="/" exact>
                            <LandingChoice/>
                        </Route>
                        <Route path="/new" exact>
                            <NewConfig/>
                        </Route>
                        <Route path="/choose-existing" exact>
                            <ViewFundForms/>
                        </Route>
                        <Route path="/save-error" exact>
                            <SaveError/>
                        </Route>
                        <Route path="*">
                            <NoMatch/>
                        </Route>
                    </Switch>
                </div>
            </Router>
        );
    }
}

ReactDOM.render(<CustomApp/>, document.getElementById("root"));
