import React, {useContext, useEffect, useRef, useState} from "react";


import "../../../../digital-form-builder/designer/client/components/Visualisation/visualisation.scss";
import {getLayout, Pos} from "../../../../digital-form-builder/designer/client/components/Visualisation/getLayout";
import {AdapterPage} from "../Page";
import {Info} from "../../../../digital-form-builder/designer/client/components/Visualisation/Info";
import {Minimap} from "../../../../digital-form-builder/designer/client/components/Visualisation/Minimap";
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

                {layout && <Info downloadedAt={downloadedAt} updatedAt={updatedAt}/>}

                {layout && <Minimap layout={layout}/>}
            </div>
        </>
    );
}
