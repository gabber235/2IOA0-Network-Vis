import { Observable } from "rxjs";
import { DataSet, DataSetDiff } from "./dynamicDataSet";




export function groupDiffBy<A, Item, B>(getDiff: (a:A) => DataSetDiff<Item>, selector: (a: Item) => number, finalize: (a:A, diff: DataSetDiff<DataSetDiff<Item>>) => B) {
    return (stream: Observable<A>): Observable<B> => {

        const groups: DataSet<Set<number>> = {}
        const itemIdToGroupId: DataSet<number> = {}

        return new Observable(sub => {
            stream.subscribe(a => {
                const diff = getDiff(a)

                const groupDiff = new DataSetDiff<DataSetDiff<Item>>()

                let updates: DataSet<DataSetDiff<Item>> = {}

                function addUpdate(groupId: number, itemId: number, item: Item) {
                    if (!(groupId in updates)) updates[groupId] = new DataSetDiff()

                    updates[groupId].add(itemId, item)
                }
                function updateUpdate(groupId: number, itemId: number, item: Item) {
                    if (!(groupId in updates)) updates[groupId] = new DataSetDiff()

                    updates[groupId].update(itemId, item)
                }
                function removeUpdate(groupId: number, itemId: number) {
                    if (!(groupId in updates)) updates[groupId] = new DataSetDiff()

                    updates[groupId].remove(itemId)
                }

                function addItem(id: number, item: Item) {
                    const groupId = selector(item)

                    itemIdToGroupId[id] = groupId

                    if (!(groupId in groups)) { // add group
                        groupDiff.add(groupId, new DataSetDiff([{id: id, value: item}]))

                        groups[groupId] = new Set([id])
                    } else { // update group
                        addUpdate(groupId, id, item)

                        groups[groupId].add(id)
                    }
                }
                function removeItem(id: number) {
                    const groupId = itemIdToGroupId[id]
                    
                    delete itemIdToGroupId[id]

                    if (groups[groupId].size > 1) { // update group
                        removeUpdate(groupId, id)

                        groups[groupId].delete(id)
                    } else { // remove group
                        groupDiff.remove(groupId)

                        delete groups[groupId]
                    }   
                }
                


                for (let change of diff.insertions) {
                    addItem(change.id, change.value)
                }
                for (let change of diff.updates) {
                    const prevGroupId = itemIdToGroupId[change.id]
                    const newGroupId = selector(change.value)

                    if (newGroupId === prevGroupId) {
                        updateUpdate(prevGroupId, change.id, change.value)
                    } else {
                        removeItem(change.id)
                        addItem(change.id, change.value)
                    }
                }
                for (let change of diff.deletions) {
                    removeItem(change.id)
                }

                for (let groupId in updates) {
                    groupDiff.update(+groupId, updates[groupId])
                }

                sub.next(finalize(a, groupDiff))
            })    
        })
    }
}
