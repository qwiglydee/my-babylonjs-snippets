import { createContext } from "@lit/context";

import type { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Nullable } from "@babylonjs/core/types";
import type { Vector3 } from "@babylonjs/core/Maths";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import type { MyScene } from "./scene";

export interface AppCtx {
    status: string;
    foo: string;
}

// NB: non nullable
export const appCtx = createContext<AppCtx>(Symbol('app'));


export interface BabylonCtx {
    scene: MyScene;
    size: number;
    utils: UtilityLayerRenderer;
    bounds: { min: Vector3, max: Vector3 }
}

export const babylonCtx = createContext<Nullable<BabylonCtx>>(Symbol('babylon'));

export const pickCtx = createContext<Nullable<PickingInfo>>(Symbol('babylo.pick'))

export interface PickDetail {
    mesh: Nullable<string>;
    state?: string;
}
export type PickEvent = CustomEvent<PickDetail>;
