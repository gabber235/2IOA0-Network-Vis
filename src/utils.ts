



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

export function newId() {
    return idCounter++;
}



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
export function div(attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    return newElm("div", attrs, children, parent)
}
export function span(attrs: { [name: string]: string } = {}, children: Node[] = [], parent: Node | undefined = undefined): HTMLElement {
    return newElm("span", attrs, children, parent)
}
export function text(txt: string): Text {
    return document.createTextNode(txt)
}



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



function swapRemove<T>(list: T[], index: number): T {
    let x = list[index]
    list[index] = list[list.length - 1]
    list.pop()

    return x
}
