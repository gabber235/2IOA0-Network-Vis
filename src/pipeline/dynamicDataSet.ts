export type ID = string

export type DataSet<A> = { [_ in ID]: A }

/**
 * Represents a set of changes to a dataset
 */
export class DataSetDiff<A> {

    public readonly insertions: {id: ID, value: A}[]
    public readonly updates: {id: ID, value: A}[]
    public readonly deletions: {id: ID}[]

    constructor(insertions: {id: ID, value: A}[] = [], updates: {id: ID, value: A}[] = [], deletions: {id: ID}[] = []) {
        this.insertions = insertions
        this.updates = updates
        this.deletions = deletions
    }

    /**
     * Adds an insertion to the diff
     */
    add(id: ID, value: A) {
        this.insertions.push({id: id, value: value})
    }
    /**
     * Adds an update to the diff
     */
    update(id: ID, value: A) {
        this.updates.push({id: id, value: value})
    }
    /**
     * Adds a deletion to the diff
     */
    remove(id: ID) {
        this.deletions.push({id: id})
    }

    /**
     * Changes every value and id using the given functions
     */
    map<B>(valueMap: (a: A, id?: ID) => B, idMap: (id: ID) => ID): DataSetDiff<B> {
        return new DataSetDiff(
            this.insertions.map(({id, value}) => {return {id: idMap(id), value: valueMap(value, id)}}),
            this.updates.map(({id, value}) => {return {id: idMap(id), value: valueMap(value, id)}}),
            this.deletions.map(({id}) => {return {id: idMap(id)}})
        )
    }

    /**
     * Creates a new DataSetDiff by concatenating the first and last diff in order
     */
    andThen(other: DataSetDiff<A>): DataSetDiff<A> {
        return new DataSetDiff(
            this.insertions.concat(other.insertions),
            this.updates.concat(other.updates),
            this.deletions.concat(other.deletions),
        )
    }

    /**
     * Applies the changes to a map
     */
    apply(dataSet: DataSet<A>) {
        for (const {id, value} of this.insertions) {
            dataSet[id] = value
        }
        for (const {id, value} of this.updates) {
            dataSet[id] = value
        }
        for (const {id} of this.deletions) {
            delete dataSet[id]
        }
    }

    /**
     * Applies the changes to a set of id's
     */
    applySet(set: Set<ID>) {
        for (const {id} of this.insertions) {
            set.add(id)
        }
        for (const {id} of this.deletions) {
            set.delete(id)
        }
    }

    /**
     * Applies just the insertions
     */
    applyInsertions(dataset: DataSet<A>) {
        for (const {id, value} of this.insertions)
            dataset[id] = value
    }
    /**
     * Applies just the updates
     */
    applyUpdates(dataset: DataSet<A>) {
        for (const {id, value} of this.updates)
            dataset[id] = value
    }
    /**
     * Applies just the deletions
     */
    applyDeletions(dataset: DataSet<A>) {
        for (const {id} of this.deletions)
            delete dataset[id]
    }

    /**
     * Applies just the insertions to a set of id's
     */
    applySetInsertions(set: Set<ID>) {
        for (const {id} of this.insertions)
            set.add(id)
    }

    /**
     * Applies just the deletions to a set of id's
     */
    applySetDeletions(set: Set<ID>) {
        for (const {id} of this.deletions) 
            set.delete(id)
    }

    /**
     * Returns true if the diff represents no changes to a dataset, it return false otherwise
     */
    get isEmpty(): boolean { 
        return this.insertions.length === 0 && this.updates.length === 0 && this.deletions.length === 0 
    }
    /**
     * Applies the insertions of a diff of diff's to a dataset of datasets 
     */
    static applyGroupInsertions<A>(diff: DataSetDiff<DataSetDiff<A>>, dataGroups: DataSet<DataSet<A>>) {
        for (const {id, value} of diff.insertions) {
            dataGroups[id] = {}
            value.apply(dataGroups[id])
        }
        
    }
    /**
     * Applies the updates of a diff of diff's to a dataset of datasets
     */
    static applyGroupUpdates<A>(diff: DataSetDiff<DataSetDiff<A>>, dataGroups: DataSet<DataSet<A>>) {
        for (const {id, value} of diff.updates) {
            value.apply(dataGroups[id])
        }
    }
    /**
     * Applies the deletions of  a diff of diff's to a dataset of datasets
     */
    static applyGroupDeletions<A>(diff: DataSetDiff<DataSetDiff<A>>, dataGroups: DataSet<DataSet<A>>) {
        for (const {id} of diff.deletions) {
            delete dataGroups[id]
        }
    }
    
}

/**
 * Represents changes to a set of numbers
 */
// NOTE: This is a lazy and dumb way to do this
export type IDSetDiff = DataSetDiff<any>


/**
 * Computes the difference between two datasets which may include pointers.
 * So this will always assume that a value is updated if its key appears in both datasets
 */
export function diffDataSet<A>(prev: DataSet<A>, cur: DataSet<A>): DataSetDiff<A> {
    const diff = new DataSetDiff<A>()

    for (const id in cur) {
        if (id in prev) { 
            // NOTE: We always update because we don't have a way to compare values
            diff.update(id, cur[id])
        } else {
            diff.add(id, cur[id])
        }
    }
    for (const id in prev) {
        if (!(id in cur)) diff.remove(id)
    }

    return diff
}

/**
 * Computes the difference between two datasets that DON'T INCLUDE POINTERS.
 * This means that it will only update a value if the value was already present and not equal to the previous value
 */
 export function diffPureDataSet<A>(prev: DataSet<A>, cur: DataSet<A>): DataSetDiff<A> {
    const diff = new DataSetDiff<A>()

    for (const id in cur) {
        if (id in prev) {
            // NOTE: Because values are not pointers they are directly comparable
            if (prev[id] !== cur[id]) 
                diff.update(id, cur[id])
        } else {
            diff.add(id, cur[id])
        }
    }
    for (const id in prev) {
        if (!(id in cur)) diff.remove(id)
    }

    return diff
}




/**
 * Applies diff to acc.
 * WARNING: MUTATES ACC
 */
export function foldDataSet<A>(acc: DataSet<A>, diff: DataSetDiff<A>): DataSet<A> {
    diff.apply(acc)
    return acc
}
