import "vis/dist/vis.min.css"
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { NodeLink } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DataSet, diffDataSet } from "./pipeline/dynamicDataSet";
import { diffMapFirst, swap } from "./utils";

const logo = require('../resources/static/logo.png')

const visualizations = [
    new AdjacencyMatrix(),
    new NodeLink(),
]

window.addEventListener("load", async () => {

    console.log('Image:', logo.default)

    const baseEmailObservable = new Observable<[DataSet<Person>, Email[]]>(sub => {
        const fileSelector = document.getElementById('file-selector');
        fileSelector.addEventListener('change', async (event: any) => {
            const fileList: FileList = event.target.files;

            for (let i = 0; i < fileList.length; i++) {
                const file = fileList.item(i);

                const label = fileSelector.nextElementSibling;
                label.innerHTML = file.name

                const txt = await file.text()
                const emails = parseData(txt)
                const correspondants = getCorrespondants(emails)
                sub.next([correspondants, emails])
            }
        });
    })

    const changes = baseEmailObservable.pipe(
        map(([correspondants, emails]): [DataSet<Person>, Email[]] => [correspondants, emails.slice(0, 100)]),
        map(([correspondants, emails]): [DataSet<Person>, DataSet<Email>] => [correspondants, Object.assign({}, ...emails.map(email => { return { [email.id]: email } }))]),
        diffMapFirst({} as DataSet<Person>, diffDataSet),
        map(swap),
        diffMapFirst({} as DataSet<Email>, diffDataSet),
        map(swap)
    )

    visualizations.forEach(vis => vis.visualize(changes))
})



// type DataSetDiff<A> = {type:'add', id: number, content: A[]}|{type:'remove', id: number, content: A[]}

// type FinalDataSetDiff = DataSetDiff<[EmailData, VisualData]>

// type DynamicDataSet<A> = Observable<DataSetDiff<A>>

// map : (A -> B) -> DynamicDataSet<A> -> DynamicDataSet<B>

// base.filter(range).filter(title).orderBy(cluster).map().interaction(selected)


// filter :  Observable<[A -> bool, DataSetDiff<A>]> ->  DynamicDataSet<A>

// filter : Observable<[]>


// filter :  Observable<[A -> bool, A[]]> ->  Observable<A[]>
