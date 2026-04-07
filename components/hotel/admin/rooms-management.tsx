"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, BedDouble, QrCode } from "lucide-react";
import { Room, RoomType } from "@/types";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageUploader } from "@/components/ui/image-uploader";
import { formatCurrency } from "@/utils/formatCurrency";
import toast from "react-hot-toast";
import Image from "next/image";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const roomSchema = z.object({
  name: z.string().min(2, "Room name required"),
  roomNumber: z.string().min(1, "Room number required"),
  type: z.enum(["SINGLE", "DOUBLE", "SUITE", "DELUXE", "PRESIDENTIAL"]),
  description: z.string().optional(),
  pricePerNight: z.number().min(1, "Price required"),
  maxOccupancy: z.number().min(1, "Max occupancy required"),
  floor: z.number().optional(),
  amenities: z.string(),
  isAvailable: z.boolean(),
});

type RoomFormData = z.infer<typeof roomSchema>;

const COMMON_AMENITIES = [
  "Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Safe", "Bathtub",
  "Shower", "Hair Dryer", "Work Desk", "Coffee Maker", "Room Service",
  "King Bed", "Queen Bed", "Twin Beds",
];

interface RoomsManagementProps {
  businessId: string;
  businessSlug: string;
  initialRooms: Room[];
}

export function RoomsManagement({ businessId, businessSlug, initialRooms }: RoomsManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Room | null>(null);
  const [qrModalRoom, setQrModalRoom] = useState<Room | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: { type: "DOUBLE", isAvailable: true, maxOccupancy: 2, pricePerNight: 0 },
  });

  const openAdd = () => {
    setEditingRoom(null);
    setImages([]);
    setSelectedAmenities([]);
    reset({ type: "DOUBLE", isAvailable: true, maxOccupancy: 2, pricePerNight: 0 });
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setImages(room.images);
    setSelectedAmenities(room.amenities);
    reset({
      name: room.name,
      roomNumber: room.roomNumber,
      type: room.type as RoomType,
      description: room.description ?? "",
      pricePerNight: room.pricePerNight,
      maxOccupancy: room.maxOccupancy,
      floor: room.floor ?? undefined,
      amenities: room.amenities.join(", "),
      isAvailable: room.isAvailable,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: RoomFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        businessId,
        images,
        amenities: selectedAmenities,
        floor: data.floor ?? null,
      };

      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (editingRoom) {
        setRooms(rooms.map((r) => (r.id === editingRoom.id ? json.room : r)));
        toast.success("Room updated successfully");
      } else {
        setRooms([...rooms, json.room]);
        toast.success("Room added successfully");
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save room");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (room: Room) => {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !room.isAvailable }),
      });
      if (res.ok) {
        setRooms(rooms.map((r) => (r.id === room.id ? { ...r, isAvailable: !r.isAvailable } : r)));
        toast.success(`Room marked as ${!room.isAvailable ? "available" : "unavailable"}`);
      }
    } catch { toast.error("Failed to update availability"); }
  };

  const deleteRoom = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        setRooms(rooms.filter((r) => r.id !== deleteConfirm.id));
        toast.success("Room deleted");
        setDeleteConfirm(null);
      }
    } catch { toast.error("Failed to delete room"); }
    finally { setLoading(false); }
  };

  const generateQR = async (room: Room) => {
    setLoading(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const url = `${appUrl}/h/${businessSlug}/menu?room=${room.roomNumber}`;
      const res = await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          roomId: room.id,
          type: "HOTEL_MENU",
          url,
          label: `Room ${room.roomNumber}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const updatedRoom = { ...room, qrCode: json.qrCode };
      setRooms(rooms.map((r) => (r.id === room.id ? updatedRoom : r)));
      setQrModalRoom(updatedRoom);
      toast.success("QR code generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate QR");
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rooms.length} room{rooms.length !== 1 ? "s" : ""} total</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms yet"
          description="Add your first room to start accepting bookings from guests."
          action={{ label: "Add First Room", onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative h-44">
                <Image
                  src={room.images[0] ?? "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"}
                  alt={room.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(room)}
                    className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-primary-600"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(room)}
                    className="p-1.5 bg-white rounded-lg shadow text-gray-600 hover:text-danger-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {room.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    +{room.images.length - 1} photos
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                    <p className="text-xs text-gray-400">Room {room.roomNumber} · {room.type.replace("_", " ")}</p>
                  </div>
                  <button onClick={() => toggleAvailability(room)} className="flex-shrink-0">
                    {room.isAvailable ? (
                      <ToggleRight className="h-6 w-6 text-success-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(room.pricePerNight)}<span className="text-xs text-gray-400 font-normal">/night</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${room.isAvailable ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-500"}`}>
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                {room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs text-gray-400">+{room.amenities.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {room.qrCode ? (
                    <button
                      onClick={() => setQrModalRoom(room)}
                      className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      View Room Service QR
                    </button>
                  ) : (
                    <button
                      onClick={() => generateQR(room)}
                      disabled={loading}
                      className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Generate Room QR
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? "Edit Room" : "Add New Room"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room Name *</label>
              <input {...register("name")} placeholder="Deluxe Double Room" className="input" />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Room Number *</label>
              <input {...register("roomNumber")} placeholder="101" className="input" />
              {errors.roomNumber && <p className="text-danger-500 text-xs mt-1">{errors.roomNumber.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type *</label>
              <select {...register("type")} className="input">
                {["SINGLE", "DOUBLE", "SUITE", "DELUXE", "PRESIDENTIAL"].map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Floor</label>
              <input {...register("floor", { valueAsNumber: true })} type="number" placeholder="1" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price per Night (₹) *</label>
              <input {...register("pricePerNight", { valueAsNumber: true })} type="number" placeholder="2500" className="input" />
              {errors.pricePerNight && <p className="text-danger-500 text-xs mt-1">{errors.pricePerNight.message}</p>}
            </div>
            <div>
              <label className="label">Max Occupancy *</label>
              <input {...register("maxOccupancy", { valueAsNumber: true })} type="number" placeholder="2" className="input" />
              {errors.maxOccupancy && <p className="text-danger-500 text-xs mt-1">{errors.maxOccupancy.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register("description")} rows={2} placeholder="Room description..." className="input resize-none" />
          </div>

          <div>
            <label className="label">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedAmenities.includes(amenity)
                      ? "bg-primary-50 dark:bg-primary-950 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <ImageUploader
            value={images}
            onChange={(urls) => setImages(urls as string[])}
            multiple
            maxFiles={8}
            folder="hospitpro/rooms"
            label="Room Photos"
          />

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isAvailable"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 accent-primary-500 rounded"
                />
              )}
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">Room is available for booking</label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={!!qrModalRoom} onClose={() => setQrModalRoom(null)} title={`Room Service QR — Room ${qrModalRoom?.roomNumber}`} size="sm">
        {qrModalRoom?.qrCode && (
          <div className="p-6 flex flex-col items-center">
            <QRCodeDisplay
              url={qrModalRoom.qrCode.url}
              label={`${qrModalRoom.name} · Room ${qrModalRoom.roomNumber}`}
              size={200}
              showDownload
            />
            <p className="text-xs text-gray-400 mt-4 text-center">
              Place this QR code in Room {qrModalRoom.roomNumber}. Guests scan it to order room service directly.
            </p>
            <div className="mt-3 w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">QR URL</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{qrModalRoom.qrCode.url}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteRoom}
        title="Delete Room"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and will affect all existing bookings.`}
        confirmLabel="Delete Room"
        loading={loading}
      />
    </>
  );
}
