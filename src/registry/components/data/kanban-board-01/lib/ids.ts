let counter = 0;

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

export function newItemId(): string {
  counter += 1;
  return `item-${rand()}-${counter.toString(36)}`;
}

export function newColumnId(): string {
  counter += 1;
  return `col-${rand()}-${counter.toString(36)}`;
}

export function newSwimlaneId(): string {
  counter += 1;
  return `lane-${rand()}-${counter.toString(36)}`;
}
