
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
 * Turns an array into an object with keys defined by getKey
 */
export function arrayToObject<A>(data: A[], getKey: (item: A) => number): {[key: number]: A} {
    return Object.assign({}, ...data.map(item => { return { [getKey(item)]: item } }))
}


export function objectMap<A, B>(f: (a:A) => B, obj: {[key:number]: A}): {[key:number]: B} {
    const newObj: {[key:number]: B} = {}

    for (const id in obj) {
        newObj[id] = f(obj[id])
    }

    return newObj
}

/**
 * Represents an immutable array
 */
export type ConstArray<A> = {getItem: (index: number) => A, length: number}


export function pair<A,B>(a: A, b: B): [A, B] {
    return [a, b]
}
export function tripple<A,B,C>(a: A, b: B, c: C): [A, B, C] {
    return [a, b, c]
}
export function tuple4<A,B,C,D>(a: A, b: B, c: C, d: D): [A, B, C, D] {
    return [a, b, c, d]
}
export function tuple5<A,B,C,D,E>(a: A, b: B, c: C, d: D, e: E): [A, B, C, D, E] {
    return [a, b, c, d, e]
}


export function pairMap<A,B,C,D>(f1: (a: A) => B, f2: (a: C) => D) {
    return (tuple: [A, C]): [B, D] => [f1(tuple[0]), f2(tuple[1])]
}


export function pairMap2<A,B,C,D,E,F>(f1: (a: A, b: B) => C, f2: (d: D, e: E) => F) {
    return (tuple1: [A, D], tuple2: [B, E]): [C, F] => 
        [f1(tuple1[0], tuple2[0]), f2(tuple1[1], tuple2[1])]
}

export function trippleMap<A,B,C,D,E,F>(f1: (a: A) => B, f2: (a: C) => D, f3: (a: E) => F) {
    return (tuple: [A, C, E]): [B, D, F] => [f1(tuple[0]), f2(tuple[1]), f3(tuple[2])]
}


export function trippleMap2<A,B,C,D,E,F,G,H,I>(
    f1: (a: A, b: B) => C, 
    f2: (d: D, e: E) => F, 
    f3: (d: G, e: H) => I
) {
    return (tuple1: [A, D, G], tuple2: [B, E, H]): [C, F, I] => 
        [f1(tuple1[0], tuple2[0]), f2(tuple1[1], tuple2[1]), f3(tuple1[2], tuple2[2])]
}

export function tuple4Map<A,B,C,D,E,F,G,H>(f1: (a: A) => B, f2: (a: C) => D, f3: (a: E) => F, f4: (a: G) => H) {
    return (tuple: [A, C, E, G]): [B, D, F, H] => [f1(tuple[0]), f2(tuple[1]), f3(tuple[2]), f4(tuple[3])]
}


export function tuple4Map2<A,B,C,D,E,F,G,H,I,J,K,L>(
    f1: (a: A, b: B) => C, 
    f2: (d: D, e: E) => F, 
    f3: (d: G, e: H) => I,
    f4: (d: J, e: K) => L,
) {
    return (tuple1: [A, D, G, J], tuple2: [B, E, H, K]): [C, F, I, L] => 
        [f1(tuple1[0], tuple2[0]), f2(tuple1[1], tuple2[1]), f3(tuple1[2], tuple2[2]), f4(tuple1[3], tuple2[3])]
}




export function copyObject<A>(x: A): A {
    return Object.assign({}, x)
}