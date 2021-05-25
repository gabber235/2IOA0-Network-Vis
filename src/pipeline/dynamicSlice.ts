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
    begin: Observable<number>, 
    initialEnd: number,
    end: Observable<number>) {

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
        begin.subscribe(curBegin => {
            if (curBegin <= prevEnd) {
                if (prevArray !== undefined) {
                    let diff = new MapDiff<A>()

                    if (curBegin < prevBegin)
                        for (let i = Math.max(curBegin, 0); i < Math.min(prevBegin, prevArray.length); i++) {
                            let [key, value] = prevArray.getItem(i)
                            diff.add(key, value)
                        }
                    else if (prevBegin < curBegin)
                        for (let i = Math.max(prevBegin, 0); i < Math.min(curBegin, prevArray.length); i++) {
                            let [key, _] = prevArray.getItem(i)
                            diff.remove(key)
                        }
                    
                    sub.next([diff, prevX])

                    diff.apply(prevDataSet)
                }
                prevBegin = curBegin
            }
        })
        end.subscribe(curEnd => {
            if (prevBegin <= curEnd) {
                if (prevArray !== undefined) {
                    let diff = new MapDiff<A>()

                    if (curEnd < prevEnd)
                        for (let i = Math.max(curEnd, 0); i < Math.min(prevEnd, prevArray.length); i++) {
                            let [key, _] = prevArray.getItem(i)
                            diff.remove(key)
                        }
                    else if (prevEnd < curEnd) 
                        for (let i = Math.max(prevEnd, 0); i < Math.min(curEnd, prevArray.length); i++) {
                            let [key, value] = prevArray.getItem(i)
                            diff.add(key, value)
                        }
                    sub.next([diff, prevX])
                    
                    diff.apply(prevDataSet)
                }
                prevEnd = curEnd
            }
        })    
    })
}