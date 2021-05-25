import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { Email, getCorrespondantsFromSingleEmail, Person } from "../data"
import { Maybe, None, Some } from "../maybe"

export type DataSet<A> = { [id: number]: A }

/**
 * Represents a set of changes to a dataset
 */
export class MapDiff<A> {

    public readonly insertions: {id: number, value: A}[]
    public readonly updates: {id: number, value: A}[]
    public readonly deletions: {id: number}[]

    constructor(insertions: {id: number, value: A}[] = [], updates: {id: number, value: A}[] = [], deletions: {id: number}[] = []) {
        this.insertions = insertions
        this.updates = updates
        this.deletions = deletions
    }

    /**
     * Adds an insertion to the diff
     */
    add(id: number, value: A) {
        this.insertions.push({id: id, value: value})
    }
    /**
     * Adds an update to the diff
     */
    update(id: number, value: A) {
        this.updates.push({id: id, value: value})
    }
    /**
     * Adds a deletion to the diff
     */
    remove(id: number) {
        this.deletions.push({id: id})
    }

    /**
     * Changes every value and id using the given functions
     */
    map<B>(valueMap: (a: A) => B, idMap: (id: number) => number): MapDiff<B> {
        return new MapDiff(
            this.insertions.map(({id, value}) => {return {id: idMap(id), value: valueMap(value)}}),
            this.updates.map(({id, value}) => {return {id: idMap(id), value: valueMap(value)}}),
            this.deletions.map(({id}) => {return {id: idMap(id)}})
        )
    }

    /**
     * Creates a new MapDiff by concatenating the first and last diff in order
     */
    andThen(other: MapDiff<A>): MapDiff<A> {
        return new MapDiff(
            this.insertions.concat(other.insertions),
            this.updates.concat(other.updates),
            this.deletions.concat(other.deletions),
        )
    }

    /**
     * Applies the changes to a map
     */
    apply(dataSet: DataSet<A>) {
        for (let {id, value} of this.insertions) {
            dataSet[id] = value
        }
        for (let {id, value} of this.updates) {
            dataSet[id] = value
        }
        for (let {id} of this.deletions) {
            delete dataSet[id]
        }
    }

    get isEmpty() { 
        return this.insertions.length === 0 && this.updates.length === 0 && this.deletions.length === 0 
    }
}

/**
 * Represents changes to a set of numbers
 */
// NOTE: This is a lazy and dumb way to do this
export type NumberSetDiff = MapDiff<any>


/**
 * Computes the difference between two datasets which may include pointers
 */
export function diffDataSet<A>(prev: DataSet<A>, cur: DataSet<A>): MapDiff<A> {
    let diff = new MapDiff<A>()

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
 * Computes the difference between two datasets that DON'T INCLUDE POINTERS
 */
 export function diffPureDataSet<A>(prev: DataSet<A>, cur: DataSet<A>): MapDiff<A> {
    let diff = new MapDiff<A>()

    for (const id in cur) {
        if (id in prev) {
            if (prev[id] !== cur[id])
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
export function ignoreDoubles<A, X>(data: Observable<[MapDiff<A>, X]>): Observable<[MapDiff<A>, X]> {

    let idSet = new Set<number>()

    return new Observable(sub => {
        data.subscribe({
            next([diff, x]) {

                let newDiff = new MapDiff<A>()

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
                        idSet.delete(change.id)
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
export function getDynamicCorrespondants<X>(emails: Observable<[MapDiff<Email>, X]>): Observable<[MapDiff<Person>, MapDiff<Email>, X]> {

    let emailsSet: DataSet<Email> = {}
    let personSet: DataSet<number> = {}

    function incr(id: number, person: Person, diff: MapDiff<Person>) {
        if (!(id in personSet)) {
            personSet[id] = 0
            diff.add(id, person)
        }
        personSet[id]++
    }
    function decr(id: number, diff: MapDiff<Person>) {

        personSet[id]--

        if (personSet[id] === 0) {
            diff.remove(id)
            delete personSet[id]
        }
    }

    return emails.pipe(
        map(([emailDiff, x]): [MapDiff<Person>, [MapDiff<Email>, X]] => {

            let diff = new MapDiff<Person>()

            for (let change of emailDiff.insertions) {
                const [from, to] = getCorrespondantsFromSingleEmail(change.value)

                incr(from.id, from, diff)
                incr(to.id, to, diff)

                emailsSet[change.id] = change.value
            }
            for (let change of emailDiff.updates) {
                let [prevFrom, prevTo] = getCorrespondantsFromSingleEmail(emailsSet[change.id])
                let [curFrom, curTo] = getCorrespondantsFromSingleEmail(change.value)

                if (prevFrom.id === curFrom.id) {
                    diff.update(curFrom.id, curFrom)
                } else {
                    decr(prevFrom.id, diff)
                    incr(curFrom.id, curFrom, diff)
                }

                if (prevTo.id === curTo.id) {
                    diff.update(curTo.id, curTo)
                } else {
                    decr(prevTo.id, diff)
                    incr(curTo.id, curTo, diff)
                }

                emailsSet[change.id] = change.value
            }
            for (let change of emailDiff.deletions) {
                const [from, to] = getCorrespondantsFromSingleEmail(emailsSet[change.id])

                decr(from.id, diff)
                decr(to.id, diff)

                delete emailsSet[change.id]
            }

            return [diff, [emailDiff, x]]
        }),
        ignoreDoubles,
        map(([a, [b, c]]) => [a, b, c])
    )
}