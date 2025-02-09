module.exports = {
  head: {
    meta: [
      { charset: 'utf-8' },
      { content: 'ie=edge', 'http-equiv': 'x-ua-compatible' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#fafafa' },
      { name: 'msapplication-TileColor', content: '#fafafa' },
      { name: 'msapplication-config', content: 'favicons/browserconfig.xml' },
    ],
    links: [
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'static/favicons/favicon-32x32.png' },
      { rel: 'shortcut icon', href: 'static/favicons/favicon.ico' },
      /**
       * Stylesheet links
       */
      { rel: 'preload', href: 'static/css/_extra.css', as: 'style' },
      { rel: 'stylesheet', href: 'static/css/_extra.css' },

      // 'https://fonts.googleapis.com/icon?family=Material+Icons',
      { rel: 'preload', href: 'static/lib/material-icons/material-icons.css', as: 'style' },
      { rel: 'stylesheet', href: 'static/lib/material-icons/material-icons.css' },

      // 'https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,500i,700,700i&display=swap
      { rel: 'preload', href: 'static/lib/gfonts/gfonts.css', as: 'style' },
      { rel: 'stylesheet', href: 'static/lib/gfonts/gfonts.css' },
    ],
    scripts: [],
  },
  body: {
    scripts: [],
    snippet: '',
  },
};
