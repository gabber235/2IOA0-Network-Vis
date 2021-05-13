import { Observable } from "rxjs"
import { DataSetDiff } from "./dynamicDataSet"

export function dynamicSlice<A>(array: A[], range: Observable<[number, number]>): Observable<DataSetDiff<A>> {

    function getDiff(oldIndex: number, newIndex: number): DataSetDiff<A> | undefined {
        if (oldIndex < newIndex) {
            return DataSetDiff.add(array.slice(oldIndex, newIndex))
        } else if (newIndex < oldIndex) {
            return DataSetDiff.remove(array.slice(newIndex, oldIndex))
        }
    }

    let previous: [number, number] | undefined = undefined

    return new Observable(sub => {
        range.subscribe({
            next([begin_, end_]) {

                if (previous === undefined) {
                    previous = [begin_, end_]
                    sub.next(DataSetDiff.add(array.slice(begin_, end_)))
                } else {
                    let [prevBegin, prevEnd] = previous

                    let left = getDiff(begin_, prevBegin)
                    let right = getDiff(prevEnd, end_)

                    if (left !== undefined) sub.next(left)
                    if (right !== undefined) sub.next(right)

                    previous = [begin_, end_]
                }
            }
        })
    })
}


