/* Solid white product pictures for purchases without a photo, drawn on a 64×64 grid.
   `d` is the silhouette (filled with currentColor); `cut` is carved out of it as thin
   lines and holes, which gives the detail. In `cut` a stroked element cuts a line,
   `fill="#000"` cuts a hole and `fill="#fff"` puts material back. */

export interface ProductIconDef {
  d: string;
  cut?: string;
}

export const PRODUCT_ICONS: Record<string, ProductIconDef> = {
  jacket: {
    d: '<path d="M24 5h16l1.6 6.4 9.6 3.2c2.6.9 4.3 3.2 4.5 6l2.3 27.9a2 2 0 0 1-2 2.2h-5.4a2 2 0 0 1-2-1.8L47 30v26a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V30l-1.6 19.7a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-2.2l2.3-27.9c.2-2.8 1.9-5.1 4.5-6l9.6-3.2z"/>',
    cut:
      '<path d="M32 13v45"/><path d="M22.6 11.4c2.9 1.9 6 2.8 9.4 2.8s6.5-.9 9.4-2.8"/>' +
      '<path d="M17.4 23.5h29.2M17.4 33h29.2M17.4 42.5h29.2"/><path d="M7.9 28.5h8.3M47.8 28.5h8.3M7.2 39h8.2M48.6 39h8.2"/>' +
      '<path d="M13.4 15.4c2.4 3.4 3.6 7.6 3.6 12.6M50.6 15.4c-2.4 3.4-3.6 7.6-3.6 12.6"/>' +
      '<path d="M20.6 45.5l2.2 6.5M43.4 45.5l-2.2 6.5"/><rect x="30.4" y="15.5" width="3.2" height="6.5" rx="1.3" fill="#fff" stroke="none"/>',
  },
  hoodie: {
    d: '<path d="M23 6.4c2.6-1.8 5.6-2.6 9-2.6s6.4.8 9 2.6l2.6 7.4 8.6 3c2.6.9 4.3 3.2 4.5 6l2.2 26.2a2 2 0 0 1-2 2.2h-5.3a2 2 0 0 1-2-1.8L48 32v24a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V32l-1.6 17.4a2 2 0 0 1-2 1.8H7.1a2 2 0 0 1-2-2.2l2.2-26.2c.2-2.8 1.9-5.1 4.5-6l8.6-3z"/>',
    cut:
      '<path fill="#000" stroke="none" d="M25.4 9.4c2-1.1 4.2-1.6 6.6-1.6s4.6.5 6.6 1.6c-1.2 4.8-3.6 8.2-6.6 9.8-3-1.6-5.4-5-6.6-9.8z"/>' +
      '<path d="M28.6 19v9M35.4 19v9"/><path d="M20 40.5h24l2.5 10.5h-29z"/><path d="M16.4 53.4h31.2M5.8 46.4h8.6M49.6 46.4h8.6"/>' +
      '<path d="M12.6 17.6c2.4 3.4 3.4 7.6 3.4 12.4M51.4 17.6C49 21 48 25.2 48 30"/>',
  },
  tshirt: {
    d: '<path d="M22.6 7.5c1.9 2.8 5.4 4.5 9.4 4.5s7.5-1.7 9.4-4.5l13.7 5.2c1.4.5 2.2 2 1.9 3.5l-1.8 9.3a2.4 2.4 0 0 1-2.9 1.9L47 26v28a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V26l-5.3 1.4a2.4 2.4 0 0 1-2.9-1.9L7 16.2c-.3-1.5.5-3 1.9-3.5z"/>',
    cut:
      '<path d="M24.6 9.8c2 2.3 4.6 3.6 7.4 3.6s5.4-1.3 7.4-3.6"/><path d="M10.6 22.4l6-1.5M53.4 22.4l-6-1.5"/>' +
      '<path d="M17 18.6V26M47 18.6V26"/><path d="M17.5 51.5h29"/><path d="M37.5 20.5h6v6c0 1.4-1.3 2.4-3 2.4s-3-1-3-2.4z"/>',
  },
  pants: {
    d: '<path d="M15 5h34a2 2 0 0 1 2 1.8l3.8 49a2 2 0 0 1-2 2.2H41.6a2 2 0 0 1-2-1.7L32.6 22h-1.2l-7 34.3a2 2 0 0 1-2 1.7H11.2a2 2 0 0 1-2-2.2L13 6.8A2 2 0 0 1 15 5z"/>',
    cut:
      '<path d="M13.6 12h36.8"/><path d="M20.5 5.5V12M43.5 5.5V12M32 5.5V12"/><path d="M32 12v9.5M35.4 12v6.6c0 2.6-1.4 4.2-3.6 4.6"/>' +
      '<path d="M16.6 12.4c.4 4.8 2.6 7.8 7 8.4M47.4 12.4c-.4 4.8-2.6 7.8-7 8.4"/><path d="M9.8 51.8h13M41.2 51.8h13"/>' +
      '<circle cx="32" cy="8.6" r="1.6" fill="#000" stroke="none"/>',
  },
  dress: {
    d: '<path d="M25.4 3.5h2.8l1.6 7h4.4l1.6-7h2.8l1.1 9c.3 2.6-.6 5.2-2.4 7l-1.7 1.8H28.4l-1.7-1.8c-1.8-1.8-2.7-4.4-2.4-7z"/><path d="M27.6 23h8.8l1.8 2.4c5.4 8 10.2 17.8 13.6 28.3.5 1.6-.7 3.3-2.4 3.3H14.6c-1.7 0-2.9-1.7-2.4-3.3C15.6 43.2 20.4 33.4 25.8 25.4z"/>',
    cut: '<path d="M32 27.5V55M27 28.5l-5 26M37 28.5l5 26"/><path d="M27.4 12.5c1.4 2.2 2.9 3.3 4.6 3.3s3.2-1.1 4.6-3.3"/>',
  },
  sneaker: {
    d:
      '<path d="M4 41v-9c0-2.6 1.4-5 3.6-6.4l3.6-2.2c1.6-1 3.6-.8 5 .4 2.2 1.8 4.8 2.8 7.6 2.8h1.2c1.8 0 3.4-.8 4.6-2 3.6 3.4 8.2 5.6 13.2 6.4l5.2.9c4 .7 7.4 3 9.6 6.4q1.2 1.2 1.3 2.7z"/>' +
      '<path d="M3 42.6h58V45c0 1.9-1.6 3.5-3.5 3.5h-51C4.6 48.5 3 46.9 3 45z"/>',
    cut:
      '<path d="M5.5 45.6h53" stroke-width="1.2" stroke-dasharray="2.4 1.8"/><path d="M48.6 32.2c3.4 1.4 6 4.2 7.2 7.6"/>' +
      '<path d="M11 36.6c9.4.4 18.2-2 25.4-7.8"/><path d="M8.6 27.4v9"/><path d="M14 25.6c3 2.4 6.6 3.6 10.6 3.6h1.4" stroke-width="1.4"/>' +
      '<circle cx="32.8" cy="27" r="1.2" fill="#000" stroke="none"/><circle cx="36.8" cy="28.9" r="1.2" fill="#000" stroke="none"/><circle cx="40.9" cy="30.2" r="1.2" fill="#000" stroke="none"/>',
  },
  boot: {
    d:
      '<path d="M13 4h17a2 2 0 0 1 2 2v19.4c0 3 2 5.6 4.8 6.6l13.6 4.8c5.4 1.9 9 7 9 12.7V48H8v-6.6c0-1.8.4-3.4 1.2-4.9L11 33V6a2 2 0 0 1 2-2z"/>' +
      '<path d="M6.6 49.5H60V52a3 3 0 0 1-3 3H24.5v2.6a1.4 1.4 0 0 1-1.4 1.4H8.6a2 2 0 0 1-2-2z"/>',
    cut:
      '<path d="M17.4 4.6v14.6c0 3 2.4 5.4 5.4 5.4s5.4-2.4 5.4-5.4V4.6"/><path d="M20.6 6.5v11.6M22.8 6.5v13M25 6.5v11.6" stroke-width="1.2"/>' +
      '<path d="M9.4 45h50" stroke-width="1.2" stroke-dasharray="2.2 1.8"/><path d="M42.2 34.4c-2.4 2.4-3.2 5.6-2.6 9"/>',
  },
  cap: {
    d: '<circle cx="32" cy="12.6" r="2.4"/><path d="M10 35.5C10 23.4 19.8 13.5 32 13.5S54 23.4 54 35.5v2.7c0 1-.8 1.8-1.8 1.8H11.8c-1 0-1.8-.8-1.8-1.8z"/><path d="M8.6 41.6h40.2c6.8 0 12.2 2 13.6 5.4.3.8-.3 1.6-1.2 1.6H25.2c-6.4 0-12.4-1.4-17.2-4.2-1-.6-.6-2.8.6-2.8z"/>',
    cut:
      '<path d="M32 15.4V39"/><path d="M31 15.6c-7 4.4-10 12.6-9.8 23.6M33 15.6c7 4.4 10 12.6 9.8 23.6"/>' +
      '<circle cx="24.6" cy="23" r="1.1" fill="#000" stroke="none"/><circle cx="39.4" cy="23" r="1.1" fill="#000" stroke="none"/>' +
      '<path d="M14 44.2c11 2 24.4 2.3 44.8 1.6" stroke-width="1.4" stroke-dasharray="2.2 2"/><path d="M10.6 36h42.8" stroke-width="1.6"/>',
  },
  bag: {
    d: '<path fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" d="M21.5 25v-8c0-5.8 4.7-10.5 10.5-10.5S42.5 11.2 42.5 17v8"/><path d="M10.8 21h42.4c1.6 0 3 1.2 3.2 2.8l3.4 28.4c.4 3.6-2.4 6.8-6 6.8H9.8c-3.6 0-6.4-3.2-6-6.8l3.4-28.4c.2-1.6 1.6-2.8 3.2-2.8z"/>',
    cut:
      '<path d="M7 31.5h50"/><rect x="28.2" y="29" width="7.6" height="6.4" rx="1.6"/><path d="M8.2 53.2h47.6" stroke-width="1.4" stroke-dasharray="2.2 2"/>' +
      '<rect x="18.5" y="21" width="6" height="4.6" rx="1" fill="#000" stroke="none"/><rect x="39.5" y="21" width="6" height="4.6" rx="1" fill="#000" stroke="none"/>',
  },
  backpack: {
    d: '<path fill="none" stroke="currentColor" stroke-width="3.6" d="M25.5 14.5v-4a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v4"/><path d="M19 13h26c5.5 0 10 4.5 10 10v31a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V23c0-5.5 4.5-10 10-10z"/>',
    cut:
      '<path d="M15.5 37.5h33v12.5a3 3 0 0 1-3 3h-27a3 3 0 0 1-3-3z"/><path d="M15.5 42.5h33"/>' +
      '<path d="M10.8 26c4.4-5.6 12-8.6 21.2-8.6s16.8 3 21.2 8.6"/><path d="M43.5 26v5.4M43.5 42.6v4.6"/>',
  },
  watch: {
    d: '<path d="M22 3.5h20l2.4 11H19.6z"/><path d="M19.6 49.5h24.8L42 60.5H22z"/><rect x="13.5" y="12.5" width="37" height="39" rx="11.5"/><rect x="49" y="25" width="5" height="9" rx="2"/>',
    cut:
      '<rect x="18" y="17" width="28" height="30" rx="7.5" stroke-width="2.2"/><path d="M32 32v-8.5M32 32l6.2 3.6"/><circle cx="32" cy="32" r="1.9" fill="#000" stroke="none"/>' +
      '<path d="M22.6 8.6h18.8M22.6 55.4h18.8" stroke-width="1.6"/>',
  },
  glasses: {
    d: '<path d="M2.5 22c0-1.4 1.1-2.5 2.5-2.5h21.2c1.6 0 2.9 1.2 3 2.8l.2 2.2h5.2l.2-2.2c.1-1.6 1.4-2.8 3-2.8H59c1.4 0 2.5 1.1 2.5 2.5v4.6c0 9.6-5.8 16.4-13.6 16.4-7.4 0-12.4-5.4-13.4-12.4h-5c-1 7-6 12.4-13.4 12.4C8.3 43 2.5 36.2 2.5 26.6z"/>',
    cut: '<path d="M6.6 24.2h19.6c-.4 8.4-4.6 14.2-10 14.2S7 32.6 6.6 24.2z"/><path d="M37.8 24.2h19.6c-.4 8.4-4.6 14.2-9.8 14.2s-9.4-5.8-9.8-14.2z"/>',
  },
  phone: {
    d: '<rect x="15.5" y="3" width="33" height="58" rx="8.5"/><rect x="12.4" y="16" width="2" height="6" rx="1"/><rect x="12.4" y="24.5" width="2" height="9" rx="1"/><rect x="49.6" y="20" width="2" height="11" rx="1"/>',
    cut:
      '<rect x="19.4" y="7" width="17.4" height="18" rx="5.2" stroke-width="2"/>' +
      '<circle cx="24.4" cy="12" r="3.3" fill="#000" stroke="none"/><circle cx="24.4" cy="20" r="3.3" fill="#000" stroke="none"/><circle cx="31.8" cy="16" r="3.3" fill="#000" stroke="none"/>' +
      '<circle cx="24.4" cy="12" r="1.3" fill="#fff" stroke="none"/><circle cx="24.4" cy="20" r="1.3" fill="#fff" stroke="none"/><circle cx="31.8" cy="16" r="1.3" fill="#fff" stroke="none"/>' +
      '<circle cx="32" cy="10.4" r="1" fill="#000" stroke="none"/><circle cx="32" cy="21.6" r="1" fill="#000" stroke="none"/>',
  },
  laptop: {
    d: '<path d="M12.5 8h39a3.5 3.5 0 0 1 3.5 3.5V42H9V11.5A3.5 3.5 0 0 1 12.5 8z"/><path d="M2 44.5h60v2c0 2.8-2.2 5-5 5H7c-2.8 0-5-2.2-5-5z"/>',
    cut:
      '<rect x="13.4" y="12.4" width="37.2" height="25.6" rx="1.4" stroke-width="2"/><circle cx="32" cy="10.2" r="0.9" fill="#000" stroke="none"/>' +
      '<rect x="25.5" y="44" width="13" height="2.8" rx="1.4" fill="#000" stroke="none"/>',
  },
  headphones: {
    d: '<path fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" d="M10.5 37.5V31a21.5 21.5 0 0 1 43 0v6.5"/><rect x="5" y="32.5" width="14" height="25" rx="6"/><rect x="45" y="32.5" width="14" height="25" rx="6"/>',
    cut: '<path d="M14.2 34v22M49.8 34v22"/><path d="M15.5 21.4a19 19 0 0 1 33 0" stroke-width="1.4"/>',
  },
  earbuds: {
    d: '<rect x="8" y="15" width="48" height="36" rx="13"/>',
    cut:
      '<path d="M8.4 25.5h47.2"/><circle cx="32" cy="32" r="1.5" fill="#000" stroke="none"/>' +
      '<path d="M23 15.6v2.8M41 15.6v2.8" stroke-width="1.4"/><path d="M8.6 34h4M51.4 34h4" stroke-width="1.6"/>',
  },
  tv: {
    d: '<rect x="3" y="8" width="58" height="38" rx="4.5"/><path d="M28.5 45h7v5h-7z"/><path d="M22 49.5h20l2 5.5H20z"/><rect x="16" y="54" width="32" height="3.5" rx="1.75"/>',
    cut: '<rect x="7.4" y="12.4" width="49.2" height="28.6" rx="1.6" stroke-width="2"/><circle cx="54.6" cy="43.4" r="0.9" fill="#000" stroke="none"/>',
  },
  gamepad: {
    d: '<path d="M17 15h30c7.4 0 13.4 5.6 14 13l1.5 18.6c.5 5.4-3.8 9.4-8.6 9.4-3.3 0-6.1-1.8-7.6-4.6l-2.6-4.8c-.8-1.6-2.4-2.6-4.2-2.6H24.5c-1.8 0-3.4 1-4.2 2.6l-2.6 4.8C16.2 54.2 13.4 56 10.1 56c-4.8 0-9.1-4-8.6-9.4L3 28c.6-7.4 6.6-13 14-13z"/>',
    cut:
      '<path fill="#000" stroke="none" d="M15.2 22.6h4v4.2h4.2v4h-4.2V35h-4v-4.2H11v-4h4.2z"/>' +
      '<circle cx="46" cy="23.8" r="2.3" fill="#000" stroke="none"/><circle cx="51.2" cy="28.8" r="2.3" fill="#000" stroke="none"/><circle cx="46" cy="33.8" r="2.3" fill="#000" stroke="none"/><circle cx="40.8" cy="28.8" r="2.3" fill="#000" stroke="none"/>' +
      '<circle cx="25" cy="39" r="4.4" fill="#000" stroke="none"/><circle cx="39" cy="39" r="4.4" fill="#000" stroke="none"/><circle cx="25" cy="39" r="2.6" fill="#fff" stroke="none"/><circle cx="39" cy="39" r="2.6" fill="#fff" stroke="none"/>' +
      '<path d="M28.6 25h2.6M32.8 25h2.6" stroke-width="2"/>',
  },
  camera: {
    d: '<path d="M8 17h10.5l3.2-5.2c.7-1.1 1.9-1.8 3.2-1.8h14.2c1.3 0 2.5.7 3.2 1.8l3.2 5.2H56a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V22a5 5 0 0 1 5-5z"/><rect x="9.5" y="12.4" width="7.5" height="3.6" rx="1.2"/>',
    cut:
      '<circle cx="32" cy="35.5" r="12"/><circle cx="32" cy="35.5" r="6.6" fill="#000" stroke="none"/><circle cx="32" cy="35.5" r="3" fill="#fff" stroke="none"/>' +
      '<rect x="48" y="21.5" width="6.5" height="3.6" rx="1" fill="#000" stroke="none"/><path d="M3.4 27h8.6M52 27h8.6" stroke-width="1.6"/>',
  },
  armchair: {
    d: '<path d="M14 10c0-2.8 2.2-5 5-5h26c2.8 0 5 2.2 5 5v17H14z"/><path d="M3.5 26.5C3.5 23.5 6 21 9 21s5.5 2.5 5.5 5.5V48h-11z"/><path d="M49.5 26.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5V48h-11z"/><path d="M16 31h32a3 3 0 0 1 3 3v14H13V34a3 3 0 0 1 3-3z"/><rect x="3.5" y="46" width="57" height="6" rx="2"/><path d="M7.5 52h4.5l-1 7H8.5zM52 52h4.5l-1 7H53z"/>',
    cut:
      '<path d="M14.8 28.6V46M49.2 28.6V46"/><path d="M14.5 40.6h35"/><path d="M17.6 29.4c4.2-1.4 8.8-2 14.4-2s10.2.6 14.4 2"/><path d="M4 46.4h56" stroke-width="1.8"/>' +
      '<circle cx="23" cy="13" r="1.2" fill="#000" stroke="none"/><circle cx="32" cy="13" r="1.2" fill="#000" stroke="none"/><circle cx="41" cy="13" r="1.2" fill="#000" stroke="none"/>' +
      '<circle cx="27.5" cy="19.5" r="1.2" fill="#000" stroke="none"/><circle cx="36.5" cy="19.5" r="1.2" fill="#000" stroke="none"/>',
  },
  sofa: {
    d: '<rect x="8" y="13" width="48" height="21" rx="5"/><rect x="2" y="24" width="11.5" height="25" rx="5"/><rect x="50.5" y="24" width="11.5" height="25" rx="5"/><rect x="11" y="32.5" width="42" height="16.5" rx="3"/><path d="M6.5 49h4.5l-1 6.5H7.5zM53 49h4.5l-1 6.5H54z"/>',
    cut: '<path d="M32 14v18M32 34v14.5"/><path d="M13.6 30v18.4M50.4 30v18.4"/><path d="M13.6 41.4h36.8"/>',
  },
  bed: {
    d: '<rect x="3" y="9" width="7.5" height="47" rx="2.6"/><rect x="9" y="33" width="52" height="15" rx="3"/><rect x="55.5" y="46" width="4.5" height="10" rx="1.6"/><rect x="12.5" y="24.5" width="13" height="8.5" rx="4"/><path d="M28 23h27a6 6 0 0 1 6 6v4H28z"/>',
    cut: '<path d="M10.6 34v13.4"/><path d="M26.8 23v10.6"/><path d="M28 33.6h33"/><path d="M10.6 41h50.4" stroke-width="1.8"/><path d="M5.2 14.5h3.2" stroke-width="1.6"/>',
  },
  desk: {
    d: '<rect x="2" y="15" width="60" height="7" rx="2"/><rect x="6" y="21" width="5.5" height="36" rx="1.5"/><rect x="37" y="21" width="22" height="36" rx="2"/>',
    cut:
      '<path d="M37.4 33.2h21.2M37.4 45.2h21.2"/><path d="M2.6 18.6h58.8" stroke-width="1.4"/>' +
      '<rect x="44.2" y="25.8" width="7.6" height="2.6" rx="1.3" fill="#000" stroke="none"/><rect x="44.2" y="37.8" width="7.6" height="2.6" rx="1.3" fill="#000" stroke="none"/><rect x="44.2" y="49.8" width="7.6" height="2.6" rx="1.3" fill="#000" stroke="none"/>',
  },
  lamp: {
    d: '<path d="M21.6 5h20.8c1.4 0 2.6.9 3 2.2l7.6 20.4c.5 1.4-.5 2.9-2 2.9H13c-1.5 0-2.5-1.5-2-2.9l7.6-20.4c.4-1.3 1.6-2.2 3-2.2z"/><rect x="30.4" y="29" width="3.2" height="21" rx="1"/><path d="M19 53.5c0-2.5 2-4.5 4.5-4.5h17c2.5 0 4.5 2 4.5 4.5V57a2 2 0 0 1-2 2H21a2 2 0 0 1-2-2z"/><path fill="none" stroke="currentColor" stroke-width="1.4" d="M42 30v7"/><circle cx="42" cy="38.6" r="1.8"/>',
    cut: '<path d="M14.5 23.6h35"/><path d="M27.4 6.6l-3.6 15.6M36.6 6.6l3.6 15.6" stroke-width="1.6"/><path d="M19.4 53h25.2" stroke-width="1.6"/>',
  },
  bike: {
    d:
      '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="42" r="10.5" stroke-width="4.6"/><circle cx="50" cy="42" r="10.5" stroke-width="4.6"/>' +
      '<path stroke-width="3.6" d="M14 42l10-18h18l8 18M24 24l8 18h6l4-18M40 13.5l2 10.5"/><path stroke-width="4.4" d="M19 19h10M36.5 13.5h7"/></g>' +
      '<circle cx="14" cy="42" r="2.6"/><circle cx="50" cy="42" r="2.6"/><circle cx="32" cy="42" r="3.4"/>',
  },
  book: {
    d: '<path d="M15.5 4H51a3 3 0 0 1 3 3v41H18a4.5 4.5 0 0 0 0 9h36v2.5a2.5 2.5 0 0 1-2.5 2.5H18a8 8 0 0 1-8-8V9.5A5.5 5.5 0 0 1 15.5 4z"/>',
    cut: '<path d="M18 5v42"/><rect x="25.5" y="13" width="21" height="9" rx="2"/><path d="M20 52.5h34" stroke-width="1.4"/><path d="M29.5 31h13" stroke-width="1.8"/>',
  },
  perfume: {
    d: '<rect x="24.5" y="3" width="15" height="10.5" rx="2.6"/><rect x="28.5" y="12.5" width="7" height="6"/><rect x="11" y="17.5" width="42" height="43" rx="9.5"/>',
    cut:
      '<rect x="19.5" y="30.5" width="25" height="17" rx="3"/><path d="M25.5 36.4h13M27.5 41.6h9" stroke-width="1.6"/>' +
      '<path d="M28.6 5v6.6M32 5v6.6M35.4 5v6.6" stroke-width="1.4"/><path d="M14.5 24.5h35" stroke-width="1.4"/>',
  },
  ring: {
    d: '<circle cx="32" cy="42" r="16.5" fill="none" stroke="currentColor" stroke-width="5"/><path d="M23.6 7.5h16.8l6.6 7.5L32 30.5 17 15z"/><rect x="27" y="25.5" width="10" height="4" rx="1"/>',
    cut: '<path d="M17.8 15h28.4" stroke-width="1.6"/><path d="M27.6 7.8L24.2 15 32 29M36.4 7.8L39.8 15 32 29" stroke-width="1.6"/><path d="M42 46.6c-1.8 3.2-5.6 5.4-10 5.4" stroke-width="1.6"/>',
  },
  gift: {
    d: '<path d="M32 21c-3-8-9-14-14.5-12.2-3 1-3.4 5.4-.6 7.6 3.4 2.6 9 3.6 15.1 4.6 6.1-1 11.7-2 15.1-4.6 2.8-2.2 2.4-6.6-.6-7.6C41 7 35 13 32 21z"/><rect x="6" y="21" width="52" height="11.5" rx="2.5"/><rect x="10" y="31.5" width="44" height="26.5" rx="2.5"/>',
    cut:
      '<path d="M28.4 21.6v36M35.6 21.6v36"/><path d="M10.4 32.6h43.2"/>' +
      '<path fill="#000" stroke="none" d="M29.6 18.8c-2.6-4.4-6.4-7.6-9.2-6.8-1.3.4-1.4 2.2-.3 3.1 2.2 1.8 5.6 2.8 9.5 3.7zM34.4 18.8c2.6-4.4 6.4-7.6 9.2-6.8 1.3.4 1.4 2.2.3 3.1-2.2 1.8-5.6 2.8-9.5 3.7z"/>',
  },
  kettle: {
    d: '<rect x="29" y="5" width="6" height="5.5" rx="2"/><path d="M21.5 18c0-4.2 4.7-7.5 10.5-7.5s10.5 3.3 10.5 7.5z"/><path d="M19.6 17h24.8c2.1 0 3.8 1.6 4 3.7l2.8 31.6c.3 3.2-2.2 5.7-5.4 5.7H18.2c-3.2 0-5.7-2.5-5.4-5.7l2.8-31.6c.2-2.1 1.9-3.7 4-3.7z"/><path fill="none" stroke="currentColor" stroke-width="4.4" stroke-linecap="round" d="M48.5 24h2.5c4.4 0 8 3.6 8 8v8c0 4.4-3.6 8-8 8h-1.5"/><path d="M15 26.5L6.4 20c-1.1-.8-2.6.1-2.4 1.5l1.6 9.4c.3 1.6 1.3 3 2.8 3.8l6.4 3.6z"/>',
    cut: '<path d="M15.2 24h33.6"/><path d="M13.6 50h36.8"/><rect x="22.5" y="29.5" width="5" height="15" rx="2.5"/>',
  },
  suitcase: {
    d: '<path fill="none" stroke="currentColor" stroke-width="3.6" d="M24.5 12.5v-5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v5"/><rect x="12" y="12" width="40" height="42" rx="6"/><circle cx="19.5" cy="57.5" r="3.2"/><circle cx="44.5" cy="57.5" r="3.2"/>',
    cut: '<path d="M22.5 18.5v29M32 18.5v29M41.5 18.5v29"/><path d="M12.6 51.4h38.8" stroke-width="1.6"/>',
  },
  dumbbell: {
    d: '<rect x="2.5" y="23" width="6.5" height="18" rx="2.6"/><rect x="8" y="17" width="8.5" height="30" rx="3"/><rect x="47.5" y="17" width="8.5" height="30" rx="3"/><rect x="55" y="23" width="6.5" height="18" rx="2.6"/><rect x="15" y="29.4" width="34" height="5.2" rx="2"/>',
    cut: '<path d="M8.6 24.5v15M55.4 24.5v15"/><path d="M25.5 30v4M28.5 30v4M31.5 30v4M34.5 30v4M37.5 30v4" stroke-width="1.3"/>',
  },
};

