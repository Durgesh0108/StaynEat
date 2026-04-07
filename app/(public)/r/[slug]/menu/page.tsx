import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RestaurantMenuPage } from "@/components/restaurant/public/menu-page";
import { ErrorCard } from "@/components/ui/error-card";

export const revalidate = 60;

interface Props {
  params: { slug: string };
  searchParams: { table?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      select: { name: true },
    });
    return { title: `${business?.name ?? "Restaurant"} Menu` };
  } catch { return { title: "Menu" }; }
}

export default async function MenuPage({ params, searchParams }: Props) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug, isActive: true },
      include: {
        settings: true,
        menuItems: {
          where: { isActive: true },
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
        tables: {
          where: { isActive: true },
          select: { id: true, tableNumber: true, capacity: true },
        },
      },
    });

    if (!business) notFound();

    let table = null;
    if (searchParams.table) {
      table = business.tables.find((t) => t.tableNumber === searchParams.table);
      if (!table) {
        // Try by id
        table = business.tables.find((t) => t.id === searchParams.table);
      }
    }

    return (
      <RestaurantMenuPage
        business={business as Parameters<typeof RestaurantMenuPage>[0]["business"]}
        initialTable={table ?? null}
      />
    );
  } catch (error) {
    console.error("Menu page error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorCard message="Unable to load menu. Please try again." />
      </div>
    );
  }
}
