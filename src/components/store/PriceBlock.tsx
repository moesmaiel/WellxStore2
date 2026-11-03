import { discountPercent, formatMoney } from "@/lib/pricing";
import clsx from "clsx";

/**
 * Regular price struck through, Wellx price prominent, discount derived.
 * Shared by the shop grid, product page, cart and the admin live preview so
 * every surface shows pricing identically.
 */
export function PriceBlock({
  regular,
  wellx,
  currency = "AED",
  size = "md",
}: {
  regular: number;
  wellx: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}) {
  const off = discountPercent(regular, wellx);

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span
        className={clsx(
          "font-bold wx-gradient-text",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-4xl"
        )}
      >
        {formatMoney(wellx, currency)}
      </span>
      {off > 0 && (
        <>
          <span
            className={clsx(
              "text-wx-muted line-through",
              size === "lg" ? "text-lg" : "text-sm"
            )}
          >
            {formatMoney(regular, currency)}
          </span>
          <span className="rounded-full wx-gradient px-2 py-0.5 text-xs font-semibold text-white">
            {off}% off
          </span>
        </>
      )}
    </div>
  );
}