const BY_TITLE: [RegExp, string][] = [
  [/куртк|пухов|парк[аи]|ветровк|бомбер|пальто|жилет|пиджак|блейзер|шуб/i, 'jacket'],
  [/худи|толстовк|свитшот|свитер|кофт|джемпер/i, 'hoodie'],
  [/футболк|лонгслив|поло|майк|рубаш|топ\b|блуз/i, 'tshirt'],
  [/джинс|брюк|штан|шорт|леггинс|джоггер|карго/i, 'pants'],
  [/плать|юбк|сарафан/i, 'dress'],
  [/кросс|кед|сникер|nike|adidas|new balance/i, 'sneaker'],
  [/ботин|сапог|челси|туфл|лофер|обув|угги|тимберленд/i, 'boot'],
  [/кепк|бейсболк|шапк|панам|шляп/i, 'cap'],
  [/рюкзак/i, 'backpack'],
  [/сумк|шоппер|клатч|кошел|портмоне/i, 'bag'],
  [/часы|watch|браслет/i, 'watch'],
  [/очки/i, 'glasses'],
  [/airpods|эйрподс|науш.*(беспровод|tws)|вкладыш/i, 'earbuds'],
  [/науш/i, 'headphones'],
  [/телефон|айфон|iphone|смартфон|samsung|xiaomi|планшет|ipad/i, 'phone'],
  [/ноут|макбук|компьют|macbook|пк\b/i, 'laptop'],
  [/телев|монитор|проектор/i, 'tv'],
  [/геймпад|джойстик|приставк|playstation|ps5|xbox|nintendo|switch/i, 'gamepad'],
  [/камер|фотоаппарат|gopro/i, 'camera'],
  [/кресл|стул/i, 'armchair'],
  [/диван/i, 'sofa'],
  [/кроват|матрас/i, 'bed'],
  [/стол|парт|тумб|комод/i, 'desk'],
  [/ламп|светиль|торшер|люстр/i, 'lamp'],
  [/велос|самокат/i, 'bike'],
  [/книг|учебник|ежедневник/i, 'book'],
  [/дух|парфюм|туалетн|крем|космет|сыворот|помад/i, 'perfume'],
  [/кольц|серьг|цепоч|подвес|украшен|золот/i, 'ring'],
  [/чайник|кофе|блендер|тостер|мультивар|пылесос/i, 'kettle'],
  [/чемодан|сумка.дорож/i, 'suitcase'],
  [/гантел|гир[яи]|штанг|тренаж|коврик для йог|абонемент/i, 'dumbbell'],
];

export const productIconFor = (title: string) => BY_TITLE.find(([re]) => re.test(title))?.[1] ?? 'gift';
