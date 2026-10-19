import { Injectable, signal } from '@angular/core';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalOptions {
  title?: string;
  message: string;
  submessage?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: string;
  hasInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
}

export interface ConfirmModalState {
  isOpen: boolean;
  options: ConfirmModalOptions;
  resolve?: (value: boolean) => void;
  resolvePrompt?: (value: string | null) => void;
  currentInputValue: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  private stateSignal = signal<ConfirmModalState>({
    isOpen: false,
    options: { message: '' },
    currentInputValue: '',
  });

  public state = this.stateSignal.asReadonly();

  /**
   * Muestra un modal de confirmación con diseño Liquid Glass profesional.
   * Reemplaza por completo el window.confirm nativo y feo del navegador.
   */
  confirm(options: ConfirmModalOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const type = options.type || 'warning';
      const defaultIcon = type === 'danger' ? '🗑️' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';

      this.stateSignal.set({
        isOpen: true,
        options: {
          title: options.title || '¿Confirmar acción?',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          type,
          icon: options.icon || defaultIcon,
          ...options,
        },
        resolve,
        currentInputValue: options.inputValue || '',
      });

      this.applyModalEffects(true);
    });
  }

  /**
   * Muestra un modal con campo de entrada de texto moderno.
   * Reemplaza el window.prompt nativo del navegador.
   */
  prompt(options: ConfirmModalOptions): Promise<string | null> {
    return new Promise<string | null>((resolvePrompt) => {
      const type = options.type || 'info';
      const defaultIcon = options.icon || '✏️';

      this.stateSignal.set({
        isOpen: true,
        options: {
          title: options.title || 'Ingresa la información',
          confirmText: options.confirmText || 'Aceptar',
          cancelText: options.cancelText || 'Cancelar',
          type,
          icon: defaultIcon,
          hasInput: true,
          ...options,
        },
        resolvePrompt,
        currentInputValue: options.inputValue || '',
      });

      this.applyModalEffects(true);
    });
  }

  updateInputValue(val: string): void {
    this.stateSignal.update((s) => ({ ...s, currentInputValue: val }));
  }

  handleConfirm(): void {
    const current = this.stateSignal();
    if (current.resolvePrompt) {
      current.resolvePrompt(current.currentInputValue.trim());
    } else if (current.resolve) {
      current.resolve(true);
    }
    this.close();
  }

  handleCancel(): void {
    const current = this.stateSignal();
    if (current.resolvePrompt) {
      current.resolvePrompt(null);
    } else if (current.resolve) {
      current.resolve(false);
    }
    this.close();
  }

  private close(): void {
    this.stateSignal.set({
      isOpen: false,
      options: { message: '' },
      resolve: undefined,
      resolvePrompt: undefined,
      currentInputValue: '',
    });
    this.applyModalEffects(false);
  }

  private applyModalEffects(open: boolean): void {
    if (typeof document !== 'undefined') {
      if (open) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
  }
}
