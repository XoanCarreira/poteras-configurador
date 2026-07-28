# Arquitectura Técnica

## 1. Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Lenguajes:** HTML / CSS / TypeScript
- **Motor 3D:** [Three.js](https://threejs.org/)
- **Adaptador de despliegue:** `@sveltejs/adapter-static` — la app es 100%
  estática (todo el catálogo vive en JSON embebido, sin backend ni datos de
  servidor), así que se prerenderiza entera a HTML/JS/CSS puro en `build/`.
  Compatible con cualquier hosting estático (Netlify, Vercel, GitHub Pages...).
  Configuración de build para Netlify en `netlify.toml` (raíz del repo).
- **Renderizado:** Client-Side Rendering para las vistas del configurador
  (Three.js necesita `window`/WebGL, no se puede pre-renderizar en servidor).

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
2. **Escalado por tamaño**: ✅ **Implementado de forma robusta**: el modelo se
   centra y escala automáticamente (`normalizeToGroup()` en `Viewer3D.svelte`)
   para que su dimensión mayor mida un tamaño objetivo, combinado con el
   `factorEscala` del tamaño elegido. Así, quien modela en Blender no necesita
   preocuparse por las unidades/orientación exactas de exportación.
3. **Materiales por zona**: ✅ **Implementado**. Dado que cuerpo, ojos y
   plumas se personalizan de forma **independiente**, el código clasifica
   automáticamente cada sub-mesh del `.glb` según su nombre (coincidencia de
   subcadena, sin distinguir mayúsculas/minúsculas):
   - contiene "cuerpo" → recibe el material/textura de `bodyPattern`.
   - contiene "ojo" → recibe el color de `eyeColor`.
   - contiene "pluma" → recibe el color de `featherColor`.
   - contiene "plomo", "corona", "anilla" o "bezier" → zona `hardware`,
     acabado metálico fijo (no personalizable) — plomada, corona de anzuelos
     y anilla.
   - cualquier otro nombre → cae por defecto en `cuerpo` (mejor pintable que
     invisible/gris).

   Esta convención se confirmó con el primer modelo real recibido del
   fabricante (ver tabla completa en `CATALOG.md`). No hace falta ninguna
   configuración manual adicional por modelo: basta con nombrar los objetos
   en Blender siguiendo esta convención.
4. **Patrones de color como materiales**: ✅ **Decisión tomada** — cada
   `bodyPattern` de tipo degradado se resuelve mediante una **textura
   pre-generada** (imagen ajustada al UV del modelo), no mediante shader
   procedural. Ventajas: control visual total sobre el resultado (fiel al
   acabado artesanal real) y sencillez de implementación en Three.js
   (simplemente se asigna la textura al `map` del material).

   El mismo enfoque se reutiliza para los `eyeColor` de tipo `radial`, pero
   con una técnica distinta: **matcap** (`MeshMatcapMaterial` +
   `createRadialTexture()` en `gradientTexture.ts`). Un `map` normal depende
   del UV del mesh (si no está bien desplegado, o no existe, el resultado se
   ve plano/incorrecto — esto fue justo el primer bug encontrado: el ojo se
   veía completamente negro). Un `matcap` en cambio se calcula según el
   ángulo de la normal respecto a la cámara, **sin depender del UV del
   mesh en absoluto** — por eso es la técnica elegida para simular un ojo
   realista (pupila oscura al centro, esclerótica clara alrededor, con un
   pequeño brillo/catchlight), y funciona igual de bien en el modelo real
   que en la geometría placeholder.

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
