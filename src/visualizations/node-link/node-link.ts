import { Observable } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';
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

    private people: DataSet<Person> = {}
    private emails: DataSet<Email> = {}
    private personGroupsByTitle: DataSet<PersonGroup> = {}
    private emailGroupsByPerson: DataSet<EmailGroup> = {}
    private emailGroupsByTitle: DataSet<EmailGroup> = {}

    private selectedPeople = new Set<ID>()
    private selectedEmails = new Set<ID>()

    private maxNodes: number

    public readonly visualisation: vis.Network

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
                ([peopleDiff]) => peopleDiff,
                person => person.title,
                ([peopleDiff, emailDiff], personGroupDiff) => tripple(peopleDiff, emailDiff, personGroupDiff)
            ),
            groupDiffBy(
                ([_, emailDiff]) => emailDiff,
                email => `${email.fromId},${email.toId}`,
                ([peopleDiff, emailDiff, personGroupDiff], emailGroupDiff) => tuple4(peopleDiff, emailDiff, personGroupDiff, emailGroupDiff)
            ),
            groupDiffBy(
                ([_, emailDiff]) => emailDiff,
                email => `${email.fromJobtitle},${email.toJobtitle}`,
                ([peopleDiff, emailDiff, personGroupDiff, emailGroupByPersonDiff], emailGroupByTitleDiff) => tuple5(peopleDiff, emailDiff, personGroupDiff, emailGroupByPersonDiff, emailGroupByTitleDiff)
            )
        ).subscribe(this.onData.bind(this))

        selections.subscribe(this.onSelection.bind(this))
    }

    private getInitialNodeLocation(person: Person) {
        const circleLayoutRadius = this.maxNodes * (nodeSize * 2 + 2) / Math.PI / 2
        return {
            x: circleLayoutRadius * Math.cos(2 * Math.PI * person.id / this.maxNodes),
            y: circleLayoutRadius * Math.sin(2 * Math.PI * person.id / this.maxNodes),
        }
    }

    private onSelection([personDiff, emailDiff]: [IDSetDiff, IDSetDiff]) {

        console.log(emailDiff);

        personDiff.applySet(this.selectedPeople)
        emailDiff.applySet(this.selectedEmails)

        this.updateSelection()

    }

    private updateSelection() {
        this.visualisation.setSelection({
            nodes: [...this.selectedPeople].map(i => getPersonVisId(this.people[i], this.options.groupNodes)),
            edges: [...this.selectedEmails].map(i => getEmailVisId(this.emails[i], this.options.groupNodes, this.options.groupEdges))
        }, {
            highlightEdges: false    
        })
    }


    private onOptions(options: NodeLinkOptions) {

        const shouldResetNodes =
            ('hierarchical' in options && this.options.hierarchical !== options.hierarchical)
            || ('groupNodes' in options)

        const shouldResetEdges =
            ('hierarchical' in options && this.options.hierarchical !== options.hierarchical)
            || ('groupNodes' in options)
            || ('groupEdges' in options)

        if (shouldResetEdges) {
            this.edges.clear()
        }
        if (shouldResetNodes) {
            this.nodes.clear()
        }

        this.visualisation.setOptions(nodeLinkOptionsToVisOptions(Object.assign(this.options, options)))

        if (shouldResetNodes) {
            if (this.options.groupNodes)
                this.nodes.add(Object.entries(this.personGroupsByTitle).map(([id]) => personGroupToNode(id, this.personGroupsByTitle[id])))
            else
                this.nodes.add(Object.values(this.people).map(person => Object.assign({}, personToNode(person), this.getInitialNodeLocation(person))))
        }

        if (shouldResetEdges) {
            if (!this.options.groupNodes && !this.options.groupEdges) {
                this.edges.add(Object.values(this.emails).map(emailToEdge))
            }
            else if (this.options.groupNodes && !this.options.groupEdges) {
                this.edges.add(Object.values(this.emails).map(emailToEdgeGroupedNodes))
            } else if (!this.options.groupNodes && this.options.groupEdges) {
                this.edges.add(Object.entries(this.emailGroupsByPerson).map(([id, val]) => emailGroupByPersonToEdge(val)))
            } else {
                this.edges.add(Object.entries(this.emailGroupsByTitle).map(([id, val]) => emailGroupByTitleToEdge(val)))
            }
        }
        this.updateSelection()
    }
    private onData(
        [peopleDiff, emailDiff, personGroupByTitleDiff, emailGroupByPersonDiff, emailGroupByTitleDiff]:
            [DataSetDiff<Person>, DataSetDiff<Email>, DataSetDiff<DataSetDiff<Person>>, DataSetDiff<DataSetDiff<Email>>, DataSetDiff<DataSetDiff<Email>>]
    ) {
        // update hashmaps
        peopleDiff.apply(this.people)
        emailDiff.apply(this.emails)

        DataSetDiff.applyGroupInsertions(personGroupByTitleDiff, this.personGroupsByTitle)
        DataSetDiff.applyGroupUpdates(personGroupByTitleDiff, this.personGroupsByTitle)

        DataSetDiff.applyGroupInsertions(emailGroupByPersonDiff, this.emailGroupsByPerson)
        DataSetDiff.applyGroupUpdates(emailGroupByPersonDiff, this.emailGroupsByPerson)

        DataSetDiff.applyGroupInsertions(emailGroupByTitleDiff, this.emailGroupsByTitle)
        DataSetDiff.applyGroupUpdates(emailGroupByTitleDiff, this.emailGroupsByTitle)

        // update vis datasets
        let nodeDiff
        if (!this.options.groupNodes) {
            nodeDiff = peopleDiff.map((person) => Object.assign({}, personToNode(person), this.getInitialNodeLocation(person)), id => "s" + id)
        } else {
            nodeDiff = personGroupByTitleDiff.map((_, id) => personGroupToNode(id, this.personGroupsByTitle[id]), id => "g" + id)
        }

        let edgeDiff
        if (!this.options.groupNodes && !this.options.groupEdges) {
            edgeDiff = emailDiff.map(emailToEdge, id => "ss" + id)

        } else if (!this.options.groupNodes && this.options.groupEdges) {
            edgeDiff = emailGroupByPersonDiff.map((_, id) => emailGroupByPersonToEdge(this.emailGroupsByPerson[id]), id => "gs" + id)

        } else if (this.options.groupNodes && !this.options.groupEdges) {
            edgeDiff = emailDiff.map(emailToEdgeGroupedNodes, id => "sg" + id)

        } else {
            edgeDiff = emailGroupByTitleDiff.map((_, id) => emailGroupByTitleToEdge(this.emailGroupsByTitle[id]), id => "gg" + id)
        }

        this.updateDataSets(
            nodeDiff,
            edgeDiff
        )

        // update hashmaps
        DataSetDiff.applyGroupDeletions(emailGroupByTitleDiff, this.emailGroupsByTitle)
        DataSetDiff.applyGroupDeletions(emailGroupByPersonDiff, this.emailGroupsByPerson)
        DataSetDiff.applyGroupDeletions(personGroupByTitleDiff, this.personGroupsByTitle)

        // update selections
        peopleDiff.applySetDeletions(this.selectedPeople)
        emailDiff.applySetDeletions(this.selectedEmails)
    }
    private updateDataSets(nodes: DataSetDiff<vis.Node>, edges: DataSetDiff<vis.Edge>) {
        this.nodes.add(nodes.insertions.map(({ value }) => value))
        this.edges.add(edges.insertions.map(({ value }) => value))

        this.nodes.update(nodes.updates.map(({ value }) => value))
        this.edges.update(edges.updates.map(({ value }) => value))

        this.edges.remove(edges.deletions.map(({ id }) => id))
        this.nodes.remove(nodes.deletions.map(({ id }) => id))
    }

    private datasetIdsFromSelectionEvent(e: any): [string[], string[]] {
        const people: string[] = []

        for (const id of e.nodes) {
            if (id[0] === 's') {
                people.push(id.slice(1))
            } else if (id[0] === 'g') {
                for (const id2 in this.personGroupsByTitle[id.slice(1)]) {
                    people.push(id2)
                }
            }
        }

        console.log(111);

        const emails: string[] = []

        for (const id of e.edges) {
            if (id[0] === 's') {
                emails.push(id.slice(2))
            } else if (id.slice(0, 2) === 'gs') {
                for (const id2 in this.emailGroupsByPerson[id.slice(2)]) {
                    emails.push(id2)
                }
            } else if (id.slice(0, 2) === 'gg') {
                for (const id2 in this.emailGroupsByTitle[id.slice(2)]) {
                    emails.push(id2)
                }
            }
        }

        return pair(people, emails)
    }

    public getVisNodeSeletions(): Observable<[IDSetDiff, IDSetDiff]> {
        return new Observable<[string[], string[]]>(sub => {
            this.visualisation.on("selectNode", e => {
                sub.next(this.datasetIdsFromSelectionEvent(e))
            })
            this.visualisation.on("deselectNode", e => {
                sub.next(this.datasetIdsFromSelectionEvent(e))
            })
            this.visualisation.on("selectEdge", e => {
                sub.next(this.datasetIdsFromSelectionEvent(e))
            })
            this.visualisation.on("deselectEdge", e => {
                sub.next(this.datasetIdsFromSelectionEvent(e))
            })
        }).pipe(
            map(([nodes, edges]) => pair(arrayToObject(nodes, x => x), arrayToObject(edges, x => x))),
            diffStream(pair({}, {}), pairMap2(diffPureDataSet, diffPureDataSet)),
            filter(([people, emails]) => !people.isEmpty || !emails.isEmpty),
            share()
        )
    }
}


