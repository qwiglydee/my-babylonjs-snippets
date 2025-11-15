import { createContext } from "@lit/context";

/** some public api of the elem  */
export interface IBabylonElement extends HTMLElement {
    getWorldSize(): { x: number, y: number, z: number }
}

export interface PickDetail {
    name: string, 
    id: string;
}

export type PickEvent = CustomEvent<PickDetail | null> & { name: "babylon.picked"};
export type InitEvent = CustomEvent<undefined> & { name: "babylon.picked"};
export type UpdateEvent = CustomEvent<undefined> & { name: "babylon.picked"};