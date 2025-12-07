/**
 * Generic Mapper Interface
 *
 * Base interface for all mappers that transform between types.
 * Infrastructure layer implements these to handle DTO ↔ Domain conversions.
 *
 * @template TSource - The source type (typically a DTO)
 * @template TTarget - The target type (typically a domain entity)
 */
export interface IMapper<TSource, TTarget> {
  /**
   * Map a single source object to target
   */
  map(source: TSource): TTarget;

  /**
   * Map an array of source objects to targets
   */
  mapMany(sources: TSource[]): TTarget[];
}
