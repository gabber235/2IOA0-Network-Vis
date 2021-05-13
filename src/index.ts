import "vis/dist/vis.min.css"

import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { NodeLink } from "./visualizations/node-link";
import { getCorrespondants, parseData } from "./data"

const dataFile = require("../resources/static/enron-v1.csv");

const visualizations = [
    new AdjacencyMatrix(),
    new NodeLink(),
]

window.addEventListener("load", async () => {
    const emails = parseData(await (await fetch(dataFile.default)).text()).slice(0, 100)
    const correspondants = getCorrespondants(emails)
    visualizations.forEach(vis => vis.visualize(emails, correspondants))
})
