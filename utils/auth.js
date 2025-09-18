const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// sign in token
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const createPasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return { resetToken, passwordResetToken, passwordResetExpires };
};

module.exports = {
  signToken,
  verifyToken,
  createPasswordResetToken,
};
