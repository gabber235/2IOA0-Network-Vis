import { sliderToObservable } from "./pipeline/basics";
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

    private readonly beginElm: HTMLElement
    private readonly endElm: HTMLElement
    private readonly durationElm: HTMLElement

    private readonly beginSlider: HTMLElement
    private readonly durationSlider: HTMLElement

    private begin: number
    private duration: number

    constructor(beginSlider: HTMLElement, durationSlider: HTMLElement, beginElm: HTMLElement, endElm: HTMLElement, durationElm: HTMLElement) {
        this.beginSlider = beginSlider
        this.durationSlider = durationSlider
        this.beginElm = beginElm
        this.endElm = endElm
        this.durationElm = durationElm

        sliderToObservable(this.beginSlider).subscribe(begin => {
            this.begin = begin
            this.render()
        })
        sliderToObservable(this.durationSlider).subscribe(duration => {
            this.duration = duration
            this.render()
        })
    }


    setFirstAndLastDate(first: number, last: number) {
        this.firstDate = first
        this.beginSlider.setAttribute("max", "" + (last - first) / millisInDay)
        this.render()
    }
    private render() {
        if (this.begin !== undefined && this.duration !== undefined && this.firstDate !== undefined) {
            this.beginElm.textContent = new Date(this.firstDate + this.begin * millisInDay).toDateString()
            this.endElm.textContent = new Date(this.firstDate + (this.begin + this.duration) * millisInDay).toDateString()
            this.durationElm.textContent = `${this.duration} days`
        }
    }
}


