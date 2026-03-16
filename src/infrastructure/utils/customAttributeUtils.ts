import camelCase from 'lodash/camelCase';
import { CustomAttribute } from '@domain/types';

/**
 * Processes custom attributes, filtering by a condition and merging values from
 * the customAttributes record into each matching CustomAttribute.
 */
export const processContactAttributes = (
  attributes: CustomAttribute[],
  customAttributes: Record<string, string>,
  filterCondition: (key: string, custom: Record<string, string>) => boolean,
): CustomAttribute[] => {
  if (!attributes.length || !customAttributes) {
    return [];
  }

  return attributes.reduce<CustomAttribute[]>((result, attribute) => {
    const { attributeKey } = attribute;
    const meetsCondition = filterCondition(camelCase(attributeKey), customAttributes);

    if (meetsCondition) {
      result.push({
        ...attribute,
        value: customAttributes[camelCase(attributeKey)] ?? '',
      });
    }

    return result;
  }, []);
};
