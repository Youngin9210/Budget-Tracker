// setting up IndexedDB for "client-side" storage
let db;
let budgetVersion;
// opening an indexedDB with a name of budget and using a set budget version OR version 23
const request = indexedDB.open('budget', budgetVersion || 23);

// upgrading indexedDB
request.onupgradeneeded = (e) => {
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    // creating object store
    db.createObjectStore('budgetStore', { autoIncrement: true });
  }
};

request.onerror = (e) => {
  console.log(`Error: ${e.target.errorCode}`);
};

const checkDatabase = () => {
  // opening a transaction for db
  let transaction = db.transaction(['budgetStore'], 'readwrite');
  // accessing store object and setting into a variable
  const store = transaction.objectStore('budgetStore');
  // getting all records from store and setting into a variable
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    // if items in store object, add when back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(['budgetStore'], 'readwrite');
            const currentStore = transaction.objectStore('budgetStore');
            // clearing after bulk add is successful
            currentStore.clear();
            console.log('budgetStore cleared');
          }
        });
    }
  };
};

request.onsuccess = (e) => {
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('saving record');
  const transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');
  // adding record to store object
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
