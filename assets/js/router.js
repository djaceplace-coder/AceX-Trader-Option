(function() {
  // If we arrived via 404.html redirect (e.g., /#/wallet/deposit.html)
  if (location.hash && location.hash.length > 1) {
    const target = location.hash.slice(1);
    // Only redirect if the target is a valid internal path and not already there
    if (target !== location.pathname && target.startsWith('/')) {
      location.replace(target);
    }
  }
})();

