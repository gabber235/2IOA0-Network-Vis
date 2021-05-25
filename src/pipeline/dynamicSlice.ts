// import { Observable } from "rxjs"
// import { DataSetDiff } from "./dynamicDataSet"

import { Observable } from "rxjs";
import { ConstArray } from "../utils";
import { DataSet, diffDataSet, MapDiff } from "./dynamicDataSet";



/**
 * Takes an array of key-value pairs and a range of integers, and returns a dynamic subset of all values with indices within that range.
 * THIS FUNCTION IS NOT ONE TO ONE WHEN IT COMES TO EVENTS
 */
export function dynamicSlice<A>(
    array: ConstArray<[number, A]>,
    range: Observable<[number, number]>
): Observable<MapDiff<A>> {

    let prevDataSet: DataSet<A> = {}
    let prevBegin: number|undefined = undefined
    let prevEnd: number|undefined = undefined

    

    return new Observable(sub => {

        range.subscribe(([curBegin, curEnd]) => {
            let diff = new MapDiff<A>()

            if (prevBegin !== undefined && prevEnd !== undefined) {
                if (curBegin <= prevEnd && prevBegin <= curEnd) {
                    if (curBegin < prevBegin) // expand left
                        for (let i = Math.max(curBegin, 0); i < Math.min(prevBegin, array.length); i++) { 
                            let [key, value] = array.getItem(i)
                            diff.add(key, value)
                        }
                    else if (prevBegin < curBegin) // shrink left
                        for (let i = Math.max(prevBegin, 0); i < Math.min(curBegin, array.length); i++) { 
                            let [key, _] = array.getItem(i)
                            diff.remove(key)
                        }
                    if (curEnd < prevEnd) // shrink right
                        for (let i = Math.max(curEnd, 0); i < Math.min(prevEnd, array.length); i++) { 
                            let [key, _] = array.getItem(i)
                            diff.remove(key)
                        }
                    else if (prevEnd < curEnd) // expand right
                        for (let i = Math.max(prevEnd, 0); i < Math.min(curEnd, array.length); i++) { 
                            let [key, value] = array.getItem(i)
                            diff.add(key, value)
                        }
                } else {
                    // move entire slice
                    for (let i = Math.max(prevBegin, 0); i < Math.min(prevEnd, array.length); i++) {
                        let [key, _] = array.getItem(i)
                        diff.remove(key)
                    }
                    for (let i = Math.max(curBegin, 0); i < Math.min(curEnd, array.length); i++) {
                        let [key, value] = array.getItem(i)
                        diff.add(key, value)
                    }
                }
            } else {
                for (let i = Math.max(curBegin, 0); i < Math.min(curEnd, array.length); i++) {
                    let [key, value] = array.getItem(i)
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