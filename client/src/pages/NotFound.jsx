import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="wrap page">
      <h1>Nothing here.</h1>
      <p className="page-intro">That page doesn’t exist.</p>
      <Link className="button" to="/">
        Back to home
      </Link>
    </div>
  );
}
