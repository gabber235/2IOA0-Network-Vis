import { Title } from "../../data"

export type Node = {
    name: string,
    id: number,
    group: Title,  // used for titles in our dataset
    index?: number, // used in adjacency matrix
    count?: number, // used in adjacency matrix
    sentiment?: number, // total sentiment
}

export type Edge = {
    source: number,
    target: number,
    emailCount: number,
    sentiment: number,
    selected: boolean,
}