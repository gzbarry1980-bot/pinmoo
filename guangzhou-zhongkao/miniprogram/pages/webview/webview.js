const { createWebPage } = require('../../utils/webpage.js');
Page(createWebPage((options) => {
  const raw = options && options.path ? decodeURIComponent(options.path) : '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}, '网页端暂时无法打开，请检查业务域名配置。'));
