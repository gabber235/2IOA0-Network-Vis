import { Email, emailToEdge, getCorrespondants, parseData, Person, personToNode } from "./data"
import { div, text } from "./utils"

const dataFile = require('../resources/static/enron-v1.csv')

import * as vis from "vis"

import "vis/dist/vis.min.css"
import { combineLatest, Observable, zip } from "rxjs"
import { map } from "rxjs/operators"
import { dynamicSlice } from "./pipeline/dynamicSlice"
import { bindVisDataSet } from "./pipeline/dynamicDataSet"

window.addEventListener("load", async () => {
    let leftBound: Observable<number> = new Observable(sub => {

        let elm: any = document.getElementById("range1")
        elm.value = "0"
        sub.next(0)
        elm.addEventListener("input", (e: any) => {
            sub.next(+e.target.value)
        })    
    })
    let rightBound: Observable<number> = new Observable<number>(sub => {
        let elm: any = document.getElementById("range2")
        elm.value = "200"
        sub.next(200)
        elm.addEventListener("input", (e: any) => {
            sub.next(+e.target.value)
        })
    })

    let emails = parseData(await (await fetch(dataFile.default)).text())

    emails.sort((i,j) => new Date(i.date).getTime() - new Date(j.date).getTime())

    let nodes = new vis.DataSet(Object.values(getCorrespondants(emails)).map(personToNode))

    let edges = new vis.DataSet<vis.Edge>()

    bindVisDataSet(edges, dynamicSlice(emails, combineLatest([leftBound, rightBound]).pipe(map(([i,j]) => [i,i+j]))).pipe(map(i => i.map(emailToEdge))))

    let config = {
        physics: {
            enabled: false
        }
    }

    new vis.Network(div({style: "height: 500px"}, [], document.body), {nodes: nodes, edges: edges}, config)
})
