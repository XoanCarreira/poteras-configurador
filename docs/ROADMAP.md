# Roadmap

## Fase 0 — Definición (actual)
- [x] Definir alcance y objetivo del proyecto.
- [x] Elegir enfoque del visualizador (modelo 3D).
- [x] Elegir stack técnico (SvelteKit + Three.js).
- [x] Definir modelo de datos de personalización por zonas (cuerpo/ojos/plumas).
- [x] Decidir cómo se resuelven los degradados (textura pre-generada).
- [ ] Recopilar catálogo real (formas, tamaños, patrones) del fabricante.
- [ ] **Resolver quién modela en 3D**: buscar/contratar recurso (freelance,
      estudio, o herramienta) capaz de modelar las 2-4 formas de potera y
      dejarlas preparadas con sub-meshes separados (cuerpo/ojos/plumas) y UV
      listo para texturizar, cumpliendo los requisitos de rendimiento definidos
      en `ARCHITECTURE.md` (poligonaje medio, exportación `.glb` con Draco,
      pensado para ir fluido en móviles de gama media/baja). *(Bloqueante para
      la Fase 3.)*
      ✅ **Primer modelo real recibido e integrado** (forma "Clásica") — el
      fabricante ya modela en Blender y sigue la convención de nombres de
      zona documentada en `CATALOG.md`. Pendiente: mismo trabajo para el
      resto de formas (2-4 en total).

## Fase 1 — Prototipo técnico
- [x] Montar proyecto base SvelteKit.
- [x] Integrar Three.js con una geometría de prueba (placeholder procedural,
      ya que aún no hay modelos `.glb` reales) organizada en zonas separadas
      (cuerpo/ojos/plumas) para validar el modelo de materiales independientes.
- [x] Implementar `OrbitControls` para rotación 360° libre.
- [x] Store de configuración + panel de UI conectado al visualizador (forma,
      tamaño, patrón de cuerpo, color de ojos, color de plumas).
- [x] Generación de textura de degradado (versión procedural de validación;
      se sustituirá por texturas reales pre-generadas en la Fase 3).
- [x] Build de producción verificado sin errores (`npm run build`).
- [ ] Validar rendimiento en un dispositivo móvil real de gama media/baja
      (pendiente de probar fuera del entorno de desarrollo).
- [x] Optimizar tamaño de bundle: el visualizador 3D (Three.js, ~550KB) ahora
      se carga con `import()` dinámico desde `+page.svelte`, en un chunk aparte
      que no bloquea la carga inicial de la página. El chip/panel de
      configuración se muestra al instante; el visualizador aparece con un
      loader breve mientras se descarga en segundo plano.

## Fase 2 — Configurador funcional
- [ ] Implementar store de estado de configuración.
- [ ] Construir panel de UI (forma, tamaño, patrón).
- [ ] Conectar cambios de UI con el visualizador 3D (cambio de modelo/escala/material).
- [ ] Cargar datos del catálogo desde `data/*.json`.

## Fase 3 — Contenido real
- [x] Cargar el primer modelo 3D real (`.glb`) de la forma "Clásica" en el
      visualizador, con clasificación automática de zonas por nombre.
- [ ] **Optimizar poligonaje del primer modelo**: tiene ~36.000 triángulos en
      total, muy por encima del objetivo (~5.000-15.000). Casi todo lo aporta
      la corona de anzuelos (objeto de curva Bézier, ~32.000 tris) — reducir
      la resolución/bevel de la curva en Blender antes de re-exportar, o
      convertirla a una malla más simple/low-poly.
- [ ] Sustituir modelos/texturas de prueba por los reales del fabricante
      (resto de formas: 2-4 en total).
- [ ] Aplicar reglas de compatibilidad forma/tamaño/patrón.
- [ ] Pulido visual (iluminación, fondo, transiciones).

## Fase 4 — Refinamiento y publicación
- [ ] Optimización de rendimiento (compresión de modelos/texturas).
- [ ] Diseño responsive completo.
- [ ] Pruebas en distintos dispositivos/navegadores.
- [ ] Despliegue.

## Ideas a futuro (no comprometidas)
- Compartir configuración vía URL.
- Exportar/capturar imagen de la configuración actual.
- Modo "comparar" dos configuraciones.
- Sección informativa sobre el proceso artesanal de fabricación.
