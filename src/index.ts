import { getCorrespondants, parseData } from "./data"
import { div, text } from "./utils"


window.addEventListener("load", async () => {
    document.body.appendChild(div({}, [text('Hello World ❤️')]))

    let file = await fetch('./enron-v1.csv')
    let list = parseData(await file.text())
    console.log(getCorrespondants(list))
    console.log(list.slice(0,10))
})