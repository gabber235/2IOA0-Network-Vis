import { Observable } from 'rxjs';
import { groupBy, map, share } from 'rxjs/operators';
import * as vis from 'vis';
import { Email, Person, } from '../data';
import { diffStream } from '../pipeline/basics';
import { DataSet, diffPureDataSet, DataSetDiff, NumberSetDiff } from '../pipeline/dynamicDataSet';
import { groupDiffBy } from '../pipeline/groupDiffBy';
import { arrayToObject, pair, pairMap2, tripple } from '../utils';

export type NodeLinkOptions = {
    hierarchical?: boolean,
    physics?: boolean,
    groupEdges?: boolean,
}

const nodeSize = 10


type EmailGroup = DataSet<Email>

const edgeColorContrast = 20

/**
 * Create a new vis.Network instance and bind it to 'container'
 */
export async function visualizeNodeLinkDiagram(
    container: HTMLElement, 
    data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>, 
    options: Observable<NodeLinkOptions>, 
    maxNodes: number
): Promise<vis.Network> {

    const people: DataSet<Person> = {}
    const emails: DataSet<Email> = {}
    const emailGroups: DataSet<EmailGroup> = {}

    const circleLayoutRadius = maxNodes * (nodeSize * 2 + 2) / Math.PI / 2

    const nodes = new vis.DataSet()
    const edges = new vis.DataSet<vis.Edge>()

    const prevOptions = defaultNodeLinkOptions

    let visualisation = new vis.Network(container, { nodes: nodes, edges: edges }, {})

    let edgeGrouping = true


    options.subscribe({next (options) {

        const fullReset = 
            ('hierarchical' in options && prevOptions.hierarchical !== options.hierarchical)
            || ('groupEdges' in options)


        if (fullReset) {
            nodes.clear()
            edges.clear()
        }

        visualisation.setOptions(nodeLinkOptionsToVisOptions(Object.assign(prevOptions, options)))

        edgeGrouping = options.groupEdges

        if (fullReset) {
            nodes.add(Object.values(people).map(person => Object.assign({}, personToNode(person), nodeLocation(person))))

            if (edgeGrouping) 
                edges.add(Object.entries(emailGroups).map(([id, val]) => emailGroupToEdge(id, val)))
            else
                edges.add(Object.values(emails).map(emailToEdge))
        }
    }})
    data.pipe(
        groupDiffBy(([_, emailDiff]) => emailDiff, email => email.fromId + "," + email.toId, ([peopleDiff, emailDiff], emailGroupDiff) => tripple(peopleDiff, emailDiff, emailGroupDiff))
    ).subscribe(([peopleDiff, emailDiff, emailGroupDiff]) => {

        peopleDiff.apply(people)
        emailDiff.apply(emails)
        

        for (const change of emailGroupDiff.insertions) {
            emailGroups[change.id] = {}

            change.value.apply(emailGroups[change.id])
        }
        for (const change of emailGroupDiff.updates) {
            change.value.apply(emailGroups[change.id])
        }

        if (edgeGrouping) {
            nodes.add(peopleDiff.insertions.map(({value}) => Object.assign({}, personToNode(value), nodeLocation(value))))
            edges.add(emailGroupDiff.insertions.map(({id}) => emailGroupToEdge(id, emailGroups[id])))

            nodes.update(peopleDiff.updates.map(({value}) => personToNode(value)))
            edges.update(emailGroupDiff.updates.map(({id}) => emailGroupToEdge(id, emailGroups[id])))

            edges.remove(emailGroupDiff.deletions.map(({id}) => id))
            nodes.remove(peopleDiff.deletions.map(({id}) => id))
        } else {
            nodes.add(peopleDiff.insertions.map(({value}) => Object.assign({}, personToNode(value), nodeLocation(value))))
            edges.add(emailDiff.insertions.map(({value}) => emailToEdge(value)))

            nodes.update(peopleDiff.updates.map(({value}) => personToNode(value)))
            edges.update(emailDiff.updates.map(({value}) => emailToEdge(value)))

            edges.remove(emailDiff.deletions.map(({id}) => id))
            nodes.remove(peopleDiff.deletions.map(({id}) => id))
        }

        for (const change of emailGroupDiff.deletions) {
            delete emailGroups[change.id]
        }
    })

    function nodeLocation(person: Person): {x:number,y:number} {
        return {
            x: circleLayoutRadius * Math.cos(2 * Math.PI * person.id / maxNodes),
            y: circleLayoutRadius * Math.sin(2 * Math.PI * person.id / maxNodes),
        }
    }

    return visualisation
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


const defaultNodeLinkOptions: NodeLinkOptions = {
    physics: true,
    hierarchical: false
}

export function nodeLinkOptionsToVisOptions(config: NodeLinkOptions): vis.Options {

    const options = Object.assign({}, defaultNodeLinkOptions, config)

    return {
        nodes: {
            shape: 'dot',
            size: nodeSize,
            
        },
        edges: {
            arrows: "to"
        },
        layout: {
            hierarchical: {
                enabled: options.hierarchical,
                nodeSpacing: 20,
                treeSpacing: 20,
            },
            // improvedLayout: false
        },
        physics: {
            enabled: options.physics,
            barnesHut: {
                centralGravity: 1
            },
            // stabilizations:false
        },
        interaction: { multiselect: true},
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

    console.log(angle, v)

    return `hsl(${angle},80%,50%)`
}


function multipleString(amount: number, thing: string, apostrophe: boolean = false): string {
    return amount + " " + thing + ((apostrophe && amount > 1) ? "'" : "") + (amount > 1 ? "s" : "")
}

const titleRanks = {
    "CEO": 0,
    "President": 1,
    "Vice President": 2,
    "Managing Director": 3,
    "Director": 4,
    "Manager": 5,
    "Trader": 6,
    "Employee": 7,
    "In House Lawyer": 8,
    "Unknown": 9,
}