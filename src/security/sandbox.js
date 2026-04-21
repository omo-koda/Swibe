import vm from 'node:vm';

/**
 * Enhanced execution sandbox for secure { execution: "strict-vm" }
 */
function createStrictSandbox(permissions = {}) {
  const sandbox = {
    console: {
      log: (...args) => console.log('[SANDBOX]', ...args),
      warn: (...args) => console.warn('[SANDBOX:WARN]', ...args),
      error: (...args) => console.error('[SANDBOX:ERROR]', ...args),
    },
    // Block dangerous globals
    eval: undefined,
    Function: undefined,
    setTimeout: undefined,
    setInterval: undefined,
  };

  // Explicitly allow/deny based on permission matrix
  if (permissions.bash === 'auto') {
    sandbox.process = { env: {} };
    // Note: in a real hardened environment, we would use a proxy or more limited set
  }

  return vm.createContext(sandbox);
}

export { createStrictSandbox };
