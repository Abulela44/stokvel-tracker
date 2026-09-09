import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm", className)}
      {...props}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "md" | "sm";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-primary-foreground active:brightness-95",
  outline: "border-2 border-primary text-primary active:bg-accent",
  ghost: "text-foreground active:bg-accent",
  danger: "border-2 border-destructive text-destructive active:bg-accent",
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[filter,background-color] disabled:opacity-50",
        size === "md" ? "tap-target px-5 text-base" : "min-h-11 px-4 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "tap-target w-full rounded-xl border border-border bg-input px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          tone === "gold" ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function PageTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">{children}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
