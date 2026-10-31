import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
}

export function NavLink({ className, activeClassName, ...props }: CustomNavLinkProps) {
  return (
    <RouterNavLink
      {...props}
      className={({ isActive }) => cn(className, isActive && activeClassName)}
    />
  );
}
