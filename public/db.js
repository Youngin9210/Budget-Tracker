let db;
let budgetVersion;
const request = indexedDB.open('budget', budgetVersion || 23);

request.onupgradeneeded = (e) => {
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;
  alert(`upgraded ${db.name}`);

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('budgetStore', { autoIncrement: true });
  }
};

request.onsuccess = (e) => {
  alert('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

request.onerror = (e) => {
  alert('error');
  console.log(`Woops! ${e.target.errorCode}`);
};

const checkDatabase = () => {
  console.log('checking db');

  let transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');
  const getAll = store.getAll();
  getAll.onsuccess = () => {
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
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
};

const saveRecord = (record) => {
  console.log('saving record');
  const transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
