// Import rules AR-01 to AR-04 of docs/ARCHITECTURE_RULES.md. Run with `npm run lint:arch`.
const TESTS = '\\.test\\.tsx?$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'AR-01-axios-only-in-services',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/services/' },
      to: { path: '(^|/)node_modules/axios/' },
    },
    {
      name: 'AR-02-noble-only-in-lib',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/lib/' },
      to: { path: '(^|/)node_modules/@noble/' },
    },
    {
      name: 'AR-03-only-router-imports-pages',
      severity: 'error',
      from: { path: '^src/', pathNot: ['^src/Router\\.tsx$', TESTS] },
      to: { path: '^src/pages/' },
    },
    {
      name: 'AR-03-services-inward',
      severity: 'error',
      from: { path: '^src/services/', pathNot: TESTS },
      to: { path: '^src/(pages|components)/' },
    },
    {
      name: 'AR-03-store-inward',
      severity: 'error',
      from: { path: '^src/store/', pathNot: TESTS },
      to: { path: '^src/(pages|components|services|lib)/' },
    },
    {
      name: 'AR-03-lib-inward',
      severity: 'error',
      from: { path: '^src/lib/', pathNot: TESTS },
      to: { path: '^src/(pages|components|services|store)/' },
    },
    {
      name: 'AR-03-types-import-nothing',
      severity: 'error',
      from: { path: '^src/types/' },
      to: { path: '^src/' },
    },
    {
      name: 'AR-04-no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
  },
};
