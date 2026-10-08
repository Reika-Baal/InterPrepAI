// Shared by registration UI and API. Never apply new registration rules to login.
export const COMMON_PASSWORDS = Object.freeze([
  "admin",
  "123456",
  "password",
  "12345678",
  "123456789",
  "Password1",
  "Password",
  "12345",
  "Lennon11",
  "1234567890",
  "Password123",
  "Fortnite21",
  "password1",
  "qwerty123",
  "qwerty",
  "123qwe",
  "abc123",
  "Strongman12",
  "daddy123",
  "Liverpool11",
]);
const common = new Set(COMMON_PASSWORDS.map((value) => value.toLowerCase()));
const normalise = (value) => value.normalize("NFKC").toLowerCase();
export function passwordError(password, name) {
  // Check this first so every listed value gets the user's requested message.
  if (common.has(normalise(password).trim())) return "Password is too common";
  if ([...password].length < 7)
    return "Password must have at least 7 characters.";
  if (password.length > 128)
    return "Password must have no more than 128 characters.";
  if (!/\p{Lu}/u.test(password))
    return "Password must include a capital letter.";
  if (!/[\p{P}\p{S}]/u.test(password))
    return "Password must include a special symbol.";
  const parts = normalise(name).match(/[\p{L}\p{N}]+/gu) ?? [];
  const joined = parts.join("");
  const comparablePassword = normalise(password).replace(/[^\p{L}\p{N}]/gu, "");
  // Ignore initials within a multi-part name; still check a single-character name.
  const names = [
    joined,
    ...parts.filter((part) => [...part].length >= 2),
  ].filter(Boolean);
  if (names.some((part) => comparablePassword.includes(part)))
    return "Password must not include your name.";
  return "";
}
export function registrationPasswordError(password, confirmation, name) {
  return (
    passwordError(password, name) ||
    (password !== confirmation ? "Passwords do not match." : "")
  );
}
