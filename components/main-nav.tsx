import { NavItem } from "@/components/nav-item";
import { UserAccountNav } from "@/components/user-account-nav";

export function MainNav() {
  return (
    <nav className="flex h-16 items-center justify-between border px-4">
   
      <UserAccountNav />
    </nav>
  );
}
