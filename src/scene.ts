import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tags } from "@babylonjs/core/Misc/tags";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";


const SCNOPTIONS: SceneOptions = {};


export class MyScene extends Scene {
    // observe when something added/removed or moved around
    onModelUpdatedObservable: Observable<AbstractMesh[]> = new Observable();

    constructor(engine: Engine) {
        super(engine, SCNOPTIONS);
        this.onNewMeshAddedObservable.add(this.#maybeupdate);
        this.onMeshRemovedObservable.add(this.#maybeupdate);
    }

    markAux(node: TransformNode) {
        Tags.AddTagsTo(node, "aux");
    }
    
    #nonAuxFilter = (n: TransformNode) => Tags.MatchesQuery(n, "!aux");

    #maybeupdate = (mesh: AbstractMesh) => { 
        if (this.#nonAuxFilter(mesh)) this.onModelUpdatedObservable.notifyObservers([mesh]);
    };

    /** bounding box of all model meshes */
    getModelBounds(): Nullable<BoundingBox> {
        const stuff = this.meshes.filter(this.#nonAuxFilter);
        if (!stuff.length) return null;
        const ext = this.getWorldExtends(this.#nonAuxFilter);
        return new BoundingBox(ext.min, ext.max);
    }

    /** possible bunding box of scene flipped around 0 */
    getWorldBounds(): Nullable<BoundingBox> {
        const stuff = this.meshes.filter(this.#nonAuxFilter);
        if (!stuff.length) return null;
        const ext = this.getWorldExtends(this.#nonAuxFilter);
        const flp = { min: ext.min.scale(-1), max: ext.max.scale(-1)};
        return new BoundingBox(
            new Vector3(
                Math.min(ext.min.x, flp.min.x, ext.max.x, flp.max.x),
                Math.min(ext.min.y, flp.min.y, ext.max.y, flp.max.y),
                Math.min(ext.min.z, flp.min.z, ext.max.z, flp.max.z)
            ),
            new Vector3(
                Math.max(ext.min.x, flp.min.x, ext.max.x, flp.max.x),
                Math.max(ext.min.y, flp.min.y, ext.max.y, flp.max.y),
                Math.max(ext.min.z, flp.min.z, ext.max.z, flp.max.z)
            ),
        );
    }   
}