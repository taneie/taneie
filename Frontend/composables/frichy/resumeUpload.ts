export const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const RESUME_EXTENSION_MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

export function resolveResumeMimeType(file: Pick<File, "name" | "type">) {
  const extension = file.name.trim().toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  const extensionMimeType = RESUME_EXTENSION_MIME_TYPES[extension] || "";
  const fileType = file.type.trim().toLowerCase();

  if (extensionMimeType && !RESUME_ALLOWED_MIME_TYPES.includes(fileType)) {
    return extensionMimeType;
  }
  if (GENERIC_MIME_TYPES.has(fileType)) return extensionMimeType;

  return fileType;
}
