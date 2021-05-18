import { getCorrespondants, parseData } from "./data";
import { div, text } from "./utils";
import "../visualisations/adjacency-matrix";

const dataFile = require("../resources/static/enron-v1.csv");

window.addEventListener("load", async () => {
  // document.body.appendChild(div({}, [text("Hello World ❤️")]));

  // let file = await fetch(dataFile.default)
  // let emails = parseData(await file.text())
  // const correspondants = getCorrespondants(emails)
  // console.table(correspondants)
  // console.table(emails.slice(0, 10))
});
