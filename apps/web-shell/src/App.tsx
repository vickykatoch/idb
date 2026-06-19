import './App.css';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

// Dynamically discover all plugin entry points at build time.
// Each folder under /plugins/<name>/index.ts is mounted at /<name>.
const pluginModules = import.meta.glob('../../../plugins/**/index.ts');

const pluginRoutes = Object.entries(pluginModules).map(([filePath, loader]) => {
  const match = filePath.match(/plugins\/([^/]+)\/index\.ts$/);
  const name = match?.[1] ?? filePath;
  const Component = lazy(loader as () => Promise<{ default: React.ComponentType }>);
  return { path: `/${name}`, Component };
});

function App() {
  const firstPlugin = pluginRoutes[0];

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          {pluginRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
          {firstPlugin && <Route path="/" element={<Navigate to={firstPlugin.path} replace />} />}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
