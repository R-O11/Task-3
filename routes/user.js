const dbSingleton = require("../dbSingleton");
const bcrypt = require("bcrypt");

const express = require("express");
const router = express.Router();

// Get database connection
const db = dbSingleton.getConnection();

// Register new user
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("📥 [POST /users] New user registration request:", req.body);

  try {
    // Step 1: Check if email already exists
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], async (err, results) => {
      if (err) {
        console.error("❌ Error checking email:", err);
        return res.status(500).json({ error: "Error checking email" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists!" });
      }

      // Email does not exist – continue inserting
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const insertQuery =
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
      db.query(insertQuery, [name, email, hashedPassword], (err, results) => {
        if (err) {
          console.error("❌ Error inserting into database:", err);
          return res
            .status(500)
            .json({ error: "Failed to add user", details: err.message });
        }

        console.log("✅ User successfully added:", results);
        res.status(201).json({
          message: "User registered successfully!",
          id: results.insertId,
        });
      });
    });
  } catch (err) {
    console.error("❌ Error during hashing:", err);
    res
      .status(500)
      .json({ error: "Failed to process request", details: err.message });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  console.log(`📥 [PUT /users/${id}] Update user:`, req.body);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updateQuery =
      "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?";
    db.query(updateQuery, [name, email, hashedPassword, id], (err, results) => {
      if (err) {
        console.error("❌ Error during update:", err);
        return res
          .status(500)
          .json({ error: "Update error", details: err.message });
      }

      if (results.affectedRows === 0) {
        console.log("⚠️ User not found:", id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ User updated successfully:", results);
      res.json({ message: "User updated!" });
    });
  } catch (err) {
    console.error("❌ Error during hashing:", err);
    res.status(500).json({ error: "Hashing error", details: err.message });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("📥 [POST /users/login] Login attempt:", req.body);

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("❌ Error in query:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "User not found" });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        console.error("❌ Error during password comparison:", err);
        return res.status(500).json({ error: "Compare error" });
      }

      if (match) {
        console.log("✅ Login successful:", email);
        res.json({ message: "Login successful!" });
      } else {
        console.log("❌ Incorrect password:", email);
        res.status(401).json({ message: "Incorrect password" });
      }
    });
  });
});

module.exports = router;
