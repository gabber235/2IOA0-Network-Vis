import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as vis from 'vis';
import { Email, Correspondants, Person, Title } from '../data';
import { DataSetDiff } from '../pipeline/dynamicDataSet';

export type NodeLinkOptions = {
    hierarchical?: boolean,
    physics?: boolean
}

/**
 * Create a new vis.Network instance and bind it to 'container'
 */
export async function visualizeNodeLinkDiagram(container: HTMLElement, data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>, options: Observable<NodeLinkOptions>): Promise<vis.Network> {

    const nodes = new vis.DataSet()
    const edges = new vis.DataSet<vis.Edge>()

    let visualisation = new vis.Network(container, { nodes: nodes, edges: edges }, {})

    options.subscribe({next (options) {
        visualisation.setOptions(nodeLinkOptionsToVisOptions(options))
    }})
    data.subscribe({next ([people, emails]) {
        nodes.add(people.insertions.map(({value}) => personToNode(value)))
        edges.add(emails.insertions.map(({value}) => emailToEdge(value)))

        nodes.update(people.updates.map(({value}) => personToNode(value)))
        edges.update(emails.updates.map(({value}) => emailToEdge(value)))

        edges.remove(emails.deletions.map(({id}) => id))
        nodes.remove(people.deletions.map(({id}) => id))
    }})

    return visualisation
}


const defaultNodeLinkOptions: NodeLinkOptions = {
    physics: true,
    hierarchical: true
}

export function nodeLinkOptionsToVisOptions(config: NodeLinkOptions): vis.Options {

    const options = Object.assign({}, defaultNodeLinkOptions, config)

    return {
        nodes: {
            shape: 'dot',
            size: 20,
        },
        edges: {
            arrows: "to"
        },
        layout: {
            hierarchical: {
                enabled: options.hierarchical,
                nodeSpacing: 10,
                treeSpacing: 10,
            }
        },
        physics: {
            enabled: options.physics,
        }
    }
}

function personToNode(p: Person): vis.Node {
    return {
        id: p.id,
        title: `${p.emailAdress}, ${p.title}`,
        group: p.title,
        level: titleRanks[p.title]
    }
}
function emailToEdge(e: Email): vis.Edge {
    return {
        id: e.id,
        from: e.fromId,
        to: e.toId,
        title: "" + e.sentiment
    }
}


const titleRanks = {
    "CEO": 0,
    "President": 1,
    "Vice President": 2,
    "Managing Director": 3,
    "Director": 4,
    "Manager": 5,
    "Trader": 6,
    "Employee": 7,
    "In House Lawyer": 8,
    "Unknown": 9,
}