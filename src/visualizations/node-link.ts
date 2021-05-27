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

    let visualisation = new vis.Network(container, { nodes: nodes, edges: edges }, initialVisOptions)

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


        edgeGrouping = options.groupEdges ?? edgeGrouping

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

    function nodeLocation(person: Person) {
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

const defaultGroupColors = [
    {border: "#2B7CE9", background: "#97C2FC", highlight: {border: "#2B7CE9", background: "#D2E5FF"}, hover: {border: "#2B7CE9", background: "#D2E5FF"}}, // 0: blue
    {border: "#FFA500", background: "#FFFF00", highlight: {border: "#FFA500", background: "#FFFFA3"}, hover: {border: "#FFA500", background: "#FFFFA3"}}, // 1: yellow
    {border: "#FA0A10", background: "#FB7E81", highlight: {border: "#FA0A10", background: "#FFAFB1"}, hover: {border: "#FA0A10", background: "#FFAFB1"}}, // 2: red
    {border: "#41A906", background: "#7BE141", highlight: {border: "#41A906", background: "#A1EC76"}, hover: {border: "#41A906", background: "#A1EC76"}}, // 3: green
    {border: "#E129F0", background: "#EB7DF4", highlight: {border: "#E129F0", background: "#F0B3F5"}, hover: {border: "#E129F0", background: "#F0B3F5"}}, // 4: magenta
    {border: "#7C29F0", background: "#AD85E4", highlight: {border: "#7C29F0", background: "#D3BDF0"}, hover: {border: "#7C29F0", background: "#D3BDF0"}}, // 5: purple
    {border: "#C37F00", background: "#FFA807", highlight: {border: "#C37F00", background: "#FFCA66"}, hover: {border: "#C37F00", background: "#FFCA66"}}, // 6: orange
    {border: "#4220FB", background: "#6E6EFD", highlight: {border: "#4220FB", background: "#9B9BFD"}, hover: {border: "#4220FB", background: "#9B9BFD"}}, // 7: darkblue
    {border: "#FD5A77", background: "#FFC0CB", highlight: {border: "#FD5A77", background: "#FFD1D9"}, hover: {border: "#FD5A77", background: "#FFD1D9"}}, // 8: pink
    {border: "#4AD63A", background: "#C2FABC", highlight: {border: "#4AD63A", background: "#E6FFE3"}, hover: {border: "#4AD63A", background: "#E6FFE3"}}, // 9: mint

    {border: "#990000", background: "#EE0000", highlight: {border: "#BB0000", background: "#FF3333"}, hover: {border: "#BB0000", background: "#FF3333"}}, // 10:bright red

    {border: "#FF6000", background: "#FF6000", highlight: {border: "#FF6000", background: "#FF6000"}, hover: {border: "#FF6000", background: "#FF6000"}}, // 12: real orange
    {border: "#97C2FC", background: "#2B7CE9", highlight: {border: "#D2E5FF", background: "#2B7CE9"}, hover: {border: "#D2E5FF", background: "#2B7CE9"}}, // 13: blue
    {border: "#399605", background: "#255C03", highlight: {border: "#399605", background: "#255C03"}, hover: {border: "#399605", background: "#255C03"}}, // 14: green
    {border: "#B70054", background: "#FF007E", highlight: {border: "#B70054", background: "#FF007E"}, hover: {border: "#B70054", background: "#FF007E"}}, // 15: magenta
    {border: "#AD85E4", background: "#7C29F0", highlight: {border: "#D3BDF0", background: "#7C29F0"}, hover: {border: "#D3BDF0", background: "#7C29F0"}}, // 16: purple
    {border: "#4557FA", background: "#000EA1", highlight: {border: "#6E6EFD", background: "#000EA1"}, hover: {border: "#6E6EFD", background: "#000EA1"}}, // 17: darkblue
    {border: "#FFC0CB", background: "#FD5A77", highlight: {border: "#FFD1D9", background: "#FD5A77"}, hover: {border: "#FFD1D9", background: "#FD5A77"}}, // 18: pink
    {border: "#C2FABC", background: "#74D66A", highlight: {border: "#E6FFE3", background: "#74D66A"}, hover: {border: "#E6FFE3", background: "#74D66A"}}, // 19: mint

    {border: "#EE0000", background: "#990000", highlight: {border: "#FF3333", background: "#BB0000"}, hover: {border: "#FF3333", background: "#BB0000"}} // 20:bright red
]

export const titleColors: {[title: string]: {color: {border: string, background: string, highlight: {border: string, background: string}, hover: {border: string, background: string}}}} = {
    "CEO": {color: defaultGroupColors[4]},
    "President": {color: defaultGroupColors[1]},
    "Vice President": {color: defaultGroupColors[2]},
    "Managing Director": {color: defaultGroupColors[3]},
    "Director": {color: defaultGroupColors[7]},
    "Manager": {color: defaultGroupColors[5]},
    "Trader": {color: defaultGroupColors[6]},
    "Employee": {color: defaultGroupColors[0]},
    "In House Lawyer": {color: defaultGroupColors[8]},
    "Unknown": {color: defaultGroupColors[9]},
}


const defaultNodeLinkOptions: NodeLinkOptions = {
    physics: true,
    hierarchical: false
}

const initialVisOptions = {
    nodes: {
        shape: 'dot',
        size: nodeSize,
    },
    edges: {
        arrows: "to"
    },
    layout: {
        hierarchical: {
            enabled: defaultNodeLinkOptions.hierarchical,
            nodeSpacing: 20,
            treeSpacing: 10,
        },
        // improvedLayout: false
    },
    physics: {
        enabled: defaultNodeLinkOptions.physics,
        barnesHut: {
            centralGravity: 1
        },
        // stabilizations:false
    },
    interaction: { multiselect: true},
    groups: titleColors
}

export function nodeLinkOptionsToVisOptions(config: NodeLinkOptions): vis.Options {

    let visOptions = {}

    return {
        layout: {
            hierarchical: {
                enabled: config.hierarchical,

            }

        },
        physics: {
            enabled: config.physics,
        },
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