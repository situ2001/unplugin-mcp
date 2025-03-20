// Main entry file for our example project
import { greet } from './greeter';

// Initialize our app
function init() {
  console.log('Initializing application...');
  document.body.innerHTML = `<div class="container">${greet('MCP User')}</div>`;
  console.log('Application started');
}

// Run the app when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export the init function for potential programmatic usage
export { init };