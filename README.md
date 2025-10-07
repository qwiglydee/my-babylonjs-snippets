# MY BabylonJS snippets

This is my production-like playground to test and experiment with reusable snippets and solutions for Web3D with [BabylonJS](https://www.babylonjs.com/).

Assumed context:

```html
<our-app>
    <!-- 
    Some babylon-unaware app to integrate with. 
    All this html could be in its shadow dom.
    -->

    <our-something>
        <!-- a babylon-unaware component of the app -->
    </our-something>

    <my-babylon>
        <!-- 
        The babylon core component 
        Shadow dom containes canvas, scene and everything
        -->

        <my-stuff>
            <!-- A babylon-aware component plugged-in -->
        </my-stuff>

    </my-babylon>

</our-app>
```

Everything is implemented in [lit.dev](https://lit.dev/)

Features and snippets go in their dedicated branches and tags.
