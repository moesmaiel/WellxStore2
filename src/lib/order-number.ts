import { customAlphabet } from "nanoid";

// Unambiguous alphabet: no 0/O/1/I, so codes are easy to read aloud.
const nano = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export function newOrderNumber(): string {
  return `WX-${nano()}`;
}
