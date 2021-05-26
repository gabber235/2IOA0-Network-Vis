import { Observable } from "rxjs"
import { DataSet, DataSetDiff } from "./dynamicDataSet"



/**
 * Applies a given diff'ing function to the first item in a tuple in an observable of tuples
 */
 export function diffMapFirst<A, B, X>(initial: A, f: (prev: A, cur: A) => B): (stream: Observable<[A, X]>) => Observable<[B, X]> {
    return stream => {
        let prev: A = initial

        return new Observable(sub => {
            stream.subscribe({
                next([cur, x]) {
                    const diff = f(prev, cur)
                    sub.next([diff, x])
                    prev = cur
                }
            })
        })
    }
}

/**
 * Returns an observable of file contents for a given file input
 */
export function fileInputObservable(elm: HTMLElement): Observable<string> {
    return new Observable(sub => {
        elm.addEventListener('change', async (event: any) => {
            const fileList: FileList = event.target.files;

            for (let i = 0; i < fileList.length; i++) {
                const file = fileList.item(i);

                const txt = await file.text()
                sub.next(txt)
            }
        });
    })
}

/**
 * Returns an observable of the values of a slider
 */
export function sliderToObservable(elm: HTMLElement): Observable<number> {
    return new Observable(sub => {
        sub.next(+(elm as any).value)

        elm.addEventListener("input", (e: any) => {
            sub.next(+e.target.value)    
        })    
    })
}

/**
 * Returns an observable of booleans representing whether the given checkbox is checked
 */
export function checkBoxObserable(elm: HTMLElement): Observable<boolean> {
    return new Observable(sub => {
        sub.next((elm as any).checked)

        elm.addEventListener("change", (e: any) => {
            sub.next(e.target.checked)
        })
    })
}

/**
 * Collects the values send by an observable into an array
 */
export function observableToArray<A>(stream: Observable<A>): A[] {
    const arr: A[] = []

    stream.subscribe(a => arr.push(a))

    return arr
}

/**
 * Converts a stream of diff's to a stream of dataset's, IT DOESN'T COPY THE DATASETS
 */
export function foldDiffFirst<A,X>(stream: Observable<[DataSetDiff<A>, X]>): Observable<[DataSet<A>, X]> {
    
    const dataset: DataSet<A> = {}
    
    return new Observable(sub => {
        stream.subscribe(([diff, x]) => {
            diff.apply(dataset)
            
            sub.next([dataset, x])
        })
    })
}