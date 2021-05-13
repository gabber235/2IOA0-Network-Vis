
export type DataSet<A> = { [id: number]: A }

type DataSetChange<A> = { type: "add", id: number, value: A } | { type: "update", id: number, value: A } | { type: "remove", id: number }

export class DataSetDiff<A> {

    public readonly changes: DataSetChange<A>[]

    constructor(changes: DataSetChange<A>[] = []) {
        this.changes = changes
    }

    add(id: number, value: A): DataSetChange<A> {
        const change: DataSetChange<A> = { type: "add", id: id, value: value }
        this.changes.push(change)
        return change
    }
    update(id: number, value: A): DataSetChange<A> {
        const change: DataSetChange<A> = { type: "update", id: id, value: value }
        this.changes.push(change)
        return change
    }
    remove(id: number): DataSetChange<A> {
        const change: DataSetChange<A> = { type: "remove", id: id }
        this.changes.push(change)
        return change
    }

    map<B>(f: (a: A) => B): DataSetDiff<B> {
        return new DataSetDiff(this.changes.map(i => {
            if (i.type === "add") {
                return Object.assign({}, i, { value: f(i.value) })
            } else if (i.type === "update") {
                return Object.assign({}, i, { value: f(i.value) })
            } else {
                return i
            }
        }))
    }
}
