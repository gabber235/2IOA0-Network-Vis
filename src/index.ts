import { Email, getCorrespondants, parseData } from "./data"
import { div, loadFile, text } from "./utils"


window.addEventListener("load", () => {
    document.body.appendChild(div({}, [text('Hello World ❤️')]))

    loadFile('enron-v1.csv', text => {
        let list = parseData(text)
        console.log(getCorrespondants(list))
        console.log(list.slice(0,10))
    })
})