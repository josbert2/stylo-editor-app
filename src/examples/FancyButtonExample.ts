import { FancyButton } from '../components/FancyButton';

// Ejemplo de uso básico
export function createFancyButtonExample() {
  const container = document.getElementById('button-container') || document.body;

  // Botón básico
  const basicButton = new FancyButton(container, {
    text: 'Click Me',
    variant: 'primary',
    size: 'medium'
  });

  basicButton.on('click', () => {
    console.log('¡Botón clickeado!');
  });

  // Botón de cancelar con subtexto
  const cancelButton = new FancyButton(container, {
    text: 'Cancel',
    subtext: 'Esc',
    variant: 'cancel',
    size: 'medium'
  });

  cancelButton.on('click', () => {
    console.log('Operación cancelada');
  });

  // Botón de éxito
  const successButton = new FancyButton(container, {
    text: 'Save Changes',
    subtext: 'Ctrl+S',
    variant: 'success',
    size: 'large'
  });

  successButton.on('click', () => {
    console.log('Cambios guardados');
  });

  // Botón de peligro
  const dangerButton = new FancyButton(container, {
    text: 'Delete',
    subtext: 'Del',
    variant: 'danger',
    size: 'small'
  });

  dangerButton.on('click', () => {
    console.log('Elemento eliminado');
  });

  return {
    basicButton,
    cancelButton,
    successButton,
    dangerButton
  };
}