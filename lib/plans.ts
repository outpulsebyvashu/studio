export type PlanId = 'free' | 'solo' | 'practice' | 'studio';
export interface PlanLimits {
  label: string; priceInr: number; clients: number; appointmentTypes: number;
  customDomain: boolean; portal: boolean; seats: number; poweredBy: boolean;
}
const INF = Number.POSITIVE_INFINITY;
export const PLANS: Record<PlanId, PlanLimits> = {
  free:     { label: 'Free',     priceInr: 0,    clients: 5,   appointmentTypes: 1,   customDomain: false, portal: false, seats: 1, poweredBy: true },
  solo:     { label: 'Solo',     priceInr: 499,  clients: 25,  appointmentTypes: INF, customDomain: false, portal: false, seats: 1, poweredBy: true },
  practice: { label: 'Practice', priceInr: 999,  clients: INF, appointmentTypes: INF, customDomain: true,  portal: true,  seats: 1, poweredBy: true },
  studio:   { label: 'Studio',   priceInr: 2499, clients: INF, appointmentTypes: INF, customDomain: true,  portal: true,  seats: 5, poweredBy: true },
};
export function canAddClient(plan: PlanId, current: number): boolean { return current < PLANS[plan].clients; }
export function canAddAppointmentType(plan: PlanId, current: number): boolean { return current < PLANS[plan].appointmentTypes; }
export function annualPriceInr(plan: PlanId): number { return PLANS[plan].priceInr * 10; } // two months free
