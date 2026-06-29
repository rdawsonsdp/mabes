import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-auth";
import { getSupabase } from "@/app/lib/supabase/server";

const CATERING_CATEGORIES = ["Boxed Lunches", "Wraps", "Trays", "Add-Ons"] as const;
type CateringCategory = (typeof CATERING_CATEGORIES)[number];

function toSlug(name: string): string {
  return (
    "catering-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/** Deduplicate `slug` by appending -2, -3, etc. if already taken. */
async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let attempt = 1;
  for (;;) {
    const { data } = await getSupabase()
      .from("products")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

// ── POST — create ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
    basePriceCents?: number;
    category?: string;
    image?: string | null;
    isAvailable?: boolean;
    sortOrder?: number;
  };

  // Validation
  if (!body.name || body.name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (
    typeof body.basePriceCents !== "number" ||
    !Number.isInteger(body.basePriceCents) ||
    body.basePriceCents < 0
  ) {
    return NextResponse.json(
      { error: "basePriceCents must be a non-negative integer" },
      { status: 400 }
    );
  }
  if (!CATERING_CATEGORIES.includes(body.category as CateringCategory)) {
    return NextResponse.json(
      {
        error: `category must be one of: ${CATERING_CATEGORIES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const slug = await uniqueSlug(toSlug(body.name.trim()));

  const { data, error } = await getSupabase()
    .from("products")
    .insert({
      name: body.name.trim(),
      description: body.description ?? null,
      base_price_cents: body.basePriceCents,
      menu: "catering",
      category: body.category,
      image: body.image ?? null,
      is_available: body.isAvailable ?? true,
      sort_order: body.sortOrder ?? 0,
      slug,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}

// ── PUT — update ───────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    description?: string | null;
    basePriceCents?: number;
    category?: string;
    image?: string | null;
    isAvailable?: boolean;
    sortOrder?: number;
  };

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (
    body.category !== undefined &&
    !CATERING_CATEGORIES.includes(body.category as CateringCategory)
  ) {
    return NextResponse.json(
      {
        error: `category must be one of: ${CATERING_CATEGORIES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.basePriceCents !== undefined)
    updates.base_price_cents = body.basePriceCents;
  if (body.category !== undefined) updates.category = body.category;
  if (body.image !== undefined) updates.image = body.image;
  if (body.isAvailable !== undefined) updates.is_available = body.isAvailable;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("products")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ product: data });
}

// ── DELETE — remove ────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");

  // Also accept id in request body as a fallback
  if (!id) {
    try {
      const body = (await request.json()) as { id?: string };
      id = body.id ?? null;
    } catch {
      // no body
    }
  }

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Best-effort: delete modifier group links first (FK may not cascade)
  await getSupabase()
    .from("product_modifier_groups")
    .delete()
    .eq("product_id", id);

  // Delete the product row
  const { error } = await getSupabase()
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
