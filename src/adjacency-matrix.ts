import { getCorrespondants, parseData, Email, Person, Title } from "./data";
import { div, text } from "./utils";

const dataFile = require('../resources/static/enron-v1.csv');

window.addEventListener("load", async () => {
    document.body.appendChild(div({}, [text('Adjacency-matrix')]))

    let file = await fetch(dataFile.default);
    let emails = parseData(await file.text());
    const correspondants = getCorrespondants(emails); //dictionary with persons

    const correspondantList: Person[] = []; // array with persons

    // for (const item in correspondants) {
    //     let person: Person;
    //     let pseudoPerson = correspondants[item];
        
    //     // Object.assign(person, pseudoPerson);
    //     person.emailAdress = pseudoPerson.emailAdress;
    //     person.id = pseudoPerson.id;
    //     person.title = pseudoPerson.title;
        
    //     correspondantList.push(person);        
    // }

    // console.log(correspondantList)

    // let personInstance: {[id: number]: Person} = {}

    // input ; lijstje job titles  --> Array
    // output ; -correspondents met die job titles

    filterCorrespondants(["CEO"], correspondantList)
    

});

// Should return an array (filtered) with the persons who have one of the jobtitles that is given as an array (jobTitleList) in the input.
//ALso requires an original array with persons as input (correspondants)
//Still in progress
function filterCorrespondants(jobTitleList: Title[], correspondants: Person[]) {
    let filtered: Person[] = []; // create an array for keeping the entries we want
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