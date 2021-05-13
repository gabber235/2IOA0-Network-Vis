import { getCorrespondants, parseData } from "./data";
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { NodeLink } from "./visualizations/node-link";

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
