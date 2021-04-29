import { div, text } from "./utils"


window.addEventListener("load", () => {
    document.body.appendChild(div({}, [text('Hello World ❤️')]))
})