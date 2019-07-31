# Nunjucks loader for Webpack

Nunjucks loader for webpack, supporting both javascript templating and generating static HTML files through the HtmlWebpackPlugin.

Originally forked from [SudoCat/Nunjucks-Isomorphic-Loader](https://github.com/SudoCat/Nunjucks-Isomorphic-Loader).

## Installation

This loader needs [`nunjucks`](https://www.npmjs.com/package/nunjucks) as a peer dependency. Versions >= 2.5.0 <= 4.0.0 are accepted. If you do not have nunjucks already installed, first run:

Using yarn:

```bash
yarn add nunjucks -D
```

Using npm:

```bash
npm install nunjucks -D
```

If you have nunjucks installed, you can then install the loader.

Using yarn:

```bash
yarn add @julians/nunjucks-loader -D
```

Using npm:

```bash
npm install @julians/nunjucks-loader -D
```

## Usage

Basic usage of this loader with `html-webpack-plugin`

```js
module: {
  rules: [
    {
      test: /\.(njk|nunjucks|html|tpl|tmpl)$/,
      use: [
        {
          loader: '@julians/nunjucks-loader',
          query: {
            root: [path.resolve(__dirname, 'path/to/templates/root')]
          }
        }
      ]
    }
  ]
},

plugins: [
  new HtmlWebpackPlugin({
    customData: { foo: 'bar' },
    filename: 'list.html',
    template: 'path/to/template.nunjucks'
  })
]
```

## Requiring assets in templates

Uses regular Webpack loaders to load the required file, so you have to have them configured in your Webpack config.

```nunjucks
{{ "src/assets/whatever.jpg" | require }}
```

## Options

```js
// include specific templates
includeTemplates: [/.*\.(njk|nunjucks|html|tpl|tmpl)$/],
// enable jinja compatibility
jinjaCompat: true,
// add custom filters
filters: {
  obj_debug: function(variable) {
    return JSON.stringify(variable, null, 2);
  },
},
```

Accessing data from the templates with the above config of `html-webpack-plugin`

`path/to/template.njk` :

```nunjucks
{% set vars = htmlWebpackPlugin.options.customData %}

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{{ vars.foo }}</title>{# outputs 'bar' #}
  </head>
  <body>
    <header class="header">
    {% block header %}
      <h1 class="header-logo">
        <a href="#">{{ vars.foo }}</a>{# outputs 'bar' #}
      </h1>
    {% endblock %}
    </header>

    {% block content %}
      <section>
        <p>I was generated with html-webpack-plugin and @julians/nunjucks-loader!</p>
      </section>
    {% endblock %}
  </body>
</html>
```
