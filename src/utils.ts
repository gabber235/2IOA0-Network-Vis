


/*
Checks if two things are equal. Not by reference but by value
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
/*
Used to create new unique numberic id's
*/
export function newId() {
    return idCounter++;
}


/*
Create an element of type, type with attributes defined by attrs and children defined by children. An optional parent may be provided
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
/*
Use newElm to create a div
*/
export function div(attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    return newElm("div", attrs, children, parent)
}
/*
Use newElm to create a span
*/
export function span(attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    return newElm("span", attrs, children, parent)
}
/*
Create a text node 
*/
export function text(txt: string): Text {
    return document.createTextNode(txt)
}


/*
Like newElm except for svg elements
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


/*
An O(1) procedure to remove an item from an array at a specific index. IT DOES NOT PRESERVE THE ORDER OF THE ARRAY
*/
function swapRemove<T>(list: T[], index: number): T {
    let x = list[index]
    list[index] = list[list.length - 1]
    list.pop()

    return x
}
