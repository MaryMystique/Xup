/**
 * Xup Chat Widget Embed Script
 * 
 * USAGE:
 * Add this to any website:
 * <script src="http://localhost:3000/widget-embed.js"></script>
 * 
 * This creates an iframe with the chat widget
 */

(function() {
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:3000/widget';
  iframe.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    border: none;
    width: 100%;
    height: 100%;
    max-width: 400px;
    max-height: 600px;
    z-index: 9999;
  `;
  
  // Add to page
  document.body.appendChild(iframe);
})();