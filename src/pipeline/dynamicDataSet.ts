import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { Email, getCorrespondantsFromSingleEmail, Person } from "../data"

export type DataSet<A> = { [id: number]: A }

/**
 * Represents a single change/insertion/deletion in a dataset
 */
type DataSetChange<A> = { type: "add", id: number, value: A } | { type: "update", id: number, value: A } | { type: "remove", id: number }

/**
 * Represents a set of changes to a dataset
 */
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

    andThen(other: DataSetDiff<A>): DataSetDiff<A> {
        return new DataSetDiff(this.changes.concat(other.changes))
    }
}


/**
 * Computes the difference between two datasets
 */
export function diffDataSet<A>(prev: DataSet<A>, cur: DataSet<A>): DataSetDiff<A> {
    let diff = new DataSetDiff<A>()

    for (const id in cur) {
        if (id in prev) {
            diff.update(+id, cur[id])
        } else {
            diff.add(+id, cur[id])
        }
    }
    for (const id in prev) {
        if (!(id in cur)) diff.remove(+id)
    }

    return diff
}



/**
 * Ignore double insertions and deletions.
 */
export function ignoreDoubles<A, X>(data: Observable<[DataSetDiff<A>, X]>): Observable<[DataSetDiff<A>, X]> {

    let idSet = new Set<number>()

    return new Observable(sub => {
        data.subscribe({
            next([diff, x]) {

                let newDiff = new DataSetDiff<A>()

                for (let change of diff.changes) {
                    if (change.type === 'add') {
                        if (!idSet.has(change.id)) {
                            idSet.add(change.id)
                            newDiff.add(change.id, change.value)
                        }
                    } else if (change.type === 'update') {
                        if (idSet.has(change.id)) {
                            newDiff.update(change.id, change.value)
                        }
                    } else {
                        if (idSet.has(change.id)) {
                            newDiff.remove(change.id)
                        }
                    }
                }

                sub.next([newDiff, x])
            }
        })
    })
}

/**
 * Takes a dynamic dataset of emails and adds to it a dynamic dataset of the relevant correspondants
 */
export function getDynamicCorrespondants<X>(emails: Observable<[DataSetDiff<Email>, X]>): Observable<[DataSetDiff<Person>, DataSetDiff<Email>, X]> {
    return emails.pipe(
        map(([emailDiff, x]): [DataSetDiff<Person>, [DataSetDiff<Email>, X]] => {
            let senderDiff = emailDiff.map(email => getCorrespondantsFromSingleEmail(email)[0])
            let recieverDiff = emailDiff.map(email => getCorrespondantsFromSingleEmail(email)[1])

            return [senderDiff.andThen(recieverDiff), [emailDiff, x]]
        }),
        ignoreDoubles,
        map(([a, [b, c]]) => [a, b, c])
    )
}