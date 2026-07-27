import { writable } from 'svelte/store';
import shapes from '$lib/data/shapes.json';
import sizes from '$lib/data/sizes.json';
import bodyPatterns from '$lib/data/bodyPatterns.json';
import eyeColors from '$lib/data/eyeColors.json';
import featherColors from '$lib/data/featherColors.json';

export interface ConfiguratorState {
	shapeId: string;
	sizeId: string;
	bodyPatternId: string;
	eyeColorId: string;
	featherColorId: string;
}

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
