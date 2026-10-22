import type { Messages } from './en';

// The Spanish texts (ADR-0007): neutral Spanish with tú, as drawn on the canvas page "C · Español".
export const es: Messages = {
  kinds: {
    'Mining reward': 'Recompensa de minado',
    Notarization: 'Notarización',
    Transfer: 'Transferencia',
  },
  document: 'documento',

  shell: {
    skip: 'Saltar al contenido',
    mainNav: 'Principal',
    tabs: { tower: 'Torre', transact: 'Firmar y enviar', wallet: 'Billetera', network: 'Red' },
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    tryDemo: 'Probar la demo',
    starting: 'Iniciando…',
    demoFailed: 'La demo no pudo empezar',
    api: 'api · ',
    health: { checking: 'comprobando', online: 'en línea', offline: 'sin conexión', 'no database': 'sin base de datos' },
    demoChip: (left) => `demo · ${left}`,
    hoursLeft: (hours) => `quedan ${hours} h`,
    minutesLeft: (minutes) => `quedan ${minutes} min`,
    theme: {
      names: { system: 'Sistema', light: 'Claro', dark: 'Oscuro' },
      label: (current, next) => `Tema: ${current}. Cambiar a ${next}`,
    },
    language: { code: 'ES', label: 'ES, español. Cambiar a English' },
    search: {
      label: 'Buscar un número de bloque o un hash',
      placeholder: 'Número de bloque o hash',
      results: 'Resultados',
      lookingUp: 'Buscando…',
      typeMore: 'Escribe un número de bloque o un hash completo de 64 caracteres.',
      noBlock: (number) => `Aún no hay bloque #${number}.`,
      noHash: 'Ningún bloque ni transacción con este hash en este nodo.',
      noAnswer: 'El nodo no respondió',
      block: (number) => `Bloque #${number}`,
      inBlock: (number) => `en el bloque #${number}`,
      waiting: 'en espera',
    },
    offline: {
      unreachable: (host) => `No se puede conectar con ${host}.`,
      noDatabase: (host) => `${host} responde, pero su base de datos no.`,
      retrying: 'Reintentando cada 10 s.',
      retry: 'Reintentar ahora',
    },
    toasts: { region: 'Notificaciones', dismiss: 'Cerrar', backOnline: 'De nuevo en línea.' },
  },

  failure: {
    error: 'Error',
    pageTitle: 'Esta página tuvo un problema',
    pageText: 'Algo falló al dibujarla. Las demás páginas siguen funcionando, y la clave que tengas en esta pestaña se conserva.',
    tryAgain: 'Intentar de nuevo',
    backToTower: 'Volver a la torre',
    appTitle: 'VeriLedger tuvo un problema',
    appText: 'Recargar suele arreglarlo. Al recargar se olvida la clave de esta pestaña, así que después vuelve a abrir su archivo de clave.',
    reload: 'Recargar',
  },

  notFound: {
    title: 'Esta página no está en la torre',
    text: 'Puede que la dirección esté mal escrita o que el enlace sea de una versión anterior de la app.',
    back: 'Volver a la torre',
  },
};
