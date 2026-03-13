const Joi = require('joi');

const markAttendanceSchema = Joi.object({
    userId: Joi.number().integer().positive().optional().messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
    }),
    faceLandmarks: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.number())
    ).optional()
}).custom((value, helpers) => {
    if (!value.userId && !value.faceLandmarks) {
        return helpers.message('Either userId or faceLandmarks must be provided for biometric verification');
    }
    return value;
});

module.exports = {
    markAttendanceSchema
};
