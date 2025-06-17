import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
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
import Duplicate from './pages/Duplicate';
import PageNumbering from './pages/PageNumbering';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-gray-50 text-black dark:bg-gray-950 dark:text-white">
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
              <Route path="/duplicate" element={<Duplicate />} />
              <Route path="/page-numbering" element={<PageNumbering />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