function getPersonVisId(person: Person, groupPeople: boolean): string {
    if (!groupPeople) {
        return `s${person.id}`
    } else {
        return "g" + person.title
    }
}

function getEmailVisId(email: Email, groupPeople: boolean, groupEmails: boolean): string {
    if (!groupPeople && !groupEmails) {
        return `ss${email.id}`
    } else if (!groupPeople && groupEmails) {
        return `gs${email.fromId},${email.toId}`
    } else if (groupPeople && !groupEmails) {
        return `sg${email.id}`
    } else {
        return `gg${email.fromJobtitle},${email.toJobtitle}`
    }
}


export function createLegend(container: HTMLElement) {
    for (const title in titleColors) {
        span({}, [
            span({ style: `background-color: ${titleColors[title].color.background};`, class: 'color-dot' }),
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
        title: nounMultiple(personList.length, personList[0].title, personList[0].title === "CEO"),
        group: personList[0].title
    }
}

function emailTitle(e: Email): string {
    return `${e.messageType}, ${e.date}, Sentiment: ${Math.round(e.sentiment * 1000) / 10}%`
}

function emailToEdge(e: Email): vis.Edge {
    return {
        id: getEmailVisId(e, /* groupNodes: */ false, /* groupEdges: */ false),
        from: `s${e.fromId}`,
        to: `s${e.toId}`,
        title: emailTitle(e),
        color: edgeColor(e.sentiment),
    }
}
function emailToEdgeGroupedNodes(e: Email): vis.Edge {
    return {
        id: getEmailVisId(e, /* groupNodes: */ true, /* groupEdges: */ false),
        from: `g${e.fromJobtitle}`,
        to: `g${e.toJobtitle}`,
        title: emailTitle(e),
        color: edgeColor(e.sentiment),
    }
}



function emailGroupByPersonToEdge(g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i, j) => i + j) / emailList.length

    return {
        id: getEmailVisId(someEmail, /* groupNodes: */ false, /* groupEdges: */ true),
        from: `s${someEmail.fromId}`,
        to: `s${someEmail.toId}`,
        width: Math.log(emailList.length) * 2,
        title: `${nounMultiple(toCount, 'Direct')}, ${nounMultiple(ccCount, 'CC', true)}, Av Sentiment: ${Math.round(avSent * 1000) / 10}%`,
        color: edgeColor(avSent),
    }
}

