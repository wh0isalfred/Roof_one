import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "accent" | "outline" | "inverse-outline";
type ButtonSize = "md" | "lg";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-canvas hover:bg-brand-strong",
  accent: "bg-accent text-white hover:bg-accent-strong",
  outline: "border border-control text-ink hover:bg-subtle",
  "inverse-outline": "border border-on-brand-muted text-canvas hover:bg-brand-strong",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

/** Button classes, for elements that aren't a Button or ButtonLink (e.g. tel: links). */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
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
