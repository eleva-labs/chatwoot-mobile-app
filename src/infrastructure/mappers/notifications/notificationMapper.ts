import camelcaseKeys from 'camelcase-keys';
import type { Notification, NotificationMeta } from '@/domain/notifications/entities/Notification';
import type {
  NotificationDTO,
  NotificationMetaDTO,
} from '@/infrastructure/repositories/notifications/dto/NotificationDTO';

/**
 * Infrastructure Layer: Notification Mapper
 *
 * Mapper class that converts DTOs (Data Transfer Objects) to Domain entities.
 * Handles the conversion from snake_case (API/DTO) to camelCase (Domain).
 */
export class NotificationMapper {
  /**
   * Map Notification DTO to Domain entity
   *
   * Converts snake_case properties to camelCase and transforms to Domain entity.
   *
   * @param notificationDTO - Notification in DTO format (snake_case)
   * @returns Notification in Domain format (camelCase)
   */
  mapNotificationFromDTO(notificationDTO: NotificationDTO): Notification {
    return camelcaseKeys(notificationDTO, { deep: true }) as unknown as Notification;
  }

  /**
   * Map Notification Meta DTO to Domain entity
   *
   * Converts snake_case properties to camelCase and transforms to Domain entity.
   *
   * @param metaDTO - Meta in DTO format (snake_case)
   * @returns NotificationMeta in Domain format (camelCase)
   */
  mapNotificationMetaFromDTO(metaDTO: NotificationMetaDTO): NotificationMeta {
    return camelcaseKeys(metaDTO, { deep: true }) as unknown as NotificationMeta;
  }
}
