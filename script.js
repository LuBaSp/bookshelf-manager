const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const libraryList = document.getElementById('library');

let personalLibrary = [];

function saveLibrary() {
  localStorage.setItem('personalLibrary', JSON.stringify(personalLibrary));
}

function loadLibrary() {
  const data = localStorage.getItem('personalLibrary');
  if (data) {
    personalLibrary = JSON.parse(data);
    filterAndSortLibrary();
  } else {
    personalLibrary = [];
  }
}

function createBookDiv({title, authors, publishedDate, publisher, thumbnail, source}, bookId) {
  const div = document.createElement('div');
  div.className = 'result-item';
  div.innerHTML = `
    <div class="book-info">
      <img src="${thumbnail || 'https://via.placeholder.com/50x70?text=No+Img'}" alt="Copertina" />
      <div class="book-details">
        <strong>${title}</strong><br/>
        <small>di ${authors || 'Autore sconosciuto'}</small><br/>
        <small>Pubblicato: ${publishedDate || 'N/D'}</small><br/>
        <small>Editore: ${publisher || 'N/D'}</small>
        <div class="source-label">Fonte: ${source}</div>
      </div>
    </div>
    <div class="add-book-controls">
      <select class="location-select-add">
        <option value="">Scegli posizione...</option>
        <option value="Camera Ilaria">Camera Ilaria</option>
        <option value="Camera Paolo">Camera Paolo</option>
        <option value="Salotto">Salotto</option>
        <option value="Piano di sopra">Piano di sopra</option>
        <option value="Taverna">Taverna</option>
        <option value="Cesenatico">Cesenatico</option>
      </select>
      <input type="number" class="rating-input" min="0" max="10" step="0.5" placeholder="Voto (0-10, opzionale)" inputmode="numeric">
      <button>Aggiungi</button>
    </div>
  `;

  div.querySelector('button').addEventListener('click', () => {
    if (!personalLibrary.find(b => b.id === bookId)) {
      const locationSelect = div.querySelector('.location-select-add');
      const ratingInput = div.querySelector('.rating-input');
      
      if (!locationSelect.value) {
        alert('Per favore seleziona una posizione per il libro');
        return;
      }

      const ratingValue = ratingInput.value;
      const rating = ratingValue ? parseFloat(ratingValue) : null;
      
      if (ratingValue && (isNaN(rating) || rating < 0 || rating > 10)) {
        alert('Per favore inserisci un voto valido tra 0 e 10 o lascia vuoto');
        return;
      }

      const newBook = { 
        id: bookId, 
        title, 
        authors, 
        publishedDate, 
        publisher, 
        thumbnail, 
        source, 
        read: false,
        location: locationSelect.value,
        rating: rating,
        loaned: false,
        loanedTo: '',
        loanDate: null,
        favorite: false
      };
      personalLibrary.push(newBook);
      addBookToLibrary(newBook);
      saveLibrary();
      filterAndSortLibrary();
    }
  });

  return div;
}

