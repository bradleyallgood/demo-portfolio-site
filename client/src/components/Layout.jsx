import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import ThemePicker from './ThemePicker.jsx';

const pages = [
  ['/', 'Home'],
  ['/projects', 'Projects'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Layout({ data }) {
  const { name, links } = data.profile;
  const { pathname } = useLocation();
  const main = useRef(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const page = pages.find(([path]) => path === pathname);
    document.title = page && pathname !== '/' ? `${page[1]} | ${name}` : name;
  }, [pathname, name]);

  // Client-side navigation keeps scroll and focus, so reset both the way a page load would.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo(0, 0);
    main.current.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="wrap site-header-inner">
          <Link className="wordmark" to="/">
            {name}
          </Link>
          <div className="header-tools">
            <nav aria-label="Main">
              {pages.map(([path, label]) => (
                <NavLink key={path} to={path} end={path === '/'}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <ThemePicker />
          </div>
        </div>
      </header>

      <main id="main" ref={main} tabIndex="-1">
        <Outlet context={data} />
      </main>

      <footer className="site-footer">
        <div className="wrap site-footer-inner">
          <p>
            © {new Date().getFullYear()} {name}
          </p>
          <ul>
            {links.map(({ label, url }) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
