import { Observable } from "rxjs"

export class DataSetDiff<A> {

    public readonly type: "add"|"remove"
    public readonly content: A[]

    constructor(type: "add"|"remove", content: A[]) {
        this.type = type
        this.content = content
    }

    static add<A>(content: A[]) {
        return new DataSetDiff("add", content)
    }
    static remove<A>(content: A[]) {
        return new DataSetDiff("remove", content)
    }

    map<B>(f: (a: A) => B) {
        return new DataSetDiff(this.type, this.content.map(f))
    }
}



export function bindVisDataSet<A extends vis.DataItem | vis.Edge | vis.Node | vis.DataGroup>(dataset: vis.DataSet<A>, dynamicData: Observable<DataSetDiff<A>>) {
    dynamicData.subscribe({next (diff) {

        if (diff.type === "add") {
            dataset.add(diff.content)
        } else if (diff.type === "remove") {
            dataset.remove(diff.content.map(i => i.id))
        }
    }})
}
