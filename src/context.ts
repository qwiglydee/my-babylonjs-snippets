import { createContext } from "@lit/context";

import type { Scene } from "@babylonjs/core/scene";
import type { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Nullable } from "@babylonjs/core/types";
import type { Vector3 } from "@babylonjs/core/Maths";

export interface AppCtx {
    status: string;
    foo: string;
}

// NB: non nullable
export const appCtx = createContext<AppCtx>(Symbol('app'));


export interface BabylonCtx {
    size: number;
    scene: Scene;
    utils: UtilityLayerRenderer;
    count: number;
    bounds: { min: Vector3, max: Vector3 }
}

export const babylonCtx = createContext<Nullable<BabylonCtx>>(Symbol('babylon'));


export interface PickDetail {
    mesh: Nullable<string>;
    state?: string;
}
export type PickEvent = CustomEvent<PickDetail>;
