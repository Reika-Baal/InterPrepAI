export const COMMON_PASSWORDS: readonly string[];
export function passwordError(password: string, name: string): string;
export function registrationPasswordError(
  password: string,
  confirmation: string,
  name: string,
): string;
