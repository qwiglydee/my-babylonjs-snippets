import { createContext } from "@lit/context";

/**** babylon-unaware context ****/

export interface AppCtx {
    status: string;
    foo: string;
}


export interface AppElement {
    ctx: AppCtx;
}

export const appCtx = createContext<AppCtx>(Symbol('app'));


export interface PickDetail {
    state?: string;
    mesh?: string;
}

export type PickEvent = CustomEvent<PickDetail>;

