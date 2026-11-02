// Нагаев Валентин, Практическая работа 5 — Телефонная книга (REST API + UI)
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'contacts.json');

const seed = [
  { _id: '1', name: 'Иван Петров', phone: '+7 (915) 123-45-67', email: 'ivan.petrov@mail.ru', category: 'Друзья' },
  { _id: '2', name: 'Мария Соколова', phone: '+7 (926) 765-43-21', email: 'm.sokolova@yandex.ru', category: 'Работа' },
  { _id: '3', name: 'Андрей Кузнецов', phone: '+7 (903) 555-12-34', email: 'kuznetsov@gmail.com', category: 'Семья' }
];

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { save(seed); return [...seed]; }
}
function save(list) { fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2)); }
function handleError(res, reason, message, code) {
  console.log('ERROR: ' + reason);
  res.status(code || 500).json({ error: message });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* "/api/contacts"
 *   GET:  список контактов (?q= — поиск по имени/телефону/email)
 *   POST: создать контакт
 */
app.get('/api/contacts', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let list = load();
  if (q) list = list.filter(c => [c.name, c.phone, c.email].join(' ').toLowerCase().includes(q));
  res.status(200).json(list);
});

app.post('/api/contacts', (req, res) => {
  const c = req.body;
  if (!c.name || !c.phone) return handleError(res, 'Invalid user input', 'Must provide a name and phone.', 400);
  const list = load();
  const contact = { _id: String(Date.now()), name: c.name, phone: c.phone, email: c.email || '', category: c.category || 'Друзья' };
  list.push(contact);
  save(list);
  res.status(201).json(contact);
});

/* "/api/contacts/:id"
 *   GET: найти контакт по id
 *   PUT: обновить контакт по id
 *   DELETE: удалить контакт по id
 */
app.get('/api/contacts/:id', (req, res) => {
  const c = load().find(x => x._id === req.params.id);
  c ? res.status(200).json(c) : handleError(res, 'Not found', 'Contact not found', 404);
});

app.put('/api/contacts/:id', (req, res) => {
  const list = load();
  const i = list.findIndex(x => x._id === req.params.id);
  if (i < 0) return handleError(res, 'Not found', 'Contact not found', 404);
  const { _id, ...upd } = req.body;
  list[i] = { ...list[i], ...upd };
  save(list);
  res.status(200).json(list[i]);
});

app.delete('/api/contacts/:id', (req, res) => {
  const list = load();
  const i = list.findIndex(x => x._id === req.params.id);
  if (i < 0) return handleError(res, 'Not found', 'Contact not found', 404);
  list.splice(i, 1);
  save(list);
  res.status(200).json({ _id: req.params.id });
});

app.listen(PORT, () => console.log('App now running on port', PORT));
