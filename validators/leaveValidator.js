const Joi = require("joi");

const validateLeaveRequest = (data) => {
  const schema = Joi.object({
    startDate: Joi.date().iso().greater("now").required().messages({
      "date.greater": "Start date must be in the future",
      "any.required": "Start date is required",
    }),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
      "date.min": "End date cannot be before start date",
      "any.required": "End date is required",
    }),
    reason: Joi.string().min(10).max(1000).required().messages({
      "string.min": "Reason must be at least 10 characters long",
      "string.max": "Reason cannot exceed 1000 characters",
      "any.required": "Reason is required",
    }),
    leaveType: Joi.string()
      .valid(
        "SICK_LEAVE",
        "CASUAL_LEAVE",
        "EARNED_LEAVE",
        "MATERNITY_LEAVE",
        "PATERNITY_LEAVE",
        "OTHER"
      )
      .required()
      .messages({
        "any.only": "Invalid leave type",
        "any.required": "Leave type is required",
      }),
  });

  return schema.validate(data);
};

module.exports = {
  validateLeaveRequest,
};
