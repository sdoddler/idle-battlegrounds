export class InventoryProvider {
  async listOwned(){throw new Error('listOwned must be implemented');}
  async grant(_itemDefId){throw new Error('grant must be implemented');}
}
