"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

const schema = z.object({
  siteName: z.string().min(2),
  supportEmail: z.string().email(),
  trialDays: z.number().min(1).max(90),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  maintenanceMode: z.boolean(),
  allowNewRegistrations: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function AdminSettingsClient({ settings }: { settings: Record<string, string> }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      siteName: settings.siteName ?? "HospitPro",
      supportEmail: settings.supportEmail ?? "support@hospitpro.com",
      trialDays: parseInt(settings.trialDays ?? "14"),
      monthlyPrice: parseInt(settings.monthlyPrice ?? "999"),
      yearlyPrice: parseInt(settings.yearlyPrice ?? "9999"),
      maintenanceMode: settings.maintenanceMode === "true",
      allowNewRegistrations: settings.allowNewRegistrations !== "false",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">General</h3>
        <div>
          <label className="label">Platform Name</label>
          <input {...register("siteName")} className="input" />
          {errors.siteName && <p className="text-danger-500 text-xs mt-1">{errors.siteName.message}</p>}
        </div>
        <div>
          <label className="label">Support Email</label>
          <input {...register("supportEmail")} type="email" className="input" />
          {errors.supportEmail && <p className="text-danger-500 text-xs mt-1">{errors.supportEmail.message}</p>}
        </div>
        <div>
          <label className="label">Trial Period (days)</label>
          <input {...register("trialDays", { valueAsNumber: true })} type="number" min="1" max="90" className="input" />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pricing (₹)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Monthly Price</label>
            <input {...register("monthlyPrice", { valueAsNumber: true })} type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">Yearly Price</label>
            <input {...register("yearlyPrice", { valueAsNumber: true })} type="number" min="0" className="input" />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Platform Controls</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input {...register("allowNewRegistrations")} type="checkbox" className="w-4 h-4 accent-primary-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Allow New Registrations</p>
            <p className="text-xs text-gray-500">New businesses can sign up on the platform</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input {...register("maintenanceMode")} type="checkbox" className="w-4 h-4 accent-primary-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ This will show a maintenance page to all users</p>
          </div>
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
        <Save className="h-4 w-4" />
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
