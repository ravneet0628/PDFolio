import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Merge from './pages/Merge';
import Split from './pages/Split';
import Rotate from './pages/Rotate';
import Reorder from './pages/Reorder';
import Extract from './pages/Extract';
import Compress from './pages/Compress';
import PdfToJpg from './pages/PdfToJpg';
import JpgToPdf from './pages/JpgToPdf';
import Delete from './pages/Delete';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main className="flex-grow p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<Merge />} />
            <Route path="/split" element={<Split />} />
            <Route path="/rotate" element={<Rotate />} />
            <Route path="/reorder" element={<Reorder />} />
            <Route path="/extract" element={<Extract />} />
            <Route path="/compress" element={<Compress />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdf/>}/>
            <Route path="/delete" element={<Delete />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
