import { identity, Observable } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';
import * as vis from 'vis';
import { Email, Person, } from '../../data';
import { diffStream } from '../../pipeline/basics';
import { DataSet, diffPureDataSet, DataSetDiff, IDSetDiff, ID } from '../../pipeline/dynamicDataSet';
import { groupDiffBy } from '../../pipeline/groupDiffBy';
import { arrayToObject, hueGradient, nounMultiple, pair, pairMap2, roundTo, span, text, tripple, tuple4, tuple5 } from '../../utils';
import { edgeColorContrast, nodeSize, titleColors, titleRanks } from '../constants';
import { defaultNodeLinkOptions, initialVisOptions, NodeLinkOptions, nodeLinkOptionsToVisOptions } from './options';



export type PersonGroup = DataSet<Person>
export type EmailGroup = DataSet<Email>

/**
 * This class listens to streams of data, selections and settings and maintains a vis Network object to visualise this data
 */
export class NodeLinkVisualisation {
    /**
     * The current options at a given time
     */
    private options: NodeLinkOptions = defaultNodeLinkOptions

    // These are the vis datesets used in the vis Network object
    private nodes: vis.DataSet<vis.Node> = new vis.DataSet()
    private edges: vis.DataSet<vis.Edge> = new vis.DataSet()

    /**
     * This object is responsible for drawing the network on screen
     */
    public readonly visualisation: vis.Network

    /**
     * A dataset of all of the correspondats currently present  
     */
    private people: DataSet<Person> = {}
    /**
     * A dataset of all of the emails currently present  
     */
    private emails: DataSet<Email> = {}
    /**
     * The current correspondats grouped by their job titles
     */
    private personGroupsByTitle: DataSet<PersonGroup> = {}
    /**
     * The current emails grouped by their correspondants
     */
    private emailGroupsByPerson: DataSet<EmailGroup> = {}
    /**
     * The current emails grouped by their correspondant's job titles
     */
    private emailGroupsByTitle: DataSet<EmailGroup> = {}

    // These sets represent the people and emails that are currently selected
    private selectedPeople = new Set<ID>()
    private selectedEmails = new Set<ID>()


    // TODO: Remove this magic number
    /**
     * Represent the maximum expected number of people
     */
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

        // We zoom out a bit so the entire graph fits properly on screen
        this.visualisation.moveTo({scale: 0.4})

