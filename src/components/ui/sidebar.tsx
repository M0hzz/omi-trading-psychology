interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarMenuProps {
  children: React.ReactNode;
}

interface SidebarMenuItemProps {
  children: React.ReactNode;
}

interface SidebarMenuButtonProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  return <div className="flex">{children}</div>;
}

export function Sidebar({ children, className = "" }: SidebarProps) {
  return (
    <div className={`w-64 flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarHeader({ children, className = "" }: SidebarHeaderProps) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarContent({ children, className = "" }: SidebarContentProps) {
  return (
    <div className={`flex-1 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarMenu({ children }: SidebarMenuProps) {
  return (
    <ul className="space-y-1">
      {children}
    </ul>
  );
}

export function SidebarMenuItem({ children }: SidebarMenuItemProps) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ children, className = "", asChild = false }: SidebarMenuButtonProps) {
  if (asChild) {
    return (
      <div className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 ${className}`}>
        {children}
      </div>
    );
  }
  
  return (
    <button className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 ${className}`}>
      {children}
    </button>
  );
}