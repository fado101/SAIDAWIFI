// server/api/usage.js أو server/routes/usage.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { username, period } = req.query;
    if (!username || !period) {
      return res.status(400).json({ success: false, message: "يرجى تحديد اسم المستخدم والفترة" });
    }
    const apiUrl = `https://saidawifi.com/radiusmanager/api/usage.php?username=${encodeURIComponent(username)}&period=${encodeURIComponent(period)}`;
    const apiRes = await fetch(apiUrl, { headers: { "Accept": "application/json" } });
    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "فشل في جلب البيانات", error: err.message });
  }
});

module.exports = router;
