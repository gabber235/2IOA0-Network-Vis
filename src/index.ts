import { Email, getCorrespondants } from "./data"
import { div, loadFile, text } from "./utils"


window.addEventListener("load", () => {
    document.body.appendChild(div({}, [text('Hello World ❤️')]))

    loadFile('enron-v1.csv', text => {

        let list: Email[] = []
        
        for (let line of text.split("\n").slice(1)) {
            if (line !== "") {
                let d = line.slice(0,-1).split(',')
                list.push({
                    date: d[0],
                    fromId: +d[1],
                    fromEmail: d[2],
                    fromJobtitle: d[3] as any,
                    toId: +d[4],
                    toEmail: d[5],
                    toJobtitle: d[6] as any,
                    messageType: d[7] as any,
                    sentiment: +d[8]
                })
            }
        }
        console.log(getCorrespondants(list))
    })
})