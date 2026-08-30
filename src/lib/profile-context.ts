import { aimbProfile } from '../data/profiles/aimb.ts';
import { iambProfile } from '../data/profiles/iamb.ts';
import type { AimbProfile, IambProfile, ProfileId } from '../data/types.ts';

export type ProfileContext =
  | { readonly id: 'iamb'; readonly profile: IambProfile }
  | { readonly id: 'aimb'; readonly profile: AimbProfile };

export function resolveProfile(id: ProfileId): ProfileContext {
  const context: ProfileContext =
    id === 'iamb' ? { id, profile: iambProfile } : { id, profile: aimbProfile };
  if (context.profile.id !== id) {
    throw new Error(`profile context mismatch: requested ${id}, resolved ${context.profile.id}`);
  }
  return context;
}
