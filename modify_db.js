const fs = require('fs');

const dataFile = 'js/data.js';
let dataContent = fs.readFileSync(dataFile, 'utf8');

// A bit of a hack to evaluate the DB object
let DB;
eval(dataContent.replace('const DB =', 'DB ='));

// Remove 'up-movie'
let newMovies = [];

DB.movies.forEach(item => {
  if (item.id === 'up-movie') {
    // skip
    return;
  }
  
  if (item.isCollection && item.collection) {
    // Expand collection
    item.collection.forEach((subItem, index) => {
      newMovies.push({
        id: subItem.id,
        title: subItem.title,
        poster: subItem.poster,
        file: subItem.file,
        trailer: subItem.trailer || item.trailer,
        searchTags: item.searchTags, // inherit
        desc: subItem.desc,
        year: item.year === 'Koleksiyon' ? (subItem.title.match(/\d{4}/) ? subItem.title.match(/\d{4}/)[0] : '2024') : item.year,
        match: item.match,
        meta: item.meta === 'Koleksiyon' || item.meta === '2 Film' ? 'HD' : item.meta,
        rating: item.rating,
        highlights: item.highlights,
        isYoutube: subItem.isYoutube !== undefined ? subItem.isYoutube : item.isYoutube,
        isNew: item.isNew
      });
    });
  } else {
    // normal movie
    newMovies.push(item);
  }
});

DB.movies = newMovies;

// Convert back to JS code string
const newContent = 'const DB = ' + JSON.stringify(DB, null, 2) + ';\n';
fs.writeFileSync(dataFile, newContent, 'utf8');
console.log('Successfully updated DB.');
