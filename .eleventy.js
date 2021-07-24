const fs = require("fs");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginNavigation = require("@11ty/eleventy-navigation");
const safeExternalLinks = require("@hirusi/eleventy-plugin-safe-external-links");

const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const htmlmin = require('html-minifier');

module.exports = function(eleventyConfig) {
  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.addPlugin(safeExternalLinks, {
    noreferrer: true,
  });

  // Alias `layout: post` to `layout: layouts/post.njk`
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");

  eleventyConfig.addFilter("readableDate", dateObj => {
    return new Date(dateObj).toLocaleString('ru', { dateStyle: 'medium' });
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    const _date = new Date(dateObj)
    const month = new Date().getMonth() + 1

    return `${_date.getFullYear()}-${month < 10 ? `0${month}` : month}-${_date.getDate()}`
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addFilter('addTimestamp', (value) => {
    return value + '?ts=' + new Date().getTime();
  });

  eleventyConfig.addTransform('htmlmin', (content, outputPath) => {
    if (outputPath && outputPath.endsWith('.html')) {
        return htmlmin.minify(
            content, {
                removeComments: true,
                collapseWhitespace: true
            }
        );
    }
    return content;
  });

  eleventyConfig.addFilter("arrayLength", array => {
    return array.length;
  });

  // Copy to the output
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy('src/scripts');
  eleventyConfig.addPassthroughCopy('src/**/*.(html|gif|jpg|png|webp|ico|svg|mp4|webm|zip)');

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#"
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('dist/404.html');

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: "/",
    // -----------------------------------------------------------------

    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',

    passthroughFileCopy: true,

    // These are all optional (defaults are shown):
    dir: {
      input: "src",
      includes: "includes",
      data: "data",
      output: "dist"
    }
  };
};
