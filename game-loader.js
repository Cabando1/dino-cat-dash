(async () => {
  'use strict';
  const files = ["./game-part-01.txt", "./game-part-02.txt", "./game-part-03.txt", "./game-part-04.txt", "./game-part-05.txt", "./game-part-06.txt", "./game-part-07.txt", "./game-part-08.txt"];
  try {
    const encoded = (await Promise.all(files.map(async file => {
      const response = await fetch(file, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Unable to load ${file}`);
      return response.text();
    }))).join('').replace(/\s+/g, '');
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const source = new TextDecoder().decode(bytes);
    (0, eval)(source);
  } catch (error) {
    console.error(error);
    const title = document.getElementById('overlayTitle');
    const text = document.getElementById('overlayText');
    if (title) title.textContent = 'Game failed to load';
    if (text) text.textContent = 'Refresh this page while connected to the internet.';
  }
})();
