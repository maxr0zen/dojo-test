export function options(args = process.argv.slice(2), env = process.env) {
  const value = (flag, fallback) => {
    const index = args.indexOf(flag);
    if (index < 0) return fallback;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(flag + ' requires a value');
    return args[index + 1];
  };
  const port = Number(value('--port', env.PORT || '5173'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const base = value('--base', env.SITE_BASE || '/');
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('Base must be / or /repository-name/');
  return {port, base, host: value('--host', env.HOST || '127.0.0.1'), preview: args.includes('--preview')};
}
