export const USER_FACING_ERROR_MESSAGE_PREFIX = 'UF:';

/**
 * Utility to parse an error object returned from API.
 *
 *
 * @param { Object } error - An error object directly from API response
 * @param { string } error.message - The error message, returned from API.
 * @param { string } defaultMessage - Default user-facing error message
 * @returns { string } - A transformed user-facing error message, or defaultMessage
 */
export const parseErrorMessage = (error = {}, defaultMessage = '') => {
  const messageString = error.message || '';
  return messageString.startsWith(USER_FACING_ERROR_MESSAGE_PREFIX)
    ? messageString.replace(USER_FACING_ERROR_MESSAGE_PREFIX, '').trim()
    : defaultMessage;
};