function addBookToLibrary(book) {
  const li = document.createElement('li');
  li.dataset.bookId = book.id;
  li.dataset.read = book.read;
  li.dataset.location = book.location || 'Non specificato';
  li.dataset.rating = book.rating !== undefined ? book.rating : 'N/D';
  li.dataset.loaned = book.loaned || false;
  
  if (book.loaned) {
    li.classList.add('loaned');
  }

  li.innerHTML = `
    <div class="book-container">
      <div class="book-image">
        <img src="${book.thumbnail || 'https://via.placeholder.com/70x100?text=No+Img'}" alt="Copertina" />
      </div>
      <div class="book-details">
        <div class="detail-row">
          <span class="detail-label">Titolo:</span>
          <span class="detail-value">${book.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Autore:</span>
          <span class="detail-value">${book.authors || 'Autore sconosciuto'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pubblicato:</span>
          <span class="detail-value">${book.publishedDate || 'N/D'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Editore:</span>
          <span class="detail-value">${book.publisher || 'N/D'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Posizione:</span>
          <select class="location-select">
            <option value="">Scegli...</option>
            <option value="Camera Ilaria" ${book.location === 'Camera Ilaria' ? 'selected' : ''}>Camera Ilaria</option>
            <option value="Camera Paolo" ${book.location === 'Camera Paolo' ? 'selected' : ''}>Camera Paolo</option>
            <option value="Salotto" ${book.location === 'Salotto' ? 'selected' : ''}>Salotto</option>
            <option value="Piano di sopra" ${book.location === 'Piano di sopra' ? 'selected' : ''}>Piano di sopra</option>
            <option value="Taverna" ${book.location === 'Taverna' ? 'selected' : ''}>Taverna</option>
            <option value="Cesenatico" ${book.location === 'Cesenatico' ? 'selected' : ''}>Cesenatico</option>
          </select>
        </div>
        <div class="detail-row">
          <span class="detail-label">Voto:</span>
          <input type="number" class="rating-input" min="0" max="10" step="0.5" value="${book.rating || ''}" placeholder="0-10">
        </div>
        
        <div class="detail-row combined-controls">
          <div class="checkbox-group">
            <label class="read-label"><input type="checkbox" class="read-checkbox" ${book.read ? 'checked' : ''} /> Letto</label>
            <label class="loan-label">
              <input type="checkbox" class="loan-checkbox" ${book.loaned ? 'checked' : ''} />
              Prestito
            </label>
          </div>
          <div class="loan-details" style="${book.loaned ? '' : 'display: none;'}">
            <input type="text" class="loan-to-input" value="${book.loanedTo || ''}" placeholder="A chi?" size="10">
            <input type="date" class="loan-date-input" value="${book.loanDate || new Date().toISOString().split('T')[0]}">
          </div>
        </div>
      </div>

      <div class="book-actions">
        <button class="favorite-button ${book.favorite ? 'favorited' : ''}">★</button>
        <button class="remove-button">×</button>
      </div>
    </div>
  `;

  const checkbox = li.querySelector('.read-checkbox');
  checkbox.checked = book.read;

  checkbox.addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib) {
      bookInLib.read = e.target.checked;
      li.dataset.read = e.target.checked;
      li.dataset.rating = bookInLib.rating !== undefined ? bookInLib.rating : 'N/D';
      saveLibrary();
      filterAndSortLibrary();
    }
  });

  li.querySelector('.location-select').addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib) {
      bookInLib.location = e.target.value;
      li.dataset.location = e.target.value || 'Non specificato';
      saveLibrary();
      filterAndSortLibrary();
    }
  });

  li.querySelector('.rating-input').addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib) {
      const ratingValue = e.target.value;
      
      if (ratingValue === '') {
        bookInLib.rating = null;
        li.dataset.rating = 'N/D';
        saveLibrary();
        return;
      }

      const rating = parseFloat(ratingValue);
      
      if (isNaN(rating) || rating < 0 || rating > 10) {
        alert('Per favore inserisci un voto valido tra 0 e 10');
        e.target.value = '';
        bookInLib.rating = null;
        li.dataset.rating = 'N/D';
        saveLibrary();
        return;
      }

      bookInLib.rating = rating;
      li.dataset.rating = rating;
      saveLibrary();
    }
  });

  const loanCheckbox = li.querySelector('.loan-checkbox');
  const loanDetails = li.querySelector('.loan-details');
  const loanToInput = li.querySelector('.loan-to-input');
  const loanDateInput = li.querySelector('.loan-date-input');

  loanCheckbox.addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib) {
      bookInLib.loaned = e.target.checked;
      li.dataset.loaned = e.target.checked;
      
      if (e.target.checked) {
        loanDetails.style.display = 'block';
        bookInLib.loanedTo = loanToInput.value;
        bookInLib.loanDate = loanDateInput.value || new Date().toISOString().split('T')[0];
        li.classList.add('loaned');
      } else {
        loanDetails.style.display = 'none';
        bookInLib.loanedTo = '';
        bookInLib.loanDate = null;
        li.classList.remove('loaned');
      }
      saveLibrary();
      checkLoanStatus(li, bookInLib);
    }
  });

  loanToInput.addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib && bookInLib.loaned) {
      bookInLib.loanedTo = e.target.value;
      saveLibrary();
    }
  });

  loanDateInput.addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib && bookInLib.loaned) {
      bookInLib.loanDate = e.target.value || new Date().toISOString().split('T')[0];
      saveLibrary();
      checkLoanStatus(li, bookInLib);
    }
  });

  li.querySelector('.favorite-button').addEventListener('click', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib) {
      bookInLib.favorite = !bookInLib.favorite;
      e.target.classList.toggle('favorited', bookInLib.favorite);
      saveLibrary();
      filterAndSortLibrary();
    }
  });

  li.querySelector('.remove-button').addEventListener('click', () => {
    if (confirm(`Sei sicuro di voler rimuovere "${book.title}" dalla libreria?`)) {
      personalLibrary = personalLibrary.filter(b => b.id !== book.id);
      li.remove();
      saveLibrary();
    }
  });

  if (book.loaned) {
    checkLoanStatus(li, book);
  }

  libraryList.appendChild(li);
}

function checkLoanStatus(li, book) {
  if (!book.loaned || !book.loanDate) return;

  const loanDate = new Date(book.loanDate);
  const now = new Date();
  const diffInMinutes = Math.floor((now - loanDate) / (1000 * 60));

  if (diffInMinutes > 1) {
    li.classList.add('loan-overdue');
  } else {
    li.classList.remove('loan-overdue');
  }
}