        // We subscribe to the incomming data
        options.subscribe(this.onOptions.bind(this))
        selections.subscribe(this.onSelection.bind(this))
        data.pipe(
            groupDiffBy( // Here we generate diffs for the groups of correspondats
                ([peopleDiff]) => peopleDiff,
                person => person.title,
                ([peopleDiff, emailDiff], personGroupDiff) => tripple(peopleDiff, emailDiff, personGroupDiff)
            ),
            groupDiffBy( // Here we generate diffs for the groups of emails, grouped by their correspondants
                ([_, emailDiff]) => emailDiff,
                email => `${email.fromId},${email.toId}`,
                ([peopleDiff, emailDiff, personGroupDiff], emailGroupDiff) => tuple4(peopleDiff, emailDiff, personGroupDiff, emailGroupDiff)
            ),
            groupDiffBy( // Here we generate diffs for the groups of emails, grouped by their correspondats' job titles
                ([_, emailDiff]) => emailDiff,
                email => `${email.fromJobtitle},${email.toJobtitle}`,
                ([peopleDiff, emailDiff, personGroupDiff, emailGroupByPersonDiff], emailGroupByTitleDiff) => tuple5(peopleDiff, emailDiff, personGroupDiff, emailGroupByPersonDiff, emailGroupByTitleDiff)
            )
        ).subscribe(this.onData.bind(this))
    }

    /**
     * This method returns a stream representing sets of the selected people and the selected emails
     */
    public getVisSelections(): Observable<[IDSetDiff, IDSetDiff]> {
        return new Observable<[string[], string[]]>(sub => {
            // We listen to selection events from the vis network.
            // Then convert the vis id's to regular id's.
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
            // First we convert the lists of id's to datasets
            map(([nodes, edges]) => pair(arrayToObject(nodes, identity), arrayToObject(edges, identity))),
            // We diff the datasets
            diffStream(pair({}, {}), pairMap2(diffPureDataSet, diffPureDataSet)),
            // And we remove empty diffs
            filter(([people, emails]) => !people.isEmpty || !emails.isEmpty),
            share()
        )
    }
    /**
     * Here we convert a vis selection event to lists of id's of the selected people and emails
     */
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

    /**
     * This method handles the incomming data diffs
     */
    private onData(
        [peopleDiff, emailDiff, personGroupByTitleDiff, emailGroupByPersonDiff, emailGroupByTitleDiff]:
            [DataSetDiff<Person>, DataSetDiff<Email>, DataSetDiff<DataSetDiff<Person>>, DataSetDiff<DataSetDiff<Email>>, DataSetDiff<DataSetDiff<Email>>]
    ) {
        // Update the datasets
        peopleDiff.apply(this.people)
        emailDiff.apply(this.emails)

        // Update the datasets of groups
        // We have to handle insertions and updates first, deletions will need to wait
        DataSetDiff.applyGroupInsertions(personGroupByTitleDiff, this.personGroupsByTitle)
        DataSetDiff.applyGroupUpdates(personGroupByTitleDiff, this.personGroupsByTitle)

        DataSetDiff.applyGroupInsertions(emailGroupByPersonDiff, this.emailGroupsByPerson)
        DataSetDiff.applyGroupUpdates(emailGroupByPersonDiff, this.emailGroupsByPerson)

        DataSetDiff.applyGroupInsertions(emailGroupByTitleDiff, this.emailGroupsByTitle)
        DataSetDiff.applyGroupUpdates(emailGroupByTitleDiff, this.emailGroupsByTitle)

        // Update vis datasets
        // To do this we need to first convert the correspondants, emails and their groups to vis nodes and vis edges
        let nodeDiff
        
        if (!this.options.groupNodes) {
            if (this.options.hierarchical)
                nodeDiff = peopleDiff.map((person) => personToNode(person), id => "s" + id)
            else {
                // Here we can't just use dataSetDiff.map because we need to set a nodes initial position only if it is newly inserted
                nodeDiff = new DataSetDiff(
                    peopleDiff.insertions.map(({id, value: person}) => ({id: "s" + id, value: Object.assign({}, personToNode(person), this.getInitialNodeLocation(person))})),
                    peopleDiff.updates.map(({id, value: person}) => ({id: "s" + id, value: personToNode(person)})),
                    peopleDiff.deletions.map(({id}) => ({id: "s" + id})),
                )
            }
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

        // Update datasets of groups
        // Now we can do the deletions
        DataSetDiff.applyGroupDeletions(emailGroupByTitleDiff, this.emailGroupsByTitle)
        DataSetDiff.applyGroupDeletions(emailGroupByPersonDiff, this.emailGroupsByPerson)
        DataSetDiff.applyGroupDeletions(personGroupByTitleDiff, this.personGroupsByTitle)

        // Whenever people or emails are removed we need to deselect them too
        peopleDiff.applySetDeletions(this.selectedPeople)
        emailDiff.applySetDeletions(this.selectedEmails)
    }

    /**
     * This method updates the datasets given a dataset diff of vis nodes and a dataset diff of vis edges
     */
    private updateDataSets(nodes: DataSetDiff<vis.Node>, edges: DataSetDiff<vis.Edge>) {
        this.nodes.add(nodes.insertions.map(({ value }) => value))
        this.edges.add(edges.insertions.map(({ value }) => value))

        this.nodes.update(nodes.updates.map(({ value }) => value))
        this.edges.update(edges.updates.map(({ value }) => value))

        this.edges.remove(edges.deletions.map(({ id }) => id))
        this.nodes.remove(nodes.deletions.map(({ id }) => id))
    }

    /**
     * We position the people in a large circle initially. 
     * This function computes those locations.
     */
    private getInitialNodeLocation(person: Person) {
        const circleLayoutRadius = this.maxNodes * (nodeSize * 2 + 2) / Math.PI / 2
        return {
            x: circleLayoutRadius * Math.cos(2 * Math.PI * person.id / this.maxNodes),
            y: circleLayoutRadius * Math.sin(2 * Math.PI * person.id / this.maxNodes),
        }
    }

    /**
     * This method handles changes to the settings
     */
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
                this.edges.add(Object.entries(this.emailGroupsByPerson).map(([_, val]) => emailGroupByPersonToEdge(val)))
            } else {
                this.edges.add(Object.entries(this.emailGroupsByTitle).map(([_, val]) => emailGroupByTitleToEdge(val)))
            }
        }
        this.updateSelection()
    }

    /**
     * This method handles incomming changes to the selections from the outside
     */
    private onSelection([personDiff, emailDiff]: [IDSetDiff, IDSetDiff]) {
        personDiff.applySet(this.selectedPeople)
        emailDiff.applySet(this.selectedEmails)

        this.updateSelection()

    }

    /**
     * This method transfers information from the selectedPeople and selectedEmails fields to the actual vis Network
     */
    private updateSelection() {
        this.visualisation.setSelection({
            nodes: [...this.selectedPeople].map(i => getPersonVisId(this.people[i].id, this.people[i].title, this.options.groupNodes)),
            edges: [...this.selectedEmails].map(i => getEmailVisId(this.emails[i], this.options.groupNodes, this.options.groupEdges))
        }, {
            highlightEdges: false    
        })
    }
}










