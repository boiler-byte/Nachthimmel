/**
 * A small, framework-independent canvas layer renderer.
 * Each layer has a stable ID, a visibility predicate, and a draw(frame) function.
 * Adding a new feature requires registration, not changes to the render loop.
 */
export class SkyRenderer {
  #layers = [];

  register({id, draw, visible = () => true, update = null}) {
    if (!id || typeof draw !== 'function' || this.#layers.some(layer => layer.id === id)) {
      throw new Error(`Invalid or duplicate sky layer: ${id}`);
    }
    this.#layers.push({id, draw, visible, update});
    return this;
  }

  get ids() {
    return this.#layers.map(layer => layer.id);
  }

  render(frame) {
    for (const layer of this.#layers) {
      if (!layer.visible(frame)) continue;
      layer.update?.(frame);
      layer.draw(frame);
    }
  }
}
