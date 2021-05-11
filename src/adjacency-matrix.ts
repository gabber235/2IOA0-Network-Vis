import { getCorrespondants, parseData, Email, Person, Title } from "./data";
import { div, text } from "./utils";
import * as d3 from "d3";

export type Edge = {
  source: string;
  target: string;
  weight: number;
};

export type Node = {
  id: string;
  role: string;
  salary: number;
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
    ["Unknown"],
    correspondantList
  );
  // console.log(filteredCorrespondants)

  console.log(emails);
  console.log(filterEmail(filteredCorrespondants, emails));

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

  // call adjacency matrix
  createAdjacencyMatrix(nodes, edges);
});

// Returns an array (filtered) with the persons who have one of the jobtitles that is given as an array (jobTitleList) in the input.
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

let nodes: Node[] = [
  {
    id: "Irene",
    role: "manager",
    salary: 300000,
  },
  {
    id: "Zan",
    role: "manager",
    salary: 380000,
  },
  {
    id: "Jim",
    role: "employee",
    salary: 150000,
  },
  {
    id: "Susie",
    role: "employee",
    salary: 90000,
  },
  {
    id: "Kai",
    role: "employee",
    salary: 135000,
  },
  {
    id: "Shirley",
    role: "employee",
    salary: 60000,
  },
  {
    id: "Erik",
    role: "employee",
    salary: 90000,
  },
  {
    id: "Shelby",
    role: "employee",
    salary: 150000,
  },
  {
    id: "Tony",
    role: "employee",
    salary: 72000,
  },
  {
    id: "Fil",
    role: "employee",
    salary: 35000,
  },
  {
    id: "Adam",
    role: "employee",
    salary: 85000,
  },
  {
    id: "Ian",
    role: "employee",
    salary: 83000,
  },
  {
    id: "Miles",
    role: "employee",
    salary: 99000,
  },
  {
    id: "Sarah",
    role: "employee",
    salary: 160000,
  },
  {
    id: "Nadieh",
    role: "contractor",
    salary: 240000,
  },
  {
    id: "Hajra",
    role: "contractor",
    salary: 280000,
  },
];
let edges: Edge[] = [
  {
    source: "Jim",
    target: "Irene",
    weight: 5,
  },
  {
    source: "Susie",
    target: "Irene",
    weight: 5,
  },
  {
    source: "Jim",
    target: "Susie",
    weight: 5,
  },
  {
    source: "Susie",
    target: "Kai",
    weight: 5,
  },
  {
    source: "Shirley",
    target: "Kai",
    weight: 5,
  },
  {
    source: "Shelby",
    target: "Kai",
    weight: 5,
  },
  {
    source: "Kai",
    target: "Susie",
    weight: 5,
  },
  {
    source: "Kai",
    target: "Shirley",
    weight: 5,
  },
  {
    source: "Kai",
    target: "Shelby",
    weight: 5,
  },
  {
    source: "Erik",
    target: "Zan",
    weight: 5,
  },
  {
    source: "Tony",
    target: "Zan",
    weight: 5,
  },
  {
    source: "Tony",
    target: "Fil",
    weight: 5,
  },
  {
    source: "Tony",
    target: "Ian",
    weight: 5,
  },
  {
    source: "Tony",
    target: "Adam",
    weight: 5,
  },
  {
    source: "Fil",
    target: "Tony",
    weight: 4,
  },
  {
    source: "Ian",
    target: "Miles",
    weight: 1,
  },
  {
    source: "Adam",
    target: "Tony",
    weight: 3,
  },
  {
    source: "Miles",
    target: "Ian",
    weight: 2,
  },
  {
    source: "Miles",
    target: "Ian",
    weight: 3,
  },
  {
    source: "Erik",
    target: "Kai",
    weight: 2,
  },
  {
    source: "Erik",
    target: "Nadieh",
    weight: 2,
  },
  {
    source: "Jim",
    target: "Nadieh",
    weight: 2,
  },
];

function createAdjacencyMatrix(nodes: Node[], edges: Edge[]) {
  // for drawing in SVG
  let width = 600;
  let height = 600;

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

  let boxSize = 35; // pixels

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
    .attr("width", boxSize)
    .attr("height", boxSize)
    .attr("x", (d) => d.x * boxSize)
    .attr("y", (d) => d.y * boxSize)
    .style("fill-opacity", (d) => d.weight * 0.2);

  d3.select("svg")
    .append("g")
    .attr("transform", "translate(50,45)")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * boxSize + boxSize / 2)
    .text((d) => d.id)
    .style("text-anchor", "middle")
    .style("font-size", "10px");

  d3.select("svg")
    .append("g")
    .attr("transform", "translate(45,50)")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("y", (d, i) => i * boxSize + boxSize / 2)
    .text((d) => d.id)
    .style("text-anchor", "end")
    .style("font-size", "10px");

  d3.selectAll("rect.grid").on("mouseover", gridOver);

  function gridOver(d: any) {
    d3.selectAll("rect").style("stroke-width", function (p: Cell) {
      //TODO: Below is the original line which works in JS but not in TS for some reason
      // return p.x === d.x || p.y == d.y ? "3px" : "1px"
      //this only works like half of the time but the idea is there
      return p.x === Math.floor((d.layerX - boxSize) / boxSize) ||
        p.y == Math.floor((d.layerY - boxSize) / boxSize)
        ? "3px"
        : "1px";
    });
  }
}
