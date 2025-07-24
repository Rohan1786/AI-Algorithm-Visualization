

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import AdvancedAlgorithmVisualizer from './AdvancedAlgorithmVisualizer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/visualizer" element={<AdvancedAlgorithmVisualizer />} />
      </Routes>
    </Router>
  );
}

export default App;