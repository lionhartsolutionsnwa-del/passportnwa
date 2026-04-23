import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  saveRestaurantAction,
  toggleActiveAction,
  toggleFeaturedAction,
  removeOwnerAction,
  addOwnerAction,
  refreshFromGoogleAction,
} from "./actions";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  const { data: owners } = await supabase
    .from("restaurant_owners")
    .select("user_id, approved_at, profiles(username, display_name)")
    .eq("restaurant_id", restaurant.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/restaurants" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
          ← All restaurants
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="eyebrow">Edit</div>
            <h1 className="headline text-3xl mt-1">{restaurant.name}</h1>
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
              /r/{restaurant.slug}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <form action={toggleActiveAction.bind(null, restaurant.id, !restaurant.is_active)}>
              <button className="btn-ghost py-1.5 px-3 text-[10px]">
                {restaurant.is_active ? "Deactivate" : "Activate"}
              </button>
            </form>
            <form action={toggleFeaturedAction.bind(null, restaurant.id, !restaurant.is_featured)}>
              <button className="btn-ghost py-1.5 px-3 text-[10px]">
                {restaurant.is_featured ? "Unfeature" : "Feature ★"}
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Edit form */}
      <form action={saveRestaurantAction.bind(null, restaurant.id)} className="flex flex-col gap-3">
        <Field label="Name"        name="name"        defaultValue={restaurant.name} />
        <Field label="Cuisine"     name="cuisine"     defaultValue={restaurant.cuisine ?? ""} />
        <Field label="City"        name="city"        defaultValue={restaurant.city} />
        <Field label="Address"     name="address"     defaultValue={restaurant.address ?? ""} />
        <Field label="Phone"       name="phone"       defaultValue={restaurant.phone ?? ""} />
        <Field label="Website"     name="website"     defaultValue={restaurant.website ?? ""} />
        <Field label="Cover image" name="cover_image_url" defaultValue={restaurant.cover_image_url ?? ""} />
        <div>
          <label className="eyebrow">Description</label>
          <textarea
            name="description"
            defaultValue={restaurant.description ?? ""}
            rows={3}
            className="input mt-2 resize-none"
          />
        </div>
        <button className="btn-primary py-3 text-[11px] self-start">Save changes</button>
      </form>

      {/* Refresh from Google */}
      {restaurant.google_place_id && (
        <form action={refreshFromGoogleAction.bind(null, restaurant.id, restaurant.google_place_id)} className="postcard p-4">
          <div className="eyebrow">Google Places</div>
          <p className="font-serif italic text-sm text-[var(--pp-ink-soft)] mt-1">
            Pull fresh rating, hours, and photos from Google.
          </p>
          <button className="btn-ghost mt-3 py-2 px-3 text-[11px]">Refresh data</button>
        </form>
      )}

      {/* Owners */}
      <section>
        <h2 className="section-heading">Owners ({owners?.length ?? 0})</h2>
        <ul className="flex flex-col gap-1.5 mt-3">
          {!owners?.length && (
            <li className="font-serif italic text-[var(--pp-ink-soft)] text-sm">No approved owners.</li>
          )}
          {owners?.map((o: any) => (
            <li key={o.user_id} className="postcard flex items-center justify-between px-3 py-2">
              <Link href={`/u/${o.profiles?.username}`}>
                <span className="font-serif">{o.profiles?.display_name ?? o.profiles?.username}</span>
                <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2">@{o.profiles?.username}</span>
              </Link>
              <form action={removeOwnerAction.bind(null, restaurant.id, o.user_id)}>
                <button className="font-mono text-[10px] tracking-[0.2em] uppercase text-red-700">Remove</button>
              </form>
            </li>
          ))}
        </ul>

        <form action={addOwnerAction.bind(null, restaurant.id)} className="mt-3 flex gap-2">
          <input name="username" required pattern="[a-zA-Z0-9_]{3,30}" placeholder="Add owner by @username" className="input flex-1" />
          <button className="btn-primary py-2 px-4 text-[11px]">Add</button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="eyebrow">{label}</label>
      <input name={name} defaultValue={defaultValue} className="input mt-2" />
    </div>
  );
}
