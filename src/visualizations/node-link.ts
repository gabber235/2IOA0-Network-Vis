import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as vis from 'vis';
import { Email, Correspondants, Person } from '../data';
import { DataSetDiff } from '../pipeline/dynamicDataSet';
import { Visualization } from './visualization'

export class NodeLink implements Visualization {
    async visualize(data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>): Promise<void> {

        const nodes = new vis.DataSet()
        const edges = new vis.DataSet<vis.Edge>()

        bindVisDataSet(nodes, data.pipe(map(i => i[0].map(personToNode))))
        bindVisDataSet(edges, data.pipe(map(i => i[1].map(emailToEdge))))

        const config = {
            nodes: {
                shape: 'dot',
                size: 20,
            },
            edges: {
                arrows: "to"
            }
        }

        new vis.Network(document.getElementById("node-links"), { nodes: nodes, edges: edges }, config)
    }
}

export function bindVisDataSet<A extends vis.DataItem | vis.Edge | vis.Node | vis.DataGroup>(dataset: vis.DataSet<A>, dynamicData: Observable<DataSetDiff<A>>) {
    dynamicData.subscribe({
        next(diff) {
            dataset.add(diff.changes.filter(i => i.type === 'add').map((i: any) => i.value))
            dataset.update(diff.changes.filter(i => i.type === 'update').map((i: any) => i.value))
            dataset.remove(diff.changes.filter(i => i.type === 'remove').map(i => i.id))
        }
    })
}

function personToNode(p: Person): vis.Node {
    return {
        id: p.id,
        title: p.emailAdress,
        group: p.title
    }
}
function emailToEdge(e: Email): vis.Edge {
    return {
        id: e.id,
        from: e.fromId,
        to: e.toId
    }
}
