import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: easy to read out over the phone and to type from a screenshot
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// "FM-7K3Q9"
export function newBookingReference() {
  let code = "";
  for (let i = 0; i < 5; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `FM-${code}`;
}
