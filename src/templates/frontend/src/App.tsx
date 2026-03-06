import { BrowserRouter, Route, Routes } from 'react-router';

import Welcome from './Welcome';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Welcome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
