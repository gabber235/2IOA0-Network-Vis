

import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { NodeLink } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { Observable } from "rxjs";
import { pureBoth } from "./pipeline/pure";
import { map } from "rxjs/operators";
import { DataSet } from "./pipeline/dynamicDataSet";

const visualizations = [
    new AdjacencyMatrix(),
    new NodeLink(),
]

window.addEventListener("load", async () => {

    const baseEmailObservable = new Observable<[DataSet<Person>, Email[]]>(sub => {
        const fileSelector = document.getElementById('file-selector');
        fileSelector.addEventListener('change', async (event: any) => {
            const fileList: FileList = event.target.files;

            for (let i = 0; i < fileList.length; i++) {
                const txt = await fileList.item(i).text()
                const emails = parseData(txt)
                const correspondants = getCorrespondants(emails)
                sub.next([correspondants, emails])
            }
        });
    })

    const changes = baseEmailObservable.pipe(
        map(([correspondants, emails]): [DataSet<Person>, Email[]] => [correspondants, emails.slice(0, 100)]),
        map(([correspondants, emails]): [DataSet<Person>, DataSet<Email>] => [correspondants, Object.assign({}, ...emails.map(email => { return { [email.id]: email } }))]),
        pureBoth
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
