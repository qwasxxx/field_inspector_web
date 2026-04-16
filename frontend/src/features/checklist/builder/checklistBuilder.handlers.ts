export class ChecklistBuilderHandlers {
  static handleAddField(addFn: () => void): void {
    addFn();
  }

  static handleRemoveField(removeFn: () => void): void {
    removeFn();
  }
}
