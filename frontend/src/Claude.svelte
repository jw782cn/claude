<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { fade } from "svelte/transition";
  import Message from "./Message.svelte";

  // Store for chat messages
  let messages = [];
  let model = "Model";
  let sessionNamesandIds = {};
  let currentSessionId = "";
  let inputRef;
  let URL = "http://localhost:3000";

  let messagesContainer;
  let newMessage = "";
  let typing = false;
  // $: console.log(messages);
  $: sessionName = sessionNamesandIds[currentSessionId] || "Session";
  // $: console.log(sessionNamesandIds, currentSessionId);

  // On mount, update messages
  onMount(async () => {
    await updateMessage();
  });

  // update all messages
  async function updateMessage() {
    const response = await fetch(URL + "/api/get-current-messages");
    const data = await response.json();
    console.log(data);
    messages.push(...data);
    messages = messages;
    // get model /api/get-model
    const modelResponse = await fetch(URL + "/api/get-current-model");
    const modelData = await modelResponse.json();
    // console.log(modelData);
    model = modelData.currentModel;
    // get session name /api/get-session-name
    const sessionNameResponse = await fetch(URL + "/api/get-session-names");
    const sessionData = await sessionNameResponse.json();
    sessionNamesandIds = sessionData;
    // get current session id
    const currentSessionIdResponse = await fetch(
      URL + "/api/get-current-session-id"
    );
    const currentSessionIdData = await currentSessionIdResponse.json();
    // console.log(currentSessionIdData);
    currentSessionId = currentSessionIdData.currentSessionId;
    // console.log(currentSessionId);
  }

  async function receiveMessage() {
    // Create an EventSource instance and handle open and update events
    const source = new EventSource(URL + "/api/stream-updates");

    source.addEventListener("open", (event) => {
      // console.log('Opened stream:', event);
      // check if event has data
      if (event.data) {
        const data = JSON.parse(event.data);
        if (data.status == 200) {
          console.log("200");
          messages.push({
            content: "",
            role: "assistant",
          });
        }
      }
    });

    source.addEventListener("update", (event) => {
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

    source.addEventListener("error", (event) => {
      console.log("Error received:", event);
      // close connection
      typing = false;
      newMessage = "";
      source.close();
    });
  }

  // Function to send message to API
  async function sendMessage(message) {
    messages.push({
      content: message,
      role: "user",
    });
    typing = true;
    newMessage = "Claude is typing...";

    // Send the message to the backend
    const response = await fetch(URL + "/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, role: "user"}),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    await receiveMessage();
  }

  async function sendFile(data){
    typing = true;
    newMessage = "File Uploading...";
    // Send the message to the backend
    const response = await fetch(URL + "/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: data.content,
        role: data.role,
        filename: data.filename,
      }),
    });
    await receiveMessage();
  }

  async function handleFileUpload(event) {
    console.log("file upload");
    const file = event.target.files[0];
    console.log(file);

    if (file) {
      // use utf-8 encoding
      const reader = new FileReader();

      reader.onload = () => {
        const contents = reader.result;
        console.log(contents);
        const data = {
          content: contents,
          role: "file",
          filename: file.name,
        };
        messages.push(data);
        messages = messages;
        // console.log(messages);
        // Send the message to the backend
        sendFile(data);
      };

      reader.readAsText(file);
    }
  }

  const scrollToBottom = async (node) => {
    node.scroll({ top: node.scrollHeight, behavior: "smooth" });
  };
  afterUpdate(() => {
    if (messagesContainer) {
      scrollToBottom(messagesContainer);
    }
  });
</script>

<main>
  <div
    class="chat-container"
    in:fade={{ delay: 100 }}
    out:fade={{ delay: 100 }}
  >
    <div class="chat-title">{model}</div>
    <div class="session-title">{sessionName}</div>
    <div class="messages-wrapper" bind:this={messagesContainer}>
      {#each messages as message}
        <Message {message} />
      {/each}
    </div>
    <div class="input-container">
      <input
        type="text"
        class="input-text"
        bind:value={newMessage}
        on:keydown={(e) => e.key === "Enter" && sendMessage(newMessage)}
        disabled={typing}
      />
      <button class="button" on:click={() => sendMessage(newMessage)} disabled={typing}
        >Send</button
      >
      <button class="button"  on:click={() => inputRef.click()} disabled={typing} >
        Upload
        <input type="file" bind:this={inputRef} class="input-file" on:change={handleFileUpload} />
      </button>
    </div>
  </div>
</main>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 93%;
    width: 98%;
    border: 1px solid #ccc;
    background-color: #f2f2f2;
    margin: 0 auto;
    border-radius: 20px;
    padding: 16px;
    padding-bottom: 6px;
    max-height: 93vh;
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
    align-self: center;
  }

  .session-title {
    font-size: 1rem;
    font-weight: bold;
    color: rgb(113, 186, 255);
    font-family: Comic Sans MS;
    margin-bottom: 1rem;
    align-self: center;
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

  .input-container {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
  }

  .input-text {
    flex-grow: 1;
    padding: 8px;
    border-radius: 20px;
    max-height: 600px;
    border: 1px solid #ccc;
    flex-wrap: wrap;
  }

  .input-text:focus {
    outline: 2px solid rgb(28, 134, 255);
  }
  
  .input-file {
    width: 20px;
    display:none;
  }

  .button {
    margin-left: 8px;
    padding: 8px 12px;
    background-color: rgb(113, 186, 255);
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .button:disabled {
    background-color: #ccc;
    color: #fff;
    cursor: not-allowed;
  }

  .button:hover {
    background-color: rgb(28, 134, 255);
  }

</style>
