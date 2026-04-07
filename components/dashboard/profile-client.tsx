"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Mail, Phone, Shield, Calendar, Camera, KeyRound } from "lucide-react";
import { format } from "date-fns";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    image?: string | null;
    role: string;
    createdAt: string;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const { update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? null);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSaving },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? "" },
  });

  const {
    register: regPwd,
    handleSubmit: handlePassword,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSaving },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSave = async (data: ProfileForm) => {
    try {
      const res = await fetch(`/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to update profile");
      }
      await update({ name: data.name });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const onPasswordSave = async (data: PasswordForm) => {
    try {
      const res = await fetch(`/api/profile/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to change password");
      }
      resetPwd();
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "");
      formData.append("folder", "avatars");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const json = await res.json();
      if (!json.secure_url) throw new Error("Upload failed");

      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: json.secure_url }),
      });
      setAvatarUrl(json.secure_url);
      await update({ image: json.secure_url });
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user.name}
                width={72}
                height={72}
                className="w-18 h-18 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
              <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield className="h-3 w-3 text-primary-500" />
              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize">
                {user.role.toLowerCase().replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-gray-400">Member since</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-0.5">
              {format(new Date(user.createdAt), "MMM yyyy")}
            </p>
          </div>
        </div>
        {uploading && <p className="text-xs text-gray-400 mt-3">Uploading photo...</p>}
      </div>

      {/* Personal info */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
        <form onSubmit={handleProfile(onProfileSave)} className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </label>
            <input {...regProfile("name")} className="input" placeholder="Your full name" />
            {profileErrors.name && <p className="text-danger-500 text-xs mt-1">{profileErrors.name.message}</p>}
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </label>
            <input value={user.email} disabled className="input opacity-60 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone Number
            </label>
            <input {...regProfile("phone")} className="input" placeholder="9876543210" />
            {profileErrors.phone && <p className="text-danger-500 text-xs mt-1">{profileErrors.phone.message}</p>}
          </div>
          <button type="submit" disabled={profileSaving} className="btn-primary">
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Change Password
        </h2>
        <form onSubmit={handlePassword(onPasswordSave)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...regPwd("currentPassword")} type="password" className="input" placeholder="••••••••" />
            {pwdErrors.currentPassword && <p className="text-danger-500 text-xs mt-1">{pwdErrors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...regPwd("newPassword")} type="password" className="input" placeholder="Min. 8 characters" />
            {pwdErrors.newPassword && <p className="text-danger-500 text-xs mt-1">{pwdErrors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...regPwd("confirmPassword")} type="password" className="input" placeholder="••••••••" />
            {pwdErrors.confirmPassword && <p className="text-danger-500 text-xs mt-1">{pwdErrors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={pwdSaving} className="btn-primary">
            {pwdSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
