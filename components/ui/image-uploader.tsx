"use client";

import { useCallback, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  folder?: string;
  maxFiles?: number;
  className?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  multiple = false,
  folder = "hospitpro",
  maxFiles = 5,
  className,
  label = "Upload Image",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const images = multiple
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : [];
  const singleImage = !multiple ? (typeof value === "string" ? value : undefined) : undefined;

  const uploadFile = async (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: reader.result, folder }),
          });
          const json = await res.json();
          if (!json.url) throw new Error("Upload failed");
          resolve(json.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!multiple && fileArray.length > 1) {
        toast.error("Only one image allowed");
        return;
      }
      if (multiple && images.length + fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} images allowed`);
        return;
      }

      setUploading(true);
      try {
        const urls = await Promise.all(fileArray.map(uploadFile));
        if (multiple) {
          onChange([...images, ...urls]);
        } else {
          onChange(urls[0]);
        }
        toast.success("Image uploaded successfully");
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [multiple, images, maxFiles, onChange, folder]
  );

  const removeImage = (index?: number) => {
    if (multiple && index !== undefined) {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    } else {
      onChange(multiple ? [] : "");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="label">{label}</p>}

      {/* Drop Zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200",
          dragOver
            ? "border-primary-400 bg-primary-50 dark:bg-primary-950"
            : "border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin mb-2" />
        ) : (
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {uploading ? "Uploading..." : "Click or drag & drop to upload"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
      </label>

      {/* Preview */}
      {!multiple && singleImage && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden group">
          <Image
            src={singleImage}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => removeImage()}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {multiple && images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
              <Image src={img} alt={`Image ${i + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < maxFiles && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
