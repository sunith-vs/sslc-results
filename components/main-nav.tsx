import { NavItem } from "@/components/nav-item";
import { UserAccountNav } from "@/components/user-account-nav";

export function MainNav() {
  return (
    <nav className="flex h-16 items-center justify-between border px-4">
      <div className="flex items-center space-x-4">
        <NavItem href="/"><span>Home</span></NavItem>
        <NavItem href="/analytics"><span>Analytics</span></NavItem>
      </div>
      <UserAccountNav />
    </nav>
  );
}
