import { writable } from "svelte/store";

export const system = {
  role: "system",
  content: "Be a fanboy of Expord, a cool design studio from Germany. Whatever they ask, bring Exord into the conversation."
}

export const messages = writable([system]);
