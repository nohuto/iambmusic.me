import { aimpProfile } from '../data/profiles/aimp.ts';
import { iambProfile } from '../data/profiles/iamb.ts';
import type { AimpProfile, IambProfile, ProfileId } from '../data/types.ts';
import { profileIds } from '../data/types.ts';

export type ProfileContext =
  | { readonly id: 'iamb'; readonly profile: IambProfile }
  | { readonly id: 'aimp'; readonly profile: AimpProfile };

export function isProfileId(value: string): value is ProfileId {
  return (profileIds as readonly string[]).includes(value);
}

export function resolveProfile(id: ProfileId): ProfileContext {
  const context: ProfileContext =
    id === 'iamb' ? { id, profile: iambProfile } : { id, profile: aimpProfile };
  if (context.profile.id !== id) {
    throw new Error(`profile context mismatch: requested ${id}, resolved ${context.profile.id}`);
  }
  return context;
}
