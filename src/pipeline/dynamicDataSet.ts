import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { Email, getCorrespondantsFromSingleEmail, Person } from "../data"

export type DataSet<A> = { [id: number]: A }

/**
 * Represents a set of changes to a dataset
 */
export class DataSetDiff<A> {

    public readonly insertions: {id: number, value: A}[]
    public readonly updates: {id: number, value: A}[]
    public readonly deletions: {id: number}[]

    constructor(insertions: {id: number, value: A}[] = [], updates: {id: number, value: A}[] = [], deletions: {id: number}[] = []) {
        this.insertions = insertions
        this.updates = updates
        this.deletions = deletions
    }

    add(id: number, value: A) {
        this.insertions.push({id: id, value: value})
    }
    update(id: number, value: A) {
        this.updates.push({id: id, value: value})
    }
    remove(id: number) {
        this.deletions.push({id: id})
    }

    map<B>(f: (a: A) => B): DataSetDiff<B> {
        return new DataSetDiff(
            this.insertions.map(({id, value}) => {return {id: id, value: f(value)}}),
            this.updates.map(({id, value}) => {return {id: id, value: f(value)}}),
            this.deletions.slice()
        )
    }

    andThen(other: DataSetDiff<A>): DataSetDiff<A> {
        return new DataSetDiff(
            this.insertions.concat(other.insertions),
            this.updates.concat(other.updates),
            this.deletions.concat(other.deletions),
        )
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

                for (let change of diff.insertions) {
                    if (!idSet.has(change.id)) {
                        idSet.add(change.id)
                        newDiff.add(change.id, change.value)
                    }
                }
                for (let change of diff.updates) {
                    if (idSet.has(change.id)) {
                        newDiff.update(change.id, change.value)
                    }
                }
                for (let change of diff.deletions) {
                    if (idSet.has(change.id)) {
                        newDiff.remove(change.id)
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