import { createContext } from "@lit/context";

/**** babylon-unaware context ****/

export interface AppCtx {
    status: string;
    foo: string;
}


export const appCtx = createContext<AppCtx>(Symbol('app'));


export interface PickDetail {
    name: string, 
    id: string;
}

export type PickEvent = CustomEvent<PickDetail | null>;


/** some public api of the elem  */
export interface IBabylonElement extends HTMLElement {
    getWorldSize(): { x: number, y: number, z: number }
}

export const babylonCtx = createContext<IBabylonElement>(Symbol('babylon'));


export interface IAppElement  extends HTMLElement {
    ctx: AppCtx;
    babylon: IBabylonElement; 
}


// TODO: define events' types and details