import * as vis from 'vis';
import { Email, Correspondants } from '../data';
import { Visualization } from './visualization'

export class NodeLink implements Visualization {
    async visualize(emails: Email[], correspondants: Correspondants): Promise<void> {
        const maxSent = Math.max(...emails.map(i => i.sentiment))
        const minSent = Math.min(...emails.map(i => i.sentiment))

        let nodes = new vis.DataSet(
            Object.entries(correspondants)
                .map(([k, i]) => {
                    return {
                        id: +k,
                        title: `${i.emailAdress}, ${i.title}`,
                        group: i.title
                    }
                })
        )
        let edges = new vis.DataSet(
            emails.map(i => {
                return {
                    from: i.fromId,
                    to: i.toId,
                    title: "" + i.sentiment,
                    width: (i.sentiment - minSent) / (maxSent - minSent) * 5
                }
            })
        )

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