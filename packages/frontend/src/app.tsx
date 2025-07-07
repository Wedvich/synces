import { useState } from "react";
import { v7 as uuid } from "uuid";
import { observer } from "mobx-react-lite";
import { makeAutoObservable } from "mobx";

interface InventoryItemCreated {
  type: "InventoryItemCreated";
  id: string;
}

class InventoryItem {
  id: string;

  events = [];

  static create() {
    return new InventoryItem(uuid());
  }

  protected constructor(id: string) {
    const ev = {
      type: "InventoryItemCreated",
      id,
    } satisfies InventoryItemCreated;
    this.apply(ev);
    makeAutoObservable(this);
  }

  private apply(ev: InventoryItemCreated, isReplay = false) {
    this.id = ev.id;
    if (!isReplay) {
      this.events.push(ev);
    }
  }

  commit() {
    this.events.length = 0;
  }
}

class InventoryItemStore {
  items: InventoryItem[];

  constructor(items = []) {
    this.items = items;
    makeAutoObservable(this);
  }

  addItem(item: InventoryItem) {
    this.items.push(item);
  }
}

const inventoryItemStore = new InventoryItemStore();

interface ICommand<T extends string> {
  type: T;
}

class CreateInventoryItem implements ICommand<"CreateInventoryItem"> {
  id = uuid();
  type: "CreateInventoryItem" = "CreateInventoryItem";
}

class CreateInventoryItemHandler {
  constructor(private store: InventoryItemStore) {}

  handle(command: CreateInventoryItem) {
    const newItem = InventoryItem.create();
    console.log(newItem.events);
    this.store.addItem(newItem);
  }
}

const createInventoryItemHandler = new CreateInventoryItemHandler(
  inventoryItemStore
);

class CommandDispatcher {
  private handlers: { [key: string]: CreateInventoryItemHandler } = {};

  dispatch(command: any) {
    console.log("Dispatching command:", command);

    const handler = this.handlers[command.type];
    if (handler) {
      handler.handle(command);
    } else {
      console.error(`No handler registered for command type: ${command.type}`);
    }
  }

  registerHandler(type: any, handler: any) {
    if (!this.handlers[type]) {
      this.handlers[type] = handler;
    } else {
      console.error(`Handler for command type ${type} already exists.`);
    }
  }
}

const commandDispatcher = new CommandDispatcher();

commandDispatcher.registerHandler(
  "CreateInventoryItem",
  createInventoryItemHandler
);

export const App = observer(() => {
  return (
    <div>
      <h1>Welcome to Synces!</h1>
      <p>This is the frontend application.</p>
      <h2>Inventory Items</h2>
      <button
        onClick={() => commandDispatcher.dispatch(new CreateInventoryItem())}
      >
        Add Item
      </button>
      <ul>
        {inventoryItemStore.items.map((item) => (
          <li key={item.id}>Item ID: {item.id}</li>
        ))}
      </ul>
    </div>
  );
});
