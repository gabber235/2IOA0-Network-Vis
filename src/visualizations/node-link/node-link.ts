import { identity, Observable } from 'rxjs';
import { filter, groupBy, map, max, share } from 'rxjs/operators';
import * as vis from 'vis';
import { Email, Person, } from '../../data';
import { diffStream } from '../../pipeline/basics';
import { DataSet, diffPureDataSet, DataSetDiff, IDSetDiff, ID } from '../../pipeline/dynamicDataSet';
import { groupDiffBy } from '../../pipeline/groupDiffBy';
import { arrayToObject, pair, pairMap2, span, text, tripple, tuple4, tuple5 } from '../../utils';
import { edgeColorContrast, nodeSize, titleColors, titleRanks } from '../constants';
import { defaultNodeLinkOptions, initialVisOptions, NodeLinkOptions, nodeLinkOptionsToVisOptions } from './options';



export type PersonGroup = DataSet<Person>
export type EmailGroup = DataSet<Email>

export class NodeLinkVisualisation {

    private options: NodeLinkOptions = defaultNodeLinkOptions

    private nodes: vis.DataSet<vis.Node> = new vis.DataSet()
    private edges: vis.DataSet<vis.Edge> = new vis.DataSet()

    public readonly visualisation: vis.Network

    private people: DataSet<Person> = {}
    private emails: DataSet<Email> = {}
    private personGroups: DataSet<PersonGroup> = {}
    private emailGroups: DataSet<EmailGroup> = {}
    private peopleGroupEmailGroups: DataSet<EmailGroup> = {}

    private selectedPeople = new Set<ID>()
    private selectedEmails = new Set<ID>()

    private maxNodes: number

    constructor(
        container: HTMLElement,
        data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>, 
        selections: Observable<[IDSetDiff, IDSetDiff]>,
        options: Observable<NodeLinkOptions>, 
        maxNodes: number,
    ) {
        this.maxNodes = maxNodes

        this.visualisation = new vis.Network(container, { nodes: this.nodes, edges: this.edges }, initialVisOptions)

        options.subscribe(this.onOptions.bind(this))

        data.pipe(
            groupDiffBy(
                ([peopleDiff, _]) => peopleDiff,
                person => person.title,
                ([peopleDiff, emailDiff], personGroupDiff) => tripple(peopleDiff, emailDiff, personGroupDiff)
            ),
            groupDiffBy(
                ([_, emailDiff, __]) => emailDiff, 
                email => email.fromId + "," + email.toId, 
                ([peopleDiff, emailDiff, personGroupDiff], emailGroupDiff) => tuple4(peopleDiff, emailDiff, personGroupDiff, emailGroupDiff)
            ),
            groupDiffBy(
                ([_, emailDiff, __, ____]) => emailDiff,
                email => email.fromJobtitle + ","+email.toJobtitle,
                ([peopleDiff, emailDiff, personGroupDiff, emailGroupDiff], emailGroupPersonGroupDiff) => tuple5(peopleDiff, emailDiff, personGroupDiff, emailGroupDiff, emailGroupPersonGroupDiff)
            )
        ).subscribe(this.onData.bind(this))

        selections.subscribe(this.onSelection.bind(this))
    }

    private nodeLocation(person: Person) {
        const circleLayoutRadius = this.maxNodes * (nodeSize * 2 + 2) / Math.PI / 2
        return {
            x: circleLayoutRadius * Math.cos(2 * Math.PI * person.id / this.maxNodes),
            y: circleLayoutRadius * Math.sin(2 * Math.PI * person.id / this.maxNodes),
        }
    }

    private onSelection([personDiff, emailDiff]: [IDSetDiff, IDSetDiff]) {

        personDiff.applySet(this.selectedPeople)
        emailDiff.applySet(this.selectedEmails)

        this.visualisation.selectNodes(
            [...this.selectedPeople]
            .map(i => getPersonVisId(this.people[i], this.options.groupNodes))
        )

        this.visualisation.selectEdges(
            [...this.selectedEmails]
            .map(i => getEmailVisId(this.emails[i], this.options.groupNodes, this.options.groupEdges))
        )
    }

