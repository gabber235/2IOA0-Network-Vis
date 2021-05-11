import { getCorrespondants, parseData, Email, Person, Title } from "./data";
import { div, text } from "./utils";
import * as d3 from "d3";

export type Edge = {
  source: number;
  target: number;
  weight: number;
};

export type Cell = {
  id: string;
  weight: number;
  x: number;
  y: number;
};

// get used data
const dataFile = require("../resources/static/enron-v1.csv");

// temp
window.addEventListener("load", async () => {
  document.body.appendChild(div({}, [text("Adjacency-matrix")]));

  // Get data
  let file = await fetch(dataFile.default);
  let emails = parseData(await file.text());
  const correspondants = getCorrespondants(emails); //dictionary with persons

  // Creating array with person objects...
  let correspondantList = Object.values(correspondants);

  // Testing the function
  let filteredCorrespondants = filterCorrespondants(
    ["CEO", "Trader"],
    correspondantList
  );
  // console.log(filteredCorrespondants)

  // console.log(emails);
  // console.log(filterEmail(filteredCorrespondants, emails));

  // Add SVG to document to use for adjacency matrix
  //TODO: fix this, currently works with SVG in index.html
  // let svg = document.createElement("svg");
  // svg.setAttribute(
  //     "width",
  //     "650"
  // );
  // svg.setAttribute(
  //     "height",
  //     "650"
  // );
  // document.body.append(svg);
  let svg = document.getElementsByTagName('svg')[0]

  // call adjacency matrix  
  createAdjacencyMatrix(filteredCorrespondants, emailsToEdges(emails), svg);
});



// Returns a filtered array with the persons who have one of the jobtitles that is given as an array (jobTitleList) in the input.
export function filterCorrespondants(
  jobTitleList: Title[],
  correspondants: Person[]
) {
  let filtered: Person[] = [];
  for (let person in correspondants) {
    for (let job in jobTitleList) {
      if (jobTitleList[job] === correspondants[person].title) {
        filtered.push(correspondants[person]);
        break;
      }
    }
  }
  return filtered;
}


// Returns filtered email array based on correspondant list and emails
export function filterEmail(correspondants: Person[], emails: Email[]) {
  const filtered: Email[] = [];

  // for each email check if the sender and receiver are both in the correspondants
  emails.forEach((email) => {
    if (
      correspondants.some((x) => x.id === email.fromId) &&
      correspondants.some((x) => x.id === email.toId)
    ) {
      filtered.push(email);
    }
  });

  return filtered;
}


// Returns array of edges based on input emails
function emailsToEdges(emails: Email[]) {
  const edges: Edge[] = [];

  // first check if an edge already exist, if it does, increase weight, else add it
  emails.forEach(email => {
    // find in edges
    let edge = edges.find(element => (element.source === email.fromId && element.target === email.toId))

    if (edge === undefined) {
      // add a new edge since it doesn't exist yet
      const newEdge: Edge = { source: email.fromId, target: email.toId, weight: 1 };
      edges.push(newEdge);
    } else {
      // increase weight of edge that already exists
      edge.weight += 1;
    }
  });
  // console.log(edges)
  return edges;
}


function createAdjacencyMatrix(nodes: Person[], edges: Edge[], SVG: SVGSVGElement) {
  const numberOfNodes = nodes.length;

  // for drawing in SVG
  const width: number = 0.9 * parseInt(SVG.getAttribute('width'));
  const height: number = 0.9 * parseInt(SVG.getAttribute('height'));
  const boxWidth: number = width / numberOfNodes; // pixels
  const boxHeight: number = height / numberOfNodes; // pixels

  console.log(nodes)

  // get max weight
  const maxWeight: number = edges.reduce((a, b) => a.weight > b.weight ? a : b).weight;
  // console.log(maxWeight)


  // hash of which edges we have
  let edgeHash: { [id: string]: Edge } = {};
  edges.forEach((edge) => {
    let id: string = edge.source + "-" + edge.target;
    edgeHash[id] = edge;
  });

  // fill matrix
  let matrix: Cell[] = [];
  nodes.forEach((source, a) => {
    nodes.forEach((target, b) => {
      let grid = { id: source.id + "-" + target.id, x: b, y: a, weight: 0 };
      if (edgeHash[grid.id]) {
        grid.weight = edgeHash[grid.id].weight;
      }
      matrix.push(grid);
    });
  });

  // console.log(matrix)

  let svg = d3.select("svg");

  d3.select("svg")
    .append("g")
    .attr("transform", "translate(50,50)")
    .attr("id", "adjacencyG")
    .selectAll("rect")
    .data(matrix)
    .enter()
    .append("rect")
    .attr("class", "grid")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("x", (d) => d.x * boxWidth)
    .attr("y", (d) => d.y * boxHeight)
    .style("fill-opacity", (d) => scaleOpacity(d.weight, maxWeight));

  d3.select("svg")
    .append("g")
    .attr("transform", "translate(50,45)")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * boxWidth + boxWidth / 2)
    .text((d) => d.title + " " + d.id)
    .style("text-anchor", "middle")
    .style("font-size", "10px");

  d3.select("svg")
    .append("g")
    .attr("transform", "translate(45,50)")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("y", (d, i) => i * boxHeight + boxHeight / 2)
    .text((d) => d.title + " " + d.id)
    .style("text-anchor", "end")
    .style("font-size", "10px");

  d3.selectAll("rect.grid").on("mouseover", gridOver);

  function gridOver(d: any) {
    d3.selectAll("rect").style("stroke-width", function (p: Cell) {
      //TODO: Below is the original line which works in JS but not in TS for some reason
      // return p.x == d.x || p.y == d.y ? "3px" : "1px"
      //this only works like half of the time but the idea is there
      return p.x === Math.floor((d.layerX - boxWidth) / boxWidth) ||
        p.y == Math.floor((d.layerY - boxHeight) / boxHeight)
        ? "3px"
        : "1px";
    });
  }
}


// Takes input and the max of all inputs and scales opacity accordingly
function scaleOpacity(inp: number, maxInp: number) {
  // linear
  // let opacity: number = inp * (1/ maxInp);

  // log scaling
  let opacity: number = Math.log(inp) / Math.log(maxInp);
  if (opacity < 0) { opacity = 0 }
  return opacity;
}
