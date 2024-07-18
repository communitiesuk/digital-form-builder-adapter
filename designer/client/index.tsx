import React from "react";
import ReactDOM from "react-dom";
import Designer from "../../digital-form-builder/designer/client/designer";
import {LandingChoice, NewConfig} from "../../digital-form-builder/designer/client/pages/LandingPage";
import {SaveError} from "../../digital-form-builder/designer/client/pages/ErrorPages";
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import { ViewFundForms } from "./pages/LandingPage";
import {initI18n} from "../../digital-form-builder/designer/client/i18n";

initI18n();

function NoMatch() {
    return <div>404 Not found</div>;
}

export class CustomApp extends React.Component {
    render() {
        return (
            <Router basename="/app">
                <div id="app">
                    <Switch>
                        <Route path="/designer/:id" component={Designer}/>
                        <Route path="/" exact>
                            <LandingChoice/>
                        </Route>
                        <Route path="/new" exact>
                            <NewConfig/>
                        </Route>
                        <Route path="/choose-existing" exact>
                            <ViewFundForms />
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
