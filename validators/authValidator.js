const Joi = require("joi");

//  validation for login
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};

module.exports = {
  validateLogin,
};
