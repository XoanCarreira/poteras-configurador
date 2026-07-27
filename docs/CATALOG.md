# Catálogo — Modelo de Datos

> Estado: **parcial**. Esta sección se irá completando con la información real que
> aporte el fabricante (nombres, medidas, fotos de referencia, patrones existentes).

## 0. Observaciones a partir de fotos de muestra reales

A partir de un lote de fotos de referencia se identifican las siguientes
partes de la potera, que probablemente deban tratarse como **zonas
independientes** en el modelo 3D (cada una con su propio color/material):

| Zona | Descripción | Variable independiente |
|---|---|---|
| **Cuerpo** | Forma de torpedo alargado, recubierto de un tejido texturizado tipo "escamas" | Color/patrón + la textura de tejido en sí |
| **Ojos** | Elemento aplicado, tipo cuenta | Color (verde, negro, azul, plateado…) |
| **Plumas/pelo** (hackle) | Mechón en la zona de la boca | Color (parece variar de forma independiente al patrón del cuerpo) |
| **Corona de anzuelos** | Conjunto de anzuelos metálicos en la base | Acabado metálico (a confirmar si varía: plateado/dorado/negro) |
| **Plomada/quilla** | Base de peso metálica | Acabado metálico |

Esto sugiere que el **patrón de color** (`pattern`) del catálogo en realidad
podría necesitar descomponerse en sub-atributos (color de cuerpo/degradado,
color de ojos, color de plumas) en vez de ser un único bloque. A confirmar
según cómo el fabricante piensa realmente sus combinaciones.

### Tipos de patrón de color identificados

1. **Degradado (el más común)**: 2-3 colores que se funden a lo largo del eje
   longitudinal del cuerpo. Ejemplos observados: azul→blanco, naranja→amarillo,
   rosa→amarillo→morado, negro→rojo→amarillo, rosa→verde, rojo sólido, azul
   sólido, verde sólido, rosa sólido.
2. **Patrón gráfico**: motivos no longitudinales, ej. rayas onduladas
   multicolor sobre un fondo de otro color.

> 📌 Pendiente de confirmar: ¿el fabricante distingue "colores sólidos" como un
> tipo de patrón aparte, o todo se gestiona como "patrón" (incluyendo los que
> son un solo color)?

### Sobre formas y tamaños

En el lote de fotos analizado, todas las piezas comparten **la misma silueta y
tamaño** — la muestra ilustra principalmente la variedad de color/patrón, no de
forma ni tamaño. Sigue pendiente aportar fotos/información específica de:
- Las distintas **formas** que fabrica (siluetas diferentes, si las hay).
- Los distintos **tamaños** por forma.

## 1. Entidades del catálogo

### 1.1 Forma (`shape`)
Representa la silueta/tipo de potera.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único |
| `nombre` | string | Nombre comercial de la forma |
| `modelo3d` | string | Ruta al archivo `.glb` correspondiente |
| `tamañosDisponibles` | string[] | IDs de tamaños compatibles con esta forma |
| `descripcion` | string | Texto descriptivo (opcional) |

*Pendiente: listado real de formas disponibles.*

### 1.2 Tamaño (`size`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único |
| `nombre` | string | Ej. "2.5", "3.0", "3.5" (numeración habitual en poteras) |
| `factorEscala` | number | Factor de escala a aplicar sobre el modelo 3D base |
| `medidasReales` | object | Medidas físicas reales (largo, diámetro, peso) — informativo |

*Pendiente: rango real de tamaños que fabrica.*

### 1.3 Personalización de color — por zonas combinables

✅ **Confirmado con el fabricante**: el color/patrón **no es un bloque cerrado**.
El usuario puede combinar libremente el color/patrón de cada zona de la potera
de forma independiente. Esto sustituye a la idea inicial de un único "patrón".

Cada zona pasa a ser su propia entidad de catálogo, con su propia lista de
opciones disponibles:

#### `bodyPattern` — Patrón del cuerpo
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único |
| `nombre` | string | Ej. "Degradado azul-blanco", "Rayado tigre" |
| `tipo` | enum | `solido` \| `degradado` \| `grafico` |
| `colores` | string[] | Colores (hex) que componen el patrón, en orden |
| `textura` | string | Ruta a la textura a aplicar sobre el mesh del cuerpo |

