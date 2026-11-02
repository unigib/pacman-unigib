# Pac-Man — Unigib Project Demo

This repository is a Unigib project demo: a small browser game that shows how a software project can be built and presented for a second-year computer science course. It uses the familiar Pac-Man game to demonstrate how HTML, CSS, and JavaScript work together to create an interactive application.

## What the project demonstrates

- Structuring a project into a page, stylesheet, and JavaScript modules.
- Drawing a game board and game elements with the HTML canvas.
- Implementing player movement, maze collisions, ghosts, collectibles, and scoring.
- Responding to keyboard and touch input.
- Adding visual effects and synthesized sound with the Web Audio API.

## Play the demo

No build step or package installation is required. Clone the repository and open `index.html` in a modern web browser:

```bash
git clone https://github.com/unigib/pacman-unigib.git
cd pacman-unigib
```

Then open `index.html`. Select **Start Game** to begin; audio starts after the game is started.

The Git version is generated when launching the project with **F5** in VS Code. AWS Amplify generates it during its build using `amplify.yml`; connect the repository to Amplify and deploy the repository root as the site.

### Controls

- Move with the **arrow keys** or **WASD**.
- On a touch device, swipe in the direction you want to move.
- Collect pellets to score points. Power pellets let Pac-Man eat frightened ghosts for bonus points.

## Project structure

```text
index.html          Page markup and game canvas
styles.css          Page and game presentation
src/
  game/game.js      Game setup, drawing, input, and scoring
  pacman/pacman.js  Pac-Man movement and behavior
  ghost/ghost.js    Ghost behavior
assets/             Images, animations, and fonts
```

## Presenting the project

For a course presentation, you can introduce the goal and technologies, show the project structure, then run the game and explain how input, movement, collisions, scoring, and rendering fit together. The game also provides a practical starting point for discussing testing, accessibility, code organization, and possible extensions.
