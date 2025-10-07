import { createContext } from "@lit/context";

import type { Nullable } from "@babylonjs/core/types";

export interface AppCtx {
    foo: string;
}

export const appCtx = createContext<Nullable<AppCtx>>(Symbol('app'));



