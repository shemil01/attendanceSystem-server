const Joi = require("joi");

// valdation for checkin
const validateCheckIn = (data) => {
  const schema = Joi.object({
    note: Joi.string().max(500).optional(),
  });

  return schema.validate(data);
};

// validation for break

const validateBreak = (data) => {
  const schema = Joi.object({
    breakType: Joi.string()
      .valid("SHORT_BREAK", "LUNCH_BREAK", "COFFEE_BREAK")
      .default("SHORT_BREAK"),
  });

  return schema.validate(data);
};

module.exports = {
  validateCheckIn,
  validateBreak,
};
