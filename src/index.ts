import { getCorrespondants, parseData } from "./data"
import { div, text } from "./utils"


window.addEventListener("load", () => {
    document.body.appendChild(div({}, [text('Hello World ❤️')]));

    (async () => {
        let file = await fetch('./enron-v1.csv')
        let text = await file.text()
        let list = parseData(text)
        console.log(getCorrespondants(list))
        console.log(list.slice(0,10))
    })()
})