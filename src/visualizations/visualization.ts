import { Observable } from "rxjs";
import { Email, Person } from "../data";
import { DataSetDiff } from "../pipeline/dynamicDataSet";

export interface Visualization {

    visualize(data: Observable<[DataSetDiff<Person>, DataSetDiff<Email>]>): Promise<void>

}