/**
 * Creates the legend of title colors
 */
 export function createLegend(container: HTMLElement) {
    for (const title in titleColors) {
        span({}, [
            span({ style: `background-color: ${titleColors[title].color.background};`, class: 'color-dot' }),
            text(title)
        ], container)
    }
}









/**
 * We add some labels to the id's so we can tell if they are individual people or groups
 */
function getPersonVisId(id: number, title: string, groupPeople: boolean): string {
    if (!groupPeople) {
        return `s${id}`
    } else {
        return "g" + title
    }
}

/**
 * We add some labels to the id's so we can tell if they are individual emails or groups
 */
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

/**
 * Converts a person to a vis node
 */
function personToNode(p: Person): vis.Node {
    return {
        id: getPersonVisId(p.id, p.title, false),
        title: `${p.emailAdress}, ${p.title}`,
        group: p.title,
        level: titleRanks[p.title],
    }
}

/**
 * Converts a group of people to a vis node
 */
function personGroupToNode(id: ID, g: PersonGroup): vis.Node {

    const personList = Object.values(g)
    const somePerson = personList[0]

    return {
        id: getPersonVisId(somePerson.id, somePerson.title, true),
        title: nounMultiple(personList.length, somePerson.title, somePerson.title === "CEO"),
        group: somePerson.title
    }
}

/**
 * Converts an email to a vis edge
 */
function emailToEdge(e: Email): vis.Edge {
    return {
        id: getEmailVisId(e, /* groupNodes: */ false, /* groupEdges: */ false),
        from: getPersonVisId(e.fromId, e.fromJobtitle, /* groupNodes */ false),
        to:   getPersonVisId(e.toId,   e.toJobtitle,   /* groupNodes */ false),
        title: emailTitle(e),
        color: edgeColor(e.sentiment),
    }
}

/**
 * Converts an email to a vis edge in case the nodes a grouped by title
 */
function emailToEdgeGroupedNodes(e: Email): vis.Edge {
    return {
        id: getEmailVisId(e, /* groupNodes: */ true, /* groupEdges: */ false),
        from: getPersonVisId(e.fromId, e.fromJobtitle, /* groupNodes */ true),
        to:   getPersonVisId(e.toId,   e.toJobtitle,   /* groupNodes */ true),
        title: emailTitle(e),
        color: edgeColor(e.sentiment),
    }
}

/**
 * Converts an email group which is grouped by their correspondants to a vis edge
 */
function emailGroupByPersonToEdge(g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i, j) => i + j) / emailList.length

    return {
        id: getEmailVisId(someEmail, /* groupNodes: */ false, /* groupEdges: */ true),
        from: getPersonVisId(someEmail.fromId, someEmail.fromJobtitle, /* groupNodes */ false),
        to:   getPersonVisId(someEmail.toId,   someEmail.toJobtitle,   /* groupNodes */ false),
        width: Math.log(emailList.length) * 2,
        title: emailGroupTitle(toCount, ccCount, avSent),
        color: edgeColor(avSent),
    }
}

/**
 * Converts an email group which is grouped by job title to a vis edge
 */
function emailGroupByTitleToEdge(g: EmailGroup): vis.Edge {
    const emailList = Object.values(g)
    const someEmail = emailList[0]
    const ccCount = emailList.filter(e => e.messageType === 'CC').length
    const toCount = emailList.filter(e => e.messageType === 'TO').length
    const avSent = emailList.map(e => e.sentiment).reduce((i, j) => i + j) / emailList.length

    return {
        id: getEmailVisId(someEmail, /* groupNodes: */ true, /* groupEdges: */ true),
        from: getPersonVisId(someEmail.fromId, someEmail.fromJobtitle, /* groupNodes */ true),
        to:   getPersonVisId(someEmail.toId,   someEmail.toJobtitle,   /* groupNodes */ true),
        width: Math.log(emailList.length) * 2,
        title: emailGroupTitle(toCount, ccCount, avSent),
        color: edgeColor(avSent),
    }
}

function emailTitle(e: Email): string {
    return `${e.messageType}, ${e.date}, Sentiment: ${Math.round(e.sentiment * 1000) / 10}%`
}

function emailGroupTitle(toCount: number, ccCount: number, avSent: number): string {
    return `${nounMultiple(toCount, 'Direct')}, ${nounMultiple(ccCount, 'CC', true)}, Av Sentiment: ${roundTo(avSent * 100, 2)}%`
}

function edgeColor(sentiment: number): any {
    // Most sentiment values are very close to 0 which makes it hard to tell them apart.
    // For this reason we raise the contrast a bit using the hyperbolic tangent function.
    const hue = Math.tanh(sentiment * edgeColorContrast) / 2 + 0.5

    return {
        color:     hueGradient(hue, 1, 0.5, 0.2), 
        hover:     hueGradient(hue, 1, 0.5, 0.5), 
        highlight: hueGradient(hue, 1, 0.5, 1  ), 
        inherit: false
    }
}
