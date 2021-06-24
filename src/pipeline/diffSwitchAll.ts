import { Observable, Subscription } from "rxjs";
import { pair } from "../utils";


// WARNING: This function is currently untested.
/**
 * Takes a stream of streams of diffs and merges them into a single stream of diffs. 
 * It does this by 'switching' to the latest stream that was sent.
 * This is very similar to how switchAll works, but it's been adapted to work for diff streams
 */
export function diffSwitchAll<A, Data, Diff>(
    getInitial: () => Data,
    diff: (x: Data, y: Data) => Diff, 
    getData: (a: A)=> Data,
    getDiff: (a: A) => Diff,
) {
    return (outerStream: Observable<Observable<A>>): Observable<[A, Diff]> => {
        return new Observable(sub => {

            let prevData: Data = getInitial()
            let prevSub: Subscription|undefined = undefined

            outerStream.subscribe(innerStream => {
                // Once a new stream arives we unsubscribe from the old one and subscribe to the new one.
                if (prevSub !== undefined) prevSub.unsubscribe()
                let streamIsNew = true
                
                prevSub = innerStream.subscribe(a => {
                    if (streamIsNew) {
                        // On the first message of a new stream we need to send a diff of the previous dataset and the current one to reflect the change in streams.
                        const curData = getData(a)
                        const dataDiff = diff(prevData, curData)

                        sub.next(pair(a, dataDiff))

                        prevData = curData
                        streamIsNew = false
                    } else {
                        // On subsequent messages we just send through the diff's themselves making sure to keep track of the full dataset.
                        const dataDiff = getDiff(a)
                        sub.next(pair(a, dataDiff))
                        prevData = getData(a)
                    }
                })
            })
        })
    }
}