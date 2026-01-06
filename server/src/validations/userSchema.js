const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required(),
    matric_no: Joi.string().required(),
    level: Joi.string().optional().allow(''),
    department: Joi.string().optional().allow(''),
    course: Joi.string().optional().allow(''),
    photo: Joi.string().optional().allow(''),
    descriptor: Joi.array().items(Joi.number()).required(),
    section: Joi.string().optional().allow('')
});

module.exports = { registerSchema };
