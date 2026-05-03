import './App.css';
import { EficcGrid } from '@idb/eficc-grid';

function App() {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age' },
  ];

  const rows = [
    { name: 'John Doe', age: 30 },
    { name: 'Jane Smith', age: 25 },
  ];

  return <EficcGrid columns={columns} rows={rows} />;
}

export default App;
