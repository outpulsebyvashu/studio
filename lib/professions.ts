export const PROFESSIONS = [
  { id: 'ca', label: 'Chartered accountant', regulated: false },
  { id: 'consultant', label: 'Consultant', regulated: false },
  { id: 'developer', label: 'Developer or designer', regulated: false },
  { id: 'advisor', label: 'Financial advisor', regulated: false },
  { id: 'doctor', label: 'Doctor', regulated: true },
  { id: 'lawyer', label: 'Lawyer', regulated: true },
  { id: 'coach', label: 'Coach or therapist', regulated: false },
  { id: 'other', label: 'Other', regulated: false },
] as const;
export type ProfessionId = (typeof PROFESSIONS)[number]['id'];
export function isProfession(v: unknown): v is ProfessionId {
  return typeof v === 'string' && PROFESSIONS.some((p) => p.id === v);
}
/** Doctors and lawyers: testimonial, review and ranking blocks are OFF by default, with a warning if switched on. */
export function adBlocksDefaultOff(p: ProfessionId): boolean {
  return PROFESSIONS.find((x) => x.id === p)?.regulated ?? false;
}