    private updateSelection() {
        this.visualisation.selectNodes(
            [...this.selectedPeople]
            .map(i => getPersonVisId(this.people[i], this.options.groupNodes))
        )

        this.visualisation.selectEdges(
            [...this.selectedEmails]
            .map(i => getEmailVisId(this.emails[i], this.options.groupNodes, this.options.groupEdges))
        )
    }


    private onOptions(options: NodeLinkOptions) {

        const resetNodes = 
            ('hierarchical' in options && this.options.hierarchical !== options.hierarchical)
            || ('groupNodes' in options)

        const resetEdges =
            ('hierarchical' in options && this.options.hierarchical !== options.hierarchical)
            || ('groupNodes' in options)
            || ('groupEdges' in options)

        if (resetEdges) {
            this.edges.clear()
        }
        if (resetNodes) {
            this.nodes.clear()
        }

        this.visualisation.setOptions(nodeLinkOptionsToVisOptions(Object.assign(this.options, options)))

        if (resetNodes) {
            if (this.options.groupNodes)
                this.nodes.add(Object.entries(this.personGroups).map(([id, val]) => personGroupToNode(id, this.personGroups[id])))
            else 
                this.nodes.add(Object.values(this.people).map(person => Object.assign({}, personToNode(person), this.nodeLocation(person))))

        }

        if (resetEdges) {
            if (!this.options.groupNodes && !this.options.groupEdges) {
                this.edges.add(Object.values(this.emails).map(emailToEdge))   
            }
            else if (this.options.groupNodes && !this.options.groupEdges) {
                this.edges.add(Object.values(this.emails).map(emailToEdgeGroupedNodes))   
            } else if (!this.options.groupNodes && this.options.groupEdges) {
                this.edges.add(Object.entries(this.emailGroups).map(([id, val]) => emailGroupToEdge(val)))
            } else {
                this.edges.add(Object.entries(this.peopleGroupEmailGroups).map(([id, val]) => emailGroupPersonGroupToEdge(val)))
            }
        }
        this.updateSelection()
    }
    private onData(
        [peopleDiff, emailDiff, personGroupDiff, emailGroupDiff, emailGroupPersonGroupDiff]: 
        [DataSetDiff<Person>, DataSetDiff<Email>, DataSetDiff<DataSetDiff<Person>>, DataSetDiff<DataSetDiff<Email>>, DataSetDiff<DataSetDiff<Email>>]
    ) {
        peopleDiff.apply(this.people)
        emailDiff.apply(this.emails)
        
        for (const change of personGroupDiff.insertions) {
            this.personGroups[change.id] = {}
            change.value.apply(this.personGroups[change.id])
        }
        for (const change of personGroupDiff.updates) {
            change.value.apply(this.personGroups[change.id])
        }

        for (const change of emailGroupDiff.insertions) {
            this.emailGroups[change.id] = {}
            change.value.apply(this.emailGroups[change.id])
        }
        for (const change of emailGroupDiff.updates) {
            change.value.apply(this.emailGroups[change.id])
        }

        for (const change of emailGroupPersonGroupDiff.insertions) {
            this.peopleGroupEmailGroups[change.id] = {}
            change.value.apply(this.peopleGroupEmailGroups[change.id])
        }
        for (const change of emailGroupPersonGroupDiff.updates) {
            change.value.apply(this.peopleGroupEmailGroups[change.id])
        }

        const nodePeopleDiff = peopleDiff.map((person) => Object.assign({}, personToNode(person), this.nodeLocation(person)), id => "s" + id)
        const nodeGroupDiff = personGroupDiff.map((_, id) => personGroupToNode(id, this.personGroups[id]), id => "g" + id)
        const edgeEmailDiff = emailDiff.map(emailToEdge, id => "ss" + id)
        const edgeEmailGroupedNodesDiff = emailDiff.map(emailToEdgeGroupedNodes, id => "sg" + id)
        const edgeGroupDiff = emailGroupDiff.map((_, id) => emailGroupToEdge(this.emailGroups[id]), id => "gs" + id)
        const edgeGroupNodeGroupDiff = emailGroupPersonGroupDiff.map((_, id) => emailGroupPersonGroupToEdge(this.peopleGroupEmailGroups[id]), id => "gg" + id)

        this.updateDataSets(
            (this.options.groupNodes) ? nodeGroupDiff : nodePeopleDiff, 
            (!this.options.groupNodes && !this.options.groupEdges) ? edgeEmailDiff : 
            (this.options.groupNodes && !this.options.groupEdges) ? edgeEmailGroupedNodesDiff :
            (!this.options.groupNodes && this.options.groupEdges) ? edgeGroupDiff :
            edgeGroupNodeGroupDiff
        )

        for (const change of emailGroupPersonGroupDiff.deletions) {
            delete this.peopleGroupEmailGroups[change.id]
        }
        for (const change of emailGroupDiff.deletions) {
            delete this.emailGroups[change.id]
        }
        for (const change of personGroupDiff.deletions) {
            delete this.personGroups[change.id]
        }

        // update selections

        for (const {id} of peopleDiff.deletions) {
            this.selectedPeople.delete(id)
        }
        for (const {id} of emailDiff.deletions) {
            this.selectedEmails.delete(id)
        }
    }
    private updateDataSets(nodes: DataSetDiff<vis.Node>, edges: DataSetDiff<vis.Edge>) {
        this.nodes.add(nodes.insertions.map(({value}) => value))
        this.edges.add(edges.insertions.map(({value}) => value))

        this.nodes.update(nodes.updates.map(({value}) => value))
        this.edges.update(edges.updates.map(({value}) => value))

        this.edges.remove(edges.deletions.map(({id}) => id))
        this.nodes.remove(nodes.deletions.map(({id}) => id))
    }