function filterAndSortLibrary() {
  const statusFilter = document.getElementById('filterStatus').value;
  const sourceFilter = document.getElementById('filterSource').value;
  const locationFilter = document.getElementById('filterLocation').value;
  const sortOption = document.getElementById('sortBy').value;
  const searchQuery = document.getElementById('searchLibraryInput').value.toLowerCase();

  let filtered = [...personalLibrary];

  if (statusFilter === 'read') {
    filtered = filtered.filter(book => book.read);
  } else if (statusFilter === 'unread') {
    filtered = filtered.filter(book => !book.read);
  } else if (statusFilter === 'favorite') {
    filtered = filtered.filter(book => book.favorite);
  }

  if (sourceFilter === 'google') {
    filtered = filtered.filter(book => book.source === 'Google Books');
  } else if (sourceFilter === 'openlibrary') {
    filtered = filtered.filter(book => book.source === 'Open Library');
  }

  if (locationFilter !== 'all') {
    filtered = filtered.filter(book => book.location === locationFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(book => 
      book.title.toLowerCase().includes(searchQuery) || 
      (book.authors && book.authors.toLowerCase().includes(searchQuery))
    );
  }

  filtered.sort((a, b) => {
    switch (sortOption) {
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'author-asc':
        return (a.authors || '').localeCompare(b.authors || '');
      case 'date-desc':
        return (b.publishedDate || '').localeCompare(a.publishedDate || '');
      case 'date-asc':
        return (a.publishedDate || '').localeCompare(b.publishedDate || '');
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0);
      case 'rating-asc':
        return (a.rating || 0) - (b.rating || 0);
      default:
        return 0;
    }
  });

  renderFilteredLibrary(filtered);
}

function renderFilteredLibrary(books) {
  libraryList.innerHTML = '';
  books.forEach(book => {
    const li = addBookToLibrary(book);
    if (book.favorite) {
      li.querySelector('.favorite-button').classList.add('favorited');
    }
  });
}

async function fetchGoogleBooks(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=30&printType=books&orderBy=relevance`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.items) return [];

  return data.items.map(book => {
    const info = book.volumeInfo;
    return {
      id: `google-${book.id}`,
      title: info.title || 'Titolo sconosciuto',
      authors: (info.authors || []).join(', '),
      publishedDate: info.publishedDate || 'N/D',
      publisher: info.publisher || 'N/D',
      thumbnail: info.imageLinks?.thumbnail || '',
      source: 'Google Books'
    };
  });
}

async function fetchOpenLibrary(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=30`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.docs) return [];

  return data.docs.map(book => {
    return {
      id: `openlibrary-${book.key}`,
      title: book.title || 'Titolo sconosciuto',
      authors: (book.author_name || []).join(', '),
      publishedDate: book.first_publish_year || 'N/D',
      publisher: (book.publisher && book.publisher[0]) || 'N/D',
      thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : '',
      source: 'Open Library'
    };
  });
}

let timeoutId;
searchInput.addEventListener('input', () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    const query = searchInput.value.trim();
    if (query.length < 3) {
      resultsDiv.innerHTML = '';
      return;
    }
    resultsDiv.innerHTML = '<div class="loading-message">Caricamento...</div>';

    try {
      const [googleBooks, openLibrary] = await Promise.all([
        fetchGoogleBooks(query),
        fetchOpenLibrary(query)
      ]);
      const combined = [...googleBooks, ...openLibrary].slice(0, 50);

      resultsDiv.innerHTML = '';
      combined.forEach(book => {
        const div = createBookDiv(book, book.id);
        resultsDiv.appendChild(div);
      });
    } catch (e) {
      resultsDiv.innerHTML = '<div class="error-message">Errore durante la ricerca.</div>';
      console.error(e);
    }
  }, 400);
});

setInterval(() => {
  document.querySelectorAll('#library li[data-loaned="true"]').forEach(li => {
    const bookId = li.dataset.bookId;
    const book = personalLibrary.find(b => b.id === bookId);
    if (book) {
      checkLoanStatus(li, book);
    }
  });
}, 60000);

loadLibrary();

document.getElementById('filterStatus').addEventListener('change', filterAndSortLibrary);
document.getElementById('filterSource').addEventListener('change', filterAndSortLibrary);
document.getElementById('filterLocation').addEventListener('change', filterAndSortLibrary);
document.getElementById('sortBy').addEventListener('change', filterAndSortLibrary);

const searchLibraryInput = document.getElementById('searchLibraryInput');
const clearSearchBtns = document.querySelectorAll('.clear-search');

searchLibraryInput.addEventListener('input', () => {
  filterAndSortLibrary();
});

clearSearchBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const container = e.target.closest('.search-container, .search-library-container');
    const input = container.querySelector('input');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    
    if (container.classList.contains('search-library-container')) {
      filterAndSortLibrary();
    }
  });
});