function trimCitation(str: string): string {
  if (str.length === 0) return str;
  if (str.length === 1) return str[0] === "'" ? "" : str;
  return str.slice(
    str[0] === "'" ? 1 : 0,
    str[str.length - 1] === "'" ? str.length - 1 : undefined,
  );
}

export { trimCitation };
