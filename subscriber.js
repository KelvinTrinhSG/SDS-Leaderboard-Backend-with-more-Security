const { SDK, SchemaEncoder } = require("@somnia-chain/streams");
const { createPublicClient, http } = require("viem");
const { dreamChain } = require("./dream-chain");
require("dotenv").config();

async function main() {
  const publisherWallet = process.env.PUBLISHER_WALLET;
  const publicClient = createPublicClient({
    chain: dreamChain,
    transport: http(),
  });
  const sdk = new SDK({ public: publicClient });

  // 🔴 1️⃣ Sửa schema lại cho đúng với bản push
  // const helloSchema = `string message, uint256 timestamp, address sender`;
  const playerSchema = `address player, uint256 score, uint256 playTime`;
  const schemaId = await sdk.streams.computeSchemaId(playerSchema);

  const schemaEncoder = new SchemaEncoder(playerSchema);
  const seen = new Set();

  setInterval(async () => {
    // 🔴 2️⃣ Lấy toàn bộ data theo schema mới
    const allData = await sdk.streams.getAllPublisherDataForSchema(
      schemaId,
      publisherWallet
    );

    for (const dataItem of allData) {
      // 🔴 3️⃣ Đổi field tương ứng
      let player = "",
        score = "",
        playTime = "";

      for (const field of dataItem) {
        const val = field.value?.value ?? field.value;
        if (field.name === "player") player = val;
        if (field.name === "score") score = val.toString();
        if (field.name === "playTime") playTime = val.toString();
      }

      // 🔴 4️⃣ Dùng player làm key để tránh trùng
      const id = `${player}-${score}-${playTime}`;
      if (!seen.has(id)) {
        seen.add(id);
        console.log(
          `🏁 Player: ${player}\n   ➤ Score: ${score}\n   ⏱️ PlayTime: ${playTime}s\n`
        );
      }
    }
  }, 3000);
}

main();
