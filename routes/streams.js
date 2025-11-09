const express = require("express");
const router = express.Router();
const { SDK, SchemaEncoder, zeroBytes32 } = require("@somnia-chain/streams");
const { createPublicClient, createWalletClient, http, toHex } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { waitForTransactionReceipt } = require("viem/actions");
const { dreamChain } = require("../dream-chain");
require("dotenv").config();

// Create SDK clients
const publicClient = createPublicClient({
  chain: dreamChain,
  transport: http(),
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY),
  chain: dreamChain,
  transport: http(),
});

const sdk = new SDK({ public: publicClient, wallet: walletClient });

// Define schema
const playerSchema = `address player, uint256 score, uint256 playTime`;
const encoder = new SchemaEncoder(playerSchema);

let schemaId;

// ✅ Compute + register schema once on startup
(async () => {
  schemaId = await sdk.streams.computeSchemaId(playerSchema);
  console.log("📘 Schema ID:", schemaId);

  try {
    const txHash = await sdk.streams.registerDataSchemas(
      [
        {
          id: "player_score",
          schema: playerSchema,
          parentSchemaId: zeroBytes32,
        },
      ],
      true
    );

    if (txHash) {
      await waitForTransactionReceipt(publicClient, { hash: txHash });
      console.log(`✅ Schema registered: ${txHash}`);
    } else {
      console.log("ℹ️ Schema already registered — no action required.");
    }
  } catch (err) {
    console.warn("⚠️ Schema may already exist:", err.message);
  }
})();

/**
 * 📍 GET /api/schema
 * Trả về schemaId hiện tại
 */
router.get("/schema", (req, res) => {
  res.json({ schemaId });
});

/**
 * 📍 POST /api/publish
 * Gửi dữ liệu lên Somnia Streams
 * Body: { player, score, playTime }
 */
router.post("/publish", async (req, res) => {
  try {
    const { player, score, playTime } = req.body;

    if (!player || score == null || playTime == null) {
      return res
        .status(400)
        .json({ error: "Missing player, score, or playTime" });
    }

    const data = encoder.encodeData([
      { name: "player", value: player, type: "address" },
      { name: "score", value: BigInt(score), type: "uint256" },
      { name: "playTime", value: BigInt(playTime), type: "uint256" },
    ]);

    const dataStreams = [
      { id: toHex(`player-${Date.now()}`, { size: 32 }), schemaId, data },
    ];

    const tx = await sdk.streams.set(dataStreams);

    console.log(
      `✅ Published: ${player} | Score ${score} | PlayTime ${playTime}s | Tx ${tx}`
    );

    res.json({ success: true, txHash: tx });
  } catch (err) {
    console.error("❌ Publish error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📍 GET /api/data
 * Truy xuất toàn bộ dữ liệu từ publisher
 */
router.get("/data", async (req, res) => {
  try {
    const publisher = process.env.PUBLISHER_WALLET;
    const allData = await sdk.streams.getAllPublisherDataForSchema(
      schemaId,
      publisher
    );

    const formatted = allData.map((item) => {
      let player = "",
        score = "",
        playTime = "";
      for (const field of item) {
        const val = field.value?.value ?? field.value;
        if (field.name === "player") player = val;
        if (field.name === "score") score = val.toString();
        if (field.name === "playTime") playTime = val.toString();
      }
      return { player, score, playTime };
    });

    // Bước 2️⃣ - Lọc trùng player, chỉ giữ score cao nhất
    const bestScores = {};
    for (const entry of formatted) {
      if (!entry.player) continue;
      const current = bestScores[entry.player];
      if (!current || entry.score > current.score) {
        bestScores[entry.player] = entry;
      }
    }

    // Bước 3️⃣ - Chuyển về mảng và sắp xếp giảm dần theo score
    const leaderboard = Object.values(bestScores)
      .sort((a, b) => Number(b.score - a.score))
      .map((e, index) => ({
        rank: index + 1,
        player: e.player,
        score: e.score.toString(),
        playTime: e.playTime.toString(),
      }));

    res.json({
      totalPlayers: leaderboard.length,
      leaderboard,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
