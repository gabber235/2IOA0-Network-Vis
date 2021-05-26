import "vis/dist/vis.min.css"
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { visualizeNodeLinkDiagram, NodeLinkOptions, getVisNodeSeletions } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { combineLatest, identity, merge, Subject } from "rxjs";
import { debounceTime, map, share, switchAll } from "rxjs/operators";
import { DataSet, DataSetDiff, diffDataSet, NumberSetDiff } from "./pipeline/dynamicDataSet";
import { getDynamicCorrespondants } from "./pipeline/getDynamicCorrespondants";
import { ConstArray, pair, pairMap2, swap } from "./utils";
import { prettifyFileInput } from "./looks";
import { checkBoxObserable, diffStream, fileInputObservable, sliderToObservable } from "./pipeline/basics";
import { dynamicSlice } from "./pipeline/dynamicSlice";

const logo = require('../resources/static/logo.png')

window.addEventListener("load", async () => {

    console.log('Image:', logo.default)

    const fileSelector = document.getElementById('file-selector');


    const range = combineLatest([
        sliderToObservable(document.getElementById('range1')),
        sliderToObservable(document.getElementById('range2'))
    ]).pipe(
        map(([i, j]): [number, number] => [i, i + j]),
        debounceTime(10)
    )


    prettifyFileInput(fileSelector)

    // This subject is used to represent selected correspondants and emails respectivly
    // They are represented by their id's
    const selectionSubject = new Subject<[NumberSetDiff, NumberSetDiff]>()

    selectionSubject.subscribe(console.log)

    const baseEmailObservable = fileInputObservable(fileSelector).pipe(map(parseData))

    const changes = baseEmailObservable.pipe(
        map((emails): [ConstArray<[number, Email]>, DataSet<Person>] => [
            {getItem: i => [emails[i].id, emails[i]], length: emails.length}, 
            getCorrespondants(emails)
        ]),
        map(([emails, people]) =>
            dynamicSlice(emails, range).pipe(map((emailDiff) => pair(people, emailDiff)))),
        switchAll(),
        diffStream(pair({} as DataSet<Person>, new DataSetDiff()), pairMap2(diffDataSet, (_, x) => x)),
        share(),
    )

    const changesWithFewerNodes = changes.pipe(
        map(([_, emails]) => emails),
        getDynamicCorrespondants(identity),
        map(([people, emails]): [DataSetDiff<Person>, DataSetDiff<Email>] => [people, emails])
    )


    new AdjacencyMatrix().visualize(changes)


    const nodeLinkOptions = merge(
        checkBoxObserable(document.getElementById('physics')).pipe(
            map((b): NodeLinkOptions => {return {physics: b}})   
        ),
        checkBoxObserable(document.getElementById('hierarchical')).pipe(
            map((b): NodeLinkOptions => {return {hierarchical: b}})   
        )
    )

    const nodeLinkDiagram = await visualizeNodeLinkDiagram(document.getElementById("node-links"), changesWithFewerNodes, nodeLinkOptions, 150)
    getVisNodeSeletions(nodeLinkDiagram).subscribe(selectionSubject)
})




// type DataSetDiff<A> = {type:'add', id: number, content: A[]}|{type:'remove', id: number, content: A[]}

// type FinalDataSetDiff = DataSetDiff<[EmailData, VisualData]>

// type DynamicDataSet<A> = Observable<DataSetDiff<A>>

// map : (A -> B) -> DynamicDataSet<A> -> DynamicDataSet<B>

// base.filter(range).filter(title).orderBy(cluster).map().interaction(selected)


// filter :  Observable<[A -> bool, DataSetDiff<A>]> ->  DynamicDataSet<A>

// filter : Observable<[]>


// filter :  Observable<[A -> bool, A[]]> ->  Observable<A[]>
