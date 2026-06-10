export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavChild[];
}

export interface AppConfig {
  appName: string;
  appColor: string;
  appGradient: string;
  appIcon: React.ElementType;
}
