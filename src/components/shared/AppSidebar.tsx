"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  BookOpen,
  Users,
  Plug,
  Settings,
  Sparkles,
  Megaphone,
  Home,
  FlaskConical,
  PanelLeftClose,
} from "lucide-react";

const mainNavItems = [
  { icon: Home, label: "Landing", href: "#", id: "landing" },
  { icon: LayoutDashboard, label: "Dashboard", href: "#", id: "dashboard" },
  { icon: Workflow, label: "Studio", href: "#", id: "studio" },
  { icon: BookOpen, label: "Knowledge Base", href: "#", id: "knowledge" },
  { icon: Users, label: "CRM", href: "#", id: "crm" },
  { icon: Megaphone, label: "Marketing", href: "#", id: "marketing" },
  { icon: FlaskConical, label: "Lunar Labs", href: "#", id: "lunar-labs" },
];

const bottomNavItems = [
  { icon: Sparkles, label: "Neptune", href: "#", id: "assistant" },
  { icon: Plug, label: "Connected Apps", href: "#", id: "connected-apps" },
  { icon: Settings, label: "Settings", href: "#", id: "settings" },
];

interface AppSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base leading-tight">GalaxyCo.ai</h2>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors group-data-[collapsible=icon]:hidden"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activePage === item.id}
                  >
                    <a 
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(item.id);
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activePage === item.id}
                  >
                    <a 
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(item.id);
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
            <span className="text-sm">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-tight truncate">John Doe</p>
            <p className="text-xs text-muted-foreground leading-tight truncate">john@company.com</p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

