import { Observable } from "rxjs";
import { ConstArray } from "../utils";
import { DataSet, DataSetDiff, ID } from "./dynamicDataSet";



/**
 * Takes an array of key-value pairs and an observable of ranges of integers, and returns a dynamic subset of all values with indices within that range.
 */
export function dynamicSlice<A>(
    array: ConstArray<[ID, A]>,
    range: Observable<[number, number]>
): Observable<DataSetDiff<A>> {

    const prevDataSet: DataSet<A> = {}
    let prevBegin: number | undefined = undefined
    let prevEnd: number | undefined = undefined

    return new Observable(sub => {
        range.subscribe(([curBegin, curEnd]) => {
            /*
            Whenever the range changes we have to return a diff which represents the change in the slice of the array.
            We check how the bounds of the range change.
            If the new range overlaps with the old one we have to shrink or grow the slice at either the left and/or right side.
            Alternatively if the ranges don't overlap at all we need to move the entire slice.
            */
            const diff = new DataSetDiff<A>()

            // We need to either add the initial slice if it doesn't exist yet or update an existing slice
            if (prevBegin !== undefined && prevEnd !== undefined) { 
                // Update an existing slice
                if (curBegin <= prevEnd && prevBegin <= curEnd) {
                    // Here we either expand or shrink the ends of the slice
                    if (curBegin < prevBegin) // expand left
                        for (let i = Math.max(curBegin, 0); i < Math.min(prevBegin, array.length); i++) {
                            const [key, value] = array.getItem(i)
                            diff.add(key, value)
                        }
                    else if (prevBegin < curBegin) // shrink left
                        for (let i = Math.max(prevBegin, 0); i < Math.min(curBegin, array.length); i++) {
                            const [key] = array.getItem(i)
                            diff.remove(key)
                        }
                    if (curEnd < prevEnd) // shrink right
                        for (let i = Math.max(curEnd, 0); i < Math.min(prevEnd, array.length); i++) {
                            const [key] = array.getItem(i)
                            diff.remove(key)
                        }
                    else if (prevEnd < curEnd) // expand right
                        for (let i = Math.max(prevEnd, 0); i < Math.min(curEnd, array.length); i++) {
                            const [key, value] = array.getItem(i)
                            diff.add(key, value)
                        }
                } else {
                    // Here we move the entire slice
                    for (let i = Math.max(prevBegin, 0); i < Math.min(prevEnd, array.length); i++) {
                        const [key] = array.getItem(i)
                        diff.remove(key)
                    }
                    for (let i = Math.max(curBegin, 0); i < Math.min(curEnd, array.length); i++) {
                        const [key, value] = array.getItem(i)
                        diff.add(key, value)
                    }
                }
            } else {
                // Add initial slice
                for (let i = Math.max(curBegin, 0); i < Math.min(curEnd, array.length); i++) {
                    const [key, value] = array.getItem(i)
                    diff.add(key, value)
                }
            }

            sub.next(diff)
            diff.apply(prevDataSet)

            prevBegin = curBegin
            prevEnd = curEnd
        })
    })
}