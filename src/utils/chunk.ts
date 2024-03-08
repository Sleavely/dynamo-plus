/**
 * Split an array into arrays no larger than chunkSize
 */
export const chunk = <ItemType = unknown>(
  originalArr: ItemType[],
  chunkSize: number,
): ItemType[][] => {
  const input = Array.from(originalArr);
  const chunks = [];

  while (input.length) {
    chunks.push(input.splice(0, chunkSize));
  }

  return chunks;
};
