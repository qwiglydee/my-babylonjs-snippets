import { createContext } from "@lit/context";

import type { Scene } from "@babylonjs/core/scene";
import type { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Nullable } from "@babylonjs/core/types";

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
    camera: Nullable<Camera>;
}

export const babylonCtx = createContext<Nullable<BabylonCtx>>(Symbol('babylon'));