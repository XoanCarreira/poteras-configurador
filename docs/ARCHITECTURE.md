# Arquitectura Técnica

## 1. Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Lenguajes:** HTML / CSS / JavaScript (TypeScript a valorar)
- **Motor 3D:** [Three.js](https://threejs.org/)
- **Renderizado:** Client-Side Rendering para las vistas del configurador
  (Three.js necesita `window`/WebGL, no se puede pre-renderizar en servidor).
  El resto del sitio (páginas informativas, listados) puede usar SSR/SSG normal de SvelteKit.

## 2. Componentes principales

```
┌─────────────────────────────────────────────┐
│                  SvelteKit App                │
│                                               │
│  ┌───────────────┐      ┌──────────────────┐ │
│  │  Panel de      │ ---> │  Store de estado  │ │
│  │  Configuración │      │  (forma, tamaño,  │ │
│  │  (UI controles)│      │   patrón, color…) │ │
│  └───────────────┘      └─────────┬────────┘ │
│                                    │            │
│                                    v            │
│                          ┌──────────────────┐  │
│                          │  Visualizador 3D  │  │
│                          │  (componente      │  │
│                          │   Three.js)        │  │
│                          └──────────────────┘  │
└─────────────────────────────────────────────┘
```

- **Store de estado** (Svelte store): única fuente de verdad con la configuración
  actual (`forma`, `tamaño`, `patrónColor`, futuros atributos). Cualquier cambio en
  el panel actualiza el store, y el visualizador 3D reacciona a esos cambios.
- **Panel de configuración**: controles de UI (selectores, swatches de color,
  miniaturas de forma, slider de tamaño).
- **Visualizador 3D**: componente Svelte que envuelve una escena de Three.js
  (cámara, luces, controles de órbita `OrbitControls` para el giro 360° libre).

## 3. Pipeline de modelado 3D (a definir con el fabricante)

1. **Modelado de formas**: cada forma base de potera se modela una única vez
   (ej. en Blender) y se exporta en formato `.glb`/`.gltf`.
2. **Escalado por tamaño**: el tamaño se resuelve con transformaciones de escala
   sobre el mismo modelo (no requiere modelar de nuevo), salvo que un tamaño
   implique un cambio de proporciones reales — a validar caso por caso.
3. **Materiales por zona**: dado que cuerpo, ojos y plumas se personalizan de
   forma **independiente**, cada modelo `.glb` debe tener el mesh separado en,
   como mínimo, estas sub-partes (cada una con su propio slot de material):
   - `cuerpo` → recibe el material/textura de `bodyPattern`.
   - `ojos` → recibe el color de `eyeColor`.
   - `plumas` → recibe el color de `featherColor`.
   - (a confirmar) `corona`/`plomada` → posible acabado fijo o personalizable.

   En Three.js esto se traduce en acceder a cada sub-mesh por nombre (definido
   al exportar desde Blender) y asignarle su `MeshStandardMaterial`
   correspondiente de forma independiente.
4. **Patrones de color como materiales**: ✅ **Decisión tomada** — cada
   `bodyPattern` de tipo degradado se resuelve mediante una **textura
   pre-generada** (imagen ajustada al UV del modelo), no mediante shader
   procedural. Ventajas: control visual total sobre el resultado (fiel al
   acabado artesanal real) y sencillez de implementación en Three.js
   (simplemente se asigna la textura al `map` del material).

   Esto implica un pequeño sub-pipeline de contenido:
   - Por cada `bodyPattern` nuevo, generar su textura (Photoshop/GIMP u otra
     herramienta) ajustada al UV unwrap del modelo base.
   - Guardar la textura en `static/models/textures/patterns/{id}.png` (o similar).
   - Referenciarla desde `bodyPattern.textura` en `data/patterns.json`.

   *(Se deja como posible mejora futura, no comprometida, evaluar un shader
   procedural más adelante si se quisiera un "generador de patrones infinito".)*
5. **Carga en Three.js**: uso de `GLTFLoader` para cargar los modelos y
   `MeshStandardMaterial`/`MeshPhysicalMaterial` para reflejar bien el
   acabado artesanal (brillo, rugosidad, y la textura tipo "escamas" de tejido
   del cuerpo — probablemente vía normal map).

> 📌 Pendiente de definir: quién se encargará del modelado 3D (¿el fabricante tiene
> algún recurso, o hay que contemplarlo como tarea del proyecto?).

## 4. Estructura de carpetas propuesta

```
src/
├── lib/
│   ├── components/
│   │   ├── ConfiguratorPanel.svelte
│   │   ├── Viewer3D.svelte
│   │   └── ...
│   ├── stores/
│   │   └── configuratorStore.ts
│   ├── models/           # referencias a assets .glb
│   └── data/
│       ├── shapes.json
│       ├── sizes.json
│       └── patterns.json
├── routes/
│   ├── +page.svelte       # home / catálogo
│   └── configurador/
│       └── +page.svelte
└── ...
static/
└── models/                # archivos .glb/.gltf y texturas
```

## 5. Requisitos de rendimiento y nivel de detalle

✅ **Decisiones tomadas:**
- **Nivel visual**: intermedio — realista pero optimizado (ni low-poly muy
  estilizado, ni fotorrealista pesado).
- **Rendimiento móvil**: imprescindible que vaya fluido en gama media/baja.
  Esto es un requisito **no negociable** que condiciona el pipeline de
  modelado y el motor de renderizado.

Esto se traduce en las siguientes pautas técnicas concretas (a compartir con
quien se encargue del modelado 3D — ver tarea en `ROADMAP.md`):

| Aspecto | Pauta recomendada |
|---|---|
| Poligonaje por modelo | Rango medio (ej. ~5.000–15.000 tris por potera), evitar high-poly innecesario en zonas no visibles de cerca |
| Formato de geometría | `.glb` comprimido con **Draco** (reduce mucho el peso de descarga) |
| Texturas | Resolución moderada (1K, como mucho 2K en el cuerpo), formato comprimido **KTX2/Basis** para GPU |
| Materiales | `MeshStandardMaterial` (PBR estándar); evitar `MeshPhysicalMaterial` con muchas capas (clearcoat, transmisión...) salvo que se compruebe que el rendimiento lo soporta |
| Iluminación | Iluminación ligera (1-2 luces + algo de entorno/environment map horneado), evitar sombras dinámicas costosas — usar sombras "falsas" (blob shadow) si se necesita apoyo visual |
| Renderer | Limitar `pixelRatio` (ej. `Math.min(window.devicePixelRatio, 2)`), desactivar antialiasing costoso en gama baja si hace falta |
| Nº de modelos cargados a la vez | Solo el modelo activo en memoria; liberar (`dispose()`) el anterior al cambiar de forma |
| Pruebas | Validar en al menos un dispositivo Android de gama media/baja real, no solo en emulador/escritorio |

## 6. Sistema de diseño (tokens visuales)

Para poder afinar la estética sin tocar componentes, toda la identidad visual
vive en **una única fuente de verdad**: `src/lib/theme.ts`.

- **Colores** (`colors`), **tipografías** (`fonts`) y **radios** (`radii`) se
  definen ahí como constantes TypeScript.
- `src/routes/+layout.svelte` vuelca esas constantes como variables CSS
  (`--color-*`, `--font-*`, `--radius-*`) en `:root`, disponibles en toda la app.
- Los componentes (`ConfiguratorPanel.svelte`, `Viewer3D.svelte`, `+page.svelte`)
  **no deben hardcodear colores/fuentes**: siempre `var(--color-...)`, etc.
- El **visualizador 3D** (Three.js no entiende CSS) importa `colors` directamente
  desde `theme.ts`, así la escena 3D usa exactamente la misma paleta que la UI.

**Para cambiar la estética en el futuro** (ej. si el fabricante pide otro tono
de marca): editar únicamente `src/lib/theme.ts` — el cambio se propaga solo.

Paleta actual (derivada del logo — azul petróleo/turquesa, negro tipo "tinta",
blanco roto cálido + acento coral que conecta con los colores vivos reales de
las poteras): ver valores exactos y comentarios en `theme.ts`.

Tipografías: **Bungee** (display, para títulos con carácter tipo insignia/logo),
**Caveat** (manuscrita, usada con moderación como guiño al lettering a mano del
logo — solo en la etiqueta "Configurador") y **Inter** (texto/UI general).

## 7. Preguntas técnicas abiertas

Todas las preguntas técnicas iniciales han quedado resueltas por ahora. Nuevas
preguntas que puedan surgir se añadirán aquí a medida que avance el proyecto.
