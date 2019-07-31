const fs = require('fs');
const path = require('path');
const utils = require('loader-utils');
const nunjucks = require('nunjucks');
const fsLoader = require('./fs-loader');

function getConfig(that, name) {
  let config;
  const configPath = require.resolve(path.resolve(process.cwd(), name));
  if (configPath) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      config = that.exec(data, name);
      if (config) {
        that.addDependency(configPath);
      }
      return config;
    } catch (e) {
      throw new Error(e);
    }
  }
}

function getRootPath(rootPaths, lookUp) {
  const contains = rootPaths.filter((opt) => lookUp.indexOf(opt) === 0);

  return contains.reduce((acc, item) => {
    if (!acc) {
      return item;
    }

    return item.length > acc.length ? item : acc;
  }, null);
}

module.exports = function(source) {
  const opt = utils.getOptions(this);
  const paths = Array.isArray(opt.root) ? opt.root : [opt.root];
  let context;
  const rootPath = getRootPath(paths, this.resourcePath);

  if (typeof opt.context === 'string') {
    context = getConfig(this, opt.context);
  }

  context = JSON.stringify(context || opt.context || {});

  const njkPath = require.resolve('nunjucks');
  this.addDependency(njkPath);

  const loaderPath = require.resolve('./fs-loader');
  this.addDependency(loaderPath);

  const njkSlimPath = require.resolve('nunjucks/browser/nunjucks-slim');
  const nunjucksSlim = utils.stringifyRequest(this, '!' + njkSlimPath);
  this.addDependency(njkSlimPath);

  let jinjaCompatSetup = '';
  if (opt.jinjaCompat) {
    nunjucks.installJinjaCompat();
    jinjaCompatSetup = 'nunjucks.installJinjaCompat();';
  }

  const env = new nunjucks.Environment(new fsLoader(paths, this.addDependency));

  // filters have to be added in the returned module,
  // so we have to actually save to source code string :(
  let customFilterSetup = '';
  if (opt.filters) {
    Object.keys(opt.filters).forEach((key) => {
      customFilterSetup += `
            env.addFilter("${key}", ${opt.filters[key].toString()});
        `;
    });
  }

  const name = path.relative(rootPath, this.resourcePath);

  this.addContextDependency(rootPath);

  let precompiledTemplates = nunjucks.precompile(rootPath, {
    env: env,
    include: opt.includeTemplates || [/.*\.(njk|nunjucks|html|tpl|tmpl)$/],
  });

  const filterReg = /env\.getFilter\("require"\)\.call\(context, "(.*?)"/g;
  precompiledTemplates = precompiledTemplates.replace(
    filterReg,
    'require("$1"',
  );

  return `// Return function to HtmlWebpackPlugin
		// Allows Data var to be passed to templates
		// Then render templates with both HtmlWebpackPlugin Data
		// and Nunjucks Context
		var nunjucks = require(${nunjucksSlim});

		// Create fake window object to store nunjucks precompiled templates
		global.window = {};

        ${precompiledTemplates}

        ${jinjaCompatSetup}

        var env = new nunjucks.Environment(new nunjucks.PrecompiledLoader());
        ${customFilterSetup}

		var context = JSON.parse('${context}');

		module.exports = env.render("${name}", context);

		module.exports = function(data) {
			return env.render("${name}", Object.assign({}, context, data));
		}`;
};
