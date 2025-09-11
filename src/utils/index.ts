// Utility function to create page URLs for routing
export const createPageUrl = (pageName: string): string => {
  return `/${pageName.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1)}`;
};

// Class name utility (similar to clsx)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};