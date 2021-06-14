import { combineLatest, Observable } from "rxjs"
import { share } from "rxjs/internal/operators/share"
import { Email, getCorrespondants, Person } from "./data"
import { selectorObserable } from "./pipeline/basics"
import { DataSet } from "./pipeline/dynamicDataSet"
import { arrayToObject, div, newElm, span, text } from "./utils"



type FilterFunction = (email: Email, people: DataSet<Person>, emails: DataSet<Email>) => boolean

export class FilterOptions {

    private container: HTMLElement
    private menu: HTMLElement
    private text: HTMLTextAreaElement
    private textWrapper: HTMLElement
    private applyButton: HTMLElement
    private errorElm: HTMLElement

    private presets: {[val:string]: [string, string]} = {
        none: ["None", "true"],
        sent: ["Sentiment", "Math.abs(email.sentiment) > 0.069"],
        title: ["Title", "email.fromJobtitle == 'CEO' ||\nemail.toJobtitle == 'CEO'"],
        type: ["Type", "email.messageType == 'TO'"],
    }


    private filterFunction: Observable<FilterFunction>

    constructor(container: HTMLElement) {
        this.container = container

        this.menu = newElm("select", {}, 
            Object.entries(this.presets).map(([value, [name]]) => 
                newElm("option", {value: value}, [text(name)]))
        )
        this.text = newElm("textArea", {class: "filter-function-body"}, []) as HTMLTextAreaElement

        this.errorElm = div({class: "filter-function-error"}, [])

        this.textWrapper = div({class: "filter-function-wrapper"}, [
            div({class: "filter-function-sig"}, [text("(email) =>")]),
            this.text,
            this.errorElm
        ])

        this.applyButton = newElm("button", {class: "filter-button"}, [text("Apply")])

        div({class: "filter-container"}, [
            div({class: "filter-title"}, [text("Filter")]),
            div({class: "filter-left-right-split"}, [
                div({class: "filter-left-panel"}, [
                    div({}, [
                        newElm("label", {}, [text("Presets")]),
                        this.menu,
                    ]),
                    this.applyButton
                ]),
                this.textWrapper
            ])
        ], this.container)

        selectorObserable(this.menu).subscribe(option => {
            this.text.value = this.presets[option][1]
        })

        this.filterFunction = new Observable<FilterFunction>(sub => {
            sub.next(this.getFilterFunction())
            this.applyButton.addEventListener("click", () => {
                sub.next(this.getFilterFunction())
            })    
        }).pipe(share())
    }

    private getFilterFunction(): FilterFunction {
        try {
            return eval("(email) => " + this.text.value)
        } catch (e) {
            this.errorElm.textContent = e.message
        }
    }

    filterEmails(emails: Observable<Email[]>): Observable<Email[]> {
        return new Observable<Email[]>(sub => {
            combineLatest([
                emails,
                this.filterFunction
            ]).subscribe(([emails, filterFunc]) => {
                const emailMap = arrayToObject(emails, email => email.id)
                const people = getCorrespondants(emails)
    
                try {
                    sub.next(emails.filter(email => filterFunc(email, people, emailMap)))
                    this.errorElm.textContent = ""
                } catch (e) {
                    this.errorElm.textContent = e.message
                }
            })
        }).pipe(share())
    }
}