import React from "react";
//@ts-ignore
import {Data} from "@xgovformbuilder/model";
import {Edge, Layout} from "../../../../digital-form-builder/designer/client/components/Visualisation/getLayout";
import {AdapterDataContext} from "../../context/AdapterDataContext";
import {Flyout} from "../../../../digital-form-builder/designer/client/components/Flyout";
import {AdapterLinkEdit} from "../component-edit/link-edit/AdapterLinkEdit";

type Props = {
    layout: Layout["pos"];
    data: Data;
    persona: any;
};

type State = {
    showEditor: Edge | boolean;
};

export class AdapterLines extends React.Component<Props, State> {
    static contextType = AdapterDataContext;

    state = {
        showEditor: false,
    };

    constructor(props, context) {
        super(props, context);
    }

    editLink = (edge: Edge) => {
        this.setState({
            showEditor: edge,
        });
    };

    handlePolylineKeyPress = (event: React.KeyboardEvent, edge: Edge) => {
        if (event.key === "Enter" || event.key == " ") {
            this.editLink(edge);
        }
    };

    render() {
        const {layout, persona} = this.props;
        const {data} = this.context;

        return (
            <div>
                <svg height={layout.height} width={layout.width}>
                    {layout.edges.map((edge) => {
                        const {source, target, points, label} = edge;
                        const pointsString = points.map((p) => `${p.x},${p.y}`).join(" ");

                        const xs = edge.points.map((p) => p.x);
                        const ys = edge.points.map((p) => p.y);

                        const textX = xs.reduce((a, b) => a + b, 0) / xs.length;
                        const textY = ys.reduce((a, b) => a + b, 0) / ys.length - 5;

                        const highlight = [source, target].every((path) =>
                            persona?.paths?.includes(path)
                        );
                        return (
                            <g key={pointsString}>
                                <polyline
                                    onClick={() => this.editLink(edge)}
                                    onKeyPress={(event) =>
                                        this.handlePolylineKeyPress(event, edge)
                                    }
                                    tabIndex={0}
                                    points={pointsString}
                                    className={`${highlight ? "highlight" : ""}`}
                                    data-testid={`${source}-${target}`.replace(/\//g, "")}
                                    role="button"
                                >
                                    <title>
                                        {`Edit link from ${source} to ${target}`.replace(/\//g, "")}
                                    </title>
                                </polyline>
                                {label && (
                                    <text
                                        textAnchor="middle"
                                        x={textX}
                                        y={textY}
                                        fill="black"
                                        pointerEvents="none"
                                    >
                                        {label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
                {this.state.showEditor && (
                    <Flyout
                        title="Edit Link"
                        onHide={() => this.setState({showEditor: false})}
                        //@ts-ignore
                    ><AdapterLinkEdit edge={this.state.showEditor} data={data}
                                      onEdit={() => this.setState({showEditor: false})}/>
                    </Flyout>
                )}
            </div>
        );
    }
}
