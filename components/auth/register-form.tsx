"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum(["HOTEL", "RESTAURANT", "BOTH"]),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(10, "Enter a valid phone number"),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: "HOTEL" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Registration failed");
        return;
      }

      toast.success("Account created! Signing you in...");

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        14-day free trial — No credit card required
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal Info */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input {...register("name")} type="text" placeholder="Your full name" className="input pl-10" />
            </div>
            {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input {...register("email")} type="email" placeholder="you@example.com" className="input pl-10" />
            </div>
            {errors.email && <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Business Info</p>
          <div className="space-y-4">
            <div>
              <label className="label">Business Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input {...register("businessName")} type="text" placeholder="The Grand Palace" className="input pl-10" />
              </div>
              {errors.businessName && <p className="text-danger-500 text-xs mt-1">{errors.businessName.message}</p>}
            </div>

            <div>
              <label className="label">Business Type</label>
              <select {...register("businessType")} className="input">
                <option value="HOTEL">Hotel</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="BOTH">Hotel + Restaurant</option>
              </select>
              {errors.businessType && <p className="text-danger-500 text-xs mt-1">{errors.businessType.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register("city")} type="text" placeholder="Mumbai" className="input pl-10" />
                </div>
                {errors.city && <p className="text-danger-500 text-xs mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register("phone")} type="tel" placeholder="9876543210" className="input pl-10" />
                </div>
                {errors.phone && <p className="text-danger-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Start Free Trial"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-primary-600 dark:text-primary-400">Terms</Link> and{" "}
          <Link href="/privacy" className="text-primary-600 dark:text-primary-400">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
