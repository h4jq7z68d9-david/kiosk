// Module resolve hook: every '@aws-sdk/*' import resolves to aws-stubs.mjs. Registered by test.js.
const STUBS = new URL('./aws-stubs.mjs', import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@aws-sdk/')) return { url: STUBS, shortCircuit: true };
  return next(specifier, context);
}
