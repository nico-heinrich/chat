<script>
  import { messages, system } from "../stores/messages.store";
  import { sleep, getChat, saveChat } from "../lib/utils";
	import { onMount } from "svelte";
  import { scale } from "svelte/transition";

  export let model = "";

  let input;
  let sendButton;
  let messagesContainer;
  let isAnimationsActive = false;

  $: $messages, scrollLastMessageIntoView();

  async function init() {
    const chat = getChat();

    if (chat) $messages = chat;

    requestAnimationFrame(() => {
      scrollLastMessageIntoView()

      isAnimationsActive = true;
    });
  }

  function scrollLastMessageIntoView() {
    if (!messagesContainer?.lastElementChild) return;

    requestAnimationFrame(() => {
      messagesContainer.lastElementChild?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function addResponse(content) {
    const message = {
      role: "assistant",
      content: content
    }

    await sleep(500);

    $messages = [$messages, message];
  }

  async function addResponseToMessages(messagesCopy) {
    const request = {
      model: model || "mistral",
      stream: false,
      messages: messagesCopy
    }

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      body: JSON.stringify(request),
    })

    const json = await response.json();
    const message = json.message;

    if ($messages[$messages.length - 1].content === null) {
      const updatedMessages = $messages.toSpliced(-1, 1);
      $messages = updatedMessages;
    }

    $messages = [...$messages, message];

    sendButton.disabled = false;

    const isChatSaved = saveChat($messages);

    if (!isChatSaved) addResponse("Local storage is full. Write 'clear' to clear the chat.")
  }

  function clearChat() {
    $messages = [system];

    localStorage.clear();

    input.value = "";
  }

  async function sendMessage() {
    const prompt = input.value;

    if (prompt.trim() === "") return;

    if (prompt.toLowerCase() === "clear") {
      clearChat()

      return;
    };

    const message = {
      role: "user",
      content: prompt
    };

    const dummy = {
      role: "assistant",
      content: null
    }

    sendButton.disabled = true;
    input.value = "";

    $messages = [...$messages, message];
    const messagesCopy = [...$messages];

    addResponseToMessages(messagesCopy);

    await sleep(1000);

    $messages = [...$messages, dummy];
  }

  onMount(init);
</script>
<div class="chat">
  <header class="header">AI CHAT</header>
  <div class="messages" bind:this={messagesContainer}>
    {#each $messages.filter(item => item.role !== "system") as message, index (index)}
      <div
        key={index}
        class="message"
        class:message-assistant={message.role === "assistant"}
        class:message-user={message.role === "user"}
        in:scale={{ start: .75, duration: isAnimationsActive ? 250 : 0 }}
      >
        {#if message.content === null}
          <div class="typing">
            <span></span><span></span><span></span>
          </div>
        {:else}
          {message.content} 
        {/if}
      </div>
    {/each}
  </div>
  <form class="form" on:submit|preventDefault={sendMessage}>
    <input type="text" class="input" placeholder="How are you?" bind:this={input}>
    <button class="send" bind:this={sendButton}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    </button>
  </form>
</div>

<style>
  .chat {
    height: 100vh;
    max-width: 1024px;
    display: flex;
    flex-direction: column;
    border-left: 2px solid var(--clr-2);
    border-right: 2px solid var(--clr-2);
    margin: 0 auto;
  }

  @media (max-width: 1200px) {
    .chat {
      max-width: unset;
      border: none;
    }
  }
  
  .header {
    padding: var(--spc-m);
    text-align: center;
    border-bottom: 2px solid var(--clr-2);
  }

  .messages {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spc-m);
    padding: var(--spc-m);
    overflow-x: hidden;
    overflow-y: auto;
  }

  .message {
    width: fit-content;
    max-width: 70%;
    padding: var(--spc-m);
    border-radius: var(--br-l);
  }

  .message-assistant {
    box-shadow: inset 0 0 0 2px var(--clr-2);
    transform-origin: top left;
  }

  .message-assistant:not(.message-assistant + .message-assistant) {
    border-top-left-radius: 0;
  }

  .message-user {
    background-color: var(--clr-2);
    color: var(--clr-1);
    margin-left: auto;
    transform-origin: top right;
  }

  .message-user:not(.message-user + .message-user) {
    border-top-right-radius: 0;
  }

  .typing {
    height: 1lh;
    display: flex;
    align-items: center;
    gap: var(--spc-s);
    padding: 0 var(--spc-s);
  }

  .typing > span {
    display: block;
    width: 4px;
    height: 4px;
    background-color: var(--clr-2);
    border-radius: 9999px;
    animation: bounce 1s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .typing > span:nth-child(2) {
    animation-delay: .1s;
  }

  .typing > span:nth-child(3) {
    animation-delay: .2s;
  }

  @keyframes bounce {
    50%, 100% {
      transform: translateY(0);
    }
    75% {
      transform: translateY(-4px);
    }
  }

  .form {
    display: flex;
    border-top: 2px solid var(--clr-2);
    padding: var(--spc-m);
  }

  .input {
    flex-grow: 1;
    background-color: var(--clr-2);
    color: var(--clr-1);
    border: none;
    outline: none;
    border-radius: var(--br-l) 0 0 var(--br-l);
    padding: var(--spc-m) 0 var(--spc-m) var(--spc-m);
  }

  .input::placeholder {
    color: var(--clr-1);
    opacity: .5;
  }

  .input:focus::placeholder {
    opacity: 0;
  }

  .send {
    background-color: var(--clr-2);
    color: var(--clr-1);
    border: none;
    padding: var(--spc-m);
    border-radius: 0 var(--br-l) var(--br-l) 0;
    cursor: pointer;
  }

  .send:disabled {
    cursor: not-allowed;
  }
  
  .send:disabled .icon {
    opacity: .5;
  }

  .icon {
    width: 1.8rem;
  }
</style>
