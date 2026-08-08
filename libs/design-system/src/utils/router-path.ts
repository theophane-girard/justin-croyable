export function normalizePath(url: string): string {
  const path = url.split('?')[0]?.split('#')[0] ?? url;
  return path.replace(/^\/+/, '');
}

export function isActivePath(path: string, currentPath: string): boolean {
  if (path === '') {
    return currentPath === '';
  }
  return currentPath === path || currentPath.startsWith(`${path}/`);
}
