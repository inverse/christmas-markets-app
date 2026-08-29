<script lang="ts">
  import { simulatedDate, setSimulatedDate } from "$lib/utils/date";

  let dateValue = $state(new Date());
  let isCollapsed = $state(true);

  function updateSimulation() {
    setSimulatedDate($simulatedDate ? dateValue : null);
  }
</script>

{#if isCollapsed}
  <button
    onclick={() => (isCollapsed = false)}
    class="fixed bottom-4 right-4 z-[9999] p-3 bg-pine text-white rounded-full shadow-lg hover:bg-pine-dark transition"
    title="Date Simulation"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
      /><line x1="8" y1="2" x2="8" y2="6" /><line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
      /></svg
    >
  </button>
{:else}
  <div
    class="fixed bottom-4 right-4 z-[9999] rounded-lg bg-white p-4 shadow-lg border border-gray-200"
  >
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-bold">Dev Date</h3>
      <button
        onclick={() => (isCollapsed = true)}
        class="text-xs text-gray-500 hover:text-gray-800">Close</button
      >
    </div>
    <label class="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        checked={!!$simulatedDate}
        onchange={(e) =>
          setSimulatedDate(e.currentTarget.checked ? dateValue : null)}
      />
      Simulate Date
    </label>
    <input
      type="date"
      value={($simulatedDate || dateValue).toISOString().split("T")[0]}
      onchange={(e) => {
        dateValue = new Date(e.currentTarget.value);
        if ($simulatedDate) setSimulatedDate(dateValue);
      }}
      disabled={!$simulatedDate}
      class="border rounded p-1 mb-2 w-full"
    />
    <button
      onclick={updateSimulation}
      class="block w-full bg-pine text-white rounded p-1"
    >
      Apply
    </button>
  </div>
{/if}
