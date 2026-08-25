/**
 * MITRA AI — Action Schema & Parameter Validator
 */

const { getActionDefinition } = require('./actionRegistry');

class ActionValidator {
  /**
   * Validates an incoming action proposal payload against the registered schema
   */
  validateProposalInput(input = {}) {
    const errors = [];

    if (!input.type || typeof input.type !== 'string') {
      errors.push('Field `type` is required and must be a valid action type string.');
    }

    const definition = getActionDefinition(input.type);
    if (!definition) {
      errors.push(`Action type '${input.type}' is unrecognized.`);
      return { valid: false, errors };
    }

    if (!input.reason || typeof input.reason !== 'string' || input.reason.trim().length < 5) {
      errors.push('Field `reason` is required (min 5 characters) explaining why this action is proposed.');
    }

    if (!input.parameters || typeof input.parameters !== 'object') {
      errors.push('Field `parameters` must be a valid JSON object.');
    } else {
      // Check required parameters from action definition
      definition.requiredParameters.forEach(param => {
        if (input.parameters[param] === undefined || input.parameters[param] === null || input.parameters[param] === '') {
          errors.push(`Missing mandatory parameter '${param}' for action type '${input.type}'.`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates a standard idempotency key if not supplied
   */
  generateIdempotencyKey(type, merchantId, parameters = {}) {
    const serialized = JSON.stringify(parameters);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      hash = ((hash << 5) - hash) + serialized.charCodeAt(i);
      hash |= 0;
    }
    return `idem_${type.toLowerCase()}_m${merchantId}_${Math.abs(hash)}_${Date.now()}`;
  }
}

module.exports = new ActionValidator();
