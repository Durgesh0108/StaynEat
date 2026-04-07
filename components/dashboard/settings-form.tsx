"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Save, Globe, Phone, Mail, MapPin, Clock, CreditCard, Bell, Key, RefreshCw } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  taxPercentage: z.number().min(0).max(100),
  acceptOnlinePayment: z.boolean(),
  acceptOfflinePayment: z.boolean(),
  notificationEmail: z.string().email().optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  foodModuleEnabled: z.boolean(),
  onlineOrderingEnabled: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface SettingsFormProps {
  business: {
    id: string;
    name: string;
    slug: string;
    type: string;
    description?: string | null;
    logo?: string | null;
    coverImage?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    apiKey?: string | null;
    settings?: {
      checkInTime: string;
      checkOutTime: string;
      taxPercentage: number;
      acceptOnlinePayment: boolean;
      acceptOfflinePayment: boolean;
      notificationEmail?: string | null;
      whatsappNumber?: string | null;
      foodModuleEnabled: boolean;
      onlineOrderingEnabled: boolean;
    } | null;
  };
}

export function SettingsForm({ business }: SettingsFormProps) {
  const [logo, setLogo] = useState<string>(business.logo ?? "");
  const [coverImage, setCoverImage] = useState<string>(business.coverImage ?? "");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(business.apiKey ?? "");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "payment" | "notifications" | "api">("profile");

  const s = business.settings;
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: business.name,
      description: business.description ?? "",
      address: business.address ?? "",
      city: business.city ?? "",
      state: business.state ?? "",
      pincode: business.pincode ?? "",
      phone: business.phone ?? "",
      email: business.email ?? "",
      website: business.website ?? "",
      checkInTime: s?.checkInTime ?? "14:00",
      checkOutTime: s?.checkOutTime ?? "11:00",
      taxPercentage: s?.taxPercentage ?? 18,
      acceptOnlinePayment: s?.acceptOnlinePayment ?? true,
      acceptOfflinePayment: s?.acceptOfflinePayment ?? true,
      notificationEmail: s?.notificationEmail ?? "",
      whatsappNumber: s?.whatsappNumber ?? "",
      foodModuleEnabled: s?.foodModuleEnabled ?? true,
      onlineOrderingEnabled: s?.onlineOrderingEnabled ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, logo, coverImage }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved successfully");
    } catch { toast.error("Failed to save settings"); }
    finally { setLoading(false); }
  };

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch(`/api/businesses/${business.id}/api-key`, { method: "POST" });
      const json = await res.json();
      if (json.apiKey) { setApiKey(json.apiKey); toast.success("New API key generated"); }
    } catch { toast.error("Failed to generate API key"); }
    finally { setGeneratingKey(false); }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: Globe },
    { id: "payment", label: "Payment & Tax", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Key", icon: Key },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Business Info</h3>
            <div>
              <label className="label">Business Name *</label>
              <input {...register("name")} className="input" />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Description</label>
              <textarea {...register("description")} rows={3} className="input resize-none" placeholder="Describe your business..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1"><Phone className="h-3 w-3" />Phone</label>
                <input {...register("phone")} className="input" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="label flex items-center gap-1"><Mail className="h-3 w-3" />Email</label>
                <input {...register("email")} type="email" className="input" />
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-1"><Globe className="h-3 w-3" />Website</label>
              <input {...register("website")} className="input" placeholder="https://example.com" />
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" />Address
            </h3>
            <div>
              <label className="label">Street Address</label>
              <input {...register("address")} className="input" placeholder="123, Main Street" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">City</label>
                <input {...register("city")} className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input {...register("state")} className="input" />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input {...register("pincode")} className="input" />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Branding</h3>
            <ImageUploader value={logo} onChange={(v) => setLogo(v as string)} label="Business Logo" folder="hospitpro/logos" />
            <ImageUploader value={coverImage} onChange={(v) => setCoverImage(v as string)} label="Cover Image" folder="hospitpro/covers" />
          </div>

          {(business.type === "HOTEL" || business.type === "BOTH") && (
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" />Check-in / Check-out
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Check-in Time</label>
                  <input {...register("checkInTime")} type="time" className="input" />
                </div>
                <div>
                  <label className="label">Check-out Time</label>
                  <input {...register("checkOutTime")} type="time" className="input" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === "payment" && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Payment Methods</h3>
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
              <input {...register("acceptOnlinePayment")} type="checkbox" className="w-4 h-4 accent-primary-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Accept Online Payment</p>
                <p className="text-xs text-gray-500">Via Razorpay (UPI, Cards, Net Banking)</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
              <input {...register("acceptOfflinePayment")} type="checkbox" className="w-4 h-4 accent-primary-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Accept Offline Payment</p>
                <p className="text-xs text-gray-500">Cash or card at time of service</p>
              </div>
            </label>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Tax Settings</h3>
            <div className="max-w-xs">
              <label className="label">GST / Tax Percentage (%)</label>
              <input {...register("taxPercentage", { valueAsNumber: true })} type="number" step="0.5" min="0" max="100" className="input" />
              <p className="text-xs text-gray-400 mt-1">Applied to all orders and bookings</p>
            </div>
          </div>
          {(business.type === "RESTAURANT" || business.type === "BOTH") && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Food Module</h3>
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                <input {...register("foodModuleEnabled")} type="checkbox" className="w-4 h-4 accent-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Food Module</p>
                  <p className="text-xs text-gray-500">Show food menu on your public page</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                <input {...register("onlineOrderingEnabled")} type="checkbox" className="w-4 h-4 accent-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Online Ordering</p>
                  <p className="text-xs text-gray-500">Allow customers to place orders online</p>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notification Preferences</h3>
          <div>
            <label className="label">Notification Email</label>
            <input {...register("notificationEmail")} type="email" className="input" placeholder="alerts@yourbusiness.com" />
            <p className="text-xs text-gray-400 mt-1">Receive booking and order alerts to this email</p>
          </div>
          <div>
            <label className="label">WhatsApp Number</label>
            <input {...register("whatsappNumber")} className="input" placeholder="9876543210" />
            <p className="text-xs text-gray-400 mt-1">For WhatsApp notification links</p>
          </div>
        </div>
      )}

      {/* API Key Tab */}
      {activeTab === "api" && (
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">API Key</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Use this key to access the HospitPro API for your custom integrations.</p>
          </div>
          {apiKey ? (
            <div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={apiKey}
                  className="input font-mono text-xs flex-1"
                  onClick={(e) => { (e.target as HTMLInputElement).select(); }}
                />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied!"); }}
                  className="btn-secondary text-xs px-3 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">⚠️ Keep this key secret. Never expose it in client-side code.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No API key generated yet.</p>
          )}
          <button
            type="button"
            onClick={generateApiKey}
            disabled={generatingKey}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${generatingKey ? "animate-spin" : ""}`} />
            {apiKey ? "Regenerate Key" : "Generate API Key"}
          </button>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">API Documentation</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              See <a href="/dashboard/api-docs" className="underline">API Docs</a> for endpoints and usage.
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      {activeTab !== "api" && (
        <div className="mt-6">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </form>
  );
}
