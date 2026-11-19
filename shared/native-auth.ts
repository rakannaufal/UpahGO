export function nativeCallbackUrl(scheme: unknown = "upahgo") {
  if (scheme !== "upahgo" && scheme !== "upahgo-qa")
    throw new Error("UNAUTHENTICATED");
  return `${scheme}://auth/callback`;
}
