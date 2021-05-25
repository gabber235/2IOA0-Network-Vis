// import { Observable } from "rxjs"
// import { DataSetDiff } from "./dynamicDataSet"

import { Observable } from "rxjs";
import { DataSet, diffDataSet, MapDiff } from "./dynamicDataSet";


export type ConstArray<A> = {getItem: (index: number) => A, length: number}

/**
 * Takes an array of key-value pairs and a range of integers, and returns a dynamic subset of all values with indices within that range.
 * THIS FUNCTION IS NOT ONE TO ONE WHEN IT COMES TO EVENTS
 */
export function dynamicSlice<A, X>(
    initialBegin: number,
    initialEnd: number,
    range: Observable<[number, number]>) {

    let prevDataSet: DataSet<A> = {}
    let prevArray: ConstArray<[number, A]>|undefined = undefined
    let prevBegin: number = initialBegin
    let prevEnd: number = initialEnd
    let prevX: X|undefined = undefined

    return (stream: Observable<[ConstArray<[number, A]>, X]>): Observable<[MapDiff<A>, X]> => new Observable(sub => {
        stream.subscribe(([curArray, x]) => {
            prevArray = curArray

            let nextDataSet: DataSet<A> = {}

            for (let i = Math.max(prevBegin, 0); i < Math.min(prevEnd, curArray.length); i++) {
                let [key, value] = curArray.getItem(i)
                nextDataSet[key] = value
            }

            sub.next([diffDataSet(prevDataSet, nextDataSet), x])

            prevX = x
            prevDataSet = nextDataSet
        })
        range.subscribe(([curBegin, curEnd]) => {
            if (prevArray !== undefined) {
                let diff = new MapDiff<A>()

                if (curBegin <= prevEnd && prevBegin <= curEnd) {
                    if (curBegin < prevBegin) // expand left
                        for (let i = Math.max(curBegin, 0); i < Math.min(prevBegin, prevArray.length); i++) { 
                            let [key, value] = prevArray.getItem(i)
                            diff.add(key, value)
                        }
                    else if (prevBegin < curBegin) // shrink left
                        for (let i = Math.max(prevBegin, 0); i < Math.min(curBegin, prevArray.length); i++) { 
                            let [key, _] = prevArray.getItem(i)
                            diff.remove(key)
                        }
                    if (curEnd < prevEnd) // shrink right
                        for (let i = Math.max(curEnd, 0); i < Math.min(prevEnd, prevArray.length); i++) { 
                            let [key, _] = prevArray.getItem(i)
                            diff.remove(key)
                        }
                    else if (prevEnd < curEnd) // expand right
                        for (let i = Math.max(prevEnd, 0); i < Math.min(curEnd, prevArray.length); i++) { 
                            let [key, value] = prevArray.getItem(i)
                            diff.add(key, value)
                        }
                } else {
                    // move entire slice
                    for (let i = Math.max(prevBegin, 0); i < Math.min(prevEnd, prevArray.length); i++) {
                        let [key, _] = prevArray.getItem(i)
                        diff.remove(key)
                    }
                    for (let i = Math.max(curBegin, 0); i < Math.min(curEnd, prevArray.length); i++) {
                        let [key, value] = prevArray.getItem(i)
                        diff.add(key, value)
                    }
                }
                sub.next([diff, prevX])
                diff.apply(prevDataSet)
            }
            prevBegin = curBegin
            prevEnd = curEnd
        })    
    })
}