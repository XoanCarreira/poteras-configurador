// La app es 100% estática (sin datos de servidor): se prerenderiza
// completa en tiempo de build, generando HTML real para cada ruta.
// Requisito de @sveltejs/adapter-static (ver vite.config.ts).
export const prerender = true;
