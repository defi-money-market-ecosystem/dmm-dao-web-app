/**
 * @param array The array on which callback will be invoked.
 * @param callback A void function of type `(T, index, $this) => {}`
 * @returns {Promise<void>}
 */
export const asyncForEach = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, this);
  }
};