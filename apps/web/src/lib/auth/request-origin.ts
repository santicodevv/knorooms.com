import "server-only";

/**
 * Deriva el origen efectivo de la petición respetando las cabeceras de proxy
 * (`X-Forwarded-Proto` / `X-Forwarded-Host`) y el `Host` recibido.
 */
export function deriveRequestOrigin(request: Request): {
  proto: string;
  host: string;
  origin: string;
} {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const reqUrl = new URL(request.url);

  const host = forwardedHost || hostHeader || reqUrl.host;
  const proto = forwardedProto || reqUrl.protocol.replace(":", "") || "http";

  return {
    proto,
    host,
    origin: `${proto}://${host}`,
  };
}
