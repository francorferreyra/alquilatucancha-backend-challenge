import { Slot } from '../../infrastructure/models/slot';

export const insertIntoSlotsList = (
  slot: Slot,
  index: number,
  list: Slot[],
) => {
  if (list?.length === 0) return [];

  let newList = [...list];

  if (index === 0) {
    newList.unshift(slot);

    return newList;
  }

  if (index === list.length - 1) {
    newList.push(slot);

    return newList;
  }

  newList = [...newList.slice(0, index), slot, ...newList.slice(index)];

  return newList;
};
