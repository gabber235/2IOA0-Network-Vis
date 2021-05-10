import { getCorrespondants, parseData } from "./data"
import { div, text } from "./utils"

const dataFile = require('../resources/static/enron-v1.csv')

import * as vis from "vis"

import "vis/dist/vis.min.css"

window.addEventListener("load", async () => {

    const emails = parseData(await (await fetch(dataFile.default)).text()).slice(0, 100)
    const correspondants = getCorrespondants(emails)

    const maxSent = Math.max(...emails.map(i => i.sentiment))
    const minSent = Math.min(...emails.map(i => i.sentiment))

    let nodes = new vis.DataSet(
        Object.entries(correspondants)
        .map(([k, i]) => {
            return {
                id: +k,
                title: `${i.email}, ${i.title}`,
                group: i.title
            }
        })
    )
    let edges = new vis.DataSet(
        emails.map(i => {
            return {
                from: i.fromId, 
                to: i.toId,
                title: ""+i.sentiment,
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

    new vis.Network(document.body, {nodes: nodes, edges: edges}, config)
})
