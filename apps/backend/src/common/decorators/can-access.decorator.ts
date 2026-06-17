import { SetMetadata } from '@nestjs/common';

export const CAN_ACCESS_KEY = 'can-access';
export type CanAccessOptions = {
  roles?: string[];
  permissions?: string[];
};

export const CanAccess = (options: CanAccessOptions = {}) => SetMetadata(CAN_ACCESS_KEY, options);
