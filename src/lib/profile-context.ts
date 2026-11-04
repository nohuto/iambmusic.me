import { aimbProfile } from '../data/profiles/aimb.ts';
import { iambProfile } from '../data/profiles/iamb.ts';
import type { AimbProfile, IambProfile, ProfileId } from '../data/types.ts';

type ProfileContext = { readonly profile: IambProfile | AimbProfile };

export function resolveProfile(id: ProfileId): ProfileContext {
  const context: ProfileContext =
    id === 'iamb' ? { profile: iambProfile } : { profile: aimbProfile };
  if (context.profile.id !== id) {
    throw new Error(
      `profile context mismatch: requested ${id}, resolved ${context.profile.id}`,
    );
  }
  return context;
}