#### `eyeColor` — Color de ojos
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único |
| `nombre` | string | Ej. "Verde", "Negro", "Plateado" |
| `colorHex` | string | Color a aplicar al material de los ojos |

#### `featherColor` — Color de plumas/pelo (hackle)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único |
| `nombre` | string | Ej. "Marrón", "Blanco" |
| `colorHex` | string | Color a aplicar al material de las plumas |

#### (A confirmar) `crownFinish` / `keelFinish` — Acabado corona de anzuelos / plomada
✅ **Parcialmente resuelto** a partir del primer modelo 3D real recibido del
fabricante: estas piezas (corona de anzuelos, plomada y anilla) se agrupan en
una única **zona "hardware"** con acabado metálico fijo (no personalizable por
el usuario), ya que en el modelo real no vienen separadas para elegir color
independiente. *Pendiente de confirmar con el fabricante si esto es
intencional o si en algún momento debería ser personalizable.*

### Convención de nombres de zona (confirmada con el primer modelo real)

El primer modelo `.glb` recibido usa esta convención de nombres de objeto en
Blender, que el código de carga (`Viewer3D.svelte`) reconoce automáticamente
(sin distinguir mayúsculas/minúsculas, por coincidencia de subcadena):

| Nombre en Blender | Zona | Personalizable |
|---|---|---|
| `Cuerpo` | `cuerpo` | Sí — `bodyPattern` |
| `Ojo d`, `Ojo i` | `ojos` | Sí — `eyeColor` |
| `Pluma d`, `Pluma i` | `plumas` | Sí — `featherColor` |
| `Plomo` | `hardware` | No (acabado metálico fijo) |
| `Coronas` / objeto de curva Bézier (corona de anzuelos) | `hardware` | No (acabado metálico fijo) |
| `Anilla` | `hardware` | No (acabado metálico fijo) |

Cualquier objeto que no encaje con ninguna de estas palabras clave se trata
por defecto como `cuerpo` (para evitar que quede invisible o sin material).

*Pendiente: listado real y completo de opciones disponibles en cada una de
estas paletas (cuántos `bodyPattern`, `eyeColor` y `featherColor` existen).*

### 1.4 (Futuro) Otros atributos personalizables
Espacio reservado para futuras características mencionadas como posibles
("cualquier otra característica personalizable"), por ejemplo:
- Tipo de anzuelo / corona.
- Material del cuerpo (plástico, madera, plomo).
- Acabado (brillante, mate, con brillo/glitter).

## 2. Relación entre entidades

```
Forma (shape) ──1..N── Tamaño (size)
Forma (shape) ──1..N── bodyPattern aplicable
Forma (shape) ──1..N── eyeColor aplicable
Forma (shape) ──1..N── featherColor aplicable
```

✅ **Confirmado**: 2-4 formas distintas de silueta en el catálogo del fabricante
(a la espera de material gráfico/fotos de cada una).

Cada zona (cuerpo/ojos/plumas) se combina de forma **libre e independiente**
entre sí — el usuario elige cada una por separado. No todas las combinaciones
tienen por qué estar disponibles para todas las formas/tamaños; este documento
definirá las reglas de compatibilidad una vez se tenga el catálogo completo.

## 3. Información pendiente de recopilar

- [ ] Fotos/nombres de las 2-4 formas distintas (para poder diferenciarlas
      visualmente y como referencia de modelado 3D).
- [ ] Rango de tamaños por forma.
- [ ] Listado completo de `bodyPattern` disponibles (nombre + colores + tipo).
- [ ] Listado completo de `eyeColor` disponibles.
- [ ] Listado completo de `featherColor` disponibles.
- [ ] Confirmar si la corona de anzuelos / plomada son personalizables o de
      acabado fijo.
- [ ] Reglas de compatibilidad (qué combinaciones aplican a qué forma/tamaño).
- [ ] Fotos de alta calidad de piezas reales (para texturizado y/o fichas de detalle).
