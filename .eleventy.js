const moment = require('moment');
const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");

const fs = require("fs");

moment.locale('en');

module.exports = function (eleventyConfig) {
  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) =>
    yaml.safeLoad(contents)
  );

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
    "./node_modules/alpinejs/dist/cdn.min.js": "./static/js/alpine.js",
    "./node_modules/prismjs/themes/prism-tomorrow.css":
      "./static/css/prism-tomorrow.css",
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  
  
  
  eleventyConfig.addFilter('datePretty', date => {
      return moment(date).format('DD MMMM YYYY')
  });

  eleventyConfig.addFilter('dateReadable', date => {
      return moment(date).format('LL')
  });  
  
  eleventyConfig.addFilter('datePretty', date => {
      return moment(date).format('DD MMMM YYYY')
  });

  eleventyConfig.addFilter('dateReadable', date => {
      return moment(date).format('LL')
  });
  
 function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "posts", "pokloni"].indexOf(tag) === -1);
  }

  eleventyConfig.addFilter("filterTagList", filterTagList)

  // Create an array of all tags
  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return filterTagList([...tagSet]);
  });

  function filterPokloniTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "posts", "pokloni"].indexOf(tag) === -1);
  }

  eleventyConfig.addFilter("filterPokloniTagList", filterPokloniTagList)

  // Create an array of all tags
  eleventyConfig.addCollection("pokloniTagList", function(collectionApi) {
    let tagSet = new Set();
    collectionApi.getFilteredByTags("pokloni").forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return filterPokloniTagList([...tagSet]);
  });

  // Custom filter for featured content.
  eleventyConfig.addFilter("featured", (collection = []) =>
    collection.filter(page => !!page.data.featured)
  );

  // Custom collection for featured content.
  eleventyConfig.addCollection("pokloniFeatured", collection =>
    collection
      .getFilteredByTags("pokloni")
      .filter(page => !!page.data.featured)
      .reverse()
  );

  // Custom collection for featured content.
  eleventyConfig.addCollection("blogFeatured", collection =>
    collection
      .getFilteredByTags("posts")
      .filter(page => !!page.data.featured)
      .reverse()
  );

  // Custom collection for featured content.
  eleventyConfig.addCollection("blogList", collection =>
    collection
      .getFilteredByTags("posts")
      .reverse()
  );

  // Custom collection for featured content.
  eleventyConfig.addCollection("pokloniList", collection =>
    collection
      .getFilteredByTags("pokloni")
      .reverse()
  );

    /**
   * Finds all related posts in a collection, but filters out the current page.
   * Usage: `{% related title="Eleventy data posts", collection=collections["eleventy:data"], filterUrl=page.url %}`
   */
     eleventyConfig.addShortcode(
      "related",
      ({ collection = [], title = "", filterUrl = "", cls = "related" }) => {
        // Omit the current URL from the collection.
        collection = collection.filter(page => page.url !== filterUrl);
        // Exit early if no other pages in the specified collection.
        if (collection.length === 0) {
          return `<!-- No related content found for "${title}" -->`;
        }
        // Convert collection items to HTML markup.
        const innerHtml = collection
          .map(page => `<li><a href="${page.url}">${page.data.title}</a></li>`)
          .join("\n")
          .trim();
        if (title.length) title = `<h2>${title}</h2>`;
        return `<section class="${cls}">${title}\n<ul>${innerHtml}</ul></section>`;
      }
    );



  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, bs) {

        bs.addMiddleware("*", (req, res) => {
          const content_404 = fs.readFileSync('_site/404.html');
          // Add 404 http status code in request header.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      }
    }
  });

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }

    return content;
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
      layouts: '_includes/layouts',
    },
    htmlTemplateEngine: "njk",
  };
};
