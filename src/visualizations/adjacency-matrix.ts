import { getCorrespondants, parseData, Email, Person, Title } from "../../src/data";
import { div, text } from "../../src/utils";
import * as d3 from "d3";

type Node = {
  name: string,
  id: number,
  group: string,  // used for titles in our dataset
  index?: number, // used in adjacency matrix
  count?: number, // used in adjacency matrix
}

// used in adjacency matrix, meaningless without linklist, needs to be hashed from emails
type Edge = {
  source: number,
  target: number,
  value: number,
}

// get used data
const dataFile = require("../../resources/static/enron-v1.csv");

// temp
window.addEventListener("load", async () => {
  // document.body.appendChild(div({}, [text("Adjacency-matrix")]));

  // Get data
  let file = await fetch(dataFile.default);
  let emails = parseData(await file.text());
  const correspondants = getCorrespondants(emails); //dictionary with persons

  // Creating array with person objects...
  let correspondantList = Object.values(correspondants);

  // Testing filtering
  let filteredCorrespondants = filterCorrespondants(
    ["CEO", "Trader", "Employee"],
    correspondantList
  );

  // get nodes from people list
  const nodes = peopleToNodes(filteredCorrespondants);
  console.log(nodes, emails)

  // get edges
  const filteredEmail = filterEmail(filteredCorrespondants, emails);
  const links = edgeHash(filteredEmail, nodes);

  // call adjacency matrix  
  // createAdjacencyMatrix(filteredCorrespondants, emailsToEdges(emails), svg);
  createAdjacencyMatrix(nodes, links);
});

// function to turn people objects into node usable by the matrix
function peopleToNodes(people: Person[]) {
  const nodes: Node[] = [];

  people.forEach((person) => {
    const newNode: Node = {
      name: emailToName(person.emailAdress),
      id: person.id,
      group: person.title,
    };
    nodes.push(newNode);
  })

  return nodes;
}

// tries to turn email into name with proper capitalisation of letters
export function emailToName(email: string) {
  let name: string = "";

  // remove everything behind @ and replace space with dot for next step
  let withoutAt = email.split('@')[0].replace(" ", ".")

  // split string at dots for each name part
  let parts: string[] = withoutAt.split(".");

  // capitalise first letter of each part
  for (let i = 0; i < parts.length; i++) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
  }

  // add parts back together, adding a dot if part is just one letter
  parts.forEach((part) => {
    if (part.length === 1) {
      name += part + ". ";
    } else {
      name += part + " ";
    }
  });

  return name;
}

// takes emails and turns them into edges for the adjacency matrix
function edgeHash(emails: Email[], nodes: Node[]) {
  const edges: Edge[] = [];

  // for each email check if it is already in the edge list
  // if so, increase it's value, else add it with value 1
  emails.forEach((email) => {
    // get source in nodelist
    const source = nodes.findIndex((node) => {
      return email.fromId === node.id;
    });
    // get target in nodelist
    const target = nodes.findIndex((node) => {
      return email.toId === node.id;
    });

    const indexInEdges = edges.findIndex((edge) => {
      return edge.source === source && edge.target === target;
    })

    if (indexInEdges === -1) {
      // new edge
      let edge: Edge = {
        source: source,
        target: target,
        value: 1,
      }
      edges.push(edge);
    } else {
      // edge already exists
      edges[indexInEdges].value++;
    }

  })

  return edges;
}

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


export function createAdjacencyMatrix(nodes: Node[], links: Edge[]) {
  let margin = {
    top: 150,
    right: 0,
    bottom: 10,
    left: 150
  };
  let width = 800;
  let height = 800;

  // @ts-expect-error
  let x = d3.scale.ordinal().rangeBands([0, width]);
  // @ts-expect-error
  let z = d3.scale.linear().domain([0, 4]).clamp(true);
  // @ts-expect-error
  let c = d3.scale.category10().domain(d3.range(10));

  let svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  type Cell = {
    x: number,
    y: number,
    z: number,
  }

  // declare variable to store the matrix values
  const matrix: Cell[][] = []

  // variable to keep number of nodes
  let n = nodes.length


  // Compute index per node.
  nodes.forEach(function (node, i) {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(function (j) { return { x: j, y: i, z: 0 }; });
  });



  // Convert links to matrix; count character occurrences.
  links.forEach(function (link) {
    // we have a directional dataset
    matrix[link.source][link.target].z += link.value;
    // matrix[link.target][link.source].z += link.value;
    // matrix[link.source][link.source].z += link.value;
    // matrix[link.target][link.target].z += link.value;
    nodes[link.source].count += link.value;
    nodes[link.target].count += link.value;
  });

  // Precompute the orders.
  let orders = {
    name: d3.range(n).sort(function (a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
    count: d3.range(n).sort(function (a, b) { return nodes[b].count - nodes[a].count; }),
    group: d3.range(n).sort(function (a, b) { return nodes[a].group.localeCompare(nodes[b].group); }),
  };

  // The default sort order.
  x.domain(orders.name);

  svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);

  let rows = svg.selectAll(".row")
    .data(matrix)
    .enter().append("g")
    .attr("class", "row")
    .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })
    .each(row);

  rows.append("line")
    .attr("x2", width);

  rows.append("text")
    .attr("x", -6)
    .attr("y", x.rangeBand() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "end")
    .text(function (d, i) { return nodes[i].name; });

  let column = svg.selectAll(".column")
    .data(matrix)
    .enter().append("g")
    .attr("class", "column")
    .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  column.append("line")
    .attr("x1", -width);

  column.append("text")
    .attr("x", 6)
    .attr("y", x.rangeBand() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "start")
    .text(function (d, i) { return nodes[i].name; });

  function row(row: Cell[]) {
    let cell = d3.select(this).selectAll(".cell")
      .data(row.filter(function (d) { return d.z; }))
      .enter().append("rect")
      .attr("class", "cell")
      .attr("x", function (d) { return x(d.x); })
      .attr("width", x.rangeBand())
      .attr("height", x.rangeBand())
      .style("fill-opacity", function (d) { return z(d.z); })
      .style("fill", function (d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);
  }

  function mouseover(p: Cell) {
    d3.selectAll(".row text").classed("active", function (d, i) { return i == p.y; });
    d3.selectAll(".column text").classed("active", function (d, i) { return i == p.x; });
  }

  function mouseout() {
    d3.selectAll("text").classed("active", false);
  }

  d3.select("#order").on("change", function () {
    clearTimeout(timeout);
    // @ts-expect-error
    order(this.value);
  });

  function order(value: string) {
    // @ts-expect-error
    x.domain(orders[value]);

    let t = svg.transition().duration(2500);

    t.selectAll(".row")
      .delay(function (d, i) { return x(i) * 4; })
      .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })
      .selectAll(".cell")
      .delay(function (d: Cell) { return x(d.x) * 4; })
      .attr("x", function (d: Cell) { return x(d.x); });

    t.selectAll(".column")
      .delay(function (d, i) { return x(i) * 4; })
      .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  }

  let timeout = setTimeout(function () {
    order("group");
    // @ts-expect-error
    d3.select("#order").property("selectedIndex", 2).node().focus();
  }, 5000);
}
