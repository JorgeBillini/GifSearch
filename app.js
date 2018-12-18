// ---------- HELPERS, testing
class Storage {
  constructor(key) {
      this.key = key;
  }
  getStorage() {
      const data = window.localStorage.getItem(this.key);
      if (data) {
          return JSON.parse(data);
      }
      return data;
  }
  save(data) {
      window.localStorage.setItem(this.key, JSON.stringify(data))
  }
}

const getGifs = (search, cb) => {
  if (search === "" || search.trim() === "") {
      return;
  }

  const api_key = '44EbA35wm9zpn1pCTa9dnzomGmrJ4n5P';
  const url = `https://api.giphy.com/v1/gifs/search?api_key=${api_key}&q=${search}`;

  let request = new XMLHttpRequest();
  request.open("GET", url);
  request.addEventListener('load', (response) => {
      const data = JSON.parse(response.currentTarget.response);

      const gifArray = [];
      data.data.forEach(currentGif => {
          const url = currentGif.images.original.url;
          gifArray.push(url);
      });

      cb(gifArray);
  })
  request.send(null);
}

const gifToHTML = (gif, index, isFav, showCpyLink) => {
  const favMarkup = isFav ? '<span style="position: absolute; top: 5px; right: 15px;">❤️</span>' : '';
  const linkMarkup = showCpyLink ? `<div data-index="${index}" class="js-cpy btn btn-primary btn-lg btn-block">
      Copy link
  </div>` : ''; 

  return `<div class='col-4' style="position: relative;">
      ${favMarkup}
      <img src='${gif}' class="js-gif" data-index="${index}" style='width: 100%; height: auto;'>
      <br><br>
      ${linkMarkup}
      <br><br>
  </div>`;
}

const storage = new Storage('app-state');

// ---------- STATE 
let state = {
  show: 'search',
  gifs: [],
  favorites: [],
}


// ---------- GLOBAL HTML OBJECTS 
const searchLink = document.querySelector('.js-navlink-search');
const favoritesLink = document.querySelector('.js-navlink-favorites');
const searchContainer = document.querySelector('.js-search-container');
const favoritesContainer = document.querySelector('.js-favorites-container');
const searchBox = document.querySelector('.js-search-box');
const searchList = document.querySelector('.js-search-list');
const favoritesList = document.querySelector('.js-favs-list')

// ---------- EVENTS
searchLink.addEventListener('click', (e) => {
  state.show = 'search';
  storage.save(state);
  render(state);
  console.log(state);

});

favoritesLink.addEventListener('click', (e) => {
  state.show = 'favorites';
  storage.save(state);
  render(state);
  console.log(state);
});

searchBox.addEventListener('keydown', (e) => {
  const { key, target } = e;

  if (key === 'Enter') {
      getGifs(target.value, (gifs) => {
          console.log(gifs);
          state.gifs = gifs;
          storage.save(state);
          render(state);
      });
  }
});

searchList.addEventListener('click', e => {
  if (e.target.matches('.js-gif')) {
      // run our logic
      // first, grab the index from DOM data-index property
      const index = e.target.getAttribute('data-index');
      // this index represents the position of the IMG URL in
      // the gifs array of our state - extract this
      const gifToAdd = state.gifs[index];

      if (state.favorites.includes(gifToAdd)) {
         // remove from favs 
         // first get index of this gif from *favorites* list
         const favIndex = state.favorites.indexOf(gifToAdd);

         const firstPart = state.favorites.slice(0, favIndex)
         const lastPart = state.favorites.slice(favIndex + 1)

         state.favorites = firstPart.concat(lastPart);
         
      }
      else {
          // take this URL that we extracted and push it into our
          // favorites 
          state.favorites = state.favorites.concat([gifToAdd]);
      }

      
      // save the updated state into localstorage
      storage.save(state);
      // render
      render(state)
  }
});

favoritesList.addEventListener('click', e => {
  if (e.target.matches('.js-gif')) {
      // remove this item
      // first, grab the index from DOM data-index property
      const index = parseInt(e.target.getAttribute('data-index'), 10);

      // state.favorites.splice(index, 1);

      /*
          arr = [a,b,c,d,e] => [a,b,d,e]
          index = 2 because arr[2] == c

          arr.slice(0, index) => [a,b]
          arr.slice(index+1) => [d,e]

          concat the above two, lol
      */

      const firstPart = state.favorites.slice(0, index);
      const lastPart = state.favorites.slice(index+1);

      state.favorites = firstPart.concat(lastPart)

      // save the updated state into localstorage
      storage.save(state);
      // render
      render(state)

  }
  else if (e.target.matches('.js-cpy')) {
      const index = parseInt(e.target.getAttribute('data-index'), 10);
      copyStr(state.favorites[index])
      
  }
});

const copyStr = str => {
  const inputField = document.createElement('input');
  inputField.setAttribute('type', 'text')
  inputField.value = str;
  document.body.appendChild(inputField)
  inputField.select();
  document.execCommand("copy");
  document.body.removeChild(inputField)

  const popup = document.querySelector('.js-popup')
  
  popup.classList.remove('hidden')
  setTimeout(() => {
      popup.classList.add('hidden')
  }, 500)

}


// ---------- RENDER
const render = state => {
  if (state.show === 'search') {
      // Show Search & Hide Favorites
      renderGifs(state)
  }
  else if (state.show === 'favorites') {
      // Show Favorites & Hide Search
      renderFavs(state)
  }

}

const renderGifs = state => {
  searchContainer.classList.remove('hidden');
  favoritesContainer.classList.add('hidden');

  searchLink.classList.add('active');
  favoritesLink.classList.remove('active');

  let allGifsHTML = '';
  for (let i = 0; i < state.gifs.length; i++) {
      if (state.favorites.includes(state.gifs[i])) {
          allGifsHTML += gifToHTML(state.gifs[i], i, true, false);
      }
      else {
          allGifsHTML += gifToHTML(state.gifs[i], i, false, false);
      }
  }

  searchList.innerHTML = allGifsHTML;
}

const renderFavs = state => {
  searchContainer.classList.add('hidden');
  favoritesContainer.classList.remove('hidden');

  searchLink.classList.remove('active');
  favoritesLink.classList.add('active');

  let allGifsHTML = '';
  for (let i = 0; i < state.favorites.length; i++) {
      allGifsHTML += gifToHTML(state.favorites[i], i, false, true);
  }

  favoritesList.innerHTML = allGifsHTML;
}

// Checking if there is anything in the local storage
const stored_state = storage.getStorage();
if (stored_state) {
  // If there is then apply that to my state in Memory
  state = stored_state;
}

render(state);

