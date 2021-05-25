import { Observable } from "rxjs";
import { Email, Person } from "../data";
import { MapDiff } from "../pipeline/dynamicDataSet";

export interface Visualization {

    visualize(data: Observable<[MapDiff<Person>, MapDiff<Email>]>): Promise<void>

}