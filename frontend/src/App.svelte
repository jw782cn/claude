<script>
  import Claude from "./Claude.svelte";
  import { themeColor } from "./store.ts";

</script>

<div class="claude-wrapper">
	<Claude />
</div>


<style>
	:root {
		--primary-color: {$themeColor.primary};
		--secondary-color: {$themeColor.secondary};
	}
	.claude-wrapper{
	}
</style>