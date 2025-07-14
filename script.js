const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const libraryList = document.getElementById('library');

let personalLibrary = [];

// --- LocalStorage functions ---
function saveLibrary() {
  localStorage.setItem('personalLibrary', JSON.stringify(personalLibrary));
}

function loadLibrary() {
  const data = localStorage.getItem('personalLibrary');
  if (data) {
    personalLibrary = JSON.parse(data);
    filterAndSortLibrary(); // Applica i filtri al caricamento
  } else {
    personalLibrary = [];
  }
}

// --- Create book element in search results ---
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
    <button>Aggiungi</button>
  `;

  div.querySelector('button').addEventListener('click', () => {
    if (!personalLibrary.find(b => b.id === bookId)) {
      const newBook = { 
        id: bookId, 
        title, 
        authors, 
        publishedDate, 
        publisher, 
        thumbnail, 
        source, 
        read: false 
      };
      personalLibrary.push(newBook);
      addBookToLibrary(newBook);
      saveLibrary();
      filterAndSortLibrary(); // Riapplica i filtri dopo l'aggiunta
    }
  });

  return div;
}

// --- Add book to personal library UI ---
function addBookToLibrary(book) {
  const li = document.createElement('li');
  li.dataset.bookId = book.id;
  li.dataset.read = book.read;
  li.innerHTML = `
    <img src="${book.thumbnail || 'https://via.placeholder.com/50x70?text=No+Img'}" alt="Copertina" />
    <div class="book-info">
      <div><strong>${book.title}</strong></div>
      <div>di ${book.authors || 'Autore sconosciuto'}</div>
      <div>Pubblicato: ${book.publishedDate || 'N/D'}</div>
      <div>Editore: ${book.publisher || 'N/D'}</div>
    </div>
    <label class="read-label"><input type="checkbox" class="read-checkbox" ${book.read ? 'checked' : ''} /> Letto</label>
    <button class="remove-button">Rimuovi</button>
  `;

  const checkbox = li.querySelector('.read-checkbox');
  checkbox.checked = book.read;

  checkbox.addEventListener('change', (e) => {
    const bookInLib = personalLibrary.find(b => b.id === book.id);
    if (bookInLib) {
      bookInLib.read = e.target.checked;
      li.dataset.read = e.target.checked;
      saveLibrary();
      filterAndSortLibrary(); // Riapplica i filtri dopo la modifica
    }
  });

  li.querySelector('.remove-button').addEventListener('click', () => {
    if (confirm(`Sei sicuro di voler rimuovere "${book.title}" dalla libreria?`)) {
      personalLibrary = personalLibrary.filter(b => b.id !== book.id);
      li.remove();
      saveLibrary();
    }
  });

  libraryList.appendChild(li);
}

// --- Filter and sort library ---
function filterAndSortLibrary() {
  const statusFilter = document.getElementById('filterStatus').value;
  const sourceFilter = document.getElementById('filterSource').value;
  const sortOption = document.getElementById('sortBy').value;

  let filtered = [...personalLibrary];

  // Apply status filter
  if (statusFilter === 'read') {
    filtered = filtered.filter(book => book.read);
  } else if (statusFilter === 'unread') {
    filtered = filtered.filter(book => !book.read);
  }

  // Apply source filter
  if (sourceFilter === 'google') {
    filtered = filtered.filter(book => book.source === 'Google Books');
  } else if (sourceFilter === 'openlibrary') {
    filtered = filtered.filter(book => book.source === 'Open Library');
  }

  // Apply sorting
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
      default:
        return 0;
    }
  });

  // Render filtered library
  renderFilteredLibrary(filtered);
}

function renderFilteredLibrary(books) {
  libraryList.innerHTML = '';
  books.forEach(book => addBookToLibrary(book));
}

// --- Fetch from Google Books API ---
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

// --- Fetch from Open Library API ---
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

// --- Search input handler with debounce ---
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

// --- On load ---
loadLibrary();

// Add event listeners for filters and sort
document.getElementById('filterStatus').addEventListener('change', filterAndSortLibrary);
document.getElementById('filterSource').addEventListener('change', filterAndSortLibrary);
document.getElementById('sortBy').addEventListener('change', filterAndSortLibrary);