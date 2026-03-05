/**
 * Component Registry [CORE]
 *
 * Generic registry for registering and looking up components by key.
 * Used for part renderers and tool-specific renderers.
 * Framework-agnostic — works with React, Vue, or any component type.
 */

/**
 * A simple key-value registry with type-safe registration and lookup.
 */
export class ComponentRegistry<TComponent> {
  private readonly registry = new Map<string, TComponent>();

  /**
   * Register a component for a given key.
   * Overwrites any previously registered component for the same key.
   */
  register(key: string, component: TComponent): void {
    this.registry.set(key, component);
  }

  /**
   * Look up a component by key.
   * Returns undefined if no component is registered for the key.
   */
  get(key: string): TComponent | undefined {
    return this.registry.get(key);
  }

  /**
   * Check if a component is registered for the given key.
   */
  has(key: string): boolean {
    return this.registry.has(key);
  }

  /**
   * Get all registered keys.
   */
  keys(): string[] {
    return Array.from(this.registry.keys());
  }
}
