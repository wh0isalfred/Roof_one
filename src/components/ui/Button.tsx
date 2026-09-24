import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "inverse" | "outline" | "inverse-outline";
type ButtonSize = "md" | "lg" | "xl";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  /** For primary actions on blue fields, where a blue button would disappear. */
  inverse: "bg-white text-ink hover:bg-brand-soft",
  outline: "border border-control text-ink hover:bg-subtle",
  "inverse-outline": "border border-white/40 text-white hover:border-white hover:bg-white/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-7 text-base",
};

/** Button classes, for elements that aren't a Button or ButtonLink (e.g. tel: links). */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    "group inline-flex shrink-0 items-center justify-center gap-2.5 rounded-md font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

/** Trailing arrow for actions that move the visitor forward. Nudges on hover. */
export function ButtonArrow() {
  return (
    <ArrowRight
      aria-hidden="true"
      className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0 motion-reduce:transition-none"
    />
  );
}

type ButtonProps = ComponentProps<"button"> & Omit<ButtonStyleOptions, "className">;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

interface ButtonLinkProps<T extends string> extends ButtonStyleOptions {
  href: Route<T>;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function ButtonLink<T extends string>({
  href,
  variant,
  size,
  className,
  children,
  onClick,
}: ButtonLinkProps<T>) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={buttonStyles({ variant, size, className })}
    >
      {children}
    </Link>
  );
}
