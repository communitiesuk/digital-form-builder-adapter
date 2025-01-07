import React, {useContext, useEffect, useRef, useState} from "react";


import "../../../../digital-form-builder/designer/client/components/Visualisation/visualisation.scss";
import {getLayout, Pos} from "../../../../digital-form-builder/designer/client/components/Visualisation/getLayout";
import {AdapterPage} from "../Page";
import {AdapterDataContext} from "../../context/AdapterDataContext";
import {AdapterLines} from "./AdapterLines";

type Props = {
    updatedAt?: string;
    downloadedAt?: string;
    previewUrl?: string;
    persona?: any;
    id?: string;
};

export function useVisualisation(ref) {
    const {data} = useContext(AdapterDataContext);
    const [layout, setLayout] = useState<Pos>();

    useEffect(() => {
        const layout = getLayout(data, ref.current!);
        setLayout(layout.pos);
    }, [data, ref]);

    return {layout};
}

export const AdapterVisualisation = (props: Props) => {
    const ref = useRef(null);
    const {layout} = useVisualisation(ref);
    const {data} = useContext(AdapterDataContext);

    const {updatedAt, downloadedAt, previewUrl, persona, id} = props;
    const {pages} = data;
    const scale = 0.05

    const wrapperStyle = layout && {
        width: layout?.width,
        height: layout?.height,
    };

    return (
        <>
            <div className="visualisation">
                <div className="visualisation__pages-wrapper">
                    <div ref={ref} style={wrapperStyle}>
                        {pages.map((page, index) => (
                            <AdapterPage
                                key={index}
                                page={page}
                                previewUrl={previewUrl}
                                layout={layout?.nodes[index]}
                                id={id}
                            />
                        ))}

                        {layout && <AdapterLines layout={layout} data={data} persona={persona}/>}
                    </div>
                </div>

                {layout &&
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <div className="notification" style={{position: 'relative'}}>
                            <p className="govuk-body">last downloaded at {downloadedAt}</p>
                            <p className="govuk-body">last updated at {updatedAt}</p>
                        </div>
                        <div className="minimap" style={{position: 'relative'}}>
                            <svg
                                height={parseFloat(layout.height) * scale}
                                width={parseFloat(layout.width) * scale}
                            >
                                {layout.edges.map((edge) => {
                                    const points = edge.points
                                        .map((points) => `${points.x * scale},${points.y * scale}`)
                                        .join(" ");
                                    return (
                                        <g key={points}>
                                            <polyline points={points}/>
                                        </g>
                                    );
                                })}

                                {layout.nodes.map((node, index) => {
                                    // @ts-ignore
                                    return (
                                        <g key={node + index}><a id={node + index} xlinkHref={`#${node.node.label}`}>
                                            <rect
                                                x={parseFloat(node.left) * scale}
                                                y={parseFloat(node.top) * scale}
                                                width={node.node.width * scale}
                                                height={node.node.height * scale}
                                                //@ts-ignore
                                                title={node.node.label}
                                            />
                                        </a>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                }
            </div>
        </>
    );
}
