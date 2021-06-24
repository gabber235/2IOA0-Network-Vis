import { Observable } from "rxjs";
import { DataSet, DataSetDiff, ID } from "./dynamicDataSet";



/**
 * This function takes a dynamic dataset of Item's and groups the Item's based on a selector function.
 * The result is a dynamic dataset of datasets where the selector function returns the same value for each value of each inner dataset.
 * The keys of the outer dataset are the values returned by the selector function for the values in the corresponding inner dataset.
 */
export function groupDiffBy<A, Item, B>(
    getDiff: (a: A) => DataSetDiff<Item>, 
    selector: (a: Item) => string, 
    finalize: (a: A, diff: DataSetDiff<DataSetDiff<Item>>) => B
) {
    return (stream: Observable<A>): Observable<B> => {

        const groups: DataSet<Set<ID>> = {}
        const itemIdToGroupId: DataSet<ID> = {}

        return new Observable(sub => {
            stream.subscribe(a => {
                // This is the current incomming diff
                const diff = getDiff(a)

                // This is the diff we eventually send out
                const groupDiff = new DataSetDiff<DataSetDiff<Item>>()

                // Here we keep track of every change to all existing groups
                const updates: DataSet<DataSetDiff<Item>> = {}

                // This adds an item to a group that already exists
                function addUpdate(groupId: ID, itemId: ID, item: Item) {
                    if (!(groupId in updates)) updates[groupId] = new DataSetDiff()

                    updates[groupId].add(itemId, item)
                }
                // This updates an item in a group that already exists
                function updateUpdate(groupId: ID, itemId: ID, item: Item) {
                    if (!(groupId in updates)) updates[groupId] = new DataSetDiff()

                    updates[groupId].update(itemId, item)
                }
                // This remove an item from a group that already exists
                function removeUpdate(groupId: ID, itemId: ID) {
                    if (!(groupId in updates)) updates[groupId] = new DataSetDiff()

                    updates[groupId].remove(itemId)
                }

                // This either creates a new group and adds an item to it or calls addUpdate
                function addItem(id: ID, item: Item) {
                    const groupId = selector(item)

                    itemIdToGroupId[id] = groupId

                    if (!(groupId in groups)) { 
                        // add group
                        groupDiff.add(groupId, new DataSetDiff([{ id: id, value: item }]))

                        groups[groupId] = new Set([id])
                    } else { 
                        // update group
                        addUpdate(groupId, id, item)

                        groups[groupId].add(id)
                    }
                }
                // This removes an existing group if this item is the last in the group.
                // Otherwise it calls removeUpdate
                function removeItem(id: ID) {
                    const groupId = itemIdToGroupId[id]

                    delete itemIdToGroupId[id]

                    if (groups[groupId].size > 1) { 
                        // update group
                        removeUpdate(groupId, id)

                        groups[groupId].delete(id)
                    } else { 
                        // remove group
                        groupDiff.remove(groupId)

                        delete groups[groupId]
                    }
                }


                // Here we process the incomming diff
                for (const change of diff.insertions) {
                    addItem(change.id, change.value)
                }
                for (const change of diff.updates) {
                    const prevGroupId = itemIdToGroupId[change.id]
                    const newGroupId = selector(change.value)

                    if (newGroupId === prevGroupId) {
                        updateUpdate(prevGroupId, change.id, change.value)
                    } else {
                        removeItem(change.id)
                        addItem(change.id, change.value)
                    }
                }
                for (const change of diff.deletions) {
                    removeItem(change.id)
                }

                // Here we transfer over all of the updates collected in the 'updates' object to the diff
                for (const groupId in updates) {
                    groupDiff.update(groupId, updates[groupId])
                }

                sub.next(finalize(a, groupDiff))
            })
        })
    }
}
