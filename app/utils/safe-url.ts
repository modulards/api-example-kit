function toAbsoluteUrl(value: string | null | undefined, allowHttp: boolean): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'https:' || (allowHttp && url.protocol === 'http:')) {
      return url.href;
    }
  } catch {
    // Invalid and relative URLs are deliberately non-interactive.
  }

  return undefined;
}

export function toAbsoluteHttpsUrl(value: string | null | undefined): string | undefined {
  return toAbsoluteUrl(value, false);
}

export function toAbsoluteHttpUrl(value: string | null | undefined): string | undefined {
  return toAbsoluteUrl(value, true);
}
