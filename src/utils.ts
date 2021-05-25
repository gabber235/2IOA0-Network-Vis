import { Observable } from "rxjs"



/**
 * Checks if two things are equal, not by reference but by value
 */
export function deepEquals(left: any, right: any): boolean {
    if (typeof (left) !== typeof (right)) {
        return false
    } else if (typeof (left) === 'object') {
        for (let key in left) {
            if (!deepEquals(left[key], right[key])) {
                return false
            }
        }
        for (let key in right) {
            if (!deepEquals(left[key], right[key])) {
                return false
            }
        }

        return true
    }

    return left === right
}







var idCounter: number = 0;
/**
 * Used to create new unique numberic id's
 */
export function newId() {
    return idCounter++;
}


/**
 * Creates an element of type, type with attributes defined by attrs and children defined by children. An optional parent may be provided
 */
export function newElm(type: string = "div", attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    let elm = document.createElement(type)

    for (let name in attrs) {
        elm.setAttribute(name, attrs[name])
    }

    for (let child of children) {
        elm.appendChild(child)
    }

    if (parent !== undefined) {
        parent.appendChild(elm)
    }

    return elm
}
/**
 * Uses newElm to create a div
 */
export function div(attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    return newElm("div", attrs, children, parent)
}
/**
 * Uses newElm to create a span
 */
export function span(attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    return newElm("span", attrs, children, parent)
}
/**
 * Creates a text node 
 */
export function text(txt: string): Text {
    return document.createTextNode(txt)
}


/**
 * Like newElm except for svg elements
 */
export function newSvg(type: string = "svg", attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): SVGElement {
    let elm = document.createElementNS("http://www.w3.org/2000/svg", type)

    for (let name in attrs) {
        elm.setAttributeNS(null, name, attrs[name])
    }

    for (let child of children) {
        elm.appendChild(child)
    }

    if (parent !== undefined) {
        parent.appendChild(elm)
    }

    return elm
}


/**
 * An O(1) procedure to remove an item from an array at a specific index
 * 
 * IT DOES NOT PRESERVE THE ORDER OF THE ARRAY
 */
function swapRemove<T>(list: T[], index: number): T {
    let x = list[index]
    list[index] = list[list.length - 1]
    list.pop()

    return x
}






/**
 * Returns the first index at which 'target' should be inserted into the sorted array represented by 'items' such that it remains sorted.
 */
export function binarySearch<A>(items: (index: number) => A, target: A, begin: number, end: number, cmp: (a: A, b: A) => number): number {
    if (begin === end) return begin

    const index = begin + Math.floor((end - begin) / 2)
    const item = items(index)

    if (cmp(item, target) < 0) return binarySearch(items, target, index + 1, end, cmp)
    else return binarySearch(items, target, begin, index, cmp)
}


/**
 * Swaps the members of a tuple
 */
export function swap<X, Y>([x, y]: [X, Y]): [Y, X] {
    return [y, x]
}




/**
 * Applies a given diff'ing function to the first item in a tuple in an observable of tuples
 */
export function diffMapFirst<A, B, X>(initial: A, f: (prev: A, cur: A) => B): (stream: Observable<[A, X]>) => Observable<[B, X]> {
    return stream => {
        let prev: A = initial

        return new Observable(sub => {
            stream.subscribe({
                next([cur, x]) {
                    sub.next([f(prev, cur), x])
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
 * Turns an array into an object with keys defined by getKey
 */
export function arrayToObject<A>(data: A[], getKey: (item: A) => number): {[key: number]: A} {
    return Object.assign({}, ...data.map(item => { return { [getKey(item)]: item } }))
}


export function objectMap<A, B>(f: (a:A) => B, obj: {[key:number]: A}): {[key:number]: B} {
    let newObj: {[key:number]: B} = {}

    for (let id in obj) {
        newObj[id] = f(obj[id])
    }

    return newObj
}