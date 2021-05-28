import { identity, Observable } from 'rxjs';
import { groupBy, map, max, share } from 'rxjs/operators';
import * as vis from 'vis';
import { Email, Person, } from '../../data';
import { diffStream } from '../../pipeline/basics';
import { DataSet, diffPureDataSet, DataSetDiff, NumberSetDiff } from '../../pipeline/dynamicDataSet';
import { groupDiffBy } from '../../pipeline/groupDiffBy';
import { arrayToObject, pair, pairMap2, span, text, tripple } from '../../utils';
import { edgeColorContrast, nodeSize, titleColors, titleRanks } from '../constants';
import { defaultNodeLinkOptions, initialVisOptions, NodeLinkOptions, nodeLinkOptionsToVisOptions } from './options';




export type EmailGroup = DataSet<Email>


/**
 * Create a new vis.Network instance and bind it to 'container'
 */
export async function visualizeNodeLinkDiagram(
    container: HTMLElement, 
    data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>, 
    options: Observable<NodeLinkOptions>, 
    maxNodes: number
): Promise<vis.Network> {
    return new NodeLinkVisualisation(container, data, options, maxNodes).visualisation
}

class NodeLinkVisualisation {

    private options: NodeLinkOptions = defaultNodeLinkOptions

    private nodes: vis.DataSet<vis.Node> = new vis.DataSet()
    private edges: vis.DataSet<vis.Edge> = new vis.DataSet()

    public readonly visualisation: vis.Network

    private people: DataSet<Person> = {}
    private emails: DataSet<Email> = {}
    private emailGroups: DataSet<EmailGroup> = {}

    private maxNodes: number

    constructor(
        container: HTMLElement,
        data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>, 
        options: Observable<NodeLinkOptions>, 
        maxNodes: number,
    ) {
        this.maxNodes = maxNodes

        this.visualisation = new vis.Network(container, { nodes: this.nodes, edges: this.edges }, initialVisOptions)

        options.subscribe(this.onOptions.bind(this))
        data.pipe(
            groupDiffBy(
                ([_, emailDiff]) => emailDiff, 
                email => email.fromId + "," + email.toId, 
                ([peopleDiff, emailDiff], emailGroupDiff) => tripple(peopleDiff, emailDiff, emailGroupDiff)
            )
        ).subscribe(this.onData.bind(this))
    }

    private nodeLocation(person: Person) {
        const circleLayoutRadius = this.maxNodes * (nodeSize * 2 + 2) / Math.PI / 2
        return {
            x: circleLayoutRadius * Math.cos(2 * Math.PI * person.id / this.maxNodes),
            y: circleLayoutRadius * Math.sin(2 * Math.PI * person.id / this.maxNodes),
        }
    }

    private onOptions(options: NodeLinkOptions) {

        const fullReset = 
            ('hierarchical' in options && this.options.hierarchical !== options.hierarchical)
            || ('groupEdges' in options)


        if (fullReset) {
            this.nodes.clear()
            this.edges.clear()
        }
        this.visualisation.setOptions(nodeLinkOptionsToVisOptions(Object.assign(this.options, options)))

        if (fullReset) {
            this.nodes.add(Object.values(this.people).map(person => Object.assign({}, personToNode(person), this.nodeLocation(person))))

            if (this.options.groupEdges) 
                this.edges.add(Object.entries(this.emailGroups).map(([id, val]) => emailGroupToEdge(id, val)))
            else
                this.edges.add(Object.values(this.emails).map(emailToEdge))
        }
    }
    private onData([peopleDiff, emailDiff, emailGroupDiff]: [DataSetDiff<Person>, DataSetDiff<Email>, DataSetDiff<DataSetDiff<Email>>]) {

        peopleDiff.apply(this.people)
        emailDiff.apply(this.emails)
        

        for (const change of emailGroupDiff.insertions) {
            this.emailGroups[change.id] = {}

            change.value.apply(this.emailGroups[change.id])
        }
        for (const change of emailGroupDiff.updates) {
            change.value.apply(this.emailGroups[change.id])
        }

        const nodeDiff = peopleDiff.map((person) => Object.assign({}, personToNode(person), this.nodeLocation(person)), identity)

        if (this.options.groupEdges) {
            this.updateDataSets(
                nodeDiff,
                emailGroupDiff.map((_, id) => emailGroupToEdge(id, this.emailGroups[id]), identity)
            )
        } else {
            this.updateDataSets(
                nodeDiff,
                emailDiff.map(emailToEdge, identity)
            )
        }

        for (const change of emailGroupDiff.deletions) {
            delete this.emailGroups[change.id]
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
}

/**
 * Takes a vis Network and returns an observable of node and edge selections respectively
 */
export function getVisNodeSeletions(visualisation: vis.Network): Observable<[NumberSetDiff, NumberSetDiff]> {
    return new Observable<[number[], number[]]>(sub => {
        visualisation.on("selectNode", e => {
            sub.next([e.edges, e.nodes])
        })
        visualisation.on("deselectNode", e => {
            sub.next([e.edges, e.nodes])
        })
        visualisation.on("selectEdge", e => {
            sub.next([e.edges, e.nodes])
        })    
        visualisation.on("deselectEdge", e => {
            sub.next([e.edges, e.nodes])
        })
    }).pipe(
        map(([nodes, edges]) => pair(arrayToObject(nodes, x => x), arrayToObject(edges, x => x))),
        diffStream(pair({}, {}), pairMap2(diffPureDataSet, diffPureDataSet)),
        share()
    )
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
        id: p.id,
        title: `${p.emailAdress}, ${p.title}`,
        group: p.title,
        level: titleRanks[p.title],
    }
}
function emailToEdge(e: Email): vis.Edge {
    return {
        id: e.id,
        from: e.fromId,
        to: e.toId,
        title: `${e.messageType}, ${e.date}, Sentiment: ${Math.round(e.sentiment * 1000)/10}%`,
        color: {color: hueGradient(Math.tanh(e.sentiment * edgeColorContrast) / 2 + 0.5), inherit: false}
    }
}
function emailGroupToEdge(id: string, g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i,j) => i + j) / emailList.length

    return {
        id: id,
        from: someEmail.fromId,
        to: someEmail.toId,
        width: Object.values(g).length / 2,
        title: `${multipleString(toCount, 'Direct')}, ${multipleString(ccCount, 'CC', true)}, Av Sentiment: ${Math.round(avSent * 1000)/10}%`,
        color: {color: hueGradient(Math.tanh(avSent * edgeColorContrast) / 2 + 0.5), inherit: false}
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
