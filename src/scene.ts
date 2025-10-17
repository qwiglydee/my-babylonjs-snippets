import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Vector3 } from "@babylonjs/core/Maths";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tags } from "@babylonjs/core/Misc/tags";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";


const SCNOPTIONS: SceneOptions = {};


export class MyScene extends Scene {
    worldSize: Vector3;
    _worldBounds: BoundingBox;

    // observe when something added/removed or moved around
    onModelUpdatedObservable: Observable<AbstractMesh[]> = new Observable();

    constructor(engine: Engine, worldSize: Vector3) {
        super(engine, SCNOPTIONS);
        this.worldSize = worldSize;
        this._worldBounds = new BoundingBox(this.worldSize.scale(-0.5), this.worldSize.scale(+0.5));
        const maybeupd = (mesh: AbstractMesh) => { 
            if (this.#nonAuxFilter(mesh)) {
                console.debug("upd", mesh);
                this.onModelUpdatedObservable.notifyObservers([mesh]) 
            }
        };
        this.onNewMeshAddedObservable.add(maybeupd);
        this.onMeshRemovedObservable.add(maybeupd);
    }

    markAux(node: TransformNode) {
        Tags.AddTagsTo(node, "aux");
    }
    
    #nonAuxFilter = (n: TransformNode) => Tags.MatchesQuery(n, "!aux");

    getWorldBounds(): BoundingBox {
        return this._worldBounds;
    }

    getModelBounds(): Nullable<BoundingBox> {
        const stuff = this.meshes.filter(this.#nonAuxFilter);
        if (!stuff.length) return null;
        const ext = this.getWorldExtends(this.#nonAuxFilter);
        return new BoundingBox(ext.min, ext.max);
    }
}