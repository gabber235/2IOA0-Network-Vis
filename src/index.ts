import "vis/dist/vis.min.css"
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { visualizeNodeLinkDiagram, NodeLinkOptions, getVisNodeSeletions } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { merge, Observable, of, Subject, timer } from "rxjs";
import { debounce, debounceTime, map, share } from "rxjs/operators";
import { DataSet, MapDiff, diffDataSet, getDynamicCorrespondants, NumberSetDiff, ignoreDoubles } from "./pipeline/dynamicDataSet";
import { arrayToObject as arrayToObject, swap } from "./utils";
import { prettifyFileInput } from "./looks";
import { checkBoxObserable, diffMapFirst, fileInputObservable, sliderToObservable } from "./pipeline/basics";
import { ConstArray, dynamicSlice } from "./pipeline/dynamicSlice";
import * as seedrandom from "seedrandom";
import { alea, Alea } from "seedrandom";

const logo = require('../resources/static/logo.png')

window.addEventListener("load", async () => {

    console.log('Image:', logo.default)

    const fileSelector = document.getElementById('file-selector');

    // let rng = alea('0')

    const begin = sliderToObservable(document.getElementById("range1"))
    const end = sliderToObservable(document.getElementById("range2")).pipe(map(i => {
        console.log(i)
        return i
    }))

//     let c =  0
//     let n = 50

    // const end = new Subject<number>()

    
    // let elm: any = document.getElementById("range2")

    // let x = 0

    // elm.addEventListener('mousemove', (e: any) => {
    //     if (e.buttons === 1) {
    //         x = Math.min(Math.max(0, Math.round((e.clientX - elm.getBoundingClientRect().x) / elm.getBoundingClientRect().width * 1000)), 1000)


    //         let y = elm.value
            
    //         console.log(+elm.value, +elm.min)
    //         end.next(+elm.value)
    //     }
    // })

    // fileSelector.addEventListener("change", () => {
    //     setInterval(e => {
    //         // n = Math.max(0, n + Math.round(rng() * 2) - 1)
    //         // let n = Math.round(4 * rng()) + 50
    //         // if (rng() < 0.05) {
    //         //     n = 0
    //         // }
    //         // let x = elm.value
    //         // console.log(x)
    //         // end.next(x)
    //         // end.next(n)
    //         // if (rng() < 0.9)
    //         //     x = Math.round(100 * rng())

    //         // console.log(x)
    //         // end.next(x)

    //         if (elm.value !== x)
    //         {
    //             console.log(x)
    //             end.next(x)
    //         }

    //         x = elm.value

            
            
    //     }, 0)  
    // })

//    elm.addEventListener("input", (e: any) => {
//         let x = Math.round(100 * rng())

//         if (rng() < 0.05) {
//             x = 100
//         }

//         x = elm.value
        
//         // console.log(x)
//         // end.next(elm.value)    
//         setTimeout(() => {
//             console.log(x)
//             end.next(x)
//         }, 10)
//     }) 
    

    prettifyFileInput(fileSelector)

    // This subject is used to represent selected correspondants and emails respectivly
    // They are represented by their id's
    const selectionSubject = new Subject<[NumberSetDiff, NumberSetDiff]>()

    selectionSubject.subscribe(console.log)

    const baseEmailObservable = fileInputObservable(fileSelector).pipe(map(parseData))

    const changes = baseEmailObservable.pipe(
        map((emails): [ConstArray<[number, Email]>, DataSet<Person>] => [{getItem: i => [emails[i].id, emails[i]], length: emails.length}, getCorrespondants(emails)]),
        dynamicSlice(0, begin, 0, end),
        // ignoreDoubles,
        map(swap),
        diffMapFirst({} as DataSet<Person>, diffDataSet),
        // ignoreDoubles,
        // map(([emails, allPeople]): [DataSet<Email>, DataSet<Person>] => [arrayToObject(emails, email => email.id), allPeople]),
        // diffMapFirst({} as DataSet<Email>, diffDataSet),
        // map(swap),
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

    const nodeLinkDiagram = await visualizeNodeLinkDiagram(document.getElementById("node-links"), changes, nodeLinkOptions, 150)
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
