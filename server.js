const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://kanuprajapati717:%40KAnu1233@cluster0.tqks5qv.mongodb.net/mydatabase')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

app.use(bodyParser.json());
app.use(express.static('public'));

const formSchema = new mongoose.Schema({
  name: String,
  servesh: String,
  city: String,
  cost: String,
  iss: String,
  mo: Number
});

const FormData = mongoose.model('FormData', formSchema);

// POST create
app.post('/submit', async (req, res) => {
  const data = req.body;
  if (!data.name || !data.servesh || !data.city || !data.cost || !data.iss || typeof data.mo !== 'number') {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const newEntry = await FormData.create(data);
    await updateFiles(); // update JSON and Excel files with DB data
    res.json({ message: "✅ Data saved successfully!", savedData: newEntry });
  } catch (err) {
    res.status(500).json({ message: "Server error while saving data" });
  }
});

// PATCH update by ID
app.patch('/update/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  try {
    const updated = await FormData.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ message: "Data not found" });
    await updateFiles();
    res.json({ message: "✅ Data updated successfully!", savedData: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error while updating data" });
  }
});

// DELETE by ID
app.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const deleted = await FormData.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Data not found" });
    await updateFiles();
    res.json({ message: "✅ Data deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting data" });
  }
});

// GET all data
app.get('/getSavedData', async (req, res) => {
  try {
    const allData = await FormData.find();
    res.json({ savedData: allData, message: "📥 All data loaded from MongoDB" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

// Helper function to update JSON & Excel from DB
async function updateFiles() {
  const allData = await FormData.find();

  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  // JSON file
  const jsonPath = path.join(dataDir, 'data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2));

  // Excel file
  const excelPath = path.join(dataDir, 'data.xlsx');
  const worksheet = XLSX.utils.json_to_sheet(allData.map(doc => {
    // convert _id ObjectId to string for Excel
    return { ...doc._doc, _id: doc._id.toString() };
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, excelPath);
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
