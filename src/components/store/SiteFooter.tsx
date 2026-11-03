import Link from "next/link";

export function SiteFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="mt-auto bg-wx-dark text-white/70">
      <div className="wx-gradient-rule" />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm sm:flex-row sm:items-center sm:px-6">
        <p className="font-semibold text-white">{storeName}</p>
        <p>Member-exclusive pricing on wellness.</p>
        <div className="flex gap-5 sm:ml-auto">
          <Link href="/shop" className="wx-focus rounded transition hover:text-white">
            Shop
          </Link>
          <Link href="/#how-it-works" className="wx-focus rounded transition hover:text-white">
            How it works
          </Link>
        </div>
      </div>
    </footer>
  );
}
