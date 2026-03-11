type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

const flattenClassValue = (value: ClassValue): string => {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => flattenClassValue(entry))
      .filter(Boolean)
      .join(" ");
  }

  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([className]) => className)
    .join(" ");
};

export function cn(...inputs: ClassValue[]) {
  return inputs
    .map((input) => flattenClassValue(input))
    .filter(Boolean)
    .join(" ");
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  
  return `${Math.floor(days / 365)}y`;
}
