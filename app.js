const express = require("express");
const dotenv = require("dotenv");
const streamRoutes = require("./routes/streams");

dotenv.config();

const app = express();
app.use(express.json());

// Mount routes
app.use("/api", streamRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Express backend running on port ${PORT}`)
);
