import {
  UserRole,
  BusinessType,
  SubscriptionPlan,
  SubscriptionStatus,
  RoomType,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  MenuCategory,
  SpiceLevel,
  OrderStatus,
  OrderType,
  QRCodeType,
  NotificationType,
  CouponType,
  StaffRole,
} from "@prisma/client";

// Re-export enums
export {
  UserRole,
  BusinessType,
  SubscriptionPlan,
  SubscriptionStatus,
  RoomType,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  MenuCategory,
  SpiceLevel,
  OrderStatus,
  OrderType,
  QRCodeType,
  NotificationType,
  CouponType,
  StaffRole,
};

// ===================== CORE TYPES =====================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  image?: string | null;
  role: UserRole;
  emailVerified?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  type: BusinessType;
  ownerId: string;
  owner?: User;
  subscriptionPlan?: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  trialEndsAt?: Date | null;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  razorpayAccountId?: string | null;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  apiKey?: string | null;
  settings?: BusinessSettings | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSettings {
  id: string;
  businessId: string;
  acceptOnlinePayment: boolean;
  acceptOfflinePayment: boolean;
  autoConfirmBookings: boolean;
  checkInTime: string;
  checkOutTime: string;
  currencyCode: string;
  taxPercentage: number;
  notificationEmail?: string | null;
  whatsappNumber?: string | null;
  customThemeColor?: string | null;
  customFont?: string | null;
  foodModuleEnabled: boolean;
  onlineOrderingEnabled: boolean;
  operatingHours?: string | null;
}

export interface Room {
  id: string;
  businessId: string;
  name: string;
  roomNumber: string;
  type: RoomType;
  description?: string | null;
  pricePerNight: number;
  maxOccupancy: number;
  images: string[];
  amenities: string[];
  floor?: number | null;
  isAvailable: boolean;
  isActive: boolean;
  qrCode?: { id: string; url: string; scanCount: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  businessId: string;
  business?: Business;
  roomId: string;
  room?: Room;
  customerId?: string | null;
  customer?: User | null;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  adults: number;
  children: number;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  status: BookingStatus;
  specialRequests?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  price: number;
  category: MenuCategory;
  image?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isActive: boolean;
  isFeatured: boolean;
  preparationTime: number;
  spiceLevel?: SpiceLevel | null;
  allergens: string[];
  nutritionInfo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  businessId: string;
  tableNumber: string;
  capacity: number;
  floor?: number | null;
  section?: string | null;
  isActive: boolean;
  qrCode?: QRCode | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  businessId: string;
  customerId?: string | null;
  tableId?: string | null;
  table?: Table | null;
  roomId?: string | null;
  bookingId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  status: OrderStatus;
  type: OrderType;
  specialInstructions?: string | null;
  notes?: string | null;
  estimatedTime?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations: string[];
  notes?: string | null;
}

export interface QRCode {
  id: string;
  businessId: string;
  tableId?: string | null;
  type: QRCodeType;
  url: string;
  qrImageUrl?: string | null;
  label?: string | null;
  isActive: boolean;
  scanCount: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  businessId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  razorpaySubscriptionId?: string | null;
  razorpayPaymentId?: string | null;
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  businessId: string;
  guestName: string;
  guestEmail?: string | null;
  rating: number;
  comment?: string | null;
  ownerReply?: string | null;
  isApproved: boolean;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  businessId: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  businessId: string;
  date: Date;
  category: string;
  amount: number;
  description?: string | null;
  receiptUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  businessId?: string | null;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: string | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  businessId?: string | null;
  userId?: string | null;
  user?: User | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

// ===================== CART TYPES =====================

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: string[];
  notes?: string;
}

export interface Cart {
  businessId: string;
  tableId?: string;
  tableNumber?: string;
  items: CartItem[];
}

// ===================== FORM TYPES =====================

export interface BookingFormData {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  paymentMethod: "ONLINE" | "OFFLINE";
  couponCode?: string;
}

export interface OrderFormData {
  tableId?: string;
  roomId?: string;
  bookingId?: string;
  guestName?: string;
  guestPhone?: string;
  type: OrderType;
  paymentMethod: "ONLINE" | "OFFLINE";
  specialInstructions?: string;
  couponCode?: string;
}

// ===================== API RESPONSE TYPES =====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== DASHBOARD TYPES =====================

export interface DashboardStats {
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  totalBookings: number;
  bookingsToday: number;
  pendingBookings: number;
  totalOrders: number;
  ordersToday: number;
  pendingOrders: number;
  occupancyRate: number;
  checkInsToday: number;
  checkOutsToday: number;
  averageOrderValue: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  bookings?: number;
  orders?: number;
}

export interface TopMenuItem {
  menuItem: MenuItem;
  totalOrdered: number;
  totalRevenue: number;
}

// ===================== SUPER ADMIN TYPES =====================

export interface PlatformStats {
  totalBusinesses: number;
  activeSubscriptions: number;
  trialBusinesses: number;
  expiredSubscriptions: number;
  mrr: number;
  arr: number;
  totalBookings: number;
  totalOrders: number;
  totalRevenue: number;
  newSignupsToday: number;
  newSignupsThisMonth: number;
}

// ===================== RAZORPAY TYPES =====================

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
}

export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ===================== SESSION TYPES =====================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
  businessId?: string | null;
  businessSlug?: string | null;
  businessType?: BusinessType | null;
  impersonating?: boolean;
  impersonatedBusinessId?: string | null;
}
