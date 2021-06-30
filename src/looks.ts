import { Observable, ReplaySubject, Subject } from "rxjs";
import { div, millisInDay, newElm, span, text } from "./utils";

/**
 * Adds some aesthetic flourish to a given file input element
 */
export function prettifyFileInput(elm: HTMLElement) {
    elm.addEventListener('change', (event: any) => {
        const fileList: FileList = event.target.files;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList.item(i);

            const label = elm.nextElementSibling;
            label.innerHTML = file.name
        }
    })
}



export class TimeSliders {
    private firstDate: number
    private lastDate: number

    private readonly beginElm: HTMLElement
    private readonly endElm: HTMLElement
    private readonly durationElm: HTMLElement

    readonly timerange: Subject<[number, number]> = new ReplaySubject(1)
    private start: number = 0
    private end: number = 1

    constructor(timeslider: Observable<[number, number]>, beginElm: HTMLElement, endElm: HTMLElement, durationElm: HTMLElement) {
        this.beginElm = beginElm
        this.endElm = endElm
        this.durationElm = durationElm

        timeslider.subscribe(range => {
            this.start = range[0]
            this.end = range[1]
            this.render()
        })
    }


    setFirstAndLastDate(first: number, last: number) {
        this.firstDate = first
        this.lastDate = last
        this.render()
    }

    dayPercentage(percentage: number): number {
        return (this.lastDate - this.firstDate) * percentage + this.firstDate
    }

    private render() {
        if (this.firstDate == undefined || this.lastDate == undefined) return

        const firstDay = this.firstDate / millisInDay

        const startDate = this.dayPercentage(this.start)
        const endDate = this.dayPercentage(this.end)
        const startDay = startDate / millisInDay - firstDay
        const endDay = endDate / millisInDay - firstDay

        this.beginElm.textContent = new Date(startDate).toDateString()
        this.endElm.textContent = new Date(endDate).toDateString()
        this.durationElm.textContent = `${Math.round(endDay - startDay)} days`

        this.timerange.next([startDay, endDay])
    }
}

export async function animateAcronym(container: HTMLElement) {

    const typingDelay = 100

    const acronym = [
        "Covert",
        "Operational",
        "Visualisation",
        "Inspection",
        "Society",
        "19"
    ]

    const acronymChars = 
        acronym.map(word => {
            if (word !== '19') { // For everything except the '19' we make just the first character bold
                return [...word].map((char, charIndex) => {
                    if (charIndex == 0) // We make just the first character bold
                        return newElm("b", {}, [text(char)])
                    else
                        return span({style: "visibility: hidden"}, [text(char)])
                })
            } else { // For the '19' we make everthing bold
                return [...word].map(char => newElm("b",{style: "visibility: hidden"}, [text(char)]))
            }
        })

    div({}, acronymChars.map(elms => div({}, elms)), container)

    for (let i = 0; i < acronym.length; i++) {
        await typeOutElements(acronymChars[i], typingDelay)
    }
}


function typeOutElements(list: HTMLElement[], delay: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let index = 0

        const interval = setInterval(() => {

            list[index].style.visibility = "visible"
            list[index].style.borderRight = "1px solid white"
            if (index > 0) list[index - 1].style.borderRight = "none"

            index++

            if (index >= list.length) {
                list[list.length - 1].style.borderRight = "none"
                clearInterval(interval)
                resolve()
            }
        }, delay)
    })
}