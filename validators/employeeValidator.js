const Joi = require("joi");

const validateEmployeeCreate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  department: Joi.string().optional().messages({
    "string.base": "Department must be a string",
  }),
  position: Joi.string().optional().messages({
    "string.base": "Position must be a string",
  }),
    role: Joi.string().valid("ADMIN", "EMPLOYEE").default("EMPLOYEE"),
  });

  return schema.validate(data);
};

module.exports = {
  validateEmployeeCreate,
};
