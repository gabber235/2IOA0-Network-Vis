import { highlightElement } from "prismjs"
import { combineLatest, Observable } from "rxjs"
import { share } from "rxjs/internal/operators/share"
import { Email, getCorrespondants, Person } from "./data"
import { selectorObserable } from "./pipeline/basics"
import { DataSet } from "./pipeline/dynamicDataSet"
import { arrayToObject, div, newElm, span, text } from "./utils"



type FilterFunction = (email: Email, people: DataSet<Person>, emails: DataSet<Email>) => boolean

/**
 * This class creates and manages the HTML elements and events for the filter options for the visualisation
 */
export class FilterOptions {

    private container: HTMLElement
    private presetMenu: HTMLSelectElement
    private applyButton: HTMLElement

    private functionBodyTextArea: HTMLTextAreaElement
    private highlightedFunctionBodyText: HTMLElement
    private functionWrapper: HTMLElement
    private functionSignature: HTMLElement
    private errorElm: HTMLElement

    private presets: {[val:string]: [string, string]} = {
        none:  ["None",        "true"                                                      ],
        sent:  ["Sentiment",   "Math.abs(email.sentiment) > 0.069"                         ],
        title: ["Title",       "email.fromJobtitle == 'CEO' || email.toJobtitle == 'CEO'"  ],
        type:  ["Type",        "email.messageType == 'TO'"                                 ],
    }


    private filterFunction: Observable<FilterFunction>

    constructor(container: HTMLElement) {
        this.container = container

        this.createElements()
        this.setupEvents()
        this.clearErrorMessage()
        this.updateText()
        highlightElement(this.functionSignature)
    }

    public filterEmails(emails: Observable<Email[]>): Observable<Email[]> {
        return new Observable<Email[]>(sub => {
            combineLatest([
                emails,
                this.filterFunction
            ]).subscribe(([emails, filterFunc]) => {
                const emailMap = arrayToObject(emails, email => email.id)
                const people = getCorrespondants(emails)
    
                try {
                    sub.next(emails.filter(email => filterFunc(email, people, emailMap)))
                    this.clearErrorMessage()
                } catch (e) {
                    this.setErrorMessage(e.message)
                }
            })
        }).pipe(share())
    }

    private getFilterFunction(): FilterFunction {
        try {
            this.clearErrorMessage()
            return eval("(email) => " + this.functionBodyTextArea.value)
        } catch (e) {
            this.setErrorMessage(e.message)
        }
    }

    private createElements() {
        this.presetMenu = newElm("select", {}, 
            Object.entries(this.presets).map(([value, [name]]) => 
                newElm("option", {value: value}, [text(name)]))
        )
        this.functionBodyTextArea = newElm("textArea", {class: "filter-function-body-input", spellcheck:"false"}, []) as HTMLTextAreaElement

        this.highlightedFunctionBodyText = newElm("code", {class:"language-javascript"}, [])

        this.errorElm = div({class: "filter-function-error"}, [])

        this.functionSignature = newElm("code", {class: "language-javascript, filter-function-sig"}, [text("(email) => ")])


        this.functionWrapper = div({class: "filter-function-wrapper"}, [
            this.functionSignature,

            div({class: "filter-function-body-wrapper"}, [
                newElm("pre", {class: "filter-highlighted-text"}, [this.highlightedFunctionBodyText]),
                this.functionBodyTextArea,
            ]),
            this.errorElm
        ])

        this.applyButton = newElm("button", {class: "filter-button"}, [text("Apply")])

        div({class: "filter-container"}, [
            div({class: "filter-title"}, [text("Filter")]),
            div({class: "filter-left-right-split"}, [
                div({class: "filter-left-panel"}, [
                    newElm("label", {}, [text("Presets")]),
                    this.presetMenu,
                ]),
                this.functionWrapper,
                div({class:"filter-button-container"}, [this.applyButton])
            ])
        ], this.container)
    }

    private setupEvents() {
        selectorObserable(this.presetMenu).subscribe(option => {
            this.functionBodyTextArea.value = this.presets[option][1]
            this.updateText()
        })

        this.filterFunction = new Observable<FilterFunction>(sub => {
            sub.next(this.getFilterFunction())
            this.applyButton.addEventListener("click", () => {
                sub.next(this.getFilterFunction())
            })    
        }).pipe(share())

        this.functionBodyTextArea.addEventListener("input", () => {
            this.updateText()
        })
    }

    private updateText() {
        this.highlightedFunctionBodyText.textContent = this.functionBodyTextArea.value    
        highlightElement(this.highlightedFunctionBodyText)
    }

    private setErrorMessage(msg: string) {
        this.errorElm.style.display = "block"
        this.errorElm.textContent = msg
    }
    private clearErrorMessage() {
        this.errorElm.style.display = "none"
    }
}