    private processSelection(e: any): [string[], string[]] {
        let people: string[] = []

        for (const id of e.nodes) {
            if (id[0] === 's') {
                people.push(id.slice(1))
            } else if (id[0] === 'g') {
                for (const id2 in this.personGroups[id.slice(1)]) {
                    people.push(id2)
                }
            }
        }

        let emails: string[] = []

        for (const id of e.edges) {
            if (id[0] === 's') {
                emails.push(id.slice(2))
            } else if (id.slice(0,2) === 'gs') {
                for (const id2 in this.emailGroups[id.slice(2)]) {
                    emails.push(id2)
                }
            } else if (id.slice(0,2) === 'gg') {
                for (const id2 in this.peopleGroupEmailGroups[id.slice(2)]) {
                    emails.push(id2)
                }
            }
        }

        return pair(people, emails)
    }

    public getVisNodeSeletions(): Observable<[IDSetDiff, IDSetDiff]> {
        const selections = new Observable<[string[], string[]]>(sub => {
            this.visualisation.on("selectNode", e => {
                sub.next(this.processSelection(e))
            })
            this.visualisation.on("deselectNode", e => {
                sub.next(this.processSelection(e))
            })
            this.visualisation.on("selectEdge", e => {
                sub.next(this.processSelection(e))
            })    
            this.visualisation.on("deselectEdge", e => {
                sub.next(this.processSelection(e))
            })
        }).pipe(
            map(([nodes, edges]) => pair(arrayToObject(nodes, x => x), arrayToObject(edges, x => x))),
            diffStream(pair({}, {}), pairMap2(diffPureDataSet, diffPureDataSet)),
            filter(([people, emails]) => !people.isEmpty || !emails.isEmpty),
            share()
        )

        // selections.subscribe(([people, emails]) => {
        //     // console.log(emails.insertions)
        //     people.applySet(this.selectedPeople)
        //     emails.applySet(this.selectedEmails)
        // })

        return selections
    }
}


function getPersonVisId(person: Person, groupPeople: boolean): string {
    if (!groupPeople) {
        return "s" + person.id
    } else {
        return "g" + person.title
    }
}

