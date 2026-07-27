# Configurador y Visualizador — Especificación Funcional

## 1. Flujo de usuario

1. El usuario entra a la sección "Configurador".
2. Ve una potera por defecto (forma/tamaño/patrón predeterminados) en el
   visualizador 3D.
3. Selecciona una **forma** → el modelo 3D se actualiza.
4. Selecciona un **tamaño** → el modelo se reescala.
5. Selecciona un **patrón de color** → el material/textura del modelo se actualiza.
6. En cualquier momento puede **rotar libremente** la pieza en 360° (arrastrando)
   y hacer zoom para ver el detalle.
7. (Opcional a futuro) Puede guardar/compartir la configuración mediante una URL
   con parámetros (ej. `?forma=x&tamano=y&patron=z`).

## 2. Panel de configuración (UI)

✅ Confirmado: el color se combina **libremente por zona** (no es un patrón
cerrado), por lo que el panel necesita un control independiente por cada zona
personalizable de la potera.

| Control | Tipo de UI sugerido |
|---|---|
| Forma | Galería de miniaturas seleccionables |
| Tamaño | Selector tipo "chips" o slider con valores discretos |
| Patrón de cuerpo (`bodyPattern`) | Grid de swatches (mostrando los colores/degradado de cada patrón) |
| Color de ojos (`eyeColor`) | Grid pequeño de swatches de color |
| Color de plumas (`featherColor`) | Grid pequeño de swatches de color |

El panel debe reflejar **solo combinaciones válidas** según las reglas de
compatibilidad definidas en `CATALOG.md` (deshabilitar o filtrar opciones no
disponibles para la forma seleccionada).

## 3. Visualizador 3D

- **Cámara**: perspectiva, con `OrbitControls` (rotación libre, zoom, sin pan
  para mantener el foco en la pieza).
- **Iluminación**: set de luces que resalte el brillo/acabado artesanal
  (ej. luz ambiental + luz direccional + algo de HDRI/entorno para reflejos).
- **Fondo**: neutro (blanco o degradado suave) para que el producto sea el
  protagonista, tipo "muestrario".
- **Transiciones**: al cambiar forma/tamaño/patrón, aplicar una transición suave
  (fade o cross-fade de material) en vez de un cambio brusco.
- **Rendimiento**: los modelos deben estar optimizados (low-poly razonable,
  texturas comprimidas) para que funcione fluido también en móvil.

## 4. Estados de la aplicación

- **Carga inicial**: mostrar loader mientras se descarga el modelo 3D base.
- **Cambio de configuración**: mostrar un loader ligero si el cambio implica
  cargar un modelo distinto (cambio de forma); si es solo textura o escala,
  la actualización debería ser instantánea.
- **Error de carga**: mensaje de fallback si un modelo o textura no carga.

## 5. Fuera de alcance (de momento)

- Comparar dos configuraciones lado a lado.
- Guardar configuraciones en cuenta de usuario.
- Exportar imagen/captura de la configuración (podría añadirse más adelante,
  es una función sencilla de valorar en el roadmap).
