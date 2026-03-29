 "use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { useEffect, useState } from "react";

import { primary } from "@/lib/theme";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  features: string[];
}

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface SubscriptionStatus {
  plan_id: string;
  status: string;
  renews_at?: string | null;
  cancel_at_period_end: boolean;
  payment_method?: PaymentMethod | null;
}

interface PaymentsResponse {
  available_plans: Plan[];
  subscription: SubscriptionStatus;
}

export default function BillingPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${getPublicApiUrl()}/api/v1/payments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || "Failed to load billing information");
          return;
        }
        const body = await res.json();
        setData(body);
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
          style={{ borderTopColor: primary }}
        />
        <p className="text-slate-500 dark:text-slate-400">Loading billing details…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-2">{error || "Unable to load billing data."}</p>
      </div>
    );
  }

  const { available_plans, subscription } = data;
  const currentPlan = available_plans.find((p) => p.id === subscription.plan_id);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">Billing</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Manage your subscription, payment method, and plan.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr,1.2fr] gap-6 mt-4">
        {/* Current subscription */}
        <div className="glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: primary }}>
              credit_card
            </span>
            Current subscription
          </h3>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                {currentPlan ? currentPlan.name : subscription.plan_id}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Status: <span className="font-medium">{subscription.status}</span>
              </p>
              {subscription.renews_at && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Renews on {new Date(subscription.renews_at).toLocaleDateString()}
                </p>
              )}
            </div>
            {subscription.payment_method ? (
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {subscription.payment_method.brand} •••• {subscription.payment_method.last4}
                </p>
                <p>
                  Expires {subscription.payment_method.exp_month.toString().padStart(2, "0")}/
                  {subscription.payment_method.exp_year}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">No payment method on file.</p>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Update payment method
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Cancel at period end
            </button>
          </div>
        </div>

        {/* Plan selection */}
        <div className="glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 md:p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: primary }}>
              workspace_premium
            </span>
            Available plans
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {available_plans.map((plan) => {
              const isCurrent = plan.id === subscription.plan_id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 flex flex-col gap-2 ${
                    isCurrent
                      ? "border-primary/60 bg-primary/5"
                      : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.name}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {plan.price_monthly === 0 ? (
                      "Free"
                    ) : (
                      <>
                        ${plan.price_monthly.toFixed(0)}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> /month</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">{plan.description}</p>
                  <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mt-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[14px]" style={{ color: primary }}>
                          check
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={isCurrent}
                    className={`mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      isCurrent
                        ? "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-default"
                        : "border-primary text-white"
                    }`}
                    style={isCurrent ? undefined : { backgroundColor: primary }}
                  >
                    {isCurrent ? "Current plan" : "Switch to this plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

