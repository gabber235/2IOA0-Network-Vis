import { Correspondants, Email } from "../data";

export interface Visualization {

    visualize(emails: Email[], correspondants: Correspondants): Promise<void>

}