<script>
    import { fade } from "svelte/transition";
    import { themeColor } from "./store.ts";
    import { marked } from "marked";
    import hljs from 'highlight.js';
    export let message;
    $: formattedMessage = message.content.replace(/\n/g, "<br />");
    // $: console.log(message);
</script>

<div class="message {message.role}">
    {#if message.role === "file"}
        <div class="message-text" in:fade={{ delay: 80 }}>
            {#if message.filename}
                📄{message.filename}
            {:else}
                📄{@html formattedMessage}
            {/if}
        </div>
    {:else}
    <div class="message-text" in:fade={{ delay: 80 }}>
        {@html formattedMessage}
    </div>
    {/if}
</div>


<style>
    .message {
    display: flex;
    align-items: flex-end;
    margin-bottom: 8px;
    font-family: Comic Sans MS;
  }

  .message.user {
    justify-content: flex-end;
  }
  .message.file {
    justify-content: flex-end;
  }

  .message-text {
    background-color: rgb(113, 186, 255);
    color: #fff;
    padding: 8px 12px;
    border-radius: 16px;
    max-width: 75%;
    word-wrap: break-word;
    font-size: 16px;
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
</style>