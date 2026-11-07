/**
 * Tiny synchronous event hub for domain -> UI notifications.
 * Services never need to import a DOM component or UI module.
 */
const subscribers = new Map();

export function on(type, handler) {
  if (!subscribers.has(type)) subscribers.set(type, new Set());
  subscribers.get(type).add(handler);
  return () => subscribers.get(type)?.delete(handler);
}

export function emit(type, payload) {
  for (const handler of subscribers.get(type) || []) handler(payload);
}
