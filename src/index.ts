import "vis/dist/vis.min.css"
import { AdjacencyMatrix } from "./visualizations/adjacency-matrix";
import { visualizeNodeLinkDiagram, NodeLinkOptions } from "./visualizations/node-link";
import { Email, getCorrespondants, parseData, Person } from "./data"
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { DataSet, DataSetDiff, diffDataSet, getDynamicCorrespondants } from "./pipeline/dynamicDataSet";
import { diffMapFirst, swap } from "./utils";


window.addEventListener("load", async () => {

    const baseEmailObservable = new Observable<Email[]>(sub => {
        const fileSelector = document.getElementById('file-selector');
        fileSelector.addEventListener('change', async (event: any) => {
            const fileList: FileList = event.target.files;

            for (let i = 0; i < fileList.length; i++) {
                const txt = await fileList.item(i).text()
                const emails = parseData(txt)
                const correspondants = getCorrespondants(emails)
                sub.next(emails)
            }
        });
    })


    const nodeLinkOptions = new Observable<NodeLinkOptions>(sub => {
        const physicsCheckBox: any = document.getElementById("physics")
        sub.next({physics: physicsCheckBox.checked})

        physicsCheckBox.addEventListener("change", (e: any) => {
            sub.next({physics: e.target.checked})
        })

        const layoutCheckBox: any = document.getElementById("hierarchical")
        sub.next({hierarchical: layoutCheckBox.checked})

        layoutCheckBox.addEventListener("change", (e: any) => {
            sub.next({hierarchical: e.target.checked})
        })
    })
    

    const changes = baseEmailObservable.pipe(
        map((emails): [Email[], DataSet<Person>] => [emails.slice(0,100), getCorrespondants(emails)]),
        map(([emails, allPeople]): [DataSet<Email>, DataSet<Person>] => [arrayToDataSet(emails, email => email.id), allPeople]),
        diffMapFirst({} as DataSet<Email>, diffDataSet),
        map(swap),
        diffMapFirst({} as DataSet<Person>, diffDataSet),
    )

    const changesWithFewerNodes = changes.pipe(
        map(swap),
        getDynamicCorrespondants,
        map(([people, emails]): [DataSetDiff<Person>, DataSetDiff<Email>] => [people, emails])
    )


    new AdjacencyMatrix().visualize(changes)
    visualizeNodeLinkDiagram(document.getElementById("node-links"), changesWithFewerNodes, nodeLinkOptions, 150)
})

function arrayToDataSet<A>(data: A[], getId: (item: A) => number): DataSet<A> {
    return Object.assign({}, ...data.map(item => { return { [getId(item)]: item } }))
}

// type DataSetDiff<A> = {type:'add', id: number, content: A[]}|{type:'remove', id: number, content: A[]}

// type FinalDataSetDiff = DataSetDiff<[EmailData, VisualData]>

// type DynamicDataSet<A> = Observable<DataSetDiff<A>>

// map : (A -> B) -> DynamicDataSet<A> -> DynamicDataSet<B>

// base.filter(range).filter(title).orderBy(cluster).map().interaction(selected)


// filter :  Observable<[A -> bool, DataSetDiff<A>]> ->  DynamicDataSet<A>

// filter : Observable<[]>


// filter :  Observable<[A -> bool, A[]]> ->  Observable<A[]>
