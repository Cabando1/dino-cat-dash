(async () => {
  const files = [
    './game-part-01.txt',
    './game-part-02.txt',
    './game-part-03.txt',
    './game-part-04.txt',
    './game-part-05.txt',
    './game-part-06.txt',
    './game-part-07.txt'
  ];
  try {
    const parts = await Promise.all(files.map(file => fetch(file).then(response => {
      if (!response.ok) throw new Error(`Unable to load ${file}`);
      return response.text();
    })));
    const source = atob(parts.join('').replace(/\s+/g, ''));
    const bytes = Uint8Array.from(source, char => char.charCodeAt(0));
    const code = new TextDecoder().decode(bytes);
    (0, eval)(code);
  } catch (error) {
    console.error(error);
    const title = document.getElementById('overlayTitle');
    const text = document.getElementById('overlayText');
    if (title) title.textContent = 'Game failed to load';
    if (text) text.textContent = 'Refresh the page while connected to the internet.';
  }
})();
