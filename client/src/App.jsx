import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';
import { fetchProfile } from './api.js';
import Layout from './components/Layout.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import Projects from './pages/Projects.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal)
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, []);

  if (failed) {
    return (
      <p className="status" role="alert">
        This page didn't load. Please refresh and try again.
      </p>
    );
  }

  if (!data) return <p className="status">Loading…</p>;

  return (
    <Routes>
      <Route element={<Layout data={data} />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
