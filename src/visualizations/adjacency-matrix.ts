import { Visualization } from './visualization'
import { Email, Person, Title, parseData, getCorrespondants } from "../data";
import * as d3 from "d3";
import { Observable } from 'rxjs';
import { DataSetDiff } from '../pipeline/dynamicDataSet';


// get used data
const dataFile = require("../../resources/static/enron-v1.csv");

type Node = {
  name: string,
  id: number,
  group: string,  // used for titles in our dataset
  index?: number, // used in adjacency matrix
  count?: number, // used in adjacency matrix
}

type Edge = {
  source: number,
  target: number,
  value: number,
}

export class AdjacencyMatrix implements Visualization {
  async visualize(data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>): Promise<void> {
    // document.body.appendChild(div({}, [text("Adjacency-matrix")]));

    data.subscribe(event => {
      let personDiff = event[0].insertions;
      let emailsDiff = event[1].insertions;

      // this is an extremely hacky temporary solution
      const emails: Email[] = [];
      emailsDiff.forEach(e => {
        emails.push(e.value);
      });

      // const persons: Person[] = [];
      // personDiff.forEach(p => {
      //   // @ts-expect-error
      //   persons.push(p.value)
      // });

      // Creating array with person object
      const correspondants = getCorrespondants(emails); //dictionary with persons
      let persons = Object.values(correspondants);


      // // Get data
      // let file = await fetch(dataFile.default);
      // let emails = parseData(await file.text());


      // // Testing filtering
      // let filteredCorrespondants = filterCorrespondants(
      //   ["CEO", "Trader", "Employee"],
      //   correspondantList
      // );

      // // get nodes from people list
      // const nodes = peopleToNodes(filteredCorrespondants);
      const nodes = peopleToNodes(persons);

      // // get edges
      // const filteredEmail = filterEmail(filteredCorrespondants, emails);
      // const links = edgeHash(filteredEmail, nodes);
      const links = edgeHash(emails, nodes);

      // call adjacency matrix  
      // createAdjacencyMatrix(filteredCorrespondants, emailsToEdges(emails), svg);
      createAdjacencyMatrix(nodes, links);
    });



    function createAdjacencyMatrix(nodes: Node[], links: Edge[]) {
      let margin = {
        top: 150,
        right: 0,
        bottom: 10,
        left: 0
      };
      let width = 750;
      let height = 750;

      // @ts-expect-error
      let x = d3.scale.ordinal().rangeBands([0, width]);
      // @ts-expect-error
      let z = d3.scale.linear().domain([0, 4]).clamp(true);
      // @ts-expect-error
      let c = d3.scale.category10().domain(d3.range(10));

      let svg = d3.select("#adj-matrix").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        // .style("margin-left", -margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      type Cell = {
        x: number,
        y: number,
        z: number,
        selected?: boolean,
      }

      // declare variable to store the matrix values
      const matrix: Cell[][] = []

      // variable to keep number of nodes
      let n = nodes.length


      // Compute index per node.
      nodes.forEach(function (node, i) {
        node.index = i;
        node.count = 0;
        matrix[i] = d3.range(n).map(function (j) { return { x: j, y: i, z: 0, selected: false }; });
      });



      // Convert links to matrix; count character occurrences.
      links.forEach(function (link) {
        // we have a directional dataset
        matrix[link.source][link.target].z += link.value;
        // these would be for undirected-graphs
        // matrix[link.target][link.source].z += link.value;
        // matrix[link.source][link.source].z += link.value;
        // matrix[link.target][link.target].z += link.value;
        nodes[link.source].count += link.value;
        nodes[link.target].count += link.value;
      });

      // Precompute the sorting orders
      let orders = {
        name: d3.range(n).sort(function (a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
        count: d3.range(n).sort(function (a, b) { return nodes[b].count - nodes[a].count; }),
        group: d3.range(n).sort(function (a, b) { return nodes[a].group.localeCompare(nodes[b].group); }),
      };

      //   console.log(nodes)

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

      // rows.append("text")
      //   .attr("x", -6)
      //   .attr("y", x.rangeBand() / 2)
      //   .attr("dy", ".32em")
      //   .attr("text-anchor", "end")
      //   .text(function (d, i) { return nodes[i].name; });

      let column = svg.selectAll(".column")
        .data(matrix)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

      column.append("line")
        .attr("x1", -width);

      // column.append("text")
      //   .attr("x", 6)
      //   .attr("y", x.rangeBand() / 2)
      //   .attr("dy", ".32em")
      //   .attr("text-anchor", "start")
      //   .text(function (d, i) { return nodes[i].name; });

      function row(row: Cell[]) {
        let cell = d3.select(this).selectAll(".cell")
          .data(row.filter(function (d) { return d.z; }))
          .enter().append("rect")
          .attr("class", "cell")
          .attr("x", function (d) { return x(d.x); })
          .attr("width", x.rangeBand())
          .attr("height", x.rangeBand())
          .style("fill-opacity", function (d) { return z(d.z); })
          .style("fill", selectColor)
          .on("mouseover", () => {
            return tooltip.style("visibility", "visible");
          })
          .on("mousemove", (d) => {
            return tooltip
            // this works but doesn't handle scaling
            // @ts-expect-error
            .style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 475) + "px")
            .text(d.x);
          })
          .on("mouseout", () => {
            return tooltip.style("visibility", "hidden");
          })
          .on("click", clickCell);
      }

      // create tooltip
      const tooltip = d3.select("#adj-matrix")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "3px")
        .style("padding", "5px")


      function selectColor(d: Cell) {
        if (d.selected === true) {
          return "#FF0000";
        } else {
          return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null;
        }
      }

      function clickCell(cell: Cell) {
        cell.selected = !cell.selected;
        d3.select(document).selectAll(".cell")
          .style("fill", selectColor);

        // console.log("I've been clicked! my original coordinates are: " + cell.x + ", " + cell.y);
      }

      d3.select("#order").on("change", function () {
        // clearTimeout(timeout);
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

      //   let timeout = setTimeout(function () {
      //     order("group");
      //     // @ts-expect-error
      //     d3.select("#order").property("selectedIndex", 2).node().focus();
      //   }, 1000);
    }
  }
}

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
function filterCorrespondants(
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
function filterEmail(correspondants: Person[], emails: Email[]) {
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
