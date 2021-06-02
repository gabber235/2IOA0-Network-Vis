import { Observable, Subject } from "rxjs";
import { startWith } from "rxjs/operators";
import { millisInDay } from "./utils";

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

    readonly timerange: Subject<[number, number]> = new Subject()
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