function emailGroupByTitleToEdge(g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i, j) => i + j) / emailList.length

    return {
        id: getEmailVisId(someEmail, /* groupNodes: */ true, /* groupEdges: */ true),
        from: `g${someEmail.fromJobtitle}`,
        to: `g${someEmail.toJobtitle}`,
        width: Math.log(emailList.length) * 2,
        title: `${nounMultiple(toCount, 'Direct')}, ${nounMultiple(ccCount, 'CC', true)}, Av Sentiment: ${Math.round(avSent * 1000) / 10}%`,
        color: edgeColor(avSent),
    }
}

function edgeColor(sentiment: number): any {
    const hue = Math.tanh(sentiment * edgeColorContrast) / 2 + 0.5
    return {
        color:     hueGradient(hue, 1, 0.5, 0.1), 
        hover:     hueGradient(hue, 1, 0.5, 0.5), 
        highlight: hueGradient(hue, 1, 0.5, 1), 
        inherit: false
    }
}

function lerpMod(min: number, max: number, mod: number, val: number) {
    if (min < max) return (max - min) * val + min
    else return ((mod - min + max) * val + min) % mod
}

function hueGradient(v: number, s: number, l: number, a: number) {
    const min = 226
    const max = 33

    const angle = lerpMod(min, max, 360, v)

    return `hsla(${angle},${s*100}%,${l*100}%,${a})`
}


function nounMultiple(amount: number, noun: string, apostrophe: boolean = false): string {
    return `${amount} ${noun}${(apostrophe && amount > 1) ? "'" : ""}${amount > 1 ? "s" : ""}`
}
