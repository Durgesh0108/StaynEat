import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding HospitPro database...");

  // ─── Super Admin ───────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@hospitpro.com" },
    update: {},
    create: {
      email: "admin@hospitpro.com",
      password: await bcrypt.hash("admin@123", 12),
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Super Admin created:", superAdmin.email);

  // ─── Demo Hotel ────────────────────────────────────────────────────
  const hotelOwner = await prisma.user.upsert({
    where: { email: "owner@grandpalace.com" },
    update: {},
    create: {
      email: "owner@grandpalace.com",
      password: await bcrypt.hash("hotel@123", 12),
      name: "Rajesh Kumar",
      phone: "9876543210",
      role: "OWNER",
      isActive: true,
    },
  });

  let hotelBusiness = await prisma.business.findUnique({ where: { slug: "demo-hotel" } });
  if (!hotelBusiness) {
    hotelBusiness = await prisma.business.create({
      data: {
        slug: "demo-hotel",
        name: "The Grand Palace Hotel",
        type: "BOTH",
        ownerId: hotelOwner.id,
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: "YEARLY",
        subscriptionStartDate: new Date(),
        subscriptionEndDate: addDays(new Date(), 365),
        logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200",
        coverImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200",
        description:
          "Experience luxury and comfort at The Grand Palace Hotel. Nestled in the heart of the city, we offer world-class amenities, fine dining, and impeccable service for a truly memorable stay.",
        address: "42, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        phone: "080-12345678",
        email: "info@grandpalace.com",
        website: "https://grandpalace.com",
        isVerified: true,
        isActive: true,
        isFeatured: true,
        apiKey: "hp_demohotelkey1234567890abcdefghijklmnop",
        settings: {
          create: {
            acceptOnlinePayment: true,
            acceptOfflinePayment: true,
            autoConfirmBookings: false,
            checkInTime: "14:00",
            checkOutTime: "11:00",
            currencyCode: "INR",
            taxPercentage: 18,
            notificationEmail: "owner@grandpalace.com",
            whatsappNumber: "9876543210",
            foodModuleEnabled: true,
            onlineOrderingEnabled: true,
          },
        },
      },
    });
  }
  console.log("✅ Demo hotel created:", hotelBusiness.name);

  // ─── Hotel Rooms ───────────────────────────────────────────────────
  const roomData = [
    {
      name: "Standard Single Room",
      roomNumber: "101",
      type: "SINGLE" as const,
      description: "Cozy single room with modern amenities, perfect for solo travelers.",
      pricePerNight: 2500,
      maxOccupancy: 1,
      floor: 1,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
      ],
      amenities: ["Free WiFi", "Air Conditioning", "TV", "Work Desk", "Coffee Maker"],
    },
    {
      name: "Deluxe Double Room",
      roomNumber: "201",
      type: "DOUBLE" as const,
      description: "Spacious double room with a king-size bed and city view.",
      pricePerNight: 4500,
      maxOccupancy: 2,
      floor: 2,
      images: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
        "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800",
      ],
      amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Safe", "Bathtub"],
    },
    {
      name: "Executive Suite",
      roomNumber: "301",
      type: "SUITE" as const,
      description: "Luxurious suite with separate living area and panoramic city views.",
      pricePerNight: 8500,
      maxOccupancy: 3,
      floor: 3,
      images: [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      ],
      amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Safe", "Bathtub", "Room Service", "Work Desk"],
    },
    {
      name: "Deluxe King Room",
      roomNumber: "202",
      type: "DELUXE" as const,
      description: "Premium deluxe room with king bed, spa bath and butler service.",
      pricePerNight: 6500,
      maxOccupancy: 2,
      floor: 2,
      images: [
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800",
      ],
      amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Bathtub", "Hair Dryer", "Coffee Maker"],
    },
    {
      name: "Presidential Suite",
      roomNumber: "501",
      type: "PRESIDENTIAL" as const,
      description: "The ultimate luxury experience with butler service, private terrace and Jacuzzi.",
      pricePerNight: 18000,
      maxOccupancy: 4,
      floor: 5,
      images: [
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
      ],
      amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Safe", "Bathtub", "Room Service", "Jacuzzi", "Private Terrace", "Butler Service"],
    },
  ];

  const rooms = [];
  for (const rd of roomData) {
    const existing = await prisma.room.findFirst({ where: { businessId: hotelBusiness.id, roomNumber: rd.roomNumber } });
    if (!existing) {
      const r = await prisma.room.create({ data: { ...rd, businessId: hotelBusiness.id, isAvailable: true, isActive: true } });
      rooms.push(r);
    } else {
      rooms.push(existing);
    }
  }
  console.log(`✅ ${rooms.length} hotel rooms created`);

  // ─── Hotel Menu Items ──────────────────────────────────────────────
  const hotelMenuData = [
    { name: "Club Sandwich", description: "Grilled chicken, bacon, lettuce, tomato on toasted bread", price: 350, category: "SNACK" as const, isVeg: false, preparationTime: 15, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
    { name: "Margherita Pizza", description: "Classic tomato, mozzarella, fresh basil", price: 450, category: "MAIN_COURSE" as const, isVeg: true, preparationTime: 20, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400" },
    { name: "Butter Chicken", description: "Tender chicken in rich tomato-butter sauce", price: 380, category: "MAIN_COURSE" as const, isVeg: false, spiceLevel: "MEDIUM" as const, preparationTime: 25, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400" },
    { name: "Masala Chai", description: "Aromatic Indian spiced tea with milk", price: 80, category: "BEVERAGE" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" },
    { name: "Continental Breakfast", description: "Toast, eggs, fresh juice, fruit bowl", price: 450, category: "SPECIAL" as const, isVeg: false, preparationTime: 20, image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400" },
    { name: "Paneer Tikka", description: "Grilled cottage cheese with spiced marinade", price: 320, category: "STARTER" as const, isVeg: true, spiceLevel: "MEDIUM" as const, preparationTime: 20, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400" },
    { name: "Chocolate Lava Cake", description: "Warm chocolate cake with molten center, vanilla ice cream", price: 280, category: "DESSERT" as const, isVeg: true, preparationTime: 15, image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400" },
    { name: "Fresh Lime Soda", description: "Refreshing lime soda with mint", price: 120, category: "BEVERAGE" as const, isVeg: true, preparationTime: 3, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400" },
    { name: "Dal Makhani", description: "Slow-cooked black lentils in buttery tomato gravy", price: 260, category: "MAIN_COURSE" as const, isVeg: true, spiceLevel: "MILD" as const, preparationTime: 30, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
    { name: "Veg Spring Rolls", description: "Crispy rolls stuffed with fresh vegetables", price: 220, category: "STARTER" as const, isVeg: true, preparationTime: 15, image: "https://images.unsplash.com/photo-1607116592827-7eec7b40a98e?w=400" },
  ];

  for (const item of hotelMenuData) {
    const existing = await prisma.menuItem.findFirst({ where: { businessId: hotelBusiness.id, name: item.name } });
    if (!existing) {
      await prisma.menuItem.create({ data: { ...item, businessId: hotelBusiness.id, isAvailable: true, isActive: true, allergens: [] } });
    }
  }
  console.log("✅ Hotel menu items created");

  // ─── Sample Bookings ───────────────────────────────────────────────
  const guestNames = ["Priya Sharma", "Arjun Mehta", "Sneha Patel", "Vikram Singh", "Anita Rao", "Rohit Gupta"];
  let bookingCount = 0;

  for (let i = 0; i < Math.min(guestNames.length, rooms.length); i++) {
    const checkIn = subDays(new Date(), Math.floor(Math.random() * 30));
    const nights = Math.floor(Math.random() * 4) + 1;
    const checkOut = addDays(checkIn, nights);
    const room = rooms[i % rooms.length];
    const total = room.pricePerNight * nights;

    const existing = await prisma.booking.findFirst({ where: { businessId: hotelBusiness.id, guestName: guestNames[i] } });
    if (!existing) {
      await prisma.booking.create({
        data: {
          businessId: hotelBusiness.id,
          roomId: room.id,
          guestName: guestNames[i],
          guestPhone: `98765${String(i).padStart(5, "0")}`,
          guestEmail: `${guestNames[i].toLowerCase().replace(" ", ".")}@example.com`,
          adults: 2,
          children: 0,
          checkIn,
          checkOut,
          nights,
          totalAmount: total,
          discountAmount: 0,
          finalAmount: total + (total * 0.18),
          paymentStatus: i % 3 === 0 ? "PENDING" : "PAID",
          paymentMethod: i % 3 === 0 ? "OFFLINE" : "ONLINE",
          status: i % 5 === 0 ? "PENDING" : i % 5 === 1 ? "CONFIRMED" : i % 5 === 2 ? "CHECKED_IN" : "CHECKED_OUT",
        },
      });
      bookingCount++;
    }
  }
  console.log(`✅ ${bookingCount} sample bookings created`);

  // ─── Demo Restaurant ───────────────────────────────────────────────
  const restaurantOwner = await prisma.user.upsert({
    where: { email: "owner@spicegarden.com" },
    update: {},
    create: {
      email: "owner@spicegarden.com",
      password: await bcrypt.hash("restaurant@123", 12),
      name: "Priya Sharma",
      phone: "9123456789",
      role: "OWNER",
      isActive: true,
    },
  });

  let restaurantBusiness = await prisma.business.findUnique({ where: { slug: "demo-restaurant" } });
  if (!restaurantBusiness) {
    restaurantBusiness = await prisma.business.create({
      data: {
        slug: "demo-restaurant",
        name: "Spice Garden Restaurant",
        type: "RESTAURANT",
        ownerId: restaurantOwner.id,
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: "MONTHLY",
        subscriptionStartDate: new Date(),
        subscriptionEndDate: addDays(new Date(), 30),
        logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200",
        coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
        description: "Authentic Indian cuisine with a modern twist. From street food favorites to gourmet dishes, Spice Garden brings you the best of India on a plate.",
        address: "15, Food Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "022-98765432",
        email: "info@spicegarden.com",
        isVerified: true,
        isActive: true,
        isFeatured: true,
        apiKey: "hp_demorestaurantkey1234567890abcdefghij",
        settings: {
          create: {
            acceptOnlinePayment: true,
            acceptOfflinePayment: true,
            autoConfirmBookings: true,
            currencyCode: "INR",
            taxPercentage: 5,
            notificationEmail: "owner@spicegarden.com",
            whatsappNumber: "9123456789",
            foodModuleEnabled: true,
            onlineOrderingEnabled: true,
          },
        },
      },
    });
  }
  console.log("✅ Demo restaurant created:", restaurantBusiness.name);

  // ─── Restaurant Tables ─────────────────────────────────────────────
  const tableNumbers = ["1", "2", "3", "4", "5", "6"];
  const tableCapacities = [2, 4, 4, 6, 2, 8];

  const tables = [];
  for (let i = 0; i < tableNumbers.length; i++) {
    const existing = await prisma.table.findFirst({ where: { businessId: restaurantBusiness.id, tableNumber: tableNumbers[i] } });
    if (!existing) {
      const t = await prisma.table.create({
        data: {
          businessId: restaurantBusiness.id,
          tableNumber: tableNumbers[i],
          capacity: tableCapacities[i],
          section: i < 3 ? "Indoor" : "Outdoor",
          isActive: true,
        },
      });
      tables.push(t);

      // Generate QR for each table
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await prisma.qRCode.create({
        data: {
          businessId: restaurantBusiness.id,
          tableId: t.id,
          type: "TABLE_MENU",
          url: `${appUrl}/r/demo-restaurant/menu?table=${tableNumbers[i]}`,
          label: `Table ${tableNumbers[i]}`,
          isActive: true,
          scanCount: Math.floor(Math.random() * 50),
        },
      });
    } else {
      tables.push(existing);
    }
  }
  console.log(`✅ ${tables.length} restaurant tables + QR codes created`);

  // ─── Restaurant Menu Items ─────────────────────────────────────────
  const restaurantMenuData = [
    { name: "Samosa (2 pcs)", description: "Crispy pastry filled with spiced potatoes and peas", price: 80, category: "STARTER" as const, isVeg: true, spiceLevel: "MILD" as const, preparationTime: 10, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
    { name: "Chicken Tikka", description: "Marinated chicken grilled in tandoor", price: 320, category: "STARTER" as const, isVeg: false, spiceLevel: "MEDIUM" as const, preparationTime: 20, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400" },
    { name: "Paneer Butter Masala", description: "Cottage cheese in rich tomato and butter gravy", price: 280, category: "MAIN_COURSE" as const, isVeg: true, spiceLevel: "MILD" as const, preparationTime: 20, image: "https://images.unsplash.com/photo-1631452180775-d3f3b78c8958?w=400" },
    { name: "Butter Chicken", description: "Succulent chicken in creamy tomato sauce", price: 320, category: "MAIN_COURSE" as const, isVeg: false, spiceLevel: "MILD" as const, preparationTime: 25, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400" },
    { name: "Biryani (Veg)", description: "Aromatic basmati rice with vegetables and spices", price: 260, category: "MAIN_COURSE" as const, isVeg: true, spiceLevel: "MEDIUM" as const, preparationTime: 30, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
    { name: "Chicken Biryani", description: "Fragrant basmati rice with tender chicken", price: 320, category: "MAIN_COURSE" as const, isVeg: false, spiceLevel: "MEDIUM" as const, preparationTime: 30, image: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=400" },
    { name: "Gulab Jamun", description: "Soft milk dumplings in rose-flavored sugar syrup", price: 120, category: "DESSERT" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400" },
    { name: "Rasgulla", description: "Soft cottage cheese balls in light sugar syrup", price: 110, category: "DESSERT" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400" },
    { name: "Mango Lassi", description: "Chilled yogurt-based mango drink", price: 120, category: "BEVERAGE" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=400" },
    { name: "Masala Chai", description: "Aromatic spiced Indian tea", price: 60, category: "BEVERAGE" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" },
    { name: "Aloo Tikki", description: "Crispy spiced potato patties", price: 100, category: "STARTER" as const, isVeg: true, spiceLevel: "MEDIUM" as const, preparationTime: 15, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400" },
    { name: "Fish Curry", description: "Fresh fish in tangy coconut-based curry", price: 360, category: "MAIN_COURSE" as const, isVeg: false, spiceLevel: "HOT" as const, preparationTime: 25, image: "https://images.unsplash.com/photo-1626508035297-0b2180f43d77?w=400" },
    { name: "Veg Thali", description: "Complete meal: dal, sabzi, roti, rice, salad, dessert", price: 220, category: "SPECIAL" as const, isVeg: true, preparationTime: 20, isFeatured: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
    { name: "Tandoori Roti (3 pcs)", description: "Whole wheat bread baked in tandoor", price: 60, category: "SNACK" as const, isVeg: true, preparationTime: 8, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400" },
    { name: "Cold Coffee", description: "Chilled coffee with ice cream", price: 140, category: "BEVERAGE" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
    { name: "Veg Manchurian", description: "Indo-Chinese vegetable dumplings in spicy sauce", price: 200, category: "STARTER" as const, isVeg: true, spiceLevel: "HOT" as const, preparationTime: 15, image: "https://images.unsplash.com/photo-1607116592827-7eec7b40a98e?w=400" },
    { name: "Palak Paneer", description: "Cottage cheese in creamy spinach gravy", price: 260, category: "MAIN_COURSE" as const, isVeg: true, spiceLevel: "MILD" as const, preparationTime: 20, image: "https://images.unsplash.com/photo-1631452180775-d3f3b78c8958?w=400" },
    { name: "Pav Bhaji", description: "Spiced vegetable mash served with buttered bread rolls", price: 150, category: "SNACK" as const, isVeg: true, spiceLevel: "MEDIUM" as const, preparationTime: 12, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400" },
    { name: "Strawberry Ice Cream", description: "Fresh strawberry ice cream scoop", price: 100, category: "DESSERT" as const, isVeg: true, preparationTime: 2, image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400" },
    { name: "Fresh Juice", description: "Seasonal fresh fruit juice", price: 120, category: "BEVERAGE" as const, isVeg: true, preparationTime: 5, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400" },
  ];

  const menuItems = [];
  for (const item of restaurantMenuData) {
    const existing = await prisma.menuItem.findFirst({ where: { businessId: restaurantBusiness.id, name: item.name } });
    if (!existing) {
      const mi = await prisma.menuItem.create({
        data: {
          ...item,
          businessId: restaurantBusiness.id,
          isAvailable: true,
          isActive: true,
          isFeatured: (item as { isFeatured?: boolean }).isFeatured ?? false,
          allergens: [],
        },
      });
      menuItems.push(mi);
    } else {
      menuItems.push(existing);
    }
  }
  console.log(`✅ ${menuItems.length} restaurant menu items created`);

  // ─── Sample Restaurant Orders ──────────────────────────────────────
  const orderStatuses = ["DELIVERED", "DELIVERED", "READY", "PREPARING", "CONFIRMED", "PENDING"];
  let orderCount = 0;

  for (let i = 0; i < 15 && i < tables.length * 3; i++) {
    const table = tables[i % tables.length];
    const item1 = menuItems[i % menuItems.length];
    const item2 = menuItems[(i + 3) % menuItems.length];
    const subtotal = item1.price * 1 + item2.price * 2;
    const tax = subtotal * 0.05;

    const existing = await prisma.order.findFirst({
      where: { businessId: restaurantBusiness.id, tableId: table.id, createdAt: { gte: subDays(new Date(), 7) } },
      take: 1,
    });

    if (!existing) {
      await prisma.order.create({
        data: {
          businessId: restaurantBusiness.id,
          tableId: table.id,
          guestName: `Guest ${i + 1}`,
          guestPhone: `9${String(i).padStart(9, "8")}`,
          type: "DINE_IN",
          paymentMethod: i % 2 === 0 ? "ONLINE" : "OFFLINE",
          subtotal,
          taxAmount: tax,
          discountAmount: 0,
          totalAmount: subtotal + tax,
          paymentStatus: i < 10 ? "PAID" : "PENDING",
          status: orderStatuses[i % orderStatuses.length] as "DELIVERED" | "READY" | "PREPARING" | "CONFIRMED" | "PENDING",
          items: {
            create: [
              { menuItemId: item1.id, quantity: 1, unitPrice: item1.price, totalPrice: item1.price, customizations: [] },
              { menuItemId: item2.id, quantity: 2, unitPrice: item2.price, totalPrice: item2.price * 2, customizations: [] },
            ],
          },
          createdAt: subDays(new Date(), Math.floor(Math.random() * 7)),
        },
      });
      orderCount++;
    }
  }
  console.log(`✅ ${orderCount} sample restaurant orders created`);

  // ─── Coupons ───────────────────────────────────────────────────────
  for (const biz of [hotelBusiness, restaurantBusiness]) {
    const existing = await prisma.coupon.findFirst({ where: { businessId: biz.id, code: "WELCOME20" } });
    if (!existing) {
      await prisma.coupon.create({
        data: {
          businessId: biz.id,
          code: "WELCOME20",
          type: "PERCENTAGE",
          value: 20,
          maxDiscount: 500,
          usageLimit: 100,
          validFrom: new Date(),
          validUntil: addDays(new Date(), 90),
          isActive: true,
        },
      });
      await prisma.coupon.create({
        data: {
          businessId: biz.id,
          code: "FLAT100",
          type: "FIXED",
          value: 100,
          minOrderValue: 500,
          validFrom: new Date(),
          validUntil: addDays(new Date(), 60),
          isActive: true,
        },
      });
    }
  }
  console.log("✅ Sample coupons created");

  // ─── Reviews ───────────────────────────────────────────────────────
  const reviewData = [
    { guestName: "Amit Patel", rating: 5, comment: "Absolutely wonderful stay! The staff was incredibly helpful." },
    { guestName: "Neha Singh", rating: 4, comment: "Great location and comfortable rooms. Will definitely come back." },
    { guestName: "Rahul Sharma", rating: 5, comment: "The food was exceptional. Best hotel in the city!" },
    { guestName: "Kavya Reddy", rating: 4, comment: "Clean rooms, friendly staff. Excellent value for money." },
    { guestName: "Suresh Kumar", rating: 3, comment: "Decent stay overall. Room service was a bit slow but food quality was good." },
  ];

  for (const review of reviewData) {
    const existing = await prisma.review.findFirst({ where: { businessId: hotelBusiness.id, guestName: review.guestName } });
    if (!existing) {
      await prisma.review.create({
        data: {
          ...review,
          businessId: hotelBusiness.id,
          isApproved: true,
          ownerReply: review.rating >= 4 ? "Thank you for your kind words! We look forward to welcoming you again." : null,
        },
      });
    }
  }
  console.log("✅ Sample reviews created");

  // ─── Platform Settings ─────────────────────────────────────────────
  const settings = [
    { key: "trial_days", value: "14", description: "Default trial period in days" },
    { key: "monthly_price", value: "999", description: "Monthly plan price in INR" },
    { key: "yearly_price", value: "9999", description: "Yearly plan price in INR" },
    { key: "maintenance_mode", value: "false", description: "Global maintenance mode" },
    { key: "commission_percent", value: "0", description: "Platform commission percentage" },
  ];
  for (const s of settings) {
    await prisma.platformSettings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ Platform settings initialized");

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Super Admin:    admin@hospitpro.com / admin@123");
  console.log("Hotel Owner:    owner@grandpalace.com / hotel@123");
  console.log("Restaurant:     owner@spicegarden.com / restaurant@123");
  console.log("─────────────────────────────────────────");
  console.log("Demo Hotel URL:      /h/demo-hotel");
  console.log("Demo Restaurant URL: /r/demo-restaurant/menu?table=1");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
