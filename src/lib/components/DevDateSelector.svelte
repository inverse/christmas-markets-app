<script lang="ts">
  import { simulatedDate, setSimulatedDate } from "$lib/utils/date";

  let dateValue = $state(new Date());

  function updateSimulation() {
    setSimulatedDate($simulatedDate ? dateValue : null);
  }
</script>

<div
  class="fixed bottom-4 right-4 z-[9999] rounded-lg bg-white p-4 shadow-lg border border-gray-200"
>
  <h3 class="font-bold mb-2">Dev Date Selector</h3>
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
    class="border rounded p-1 mb-2"
  />
  <button
    onclick={updateSimulation}
    class="block w-full bg-pine text-white rounded p-1"
  >
    Apply
  </button>
</div>
