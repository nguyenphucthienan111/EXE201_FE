// src/services/planService.js
import api from "./api";

/** Get current plan: { plan: 'free' | 'premium' } */
export async function getCurrentPlan() {
  const { data } = await api.get("/plans/me");
  // Chuẩn hoá: trả về { plan: 'free'|'premium' }
  const plan =
    data?.data?.plan ??
    data?.plan ??
    "free";
  return { plan, raw: data };
}

/** Get subscription detail: { isPremiumActive, daysLeft, premiumExpiresAt, ... } */
export async function getSubscriptionInfo() {
  const { data } = await api.get("/plans/subscription");
  const d = data?.data ?? {};
  return {
    isPremiumActive: !!(d.isPremiumActive ?? d.active),
    daysLeft: d.daysLeft ?? 0,
    premiumExpiresAt: d.premiumExpiresAt ?? null,
    premiumStartedAt: d.premiumStartedAt ?? d.premiumStartedAt ?? null,
    isExpiringSoon: !!d.isExpiringSoon,
    raw: data,
  };
}

/** (Dev/QA) Set plan thủ công – KHÔNG dùng ở production */
export async function setPlanDev(plan = "free") {
  const { data } = await api.post("/plans/set", { plan });
  return data;
}
