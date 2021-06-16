import { Observable } from "rxjs"


/**
 * Creates a an observable of diff's using the given diff'ing function
 */
export function diffStream<A,B>(initial: A, diff: (x: A, y: A) => B) {
    return (stream: Observable<A>): Observable<B> => {
        let prev: A = initial

        return new Observable(sub => {
            stream.subscribe(cur => {
                sub.next(diff(prev, cur))
                prev = cur
            })    
        })
    }
}

/**
 * Returns an observable of file contents for a given file input
 */
export function fileInputObservable(elm: HTMLInputElement): Observable<string> {
    return new Observable(sub => {
        elm.addEventListener('change', async () => {
            const fileList: FileList = elm.files;

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
export function sliderToObservable(elm: HTMLInputElement): Observable<number> {
    return new Observable(sub => {
        sub.next(+elm.value)

        elm.addEventListener("input", (e: any) => {
            sub.next(+elm.value)
        })    
    })
}

/**
 * Returns an observable of booleans representing whether the given checkbox is checked
 */
export function checkBoxObserable(elm: HTMLInputElement): Observable<boolean> {
    return new Observable(sub => {
        sub.next(elm.checked)

        elm.addEventListener("change", () => {
            sub.next(elm.checked)
        })
    })
}

 export function selectorObserable(elm: HTMLSelectElement): Observable<string> {
    return new Observable(sub => {
        sub.next(elm.value)

        elm.addEventListener("change", () => {
            sub.next(elm.value)
        })
    })
}


 export function textAreaObserable(elm: HTMLTextAreaElement): Observable<string> {
    return new Observable(sub => {
        sub.next(elm.value)

        elm.addEventListener("change", (e: any) => {
            sub.next(elm.value)
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


