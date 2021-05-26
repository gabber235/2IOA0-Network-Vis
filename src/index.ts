import "vis/dist/vis.min.css"
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { visualizeNodeLinkDiagram, NodeLinkOptions, getVisNodeSeletions } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { combineLatest, merge, Subject, Subscription } from "rxjs";
import { debounceTime, map, scan, share, shareReplay, subscribeOn, switchAll } from "rxjs/operators";
import { DataSet, DataSetDiff, diffDataSet, foldDataSet, NumberSetDiff } from "./pipeline/dynamicDataSet";
import { getDynamicCorrespondants } from "./pipeline/getDynamicCorrespondants";
import { binarySearch, ConstArray, pair, pairMap2, tripple } from "./utils";
import { prettifyFileInput } from "./looks";
import { checkBoxObserable, diffStream, fileInputObservable, sliderToObservable } from "./pipeline/basics";
import { dynamicSlice } from "./pipeline/dynamicSlice";
import { diffSwitchAll } from "./pipeline/diffSwitchAll";

const logo = require('../resources/static/logo.png')
const millisInDay = 24 * 60 * 60 * 1000

window.addEventListener("load", async () => {

    console.log('Image:', logo.default)

    const fileSelector = document.getElementById('file-selector');

    const timeSlider = document.getElementById('range1')
    const range = combineLatest([
        sliderToObservable(timeSlider),
        sliderToObservable(document.getElementById('range2'))
    ]).pipe(
        map(([i, j]): [number, number] => [i, i + j]),
        debounceTime(10),
    )


    prettifyFileInput(fileSelector)

    const firstDayElm = document.getElementById('first-day')
    const lastDayElm = document.getElementById('last-day')
    const durationElm = document.getElementById('duration')

    // This subject is used to represent selected correspondants and emails respectivly
    // They are represented by their id's
    const selectionSubject = new Subject<[NumberSetDiff, NumberSetDiff]>()

    selectionSubject.subscribe(console.log)

    const baseEmailObservable = fileInputObservable(fileSelector).pipe(map(parseData))

    let lastSub: Subscription|undefined = undefined

    const dataWithAllNodes = baseEmailObservable.pipe(
        map(emails => {
            emails.sort((i, j) => new Date(i.date).getTime() - new Date(j.date).getTime())

            const firstDate = new Date(emails[0].date)
            const lastDate = new Date(emails[emails.length - 1].date)

            timeSlider.setAttribute('max', "" + (lastDate.getTime() - firstDate.getTime()) / millisInDay)

            if (lastSub !== undefined) lastSub.unsubscribe()

            lastSub = range.subscribe(([begin, end]) => {
                firstDayElm.textContent = new Date(firstDate.getTime() + begin * millisInDay).toDateString()
                lastDayElm.textContent = new Date(firstDate.getTime() + end * millisInDay).toDateString()
                durationElm.textContent = `${end - begin} days`
            })

            function dayToIndex(day: number): number {
                return binarySearch(i => new Date(emails[i].date).getTime(), firstDate.getTime() + millisInDay * day, 0, emails.length, (i, j) => i - j)
            }

            const constEmails: ConstArray<[number, Email]> = {getItem: i => [emails[i].id, emails[i]], length: emails.length}
            const people = getCorrespondants(emails)


            return dynamicSlice(constEmails, range.pipe(map(([begin, end]) => pair(dayToIndex(begin), dayToIndex(end))))).pipe(
                scan( // Get full email dataset and people
                    ([_, emails, __], emailDiff) => tripple(people, foldDataSet(emails, emailDiff), emailDiff),
                    tripple({} as DataSet<Person>, {} as DataSet<Email>, new DataSetDiff<Email>())
                ),
            )
        }),
        diffSwitchAll( // merge the stream of streams
            () => ({} as DataSet<Email>),
            diffDataSet,
            ([_, emails, __]) => emails,
            ([_, __, emailDiff]) => emailDiff,
        ),
        map(([[people, emails, __], emailDiff]) => pair(pair(people, emails), pair(people, emailDiff))), // rearange data
        diffStream( // diff person dataset
            pair(pair({} as DataSet<Person>, {} as DataSet<Email>), pair({} as DataSet<Person>, new DataSetDiff())), 
            pairMap2((_, x) => x, pairMap2(diffDataSet, (_, x) => x))
        ), 
        share(),
    )

    const dataWithFewerNodes = dataWithAllNodes.pipe(
        map(([[_, emails], [__, emailDiff]]) => pair(emails, emailDiff)), // forget about people
        getDynamicCorrespondants(([_, diff]) => diff),
        scan( // get full people dataset
            ([[people, _], __], [personDiff, [emails, emailDiff]]) => 
                pair(pair(foldDataSet(people, personDiff), emails), pair(personDiff, emailDiff)),
            pair(pair({} as DataSet<Person>, {} as DataSet<Email>), pair(new DataSetDiff<Person>(), new DataSetDiff<Email>()))
        ),
        share()
    )


    new AdjacencyMatrix().visualize(dataWithAllNodes.pipe(map(([_, diffs]) => diffs)))


    const nodeLinkOptions = merge(
        checkBoxObserable(document.getElementById('physics')).pipe(
            map((b): NodeLinkOptions => {return {physics: b}})   
        ),
        checkBoxObserable(document.getElementById('hierarchical')).pipe(
            map((b): NodeLinkOptions => {return {hierarchical: b}})   
        )
    )

    const allNodes = dataWithAllNodes.pipe(shareReplay(1))
    allNodes.subscribe()

    const fewerNodes = dataWithFewerNodes.pipe(shareReplay(1))
    fewerNodes.subscribe()


    const maybeShowAllNodes = checkBoxObserable(document.getElementById('show-all-nodes')).pipe(
        map(bool => bool ? allNodes : fewerNodes),
        diffSwitchAll(
            () => pair({} as DataSet<Person>, {} as DataSet<Email>),
            pairMap2(diffDataSet, diffDataSet),
            ([data, _]) => data,
            ([_, diffs]) => diffs
        ),
        map(([_, [peopleDiff, emailDiff]]) => pair(peopleDiff, emailDiff)),
        share()
    )

    const nodeLinkDiagram = await visualizeNodeLinkDiagram(document.getElementById("node-links"), maybeShowAllNodes, nodeLinkOptions, 150)
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
