export function CodexScreen({ onBackToArena }: { onBackToArena: () => void }) {
  const entries = [
    ['EVERY STEP LEAVES A SEAL', 'Collect all fragments and reach the portal. Every successful move permanently blocks the tile you leave. Your destination stays open until you leave it.'],
    ['SURPRISE RIFTS', 'No random tile is shown in advance. At random moments, a cyan rift appears immediately beside you. It blocks entry for one turn and clears after the next successful move.'],
    ['TIME REWIND', 'Undo restores your position, fragments, permanent trail and the exact surprise-rift timing. Replaying the same move produces the same surprise. Use Z, B, Space or the Time Rewind button.'],
    ['A FRESH TIMELINE', 'Restart clears the maze and changes the upcoming surprise pattern. Its first surprise avoids the previous first-spawn and last-visible tiles when safe adjacent alternatives exist.'],
    ['THE SLING RING PORTAL', 'A locked portal is walkable, but only all fragments plus arrival on the portal wins. Leaving it early seals it like any other tile, so plan the whole path.'],
    ['CONTROLS', 'Move with arrow keys, WASD, the direction buttons or an adjacent tile. R restarts; Z, B or Space rewinds. Enter scans your position. Hints suggest a legal step without revealing a future random tile.'],
  ];
  return <section className="max-w-4xl mx-auto flex flex-col gap-5">
    <div className="archive-card flex items-center justify-between gap-3"><div><h1 className="font-heading font-black text-2xl">REALITY CODEX</h1><p className="text-sm">The Sorcerer's field guide</p></div><button className="archive-button" onClick={onBackToArena}>Return to arena</button></div>
    <div className="grid md:grid-cols-2 gap-4">{entries.map(([title, text], index) => <article key={title} className="archive-card"><h2 className="font-heading font-extrabold mb-3">{index + 1}. {title}</h2><p className="text-sm leading-relaxed">{text}</p></article>)}</div>
  </section>;
}
