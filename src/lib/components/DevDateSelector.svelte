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
      ><polyline points="16 18 22 12 16 6" /><polyline
        points="8 6 2 12 8 18"
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
