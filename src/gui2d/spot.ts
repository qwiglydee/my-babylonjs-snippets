import { Animation } from "@babylonjs/core/Animations/animation";
import type { ICanvasRenderingContext } from "@babylonjs/core/Engines/ICanvas";
import { Color4 } from "@babylonjs/core/Maths";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { Control } from "@babylonjs/gui/2D/controls/control";
import type { GradientColorStop } from "@babylonjs/gui/2D/controls/gradient/BaseGradient";
import { RadialGradient } from "@babylonjs/gui/2D/controls/gradient/RadialGradient";
import type { Measure } from "@babylonjs/gui/2D/measure";


function createBlinking() {
    const a = new Animation("blinking", "alpha", 24, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT); 
    a.setKeys([
        { frame: 0, value: 0 },
        { frame: 3, value: 0.75},
        { frame: 6, value: 1.0},
        { frame: 9, value: 0.75},
        { frame: 12, value: 0 },
    ])
    return a;
}


export class Spot extends Control {
    static _blinking = createBlinking();

    protected override _getTypeName(): string {
        return "Spot";
    }

    _blinking = false;
    get blinking(): boolean { return this._blinking; }
    set blinking(enable: boolean) {
        this._blinking = enable;
        if (enable) this.animations = [Spot._blinking]; else this.animations = [];
        this.alpha = enable ? 0 : 1.0;
    } 

    _diameter: number = 8;
    get diameter() { return this._diameter; }
    set diameter(size: number) {
        this._diameter = size;
        this.widthInPixels = size;
        this.heightInPixels = size;
    }

    override set color(value: string) {
        super.color = value;
        this._initGradient();
    }
    override get color() {
        return super.color;
    }

    _colors: GradientColorStop[] = [];
    _initGradient() {
        if (!this.color) {
            this._colors = [];
            return;
        }
        const base = Color4.FromHexString(this.color);

        const stop = (offset: number, alpha: number) => {
            let color = base.clone();
            color.a = alpha;
            return { offset, color: color.toHexString() }; 
        }

        this._colors = [stop(0, 1.0), stop(0.5, 0.875), stop(1.0, 0.0)]
    }


    public override _draw(context: ICanvasRenderingContext, _invalidatedRectangle?: Nullable<Measure>): void {        
        context.save();
        const { left, top, width, height } = this._currentMeasure;
        const rx = width / 2;
        const ry = height / 2;
        const x0 = left + rx;
        const y0 = top + ry;

        const gradient = new RadialGradient(x0, y0, 0, x0, y0, rx);
        gradient.addColorStop(this._colors[0].offset, this._colors[0].color);
        gradient.addColorStop(this._colors[1].offset, this._colors[1].color);
        gradient.addColorStop(this._colors[2].offset, this._colors[2].color);
        Control.drawEllipse(x0, y0, rx, ry, 1, context);
        context.fillStyle = gradient.getCanvasGradient(context);
        context.fill();

        context.restore();
    }

    blink(scene: Scene) {
        scene.beginAnimation(this, 0, 24, false);
    }
}