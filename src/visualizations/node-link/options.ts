import { Person } from "../../data"
import { DataSet } from "../../pipeline/dynamicDataSet"
import { nodeSize, titleColors } from "../constants"


export type NodeLinkOptions = {
    hierarchical?: boolean,
    physics?: boolean,
    groupEdges?: boolean,
}



export const defaultNodeLinkOptions: NodeLinkOptions = {
    physics: true,
    hierarchical: false,
    groupEdges: true
}

export const initialVisOptions = {
    nodes: {
        shape: 'dot',
        size: nodeSize,
    },
    edges: {
        arrows: "to"
    },
    layout: {
        hierarchical: {
            enabled: defaultNodeLinkOptions.hierarchical,
            nodeSpacing: 20,
            treeSpacing: 10,
        },
        // improvedLayout: false
    },
    physics: {
        enabled: defaultNodeLinkOptions.physics,
        barnesHut: {
            centralGravity: 1
        },
        // stabilizations:false
    },
    interaction: { multiselect: true},
    groups: titleColors
}



export function nodeLinkOptionsToVisOptions(config: NodeLinkOptions): vis.Options {
    return {
        layout: {
            hierarchical: {
                enabled: config.hierarchical,

            }

        },
        physics: {
            enabled: config.physics,
        },
    }
}

