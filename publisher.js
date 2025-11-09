const { SDK, SchemaEncoder, zeroBytes32 } = require("@somnia-chain/streams");
const { createPublicClient, http, createWalletClient, toHex } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { waitForTransactionReceipt } = require("viem/actions");
const { dreamChain } = require("./dream-chain");
require("dotenv").config();

async function main() {
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

  // 🔴 1️⃣ Thay schema định nghĩa ban đầu
  // const helloSchema = `string message, uint256 timestamp, address sender`;
  const playerSchema = `address player, uint256 score, uint256 playTime`;
  const schemaId = await sdk.streams.computeSchemaId(playerSchema);
  console.log("Schema ID:", schemaId);

  // 🔴 2️⃣ Đổi ID schema khi đăng ký
  // id: "hello_world",
  const ignoreAlreadyRegistered = true;

  try {
    const txHash = await sdk.streams.registerDataSchemas(
      [
        {
          id: "player_score", // 🔴 Đổi tên ID schema
          schema: playerSchema, // 🔴 Dùng schema mới
          parentSchemaId: zeroBytes32,
        },
      ],
      ignoreAlreadyRegistered
    );

    if (txHash) {
      await waitForTransactionReceipt(publicClient, { hash: txHash });
      console.log(`✅ Schema registered or confirmed, Tx: ${txHash}`);
    } else {
      console.log("ℹ️ Schema already registered — no action required.");
    }
  } catch (err) {
    if (String(err).includes("SchemaAlreadyRegistered")) {
      console.log("⚠️ Schema already registered. Continuing...");
    } else {
      throw err;
    }
  }

  // 🔴 3️⃣ Dùng encoder mới
  const encoder = new SchemaEncoder(playerSchema);
  let count = 0;

  setInterval(async () => {
    count++;

    // 🔴 Dữ liệu mới: score & playTime
    const randomScore = Math.floor(Math.random() * 1000);
    const playTime = Math.floor(Math.random() * 600);

    const data = encoder.encodeData([
      { name: "player", value: walletClient.account.address, type: "address" },
      { name: "score", value: BigInt(randomScore), type: "uint256" },
      { name: "playTime", value: BigInt(playTime), type: "uint256" },
    ]);

    // 🔴 Cập nhật id cho stream
    const dataStreams = [
      { id: toHex(`player-${count}`, { size: 32 }), schemaId, data },
    ];

    const tx = await sdk.streams.set(dataStreams);
    console.log(
      `✅ Published: Player ${walletClient.account.address} | Score ${randomScore} | PlayTime ${playTime}s (Tx: ${tx})`
    );
  }, 5000); // 🔴 có thể đổi lại từ 3000ms → 5000ms để dễ quan sát
}

main();
