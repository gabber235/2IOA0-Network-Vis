import { Title } from "../../data"

export type Node = {
    name: string,
    personId: number,
    jobTitle: Title,  // used for titles in our dataset
    matrixIndex?: number, // used in adjacency matrix
    emailCount?: number, // used in adjacency matrix
    totalSentiment?: number, // total sentiment
}

export type Edge = {
    sourceMatrixIndex: number,
    targetMatrixIndex: number,
    emailCount: number,
    sentiment: number,
    selected: boolean,
}

export type Cell = {
    unsortedPositionX: number,
    unsortedPositionY: number,
    emailCount: number,
    selected?: boolean,
    from: Node,
    to: Node,
    totalSentiment: number,
}
