# Tasks

Here are the list of bugs of features left to implement

## Bugs

- [ ] Popup fully visible when open in all cases
  - [ ] Investigate popup DOM structure and leaflet constraints.
  - [ ] Implement CSS adjustments for dynamic centering and overflow handling.
- [ ] Find my location show nearest market and our location pin with nearest market popup open and fully visible
  - [ ] Update `Map.svelte` `findMe` logic to compute a bounding box including both user and nearest market.
  - [ ] Programmatically open the nearest market's popup.
  - [ ] Adjust map zoom/centering to fit the bounding box.


## Features


- [ ] Nearest market filters open state, if nothing open show a sad modal
