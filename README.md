# Catálogo Configurable — Poteras Artesanales Riotinta

## 1. Descripción del proyecto

Aplicación web tipo **muestrario/catálogo interactivo** para **Poteras
Artesanales Riotinta**, fabricante artesanal de poteras para pesca de
calamar. No es una tienda online ni gestiona ventas: su único objetivo es
mostrar el abanico de posibilidades de personalización que ofrece el
fabricante.

El núcleo de la aplicación es un **configurador visual**: el usuario elige forma,
tamaño, color/patrón (y otros atributos futuros) y ve el resultado reflejado al
instante en un **visualizador 3D con rotación libre a 360°**.

## 2. Objetivo

Permitir que un cliente potencial (o el propio fabricante en una feria, por ejemplo)
explore visualmente todas las combinaciones posibles de un producto artesanal sin
necesidad de tener cada variante fabricada o fotografiada.

## 3. Alcance (Scope)

**Incluye:**
- Catálogo de formas y tamaños de poteras.
- Catálogo de patrones de color (combinaciones de varios colores por patrón).
- Configurador interactivo que combina forma + tamaño + patrón (+ futuros atributos).
- Visualizador 3D en 360° que refleja en tiempo real la configuración elegida.

**No incluye (por ahora):**
- Carrito de compra / checkout / pasarela de pago.
- Gestión de usuarios o cuentas.
- Precios (a valorar más adelante si se desea mostrar orientativos).

## 4. Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Enfoque del visualizador 360° | **Modelo 3D renderizado (Three.js)** | Escala con cientos de combinaciones de forma/tamaño/patrón sin necesidad de fotografiar cada variante |
| Stack técnico | **SvelteKit + HTML/CSS/JS + Three.js** | Preferencia del equipo, buen rendimiento y encaja de forma nativa con Three.js |
| Estado del catálogo | Parcial — se irá completando durante el desarrollo | El fabricante aportará info progresivamente |
| Personalización de color | Combinación **libre e independiente** de `bodyPattern` + `eyeColor` + `featherColor` | Confirmado con el fabricante a partir de fotos reales; no es un patrón cerrado |
| Generación de degradados | **Textura pre-generada** (no shader procedural) | Máximo control visual y sencillez de implementación |
| Modelado 3D | Se contempla como **tarea a subcontratar/resolver dentro del proyecto** | El fabricante no dispone de este recurso |

## 5. Identidad de marca

- **Fabricante**: Poteras Artesanales Riotinta.
- **Logo**: en `static/brand/logo-riotinta.png`, usado como favicon y en el
  header del panel del configurador.
- Paleta actual del visualizador (fondo oscuro azulado, acentos en azul claro)
  es provisional; se puede afinar para que combine mejor con los colores del
  logo (azul petróleo/turquesa + blanco + negro) en una fase de pulido visual.

## 6. Estructura de la documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arquitectura técnica y pipeline 3D.
- [`docs/CATALOG.md`](docs/CATALOG.md) — Modelo de datos del catálogo (formas, tamaños, patrones).
- [`docs/CONFIGURATOR.md`](docs/CONFIGURATOR.md) — Especificación funcional del configurador y visualizador.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Fases de desarrollo.

## 7. Cómo ejecutar el prototipo (Fase 1)

```bash
npm install
npm run dev -- --open
```

Esto abre el prototipo técnico: configurador con datos de prueba + visualizador
3D con rotación libre en 360°. La geometría de las poteras es **provisional**
(generada por código, no son los modelos reales) — sirve para validar toda la
arquitectura (cambio de forma/tamaño, materiales independientes por zona)
antes de recibir los modelos definitivos. Detalles de desarrollo adicionales
en [`README-DEV.md`](README-DEV.md).

## 8. Estado actual

📝 **Fase de definición y prototipo técnico.** Este documento y los que le
acompañan se irán ampliando a medida que se aporte más información (fotos del
fabricante, lista real de formas/tamaños/patrones, referencias visuales, etc.).
