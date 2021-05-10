import { getCorrespondants, parseData, Email, Person, Title } from "./data";
import { div, text } from "./utils";

const dataFile = require('../resources/static/enron-v1.csv');

window.addEventListener("load", async () => {
    document.body.appendChild(div({}, [text('Adjacency-matrix')]))

    // Get data
    let file = await fetch(dataFile.default);
    let emails = parseData(await file.text());
    const correspondants = getCorrespondants(emails); //dictionary with persons
    
    //Creating array with person objects...
    let correspondantList = Object.values(correspondants);


    //Testing the function

    let filtered = filterCorrespondants(["Unknown"], correspondantList);
    console.log(filtered)
});

//Returns an array (filtered) with the persons who have one of the jobtitles that is given as an array (jobTitleList) in the input.
function filterCorrespondants(jobTitleList: Title[], correspondants: Person[]) {
    let filtered: Person[] = [];
    for (let person in correspondants) {
        for (let job in jobTitleList){
            if (jobTitleList[job]===correspondants[person].title){
                filtered.push(correspondants[person]);
                break;
            }                
        }
    }
    return filtered;
}