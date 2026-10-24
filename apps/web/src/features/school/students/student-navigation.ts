export function studentProfileHref(id: string, query: string, status: string, page: number) {
  const returnTo = "/students?" + new URLSearchParams({ q: query, status, page: String(page) });
  return "/students/" + id + "?" + new URLSearchParams({ returnTo });
}
