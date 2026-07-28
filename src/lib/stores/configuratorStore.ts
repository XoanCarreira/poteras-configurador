import { writable } from 'svelte/store';
import shapesData from '$lib/data/shapes.json';
import sizesData from '$lib/data/sizes.json';
import bodyPatternsData from '$lib/data/bodyPatterns.json';
import eyeColorsData from '$lib/data/eyeColors.json';
import featherColorsData from '$lib/data/featherColors.json';

/**
 * Tipos del catálogo (ver docs/CATALOG.md). Tipar explícitamente los JSON
 * evita errores de TypeScript cuando un campo (como `modelo3d`) solo está
 * presente en algunas entradas todavía.
 */
export interface Shape {
	id: string;
	nombre: string;
	descripcion?: string;
	/** Ruta al modelo .glb real, si ya existe (ver ARCHITECTURE.md). */
	modelo3d?: string;
	/** Perfil 2D usado por la geometría placeholder mientras no hay modelo3d. */
	perfil: { x: number; y: number }[];
}

export interface Size {
	id: string;
	nombre: string;
	factorEscala: number;
}

export interface BodyPattern {
	id: string;
	nombre: string;
	tipo: 'solido' | 'degradado' | 'grafico';
	colores: string[];
}

export interface ColorOption {
	id: string;
	nombre: string;
	/** Color sólido (usado cuando `tipo` no es 'radial', o como fallback). */
	colorHex: string;
	/** 'solido' (por defecto) o 'radial' — degradado radial centro→borde. */
	tipo?: 'solido' | 'radial';
	/** Para tipo 'radial': [colorCentro, colorBorde]. */
	colores?: [string, string];
}

export interface ConfiguratorState {
	shapeId: string;
	sizeId: string;
	bodyPatternId: string;
	eyeColorId: string;
	featherColorId: string;
}

const shapes = shapesData as Shape[];
const sizes = sizesData as Size[];
const bodyPatterns = bodyPatternsData as BodyPattern[];
const eyeColors = eyeColorsData as ColorOption[];
const featherColors = featherColorsData as ColorOption[];

const initialState: ConfiguratorState = {
	shapeId: shapes[0].id,
	sizeId: sizes[2].id, // 3.5, tamaño "medio" por defecto
	bodyPatternId: bodyPatterns[0].id,
	eyeColorId: eyeColors[0].id,
	featherColorId: featherColors[0].id
};

export const configuratorState = writable<ConfiguratorState>(initialState);

// Datos del catálogo re-exportados para que los componentes no tengan
// que importar cada JSON por separado.
export const catalog = {
	shapes,
	sizes,
	bodyPatterns,
	eyeColors,
	featherColors
};
