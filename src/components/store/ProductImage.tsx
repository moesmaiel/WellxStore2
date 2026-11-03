import clsx from "clsx";

/**
 * Products may have no image yet (or one pasted from an arbitrary host), so
 * this falls back to a branded gradient placeholder showing the initials.
 * Plain <img> rather than next/image because URLs can be pasted from any host.
 */
export function ProductImage({
  src,
  alt,
  className,
  initials,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  initials?: string;
}) {
  if (!src) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center bg-gradient-to-br from-violet-100 via-white to-pink-100",
          className
        )}
        aria-hidden="true"
      >
        <span className="text-2xl font-bold wx-gradient-text">
          {(initials ?? alt).slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={clsx("object-cover", className)} loading="lazy" />;
}
