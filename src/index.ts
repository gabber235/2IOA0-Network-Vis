import "vis/dist/vis.min.css"
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { visualizeNodeLinkDiagram, NodeLinkOptions } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { merge, Observable, of, Subject } from "rxjs";
import { map, share } from "rxjs/operators";
import { DataSet, MapDiff, diffDataSet, getDynamicCorrespondants, NumberSetDiff } from "./pipeline/dynamicDataSet";
import { arrayToObject as arrayToObject, checkBoxObserable, diffMapFirst, fileInputObservable, swap } from "./utils";
import { prettifyFileInput } from "./looks";

const logo = require('../resources/static/logo.png')

window.addEventListener("load", async () => {

    console.log('Image:', logo.default)

    const fileSelector = document.getElementById('file-selector');

    prettifyFileInput(fileSelector)

    // This subject is used to represent selected correspondants and emails respectivly
    // They are represented by their id's
    const selectionSubject = new Subject<[NumberSetDiff, NumberSetDiff]>()

    const baseEmailObservable = fileInputObservable(fileSelector).pipe(map(parseData))

    const changes = baseEmailObservable.pipe(
        map((emails): [Email[], DataSet<Person>] => [emails.slice(0, 100), getCorrespondants(emails)]),
        map(([emails, allPeople]): [DataSet<Email>, DataSet<Person>] => [arrayToObject(emails, email => email.id), allPeople]),
        diffMapFirst({} as DataSet<Email>, diffDataSet),
        map(swap),
        diffMapFirst({} as DataSet<Person>, diffDataSet),
        share()
    )

    const changesWithFewerNodes = changes.pipe(
        map(swap),
        getDynamicCorrespondants,
        map(([people, emails]): [MapDiff<Person>, MapDiff<Email>] => [people, emails])
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

    visualizeNodeLinkDiagram(document.getElementById("node-links"), changesWithFewerNodes, nodeLinkOptions, 150)
})




// type DataSetDiff<A> = {type:'add', id: number, content: A[]}|{type:'remove', id: number, content: A[]}

// type FinalDataSetDiff = DataSetDiff<[EmailData, VisualData]>

// type DynamicDataSet<A> = Observable<DataSetDiff<A>>

// map : (A -> B) -> DynamicDataSet<A> -> DynamicDataSet<B>

// base.filter(range).filter(title).orderBy(cluster).map().interaction(selected)


// filter :  Observable<[A -> bool, DataSetDiff<A>]> ->  DynamicDataSet<A>

// filter : Observable<[]>


// filter :  Observable<[A -> bool, A[]]> ->  Observable<A[]>
