# Blue-Party

A real-time multiplayer party games platform. Create a room, share the code with friends, and play browser-based social deduction and word games together.

## Games

| Game | Description |
|------|-------------|
| **Codenames** | Team-based word association game with spymasters giving clues |
| **Liar's Bar** | Bluffing card game where getting caught lying has explosive consequences |
| **Scribble** | Draw-and-guess game with real-time canvas drawing |
| **Secret Hitler** | Social deduction game of liberals vs. fascists |
| **Spyfall** | Question-based deduction game to find the spy |

## Tech Stack

- **Backend:** Node.js, [Express](https://expressjs.com/), [Socket.IO](https://socket.io/) for real-time communication
- **Frontend:** Vanilla JavaScript, HTML, CSS (served from `public/`)
- **Deployment:** [Render](https://render.com/) (see `render.yaml`)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm

### Installation

```bash
git clone https://gitlab.com/pelicanindustries-group/gitlab.git
cd gitlab
npm install
```

### Running Locally

```bash
npm start
```

The server starts on port `3000` by default. Open `http://localhost:3000` in your browser.

### Configuration

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| `ALLOWED_ORIGIN` | Production origin allowed by the Socket.IO CORS policy | `https://shenanigans-and-tomfoolery.onrender.com` |

## Project Structure

```
.
├── server.js              # Entry point: Express app, Socket.IO setup, rate limiting
├── server/
│   ├── GameManager.js     # Registers and routes events to game engines
│   ├── Room.js            # Room lifecycle and player membership
│   ├── Player.js          # Player model with reconnect support
│   └── constants.js       # Shared server constants
├── games/
│   ├── codenames/         # Game engine + client UI per game
│   ├── liarsbar/
│   ├── scribble/
│   ├── secrethitler/
│   ├── spyfall/
│   └── common/            # Shared resources (word bank)
├── public/
│   ├── index.html         # Lobby and game shell
│   ├── js/app.js          # Client-side app logic
│   ├── css/styles.css
│   └── sounds/            # Game sound effects
└── render.yaml            # Render deployment config
```

## Architecture Notes

- Each game lives in `games/<name>/` with a server-side `engine.js` (game logic) and a client-side `ui.js` (rendering), wired together through `server/GameManager.js`.
- All communication happens over Socket.IO events; the server enforces per-socket rate limiting and sanitizes player names and chat messages to prevent XSS.
- Players can reconnect to in-progress games within a timeout window.

## License

ISC