function getEmailVisId(email: Email, groupPeople: boolean, groupEmails: boolean): string {
    if (!groupPeople && !groupEmails) {
        return "ss" + email.id
    } else if (!groupPeople && groupEmails) {
        return `gs${email.fromId},${email.toId}`
    } else if (groupPeople && !groupEmails) {
        return "sg" + email.id
    } else {
        return `gg${email.fromJobtitle},${email.toJobtitle}`
    }
}


export function createLegend(container: HTMLElement) {
    for (let title in titleColors) {
        span({}, [
            span({style: `background-color: ${titleColors[title].color.background};`, class: 'color-dot'}), 
            text(title)
        ], container)
    }
}


function personToNode(p: Person): vis.Node {
    return {
        id: getPersonVisId(p, false),
        title: `${p.emailAdress}, ${p.title}`,
        group: p.title,
        level: titleRanks[p.title],
    }
}
function personGroupToNode(id: ID, g: PersonGroup): vis.Node {

    const personList = Object.values(g)

    return {
        id: getPersonVisId(personList[0], true),
        title: multipleString(personList.length, personList[0].title, personList[0].title === "CEO"),
        group: personList[0].title
    }
}

function emailTitle(e: Email): string {
    return `${e.messageType}, ${e.date}, Sentiment: ${Math.round(e.sentiment * 1000)/10}%`
}
function emailColor(e: Email): {color: string, inherit?: boolean} {
    return {color: hueGradient(Math.tanh(e.sentiment * edgeColorContrast) / 2 + 0.5), inherit: false}
}

function emailToEdge(e: Email): vis.Edge {
    return {
        id: getEmailVisId(e, /* groupNodes: */ false, /* groupEdges: */ false),
        from: "s"+e.fromId,
        to: "s"+e.toId,
        title: emailTitle(e),
        color: emailColor(e),
    }
}
function emailToEdgeGroupedNodes(e: Email): vis.Edge {
    return {
        id: getEmailVisId(e, /* groupNodes: */ true, /* groupEdges: */ false),
        from: "g"+e.fromJobtitle,
        to: "g"+e.toJobtitle,
        title: emailTitle(e),
        color: emailColor(e),
    }
}



function emailGroupToEdge(g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i,j) => i + j) / emailList.length

    return {
        id: getEmailVisId(someEmail, /* groupNodes: */ false, /* groupEdges: */ true),
        from: "s"+someEmail.fromId,
        to: "s"+someEmail.toId,
        width: Math.log(emailList.length) * 2,
        title: `${multipleString(toCount, 'Direct')}, ${multipleString(ccCount, 'CC', true)}, Av Sentiment: ${Math.round(avSent * 1000)/10}%`,
        color: {color: hueGradient(Math.tanh(avSent * edgeColorContrast) / 2 + 0.5), inherit: false},
    }
}

function emailGroupPersonGroupToEdge(g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i,j) => i + j) / emailList.length

    return {
        id: getEmailVisId(someEmail, /* groupNodes: */ true, /* groupEdges: */ true),
        from: "g"+someEmail.fromJobtitle,
        to: "g"+someEmail.toJobtitle,
        width: Math.log(emailList.length) * 2,
        title: `${multipleString(toCount, 'Direct')}, ${multipleString(ccCount, 'CC', true)}, Av Sentiment: ${Math.round(avSent * 1000)/10}%`,
        color: {color: hueGradient(Math.tanh(avSent * edgeColorContrast) / 2 + 0.5), inherit: false},
    }
}

function lerpMod(min: number, max: number, mod: number, val: number) {
    if (min < max) return (max - min) * val + min
    else return ((mod - min + max) * val + min) % mod
}

function hueGradient(v: number) {
    const min = 226
    const max = 33

    const angle = lerpMod(min, max, 360, v)

    return `hsl(${angle},80%,50%)`
}


function multipleString(amount: number, thing: string, apostrophe: boolean = false): string {
    return amount + " " + thing + ((apostrophe && amount > 1) ? "'" : "") + (amount > 1 ? "s" : "")
}
