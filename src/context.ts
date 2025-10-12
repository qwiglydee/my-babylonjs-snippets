import { createContext } from "@lit/context";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import type { Vector3 } from "@babylonjs/core/Maths";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import type { MyScene } from "./scene";

export interface AppCtx {
    status: string;
    foo: string;
}

// NB: non nullable
export const appCtx = createContext<AppCtx>(Symbol('app'));


export interface SceneCtx {
    worldSize: number;
    scene: MyScene;
    bounds: { min: Vector3, max: Vector3 }
}

export const sceneCtx = createContext<Nullable<SceneCtx>>(Symbol('babylon.scene'));

// NB: non nullable
export const utilsCtx = createContext<Scene>(Symbol('babylo.utils'));

export const pickCtx = createContext<Nullable<PickingInfo>>(Symbol('babylo.pick'))

export interface PickDetail {
    mesh: Nullable<string>;
    state?: string;
}
export type PickEvent = CustomEvent<PickDetail>;
