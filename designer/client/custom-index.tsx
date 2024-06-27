// @ts-ignore
import {App} from "../../digital-form-builder/designer/client";
import React from "react";
import ReactDOM from "react-dom";

export class CustomApp extends App {
    render(): React.JSX.Element {
        return (
            <div style={{ margin: "4em" }}>
                <h1>This is New flavour of designer</h1>
                {super.render()}
            </div>
        );
    }
}

ReactDOM.render(<CustomApp/>, document.getElementById("root"));
