// This script will unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service worker unregistered:', registration);
    }
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        console.log('All caches cleared');
        // Reload the page after unregistering service workers and clearing caches
        window.location.reload(true);
      });
    } else {
      // Reload the page after unregistering service workers
      window.location.reload(true);
    }
  });
}
