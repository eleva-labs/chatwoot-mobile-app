import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@application/store/auth/authSelectors';
import { getUserPermissions } from '@infrastructure/utils/permissionUtils';
import { CONVERSATION_PERMISSIONS } from '@domain/constants/permissions';

/**
 * Returns whether the current user has any conversation-related permission.
 *
 * Replaces the repeated pattern of:
 *   const userPermissions = user ? getUserPermissions(user, accountId) : [];
 *   const hasConversationPermission = CONVERSATION_PERMISSIONS.some(p => userPermissions.includes(p));
 */
export const useConversationPermission = (): boolean => {
  const user = useSelector(selectUser);
  const accountId = user?.account_id ?? null;
  return useMemo(() => {
    const perms = user ? getUserPermissions(user, accountId) : [];
    return CONVERSATION_PERMISSIONS.some(p => perms.includes(p));
  }, [user, accountId]);
};

/**
 * Returns the full permissions array for the current user.
 * Useful when you need to check specific individual permissions.
 */
export const useUserPermissions = (): string[] => {
  const user = useSelector(selectUser);
  const accountId = user?.account_id ?? null;
  return useMemo(() => {
    return user ? getUserPermissions(user, accountId) : [];
  }, [user, accountId]);
};
