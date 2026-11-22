// Ember Sigil Duel — keyboard and mouse.
// One file, one job: turn presses and clicks into game actions.

export function bindInput(ui) {
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (key === 'm') { ui.toggleMute(); return; }
    if (key === 'r') { ui.restart(); return; }
    if (key === 'h') { ui.toggleHelp(); return; }
    if (key === 'enter' || key === ' ') {
      e.preventDefault();
      if (ui.screen() === 'title') ui.start();
      else if (ui.screen() === 'win' || ui.screen() === 'loss') ui.restart();
      else ui.endTurn();
      return;
    }
    if (key >= '1' && key <= '7') {
      const index = Number(key) - 1;
      ui.playCard(index);
    }
  });
}
