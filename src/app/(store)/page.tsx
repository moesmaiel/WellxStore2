import Link from "next/link";
import { listBrands, listProducts, listTopCategories } from "@/lib/repo";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    t: "Browse everything you need",
    d: "Devices, food, testing, fitness, and more, all vetted by Wellx.",
  },
  {
    t: "See the real price",
    d: "Every product shows what it normally costs, and what it costs here.",
  },
  {
    t: "Get it however works for you",
    d: "Delivered, unlocked instantly, or connected straight to the partner.",
  },
];

const WHY_WELLX = [
  {
    t: "Trusted, not just discounted",
    d: "Wellx has helped people across the Middle East get healthier for years. Every product here carries that same standard.",
  },
  {
    t: "Real prices, shown honestly",
    d: "We show you what things normally cost, and what they cost here — so the value is always clear, never a guessing game.",
  },
  {
    t: "Growing with what you need",
    d: "This is just the beginning. More categories, more partners, more ways to reach your goals — added continuously.",
  },
];

export default async function HomePage() {
  const [categories, brands, products] = await Promise.all([
    listTopCategories(),
    listBrands(true), // Active brands only — drives the partner strip.
    listProducts({ activeOnly: true }),
  ]);

  const featured = products.slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-wx-dark text-white">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl wx-gradient"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/15">
            From the Middle East&rsquo;s leading well-being platform
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Everything you need to be healthy,{" "}
            <span className="wx-gradient-text">all in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">
            Devices, nutrition, health testing, gyms, and more — curated by Wellx, at
            prices that make it easy to start.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="wx-focus rounded-full wx-gradient px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:opacity-90"
            >
              Shop the Store
            </Link>
            <Link
              href="#how-it-works"
              className="wx-focus rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Learn how it works
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Curated by Wellx · Trusted brands · New products added regularly
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-wx-dark text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">How the Wellx Store Works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.t}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full wx-gradient text-sm font-bold">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-white/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Health, however you need it</h2>
            <p className="mt-1 text-neutral-600">
              More categories are added as we grow — this is just the start.
            </p>
          </div>
          <Link href="/shop" className="wx-focus shrink-0 rounded text-sm font-semibold text-wx-purple hover:underline">
            View all →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="wx-focus group rounded-2xl border border-wx-line bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:shadow-violet-100"
            >
              <div className="mx-auto mb-3 h-10 w-10 rounded-xl wx-gradient opacity-90 transition group-hover:scale-110" />
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-sm text-wx-muted">New categories on the way →</p>
      </section>

      {/* Partner logos — only brands marked Active in admin, in sort order */}
      {brands.length > 0 && (
        <section className="border-y border-wx-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">
                The brands we&rsquo;ve brought together
              </h2>
              <p className="mt-1 text-neutral-600">
                Every partner here has been vetted by the Wellx team.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {brands.map((b) => {
                const logo = (
                  <ProductImage
                    src={b.logo_url}
                    alt={b.name}
                    initials={b.name}
                    className="h-10 w-auto max-w-[9rem] rounded-lg object-contain"
                  />
                );
                return b.website_url ? (
                  <a
                    key={b.id}
                    href={b.website_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={b.name}
                    className="wx-focus rounded opacity-60 transition hover:opacity-100"
                  >
                    {logo}
                  </a>
                ) : (
                  <div key={b.id} title={b.name} className="opacity-60">
                    {logo}
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm text-wx-muted">
              Want to become a Wellx partner?{" "}
              <Link href="/partner-with-us" className="wx-focus rounded font-semibold text-wx-purple hover:underline">
                Get in touch →
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Popular right now</h2>
        <p className="mt-1 text-neutral-600">A few products people are picking up this week.</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                slug: p.slug,
                name: p.name,
                tagline: p.tagline,
                brandName: p.brand?.name,
                image: p.images[0],
                regular_price: p.regular_price,
                wellx_price: p.wellx_price,
                currency: p.currency,
                badges: p.badges,
              }}
            />
          ))}
        </div>

        <Link
          href="/shop"
          className="wx-focus mt-8 inline-block rounded text-sm font-semibold text-wx-purple hover:underline"
        >
          See everything in the Store →
        </Link>
      </section>

      {/* Why Wellx */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Why it&rsquo;s worth starting here</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {WHY_WELLX.map((s) => (
              <div key={s.t}>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-neutral-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="relative overflow-hidden bg-wx-dark text-white">
        <div
          className="pointer-events-none absolute -left-40 -bottom-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl wx-gradient"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your health, made easier to invest in.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Everything from Wellx, all in one place, at prices that make starting easy.
          </p>
          <Link
            href="/shop"
            className="wx-focus mt-8 inline-block rounded-full wx-gradient px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:opacity-90"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </>
  );
}
