import { signalStore, withState, withMethods } from '@ngrx/signals';
import { withDevtools, updateState } from '@angular-architects/ngrx-toolkit';

export type KeyboardType = 'numeric' | 'alphanumeric' | 'custom';

export interface KeyboardButton {
  label: string;
  value: string;
  cssClass?: string;
}

export interface KeyboardConfig {
  type: KeyboardType;
  title: string;
  initialValue: string;
  customButtons?: KeyboardButton[];
  simpleButtons?: string[];
  allowDecimal?: boolean;
}

interface KeyboardState {
  value: string;
  config: KeyboardConfig | null;
}

// Component-level store, not root level
export const KeyboardStore = signalStore(
  withDevtools('keyboard'),
  withState<KeyboardState>({
    value: '',
    config: null,
  }),
  withMethods((store) => ({
    init(config: KeyboardConfig) {
      updateState(store, `🎹 Init: "${config.title}"`, {
        value: config.initialValue || '',
        config,
      });
    },

    appendValue(input: string) {
      const currentValue = store.value();
      const config = store.config();
      
      // Don't start with zero
      if (input === '0' && currentValue === '') {
        return;
      }
      
      // Handle decimal point
      if (input === '.' && config?.allowDecimal) {
        if (!currentValue.includes('.')) {
          const newVal = currentValue === '' ? '0.' : currentValue + '.';
          updateState(store, `🎹 Decimal: ${currentValue} → ${newVal}`, {
            value: newVal,
          });
        }
        return;
      }
      
      updateState(store, `🎹 Append: ${input}`, {
        value: currentValue + input,
      });
    },

    setValue(input: string) {
      updateState(store, `🎹 Set: ${input}`, {
        value: input,
      });
    },

    backspace() {
      const currentValue = store.value();
      const newValue = currentValue.slice(0, -1);
      updateState(store, `🎹 ⌫ Backspace`, {
        value: newValue,
      });
    },

    clear() {
      updateState(store, `🎹 Clear`, {
        value: '',
      });
    },

    reset() {
      updateState(store, `🎹 Reset`, {
        value: '',
        config: null,
      });
    },
  }))
);