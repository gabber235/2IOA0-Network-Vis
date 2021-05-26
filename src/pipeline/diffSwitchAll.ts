import { Observable, Subscription } from "rxjs";
import { pair } from "../utils";


// WARNING: This function is currently untested.
export function diffSwitchAll<A, Data, Diff>(
    initial: Data,
    diff: (x: Data, y: Data) => Diff, 
    getData: (a: A)=> Data,
    getDiff: (a: A) => Diff,
) {
    return (outerStream: Observable<Observable<A>>): Observable<[A, Diff]> => {
        return new Observable(sub => {

            let prevData: Data = initial
            let prevSub: Subscription|undefined = undefined

            outerStream.subscribe(innerStream => {
                if (prevSub !== undefined) prevSub.unsubscribe()
                let streamIsNew = true

                prevSub = innerStream.subscribe(a => {
                    if (streamIsNew) {

                        const curData = getData(a)
                        const dataDiff = diff(prevData, curData)

                        sub.next(pair(a, dataDiff))

                        prevData = curData
                        streamIsNew = false
                    } else {
                        const dataDiff = getDiff(a)
                        sub.next(pair(a, dataDiff))
                        prevData = getData(a)
                    }
                })
            })
        })
    }
}