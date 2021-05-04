import { getCorrespondants, parseData } from "./data"
import { div, text } from "./utils"


window.addEventListener("load", () => {
    document.body.appendChild(div({}, [text('Hello World ❤️')]))

    fetch('./enron-v1.csv')
    .then(r => r.text())
    .then(text => {
        let list = parseData(text)
        console.log(getCorrespondants(list))
        console.log(list.slice(0,10))
    })
})