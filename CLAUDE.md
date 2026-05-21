@AGENTS.md

## Git workflow

- Commit en push altijd naar `main`. Geen PR, geen CI-check nodig.
- Als de sessie een feature branch toewijst (bijv. `claude/...`), push dan naar die branch én merge daarna direct naar `main` en push `main`:
  ```
  git push -u origin <feature-branch>
  git checkout main
  git merge <feature-branch> --ff-only
  git push -u origin main
  git checkout <feature-branch>
  ```
- Doe dit bij elke commit, zodat Vercel altijd de laatste versie deployt.
- Nooit een PR aanmaken tenzij de gebruiker dat expliciet vraagt.
