# 🛰️ SDS-Leaderboard-Backend-with-more-Security
**Secure Leaderboard Backend powered by Somnia Data Stream**

## 📘 Overview
This project is an **Express.js backend** that records and retrieves player data using **Somnia Data Stream (SDS)** — ensuring full transparency, immutability, and anti-cheat protection for on-chain leaderboards.

Every player’s game record (address, score, and playtime) is securely published to Somnia’s decentralized data stream layer.  
When fetching data, the backend automatically filters duplicate players and ranks them based on their **highest score**, delivering a live and tamper-proof leaderboard.

---

## ⚙️ Tech Stack
| Layer | Technology |
|--------|-------------|
| Backend Framework | **Express.js** |
| Blockchain SDK | **@somnia-chain/streams** |
| Chain Provider | **viem** |
| Environment Management | **dotenv** |
| CORS Middleware | **cors** |
| Node Version | ≥ 18.x |

---

## 🧩 Features
✅ Real-time data streaming via **Somnia Data Stream**  
✅ Schema-based encoding for structured player data  
✅ Anti-cheat system (score & playTime recorded immutably)  
✅ Auto leaderboard aggregation  
✅ CORS enabled for **Unity WebGL** or other frontend clients  
✅ Simple REST API for integration  

---

## 📂 Project Structure
```
SDS-Leaderboard-Backend-with-more-Security/
│
├── routes/
│   └── streams.js              # Main route for /schema, /publish, /data
│
├── app.js                      # Express app entry point
├── dream-chain.js              # Somnia Dream chain configuration
├── publisher.js                # Example publisher (manual test)
├── subscriber.js               # Example subscriber (manual test)
├── .env                        # Private key, publisher wallet (ignored)
├── .gitignore                  # Ignores /node_modules and .env
├── package.json
├── package-lock.json
├── Note.txt                    # Dev notes
└── README.md                   # You are here
```

---

## 🔐 Environment Variables
Create a `.env` file in the project root:

```bash
PRIVATE_KEY=your_private_key_here
PUBLISHER_WALLET=0xYourPublisherWalletAddress
PORT=3000
```

> ⚠️ Never commit `.env` to GitHub.

---

## 🚀 Installation & Run

```bash
# 1️⃣ Clone the repository
git clone https://github.com/KelvinTrinhSG/SDS-Leaderboard-Backend-with-more-Security.git
cd SDS-Leaderboard-Backend-with-more-Security

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start development server
npm run dev

# or run in production mode
npm start
```

You should see:
```
🚀 Express backend running on port 3000
📘 Schema ID: 0x....
✅ Schema registered: 0x...
```

---

## 🌐 API Endpoints

### 1️⃣ GET /api/schema
Returns the current `schemaId` used by Somnia Data Stream.

**Example Response**
```json
{ "schemaId": "0x6e4c...fa0" }
```

---

### 2️⃣ POST /api/publish
Publishes a new player record to the Somnia Data Stream.

**Body Parameters**
```json
{
  "player": "0x1234...abcd",
  "score": 980,
  "playTime": 65
}
```

**Example Response**
```json
{
  "success": true,
  "txHash": "0xb47f...3da"
}
```

Each publish automatically encodes the data according to the schema:
```
address player, uint256 score, uint256 playTime
```

---

### 3️⃣ GET /api/data
Fetches all player records from the publisher, removes duplicates,  
keeps the highest score per player, and returns a ranked leaderboard.

**Example Response**
```json
{
  "totalPlayers": 2,
  "leaderboard": [
    {
      "rank": 1,
      "player": "0xA24d7ECD79B25CE6C66f...",
      "score": "2500",
      "playTime": "70"
    },
    {
      "rank": 2,
      "player": "0xF91C1bB97dC6fD7e6f9F...",
      "score": "1800",
      "playTime": "55"
    }
  ]
}
```

---

## 🧠 How It Works

1. **Startup Phase**
   - The backend computes and registers a **schemaId** (`player_score`) on Somnia.
   - Schema: `address player, uint256 score, uint256 playTime`
   - This step runs once per deployment.

2. **Publishing Data**
   - Every game result (player address, score, playTime) is encoded using `SchemaEncoder`.
   - The encoded payload is sent to the Somnia Data Stream via `sdk.streams.set()`.

3. **Fetching Data**
   - `sdk.streams.getAllPublisherDataForSchema()` retrieves all published data.
   - The backend filters duplicates, keeps the top score for each player, and sorts descendingly.

4. **Leaderboard Security**
   - Every score record is on-chain, transparent, and immutable.
   - Players cannot modify their scores once streamed.
   - The `playTime` field can be cross-checked to detect speed cheats.

---

## 🔐 Security Enhancements
- **Immutable Score Records**: All game events stored on-chain, no local tampering.
- **Session-based Filtering (optional)**: You can add `sessionId` to schema to separate sessions.
- **Transparent Auditability**: Anyone can verify score proofs directly on the Somnia chain.

---

## 🧱 dream-chain.js Example
```js
const { defineChain } = require("viem");

const dreamChain = defineChain({
  id: 50312,
  name: "Somnia Dream",
  network: "somnia-dream",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
});

module.exports = { dreamChain };
```

---

## 🧰 Developer Notes
- Compatible with **Somnia Dream RPC**
- Tested with **Unity WebGL frontend** connected via REST calls
- Perfect for **on-chain leaderboards**, **anti-cheat validation**, and **real-time analytics**

---

## 💡 Future Enhancements
- Add `sessionId` to group scores by match  
- Implement `cache` layer for leaderboard  
- Support real-time **WebSocket updates** from Somnia Streams  
- Optional **AI agent integration** for live data insights  
