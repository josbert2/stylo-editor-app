import { StyloEditor } from "../../src/index.ts";
//import "../../src/styles.scss";
import "../../src/index.css";

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 100001;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

StyloEditor.init({
  container: document.body,
  panelOptions: {
    minimized: true,
    position: { x: 20, y: 20 }
  },
  excludeSelectors: ['.controls', '.controls *']
});

// Escuchar eventos del Ruler
if (window.styloEditor) {
  window.styloEditor.on('dock:ruler', () => {
    showNotification('Ruler activado - Haz clic y arrastra para medir', 'info');
  });

  window.styloEditor.on('dock:ruler-measurement', (measurement) => {
    const message = `Medición: ${measurement.width.toFixed(1)} × ${measurement.height.toFixed(1)}${measurement.units}`;
    showNotification(message, 'success');
  });
}


// Pruebas de consola para verificar que funciona
setTimeout(() => {
  console.log('Editor inicializado con éxito');
  console.warn('Esta es una advertencia de prueba');
  console.error('Este es un error de prueba');
  console.info('Esta es información de prueba');
  
  // Crear un error intencional para probar
  setTimeout(() => {
    try {
      // Esto debería generar un error
      dasd.nonExistentMethod();
    } catch (e) {
      console.error('Error capturado:', e);
    }
    
    // Error no capturado (debería aparecer en la consola)
    setTimeout(() => {
      qrq.anotherNonExistentMethod();
    }, 500);
  }, 1000);
}, 1000);