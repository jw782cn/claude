<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { fade } from "svelte/transition";
  import { AI_PROMPT, Client, HUMAN_PROMPT } from "./index";
  import {} from "./store.ts";

  // Store for chat messages
  const messages = [];
  // Function to send message to API
  async function sendMessage(message) {
    messages.push({
      content: message,
      role: "user",
    });
    typing = true;
    newMessage = "Claude is typing..."

    // Send the message to the backend
    const response = await fetch('http://localhost:3000/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message}),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Create an EventSource instance and handle open and update events
    const source = new EventSource('http://localhost:3000/api/stream-updates');

    source.addEventListener('open', (event) => {
      console.log('Opened stream:', event);
      // check if event has data
      if (event.data) {
        const data = JSON.parse(event.data);
        if (data.status == 200) {
          console.log("200")
          messages.push({
            content: "",
            role: "assistant",
          });
        }
      }
    });

    source.addEventListener('update', (event) => {
      // console.log('Update received:', event.data);
      const reply = JSON.parse(event.data);
      messages[messages.length - 1].content = reply.result;
      // 201, 202
      if (reply.status == 202) {
        // close connection
        typing = false;
        newMessage = "";
        source.close();
      }
    });

    source.addEventListener('error', (event) => {
      console.log('Error received:', event);
      // close connection
      typing = false;
      newMessage = "";
      source.close();
    });
  }

  const scrollToBottom = async (node) => {
    node.scroll({ top: node.scrollHeight, behavior: "smooth" });
  };
  afterUpdate(() => {
    if (messagesContainer) {
      scrollToBottom(messagesContainer);
    }
  });

  let messagesContainer;
  let newMessage = "";
  let typing = false;
</script>

<main>
  <div
    class="chat-container"
    in:fade={{ delay: 100 }}
    out:fade={{ delay: 100 }}
  >
    <div class="chat-title">Claude - 100k</div>
    <div class="messages-wrapper" bind:this={messagesContainer}>
      {#each messages as message}
        <div class="message {message.role}">
          <div class="message-text" in:fade={{ delay: 80 }}>
            {message.content}
          </div>
        </div>
      {/each}
    </div>
    <div class="input-container">
      <input
        type="text"
        bind:value={newMessage}
        on:keydown={(e) => e.key === "Enter" && sendMessage(newMessage)}
        disabled={typing}
      />
      <button on:click={() => sendMessage(newMessage)} disabled={typing}
        >Send</button
      >
    </div>
  </div>
</main>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 80%;
    width: 80%;
    max-width: 1000px;
    border: 1px solid #ccc;
    background-color: #f2f2f2;
    margin: 0 auto;
    border-radius: 20px;
    padding: 16px;
    padding-bottom: 6px;
    position: fixed;
    overflow-y: scroll;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    font-family: Comic Sans MS;
    z-index: 1;
  }

  .chat-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: rgb(113, 186, 255);
    font-family: Comic Sans MS;
    margin-bottom: 1rem;
  }

  .messages-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .messages-wrapper::-webkit-scrollbar {
    display: none;
  }

  .message {
    display: flex;
    align-items: flex-end;
    margin-bottom: 8px;
    font-family: Comic Sans MS;
  }

  .message.user {
    justify-content: flex-end;
  }

  .message-text {
    background-color: rgb(113, 186, 255);
    color: #fff;
    padding: 8px 12px;
    border-radius: 16px;
    max-width: 75%;
    word-wrap: break-word;
    font-size: 20px;
    line-height: 1.4;
    text-align: left;
  }

  .message.user .message-text {
    background-color: rgb(113, 186, 255);
    color: #fff;
  }

  .message.choice {
    justify-content: center;
  }

  .message.choice .message-text {
    cursor: grab;
  }

  .message.hint {
    justify-content: center;
  }

  .message.hint .message-text {
    background-color: transparent;
    font-size: 14px;
    color: rgb(113, 186, 255);
  }

  .message.assistant .message-text {
    background-color: #fff;
    color: rgb(113, 186, 255);
  }

  .input-container {
    display: flex;
    margin-top: 16px;
  }

  input {
    flex-grow: 1;
    padding: 8px;
    border-radius: 20px;
    border: 1px solid #ccc;
  }

  input:focus {
    outline: 2px solid rgb(28, 134, 255);
  }

  button {
    margin-left: 8px;
    padding: 8px 12px;
    background-color: rgb(113, 186, 255);
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  button:disabled {
    background-color: #ccc;
    color: #fff;
    cursor: not-allowed;
  }

  button:hover {
    background-color: rgb(28, 134, 255);
  }
</style>
