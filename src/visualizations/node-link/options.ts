import { nodeSize, titleColors } from "../constants"


export type NodeLinkOptions = {
    hierarchical?: boolean,
    physics?: boolean,
    solver?: "barnesHut"|"forceAtlas2Based",
    groupNodes?: boolean,
    groupEdges?: boolean,
}



export const defaultNodeLinkOptions: NodeLinkOptions = {
    physics: true,
    hierarchical: false,
    groupNodes: false,
    groupEdges: true,
    solver: "barnesHut"
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
        timestep: 0.5,
        solver: defaultNodeLinkOptions.solver,
        forceAtlas2Based: {
            springLength: 10,
            springConstant: 0.1,
            damping: 0.5,
            // theta: 1,
            gravitationalConstant: -20,
            centralGravity: 0.005
        },
        barnesHut: {
            // theta: 1,
            gravitationalConstant: -4000,
            centralGravity: 1 ,
            springLength: 300 	,
            springConstant: 0.1,
            damping: 0.7,
            avoidOverlap: 0,
        },
        stabilizations: false
    },
    interaction: { 
        multiselect: true,
        hover: true,
        tooltipDelay: 0,
        // selectConnectedEdges: false,
    },
    // groups: titleColors
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
            solver: config.solver,
        },
    }
}

