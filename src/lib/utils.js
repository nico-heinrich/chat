export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export function saveChat(array) {
  const string = JSON.stringify(array);
  const limit = 5 * 1024 * 1024; // 5 MB 
  let usage = string.length;

  if (usage > limit) return false;

  localStorage.setItem("chat", string);

  return true;
}

export function getChat() {
  const chat = localStorage.getItem("chat");

  return JSON.parse(chat);
}
