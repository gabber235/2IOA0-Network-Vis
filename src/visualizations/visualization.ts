import { Correspondants, Email } from "../data";

export abstract class Visualization {

    abstract visualize(emails: Email[], correspondants: Correspondants): Promise<void>

}