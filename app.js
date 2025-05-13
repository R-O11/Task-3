const express = require("express");
const app = express();
const userRoutes = require("./routes/user");

const port = 3000;

app.use(express.json());

app.use("/users", userRoutes);

app.use((err, req, res, next) => {
  console.error(err); // Log the error
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
